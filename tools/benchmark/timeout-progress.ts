/**
 * Where a benchmark example had got to when it timed out.
 *
 * The in-page harness publishes `window.__benchmarkProgress` between iterations. On a timeout the
 * runner reads it back so a hang can be told apart from slow iterations, and so the CI artifact keeps
 * the answer. The harness's timestamps are `performance.now()` on the page, so they are aged against
 * the page's clock in the same `evaluate` rather than against the runner's.
 */
import type { Page } from 'playwright';

/** Mirrors `BenchmarkProgress` in `benchmarkHarness.ts`. */
interface PageProgress {
    testCase: string;
    params: Record<string, string>;
    phase: 'setup' | 'warmup' | 'measure' | 'teardown';
    warmupCompleted: number;
    iterationsCompleted: number;
    startedAt: number;
    lastIterationAt: number | null;
}

export type TimeoutProgress =
    | {
          kind: 'recorded';
          testCase: string;
          params: Record<string, string>;
          phase: PageProgress['phase'];
          warmupCompleted: number;
          iterationsCompleted: number;
          /** Null when no iteration of the variant had completed. */
          msSinceLastIteration: number | null;
          msSinceVariantStart: number;
      }
    /** The benchmark never started on the page. */
    | { kind: 'none' }
    /** The page did not answer, typically because its main thread was stuck. */
    | { kind: 'unreadable' };

/** A stuck page never answers `evaluate`, so the read must not wait for it. */
const READ_TIMEOUT_MS = 5_000;

export async function readTimeoutProgress(page: Page, timeoutMs = READ_TIMEOUT_MS): Promise<TimeoutProgress> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const read = page.evaluate(() => ({
            now: performance.now(),
            progress: (window as any).__benchmarkProgress as PageProgress | undefined,
        }));
        const unreadable = new Promise<'unreadable'>((resolve) => {
            timer = setTimeout(() => resolve('unreadable'), timeoutMs);
        });
        // The losing `evaluate` of a stuck page stays pending; swallow its eventual rejection.
        read.catch(() => undefined);

        const snapshot = await Promise.race([read, unreadable]);
        if (snapshot === 'unreadable') return { kind: 'unreadable' };

        const { now, progress } = snapshot;
        if (!progress) return { kind: 'none' };
        return {
            kind: 'recorded',
            testCase: progress.testCase,
            params: progress.params,
            phase: progress.phase,
            warmupCompleted: progress.warmupCompleted,
            iterationsCompleted: progress.iterationsCompleted,
            msSinceLastIteration: progress.lastIterationAt === null ? null : now - progress.lastIterationAt,
            msSinceVariantStart: now - progress.startedAt,
        };
    } catch {
        return { kind: 'unreadable' };
    } finally {
        clearTimeout(timer);
    }
}

function seconds(ms: number): string {
    return `${(ms / 1000).toFixed(1)}s`;
}

/** One line for the log, e.g. `in measure of test case "line" (series=3): 2 warmup and 7 measured iterations completed, last completed 212.4s ago`. */
export function formatTimeoutProgress(progress: TimeoutProgress): string {
    if (progress.kind === 'none') return 'no progress recorded: the benchmark had not started on the page';
    if (progress.kind === 'unreadable') return 'progress could not be read: the page did not respond';

    const { testCase, params, phase, warmupCompleted, iterationsCompleted, msSinceLastIteration } = progress;
    const variant = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
    const where = `test case "${testCase}"${variant ? ` (${variant})` : ''}`;

    if (phase === 'setup' || phase === 'teardown') {
        return `stuck in ${phase} of ${where}, ${seconds(progress.msSinceVariantStart)} after it began`;
    }

    const last =
        msSinceLastIteration === null
            ? `none completed in the ${seconds(progress.msSinceVariantStart)} since the variant started`
            : `last completed ${seconds(msSinceLastIteration)} ago`;
    return `in ${phase} of ${where}: ${warmupCompleted} warmup and ${iterationsCompleted} measured iterations completed, ${last}`;
}
