import type { AxeExampleResult, AxePassName } from './axe-report';

/** An accepted axe finding: `rule` fires on `example` (`<page>/<example>`, as in the report) and is not a CI failure. */
export interface AxeAllowlistEntry {
    rule: string;
    example: string;
    reason: string;
    /** JIRA key tracking the fix, only where a real ticket exists. */
    ticket?: string;
}

/** A violation found in a scan pass that no allowlist entry covers. */
export interface NewAxeViolation {
    rule: string;
    example: string;
    pass: AxePassName;
    nodeCount: number;
    firstTarget: string;
}

export function axeExampleKey(entry: Pick<AxeExampleResult, 'page' | 'example'>) {
    return `${entry.page}/${entry.example}`;
}

function entryKey(rule: string, example: string) {
    return `${rule}\u0000${example}`;
}

function nonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim() !== '';
}

/**
 * Validates the committed allowlist file and flattens it to one entry per (rule, example) pair. The file is a
 * `groups` list, one group per rule, each naming its examples explicitly (no wildcards) with a single reason.
 * Throws with every problem listed: an invalid allowlist is a committed config error, so the run fails closed.
 */
export function parseAxeAllowlist(raw: unknown): AxeAllowlistEntry[] {
    const problems: string[] = [];
    const entries: AxeAllowlistEntry[] = [];
    const seen = new Set<string>();
    const groups = (raw as { groups?: unknown } | null)?.groups;

    if (!Array.isArray(groups)) {
        throw new Error('Invalid axe allowlist: expected an object with a "groups" array.');
    }

    groups.forEach((group: Record<string, unknown> | null, index) => {
        const where = `groups[${index}]`;
        if (group == null || typeof group !== 'object') {
            problems.push(`${where} is not an object`);
            return;
        }
        const { rule, reason, ticket, examples } = group;
        if (!nonEmptyString(rule)) problems.push(`${where} has no "rule"`);
        if (!nonEmptyString(reason)) problems.push(`${where} (${String(rule)}) has no "reason"`);
        if (ticket !== undefined && !nonEmptyString(ticket)) problems.push(`${where} has an empty "ticket"`);
        if (!Array.isArray(examples) || examples.length === 0) {
            problems.push(`${where} (${String(rule)}) has no "examples"`);
            return;
        }
        for (const example of examples) {
            if (!nonEmptyString(example)) {
                problems.push(`${where} (${String(rule)}) has an empty example`);
                continue;
            }
            if (!nonEmptyString(rule) || !nonEmptyString(reason)) continue;
            const key = entryKey(rule, example);
            if (seen.has(key)) {
                problems.push(`duplicate entry: ${rule} on ${example}`);
                continue;
            }
            seen.add(key);
            entries.push({ rule, example, reason, ...(nonEmptyString(ticket) ? { ticket } : {}) });
        }
    });

    if (problems.length > 0) {
        throw new Error(`Invalid axe allowlist (e2e/a11y/axe-allowlist.json):\n- ${problems.join('\n- ')}`);
    }
    return entries;
}

/** Whether (rule, example) is allowlisted; one entry covers both the load and focus passes. */
export function isAxeViolationAllowed(allowlist: readonly AxeAllowlistEntry[], rule: string, example: string) {
    return allowlist.some((entry) => entry.rule === rule && entry.example === example);
}

/**
 * The violations in `result` that the allowlist does not cover. Passes that errored are skipped, as scan
 * errors never fail the run (they are listed in the report instead). The match is on rule and example only,
 * so more nodes under an allowlisted pair do not fail.
 */
export function findNewViolations(result: AxeExampleResult, allowlist: readonly AxeAllowlistEntry[]): NewAxeViolation[] {
    const example = axeExampleKey(result);
    const found: NewAxeViolation[] = [];
    for (const pass of result.passes) {
        if (pass.error != null) continue;
        for (const violation of pass.violations ?? []) {
            if (isAxeViolationAllowed(allowlist, violation.id, example)) continue;
            found.push({
                rule: violation.id,
                example,
                pass: pass.pass,
                nodeCount: violation.nodes.length,
                firstTarget: violation.nodes[0]?.target.join(' ') ?? '',
            });
        }
    }
    return found;
}

/** Entries whose example scanned cleanly in both passes without firing the rule; errored or unscanned examples are skipped. */
export function findStaleEntries(
    results: readonly AxeExampleResult[],
    allowlist: readonly AxeAllowlistEntry[]
): AxeAllowlistEntry[] {
    const fired = new Set<string>();
    const verified = new Set<string>();
    for (const result of results) {
        const example = axeExampleKey(result);
        const names = new Set(result.passes.map((pass) => pass.pass));
        if (!names.has('load') || !names.has('focus') || result.passes.some((pass) => pass.error != null)) continue;
        verified.add(example);
        for (const pass of result.passes) {
            for (const violation of pass.violations ?? []) fired.add(entryKey(violation.id, example));
        }
    }
    return allowlist.filter(
        (entry) => verified.has(entry.example) && !fired.has(entryKey(entry.rule, entry.example))
    );
}

/** The failure message for the spec: each new violation's rule, pass, node count and first target. */
export function formatNewViolations(violations: readonly NewAxeViolation[]) {
    const lines = violations.map(
        (v) => `- ${v.rule} (${v.pass} pass): ${v.nodeCount} node${v.nodeCount === 1 ? '' : 's'}, first ${v.firstTarget}`
    );
    return [
        `${violations.length} axe violation${violations.length === 1 ? '' : 's'} not in the allowlist on ${violations[0]?.example}:`,
        ...lines,
        'Fix the violation, or add its rule and example with a reason to e2e/a11y/axe-allowlist.json.',
    ].join('\n');
}
