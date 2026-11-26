import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import {
    type AxeAllowlistEntry,
    findNewViolations,
    findStaleEntries,
    formatNewViolations,
    parseAxeAllowlist,
} from './axe-allowlist';
import type { AxeExampleResult, AxePassResult, CompactViolation } from './axe-report';

function violation(id: string, targets: string[] = ['#node-0']): CompactViolation {
    return {
        id,
        impact: 'serious',
        help: `${id} help`,
        helpUrl: `https://example.com/${id}`,
        nodes: targets.map((target) => ({ target: [target], html: `<div>`, inChart: true })),
    };
}

function passResult(pass: AxePassResult['pass'], ids: CompactViolation[] | string): AxePassResult {
    return typeof ids === 'string' ? { pass, error: ids } : { pass, violations: ids };
}

function result(page: string, load: AxePassResult, focus: AxePassResult): AxeExampleResult {
    return { page, example: 'simple', framework: 'vanilla', url: `https://example.com/${page}`, passes: [load, focus] };
}

function entry(rule: string, example: string): AxeAllowlistEntry {
    return { rule, example, reason: `${rule} is accepted` };
}

function group(rule: string, examples: string[], reason = 'Accepted for now') {
    return { rule, reason, examples };
}

describe('parseAxeAllowlist', () => {
    it('flattens each group to one entry per (rule, example) pair, keeping the reason and optional ticket', () => {
        const entries = parseAxeAllowlist({
            groups: [
                {
                    ...group('region', ['bar-series/simple', 'line-series/simple'], 'Landmarks are the host page'),
                    ticket: 'AG-1',
                },
                group('page-has-heading-one', ['sync/basic-sync']),
            ],
        });

        expect(entries).toEqual([
            { rule: 'region', example: 'bar-series/simple', reason: 'Landmarks are the host page', ticket: 'AG-1' },
            { rule: 'region', example: 'line-series/simple', reason: 'Landmarks are the host page', ticket: 'AG-1' },
            { rule: 'page-has-heading-one', example: 'sync/basic-sync', reason: 'Accepted for now' },
        ]);
    });

    it('allows the same example under different rules and the same rule on different examples', () => {
        expect(() =>
            parseAxeAllowlist({ groups: [group('region', ['a/b', 'c/d']), group('landmark-one-main', ['a/b'])] })
        ).not.toThrow();
    });

    it.each([
        ['a missing "groups" array', {}],
        ['a null file', null],
        ['"groups" that is not an array', { groups: 'region' }],
    ])('rejects %s', (_label, raw) => {
        expect(() => parseAxeAllowlist(raw)).toThrow(/Invalid axe allowlist/);
    });

    it.each([
        ['an empty rule', { ...group('', ['a/b']) }, /no "rule"/],
        ['a missing rule', { reason: 'r', examples: ['a/b'] }, /no "rule"/],
        ['a whitespace-only rule', { ...group('   ', ['a/b']) }, /no "rule"/],
        ['an empty reason', { ...group('region', ['a/b'], '') }, /no "reason"/],
        ['a whitespace-only reason', { ...group('region', ['a/b'], '  ') }, /no "reason"/],
        ['a missing reason', { rule: 'region', examples: ['a/b'] }, /no "reason"/],
        ['an empty examples list', group('region', []), /no "examples"/],
        ['a missing examples list', { rule: 'region', reason: 'r' }, /no "examples"/],
        ['an empty example', group('region', ['a/b', '']), /empty example/],
        ['a non-string example', group('region', [42 as unknown as string]), /empty example/],
        ['an empty ticket', { ...group('region', ['a/b']), ticket: '' }, /empty "ticket"/],
    ])('fails closed on %s', (_label, bad, message) => {
        expect(() => parseAxeAllowlist({ groups: [bad] })).toThrow(message);
    });

    it('fails closed on a duplicate pair, within a group and across groups, naming the pair', () => {
        expect(() => parseAxeAllowlist({ groups: [group('region', ['a/b', 'a/b'])] })).toThrow(
            'duplicate entry: region on a/b'
        );
        expect(() => parseAxeAllowlist({ groups: [group('region', ['a/b']), group('region', ['a/b'])] })).toThrow(
            'duplicate entry: region on a/b'
        );
    });

    it('rejects a group that is not an object', () => {
        expect(() => parseAxeAllowlist({ groups: [null, 'region'] })).toThrow(/groups\[0\] is not an object/);
    });

    it('lists every problem in one message', () => {
        expect(() =>
            parseAxeAllowlist({
                groups: [group('', ['a/b']), group('region', ['c/d'], ''), group('x', ['y/z', 'y/z'])],
            })
        ).toThrow(/no "rule"[\s\S]*no "reason"[\s\S]*duplicate entry: x on y\/z/);
    });
});

describe('committed allowlist (e2e/a11y/axe-allowlist.json)', () => {
    const raw = JSON.parse(readFileSync(resolve(__dirname, '../../e2e/a11y/axe-allowlist.json'), 'utf-8'));

    it('is valid', () => {
        expect(() => parseAxeAllowlist(raw)).not.toThrow();
    });

    it('lists the 48 accepted (rule, example) pairs from the baseline, per rule', () => {
        const entries = parseAxeAllowlist(raw);
        const perRule: Record<string, number> = {};
        for (const { rule } of entries) perRule[rule] = (perRule[rule] ?? 0) + 1;

        expect(entries).toHaveLength(48);
        expect(perRule).toEqual({
            'aria-command-name': 17,
            'label-content-name-mismatch': 1,
            'landmark-one-main': 1,
            'page-has-heading-one': 1,
            region: 28,
        });
    });

    it('names each example explicitly as <page>/<example>, with no wildcards and a reason per rule', () => {
        for (const { rule, example, reason } of parseAxeAllowlist(raw)) {
            expect(example, rule).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+$/);
            expect(reason.trim(), `${rule} ${example}`).not.toBe('');
        }
    });

    it('covers the region rule on every example the CI scan covers for it, including the kitchen sink and sync pages', () => {
        const entries = parseAxeAllowlist(raw);
        const region = entries.filter((e) => e.rule === 'region').map((e) => e.example);
        expect(region).toEqual(expect.arrayContaining(['accessibility-e2e/axe-kitchen-sink', 'sync/basic-sync']));
        expect(entries.filter((e) => e.rule === 'landmark-one-main')).toEqual([
            expect.objectContaining({ example: 'sync/basic-sync' }),
        ]);
    });
});

describe('findNewViolations', () => {
    const allowlist = [entry('region', 'bar-series/simple')];

    it('returns nothing when every violation is allowlisted', () => {
        const res = result(
            'bar-series',
            passResult('load', [violation('region')]),
            passResult('focus', [violation('region')])
        );
        expect(findNewViolations(res, allowlist)).toEqual([]);
    });

    it('returns nothing when the example has no violations', () => {
        const res = result('bar-series', passResult('load', []), passResult('focus', []));
        expect(findNewViolations(res, [])).toEqual([]);
    });

    it('returns a violation whose rule is not allowlisted for the example, with pass, node count and first target', () => {
        const res = result(
            'bar-series',
            passResult('load', [violation('region'), violation('color-contrast', ['#a', '#b', '#c'])]),
            passResult('focus', [])
        );
        expect(findNewViolations(res, allowlist)).toEqual([
            { rule: 'color-contrast', example: 'bar-series/simple', pass: 'load', nodeCount: 3, firstTarget: '#a' },
        ]);
    });

    it('does not carry an allowlist entry across examples', () => {
        const res = result('line-series', passResult('load', [violation('region')]), passResult('focus', []));
        expect(findNewViolations(res, allowlist)).toEqual([
            expect.objectContaining({ rule: 'region', example: 'line-series/simple', pass: 'load' }),
        ]);
    });

    it('does not carry an allowlist entry across rules on the same example', () => {
        const res = result('bar-series', passResult('load', [violation('landmark-one-main')]), passResult('focus', []));
        expect(findNewViolations(res, allowlist)).toEqual([expect.objectContaining({ rule: 'landmark-one-main' })]);
    });

    it('covers both passes with one entry', () => {
        const res = result(
            'bar-series',
            passResult('load', [violation('region')]),
            passResult('focus', [violation('region', ['#x', '#y'])])
        );
        expect(findNewViolations(res, allowlist)).toEqual([]);
    });

    it('reports a new violation that appears only in the focus pass', () => {
        const res = result('bar-series', passResult('load', []), passResult('focus', [violation('aria-valid-attr')]));
        expect(findNewViolations(res, allowlist)).toEqual([
            expect.objectContaining({ rule: 'aria-valid-attr', pass: 'focus' }),
        ]);
    });

    it('reports a new violation in each pass separately', () => {
        const res = result('bar-series', passResult('load', [violation('x')]), passResult('focus', [violation('x')]));
        expect(findNewViolations(res, allowlist).map((v) => v.pass)).toEqual(['load', 'focus']);
    });

    it('does not fail when an allowlisted pair has more nodes than before', () => {
        const res = result(
            'bar-series',
            passResult('load', [
                violation(
                    'region',
                    Array.from({ length: 50 }, (_, i) => `#n${i}`)
                ),
            ]),
            passResult('focus', [])
        );
        expect(findNewViolations(res, allowlist)).toEqual([]);
    });

    it('fails open on scan errors: errored passes contribute nothing, and the other pass is still checked', () => {
        const errored = result(
            'bar-series',
            passResult('load', 'Timed out'),
            passResult('focus', 'Skipped: load pass failed')
        );
        expect(findNewViolations(errored, [])).toEqual([]);

        const partial = result('bar-series', passResult('load', [violation('x')]), passResult('focus', 'Timed out'));
        expect(findNewViolations(partial, [])).toEqual([expect.objectContaining({ rule: 'x', pass: 'load' })]);
    });

    it('ignores violations on a pass that also carries an error', () => {
        const res = result(
            'bar-series',
            { pass: 'load', error: 'Timed out', violations: [violation('x')] },
            passResult('focus', [])
        );
        expect(findNewViolations(res, [])).toEqual([]);
    });

    it('uses an empty first target when a violation has no nodes', () => {
        const res = result('bar-series', passResult('load', [violation('x', [])]), passResult('focus', []));
        expect(findNewViolations(res, [])).toEqual([expect.objectContaining({ nodeCount: 0, firstTarget: '' })]);
    });

    it('joins a nested selector path in the first target', () => {
        const nested: CompactViolation = {
            ...violation('x'),
            nodes: [{ target: ['iframe', '#inner'], html: '<div>', inChart: true }],
        };
        const res = result('bar-series', passResult('load', [nested]), passResult('focus', []));
        expect(findNewViolations(res, [])[0].firstTarget).toBe('iframe #inner');
    });
});

describe('formatNewViolations', () => {
    it('lists each rule with its pass, node count and first target, and says how to resolve it', () => {
        const message = formatNewViolations([
            { rule: 'color-contrast', example: 'bar-series/simple', pass: 'load', nodeCount: 3, firstTarget: '#a' },
            { rule: 'aria-valid-attr', example: 'bar-series/simple', pass: 'focus', nodeCount: 1, firstTarget: '#b' },
        ]);

        expect(message).toContain('2 axe violations not in the allowlist on bar-series/simple');
        expect(message).toContain('- color-contrast (load pass): 3 nodes, first #a');
        expect(message).toContain('- aria-valid-attr (focus pass): 1 node, first #b');
        expect(message).toContain('axe-allowlist.json');
    });

    it('uses the singular for one violation', () => {
        const message = formatNewViolations([
            { rule: 'x', example: 'a/b', pass: 'load', nodeCount: 1, firstTarget: '#a' },
        ]);
        expect(message).toContain('1 axe violation not in the allowlist on a/b');
    });
});

describe('findStaleEntries', () => {
    const clean = (page: string) => result(page, passResult('load', []), passResult('focus', []));

    it('reports an entry whose example scanned cleanly and whose rule fired in neither pass', () => {
        const allowlist = [entry('region', 'bar-series/simple')];
        expect(findStaleEntries([clean('bar-series')], allowlist)).toEqual(allowlist);
    });

    it('does not report an entry whose rule fired in both passes', () => {
        const res = result(
            'bar-series',
            passResult('load', [violation('region')]),
            passResult('focus', [violation('region')])
        );
        expect(findStaleEntries([res], [entry('region', 'bar-series/simple')])).toEqual([]);
    });

    it.each([
        ['load', passResult('load', [violation('region')]), passResult('focus', [])],
        ['focus', passResult('load', []), passResult('focus', [violation('region')])],
    ])('does not report an entry whose rule fired only in the %s pass', (_pass, load, focus) => {
        expect(findStaleEntries([result('bar-series', load, focus)], [entry('region', 'bar-series/simple')])).toEqual(
            []
        );
    });

    it('reports only the rule that stopped firing when another rule on the example still fires', () => {
        const res = result(
            'bar-series',
            passResult('load', [violation('region')]),
            passResult('focus', [violation('region')])
        );
        const allowlist = [entry('region', 'bar-series/simple'), entry('landmark-one-main', 'bar-series/simple')];
        expect(findStaleEntries([res], allowlist)).toEqual([allowlist[1]]);
    });

    it('does not count a rule that fired on a different example as firing on this one', () => {
        const fires = result('line-series', passResult('load', [violation('region')]), passResult('focus', []));
        const allowlist = [entry('region', 'bar-series/simple')];
        expect(findStaleEntries([fires, clean('bar-series')], allowlist)).toEqual(allowlist);
    });

    it('does not report entries for examples that were not scanned in this run', () => {
        expect(findStaleEntries([clean('bar-series')], [entry('region', 'line-series/simple')])).toEqual([]);
        expect(findStaleEntries([], [entry('region', 'line-series/simple')])).toEqual([]);
    });

    it.each([
        ['the load pass errored', passResult('load', 'Timed out'), passResult('focus', [])],
        ['the focus pass errored', passResult('load', []), passResult('focus', 'Timed out')],
        ['both passes errored', passResult('load', 'Timed out'), passResult('focus', 'Skipped: load pass failed')],
    ])('treats entries as unverified, not stale, when %s', (_label, load, focus) => {
        expect(findStaleEntries([result('bar-series', load, focus)], [entry('region', 'bar-series/simple')])).toEqual(
            []
        );
    });

    it('does not report an example that ran only one pass', () => {
        const partial: AxeExampleResult = { ...clean('bar-series'), passes: [passResult('load', [])] };
        expect(findStaleEntries([partial], [entry('region', 'bar-series/simple')])).toEqual([]);
    });

    it('checks each scanned example independently', () => {
        const results = [
            clean('bar-series'),
            result('pie-series', passResult('load', 'Timed out'), passResult('focus', [])),
        ];
        const allowlist = [entry('region', 'bar-series/simple'), entry('region', 'pie-series/simple')];
        expect(findStaleEntries(results, allowlist)).toEqual([allowlist[0]]);
    });
});
