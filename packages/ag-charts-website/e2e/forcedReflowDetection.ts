import type { CDPSession, Page } from '@playwright/test';

interface TraceEvent {
    cat: string;
    name: string;
    ph: string;
    ts: number;
    dur?: number;
    pid: number;
    tid: number;
    args?: Record<string, any>;
}

interface StackFrame {
    functionName?: string;
    url?: string;
    lineNumber?: number;
}

interface ForcedReflow {
    name: string;
    dur: number;
    parentName: string;
    stackFrames: StackFrame[];
}

interface ForcedReflowAnalysis {
    count: number;
    totalDuration: number;
    reflows: ForcedReflow[];
}

// JS invocation event names — a Layout or RecalcStyle nested inside one of
// these is classified as "forced" by Chrome DevTools (see WarningsHandler.ts).
const JS_INVOCATION_EVENTS = new Set([
    'FunctionCall',
    'EvaluateScript',
    'EventDispatch',
    'V8Execute',
    'v8.callFunction',
    'v8.run',
    'TimerFire',
    'FireAnimationFrame',
    'RunMicrotasks',
]);

// Layout/style events that Chrome flags as forced when nested inside JS.
const FORCED_REFLOW_EVENTS = new Set(['Layout', 'UpdateLayoutTree']);

/**
 * Start CDP tracing, run an action, stop tracing, and return raw trace events.
 */
export async function traceAction(page: Page, action: () => Promise<void>): Promise<TraceEvent[]> {
    const client: CDPSession = await page.context().newCDPSession(page);

    await client.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'v8.execute',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-devtools.timeline.stack',
        ].join(','),
        options: 'sampling-frequency=10000',
    });

    await action();

    const events: TraceEvent[] = [];
    const done = new Promise<void>((resolve) => {
        client.on('Tracing.tracingComplete', () => resolve());
        client.on('Tracing.dataCollected', (data: any) => {
            events.push(...(data.value as TraceEvent[]));
        });
    });

    await client.send('Tracing.end');
    await done;
    await client.detach();

    return events;
}

/**
 * Analyse trace events for forced reflows using Chrome DevTools' nesting
 * heuristic: a Layout/UpdateLayoutTree event whose parent in the trace is a
 * JS invocation event is classified as forced.
 *
 * Events are correlated by thread ID and timestamp nesting (child.ts >= parent.ts
 * and child.ts + child.dur <= parent.ts + parent.dur).
 */
export function analyseForcedReflows(events: TraceEvent[]): ForcedReflowAnalysis {
    // Build a per-thread stack of "complete" (ph=X) events sorted by start time.
    const byThread = new Map<number, TraceEvent[]>();
    for (const ev of events) {
        if (ev.ph !== 'X' || ev.dur == null) continue;
        let arr = byThread.get(ev.tid);
        if (arr == null) {
            arr = [];
            byThread.set(ev.tid, arr);
        }
        arr.push(ev);
    }

    const reflows: ForcedReflow[] = [];

    for (const threadEvents of byThread.values()) {
        // Sort by start time ascending; ties broken by longer duration first (parent before child).
        threadEvents.sort((a, b) => a.ts - b.ts || (b.dur ?? 0) - (a.dur ?? 0));

        // Stack of currently open events (their end timestamp).
        const stack: TraceEvent[] = [];

        for (const ev of threadEvents) {
            // Pop events that have ended before this one starts.
            while (stack.length > 0) {
                const top = stack[stack.length - 1];
                if (ev.ts >= top.ts + (top.dur ?? 0)) {
                    stack.pop();
                } else {
                    break;
                }
            }

            if (FORCED_REFLOW_EVENTS.has(ev.name)) {
                // Walk up the stack to find the nearest JS invocation parent.
                for (let i = stack.length - 1; i >= 0; i--) {
                    if (JS_INVOCATION_EVENTS.has(stack[i].name)) {
                        const stackFrames: StackFrame[] =
                            ev.args?.beginData?.stackTrace ?? ev.args?.data?.stackTrace ?? [];
                        reflows.push({
                            name: ev.name,
                            dur: ev.dur ?? 0,
                            parentName: stack[i].name,
                            stackFrames,
                        });
                        break;
                    }
                }
            }

            stack.push(ev);
        }
    }

    return {
        count: reflows.length,
        totalDuration: reflows.reduce((sum, r) => sum + r.dur, 0),
        reflows,
    };
}

/**
 * Default allowlist of top-frame function names that are unavoidable and should
 * not count as AG Charts-caused forced reflows.
 */
const DEFAULT_ALLOWLIST = new Set(['allocMouseEvent', 'calcCurrentXY']);

interface FilterOptions {
    /** Additional function names to allowlist beyond the defaults. */
    additionalAllowlist?: string[];
}

/**
 * Filter a reflow analysis to only include reflows attributable to AG Charts code.
 *
 * Two filters are applied in order:
 *
 * 1. **Source filter** — only keep reflows where at least one stack frame URL
 *    contains `ag-charts`. This excludes Playwright-internal reflows such as
 *    `allocMouseEvent` and `calcCurrentXY`.
 *
 * 2. **Allowlist filter** — exclude reflows whose top stack frame function name
 *    matches a known-unavoidable pattern (e.g. `togglePopover` from the native
 *    Popover API).
 */
export function filterAgChartsReflows(analysis: ForcedReflowAnalysis, opts?: FilterOptions): ForcedReflowAnalysis {
    const allowlist = new Set([...DEFAULT_ALLOWLIST, ...(opts?.additionalAllowlist ?? [])]);

    const filtered = analysis.reflows.filter((r) => {
        // Source filter: at least one frame must come from ag-charts source.
        const hasAgChartsFrame = r.stackFrames.some((f) => f.url?.includes('ag-charts'));
        if (!hasAgChartsFrame) return false;

        // Allowlist filter: skip known-unavoidable top-frame functions.
        const topFunctionName = r.stackFrames[0]?.functionName;
        if (topFunctionName != null && allowlist.has(topFunctionName)) return false;

        return true;
    });

    return {
        count: filtered.length,
        totalDuration: filtered.reduce((sum, r) => sum + r.dur, 0),
        reflows: filtered,
    };
}

/**
 * Diagnostic formatter for test failure messages.
 */
export function formatReflowDiagnostics(analysis: ForcedReflowAnalysis): string {
    if (analysis.count === 0) return 'No forced reflows detected.';

    const lines = [`Forced reflows: ${analysis.count} (total ${(analysis.totalDuration / 1000).toFixed(2)}ms)`, ''];
    for (const r of analysis.reflows) {
        const topFrame = r.stackFrames[0];
        const frameLabel = topFrame
            ? `${topFrame.functionName ?? '(anonymous)'} @ ${topFrame.url ?? '?'}:${topFrame.lineNumber ?? '?'}`
            : '';
        lines.push(
            `  ${r.name} (${(r.dur / 1000).toFixed(2)}ms) triggered by ${r.parentName}${frameLabel ? ` [${frameLabel}]` : ''}`
        );
        // Include additional frames for context.
        for (const frame of r.stackFrames.slice(1, 4)) {
            lines.push(
                `    at ${frame.functionName ?? '(anonymous)'} @ ${frame.url ?? '?'}:${frame.lineNumber ?? '?'}`
            );
        }
    }
    return lines.join('\n');
}
