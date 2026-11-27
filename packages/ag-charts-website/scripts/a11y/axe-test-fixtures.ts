import type { AxeAllowlistEntry } from './axe-allowlist';
import type { AxeExampleResult, AxePassResult, CompactViolation } from './axe-report';

/** A violation with one node per `inChart` value, targeted `#node-<i>`. */
export function violation(
    id: string,
    inChart: Array<boolean | null> = [true],
    impact: CompactViolation['impact'] = 'serious'
): CompactViolation {
    return {
        id,
        impact,
        help: `${id} help`,
        helpUrl: `https://example.com/${id}`,
        nodes: inChart.map((value, i) => ({ target: [`#node-${i}`], html: `<div id="node-${i}">`, inChart: value })),
    };
}

export function exampleResult(page: string, passes: AxeExampleResult['passes']): AxeExampleResult {
    return { page, example: 'simple', framework: 'vanilla', url: `https://example.com/${page}`, passes };
}

/** A pass that found `violations`, or errored with that message. */
export function passResult(pass: AxePassResult['pass'], outcome: CompactViolation[] | string): AxePassResult {
    return typeof outcome === 'string' ? { pass, error: outcome } : { pass, violations: outcome };
}

export function scanned(page: string, load: AxePassResult, focus: AxePassResult): AxeExampleResult {
    return exampleResult(page, [load, focus]);
}

export function cleanExample(page: string): AxeExampleResult {
    return scanned(page, passResult('load', []), passResult('focus', []));
}

export function allow(rule: string, example: string): AxeAllowlistEntry {
    return { rule, example, reason: 'accepted' };
}
