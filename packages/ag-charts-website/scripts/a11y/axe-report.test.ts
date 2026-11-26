import { describe, expect, it } from 'vitest';

import type { AxeAllowlistEntry } from './axe-allowlist';
import {
    type AxeExampleResult,
    type CompactViolation,
    groupAxeResults,
    renderAxeReportHtml,
    renderAxeReportMarkdown,
} from './axe-report';

function violation(id: string, impact: CompactViolation['impact'], inChart: Array<boolean | null>): CompactViolation {
    return {
        id,
        impact,
        help: `${id} help`,
        helpUrl: `https://example.com/${id}`,
        nodes: inChart.map((value, i) => ({ target: [`#node-${i}`], html: `<div id="node-${i}">`, inChart: value })),
    };
}

function entry(page: string, passes: AxeExampleResult['passes']): AxeExampleResult {
    return { page, example: 'simple', framework: 'vanilla', url: `https://example.com/${page}`, passes };
}

describe('groupAxeResults', () => {
    it('groups a rule shared by several examples once, with counts', () => {
        const report = groupAxeResults([
            entry('bar-series', [
                { pass: 'load', violations: [violation('aria-label', 'serious', [true, false])], axeVersion: '4.13.0' },
                { pass: 'focus', violations: [violation('aria-label', 'serious', [true])] },
            ]),
            entry('line-series', [{ pass: 'load', violations: [violation('aria-label', 'serious', [null])] }]),
        ]);

        expect(report.examplesScanned).toBe(2);
        expect(report.axeVersion).toBe('4.13.0');
        expect(report.rules).toHaveLength(1);
        expect(report.rules[0]).toMatchObject({
            id: 'aria-label',
            exampleCount: 2,
            nodeCount: 4,
            inChartNodes: 2,
            outsideChartNodes: 1,
            byPass: { load: 2, focus: 1 },
        });
        expect(report.rules[0].examples).toHaveLength(3);
    });

    it('reports errored passes as scan errors rather than rules', () => {
        const report = groupAxeResults([
            entry('pie-series', [
                { pass: 'load', error: 'Timed out' },
                { pass: 'focus', error: 'Skipped: load pass failed' },
            ]),
        ]);

        expect(report.rules).toEqual([]);
        expect(report.scanErrors).toEqual([
            expect.objectContaining({ page: 'pie-series', pass: 'load', error: 'Timed out' }),
            expect.objectContaining({ page: 'pie-series', pass: 'focus' }),
        ]);
    });

    it('sorts by impact, then by example count', () => {
        const report = groupAxeResults([
            entry('a', [
                {
                    pass: 'load',
                    violations: [
                        violation('minor-rule', 'minor', [true]),
                        violation('wide-serious', 'serious', [true]),
                        violation('critical-rule', 'critical', [true]),
                    ],
                },
            ]),
            entry('b', [{ pass: 'load', violations: [violation('wide-serious', 'serious', [true])] }]),
            entry('c', [{ pass: 'load', violations: [violation('narrow-serious', 'serious', [true])] }]),
        ]);

        expect(report.rules.map((r) => r.id)).toEqual([
            'critical-rule',
            'wide-serious',
            'narrow-serious',
            'minor-rule',
        ]);
    });
});

describe('renderAxeReportHtml', () => {
    it('escapes interpolated values', () => {
        const html = renderAxeReportHtml(
            groupAxeResults([
                entry('bar-series', [{ pass: 'load', violations: [violation('<script>', 'serious', [true])] }]),
            ])
        );

        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;script&gt;');
        expect(html).toContain('&lt;div id=&quot;node-0&quot;&gt;');
    });
});

describe('renderAxeReportMarkdown', () => {
    it('summarises rules and scan errors as a table and list', () => {
        const markdown = renderAxeReportMarkdown(
            groupAxeResults([
                entry('bar-series', [
                    {
                        pass: 'load',
                        violations: [violation('region', 'moderate', [false, true])],
                        axeVersion: '4.13.0',
                    },
                    { pass: 'focus', error: 'Timed out | after\n35000ms' },
                ]),
            ])
        );

        expect(markdown).toContain('1 examples scanned, 1 rules violated, 1 scan errors (axe 4.13.0)');
        expect(markdown).toContain('| [region](https://example.com/region) | moderate | 1 | 1 | 2 | 1 / 1 |');
        expect(markdown).toContain('- bar-series/simple (focus): Timed out \\| after 35000ms');
    });

    it('omits the table and error list when there is nothing to report', () => {
        const markdown = renderAxeReportMarkdown(
            groupAxeResults([entry('bar-series', [{ pass: 'load', violations: [] }])])
        );

        expect(markdown).not.toContain('| Rule |');
        expect(markdown).not.toContain('### Scan errors');
    });
});

describe('allowlist in the grouped report', () => {
    const allow = (rule: string, example: string): AxeAllowlistEntry => ({ rule, example, reason: 'accepted' });
    const clean: AxeExampleResult['passes'] = [
        { pass: 'load', violations: [] },
        { pass: 'focus', violations: [] },
    ];

    it('marks each violation allowlisted or new and counts new examples per rule', () => {
        const report = groupAxeResults(
            [
                entry('bar-series', [
                    { pass: 'load', violations: [violation('region', 'moderate', [true])] },
                    { pass: 'focus', violations: [violation('region', 'moderate', [true])] },
                ]),
                entry('line-series', [{ pass: 'load', violations: [violation('region', 'moderate', [true])] }]),
                entry('pie-series', [{ pass: 'load', violations: [violation('region', 'moderate', [true])] }]),
            ],
            [allow('region', 'bar-series/simple')]
        );

        const region = report.rules[0];
        expect(region.exampleCount).toBe(3);
        expect(region.newExampleCount).toBe(2);
        expect(region.examples.map((e) => [e.page, e.pass, e.allowlisted])).toEqual([
            ['bar-series', 'load', true],
            ['bar-series', 'focus', true],
            ['line-series', 'load', false],
            ['pie-series', 'load', false],
        ]);
    });

    it('counts a rule with no allowlist entry as all new, and a fully allowlisted rule as zero new', () => {
        const entries = [
            entry('bar-series', [
                {
                    pass: 'load',
                    violations: [violation('region', 'moderate', [true]), violation('x', 'minor', [true])],
                },
            ]),
        ];

        const none = groupAxeResults(entries);
        expect(none.rules.map((r) => r.newExampleCount)).toEqual([1, 1]);

        const some = groupAxeResults(entries, [allow('region', 'bar-series/simple')]);
        expect(Object.fromEntries(some.rules.map((r) => [r.id, r.newExampleCount]))).toEqual({ region: 0, x: 1 });
    });

    it('does not count a pair as allowlisted on a different example', () => {
        const report = groupAxeResults(
            [entry('line-series', [{ pass: 'load', violations: [violation('region', 'moderate', [true])] }])],
            [allow('region', 'bar-series/simple')]
        );
        expect(report.rules[0].newExampleCount).toBe(1);
    });

    it('lists stale entries only for examples scanned cleanly in both passes', () => {
        const stale = allow('region', 'bar-series/simple');
        const report = groupAxeResults(
            [
                entry('bar-series', clean),
                entry('pie-series', [
                    { pass: 'load', error: 'Timed out' },
                    { pass: 'focus', error: 'Skipped' },
                ]),
            ],
            [stale, allow('region', 'pie-series/simple'), allow('region', 'unscanned/simple')]
        );

        expect(report.staleAllowlistEntries).toEqual([stale]);
        expect(report.scanErrors).toHaveLength(2);
    });

    it('has no stale entries and marks everything new without an allowlist', () => {
        const report = groupAxeResults([entry('bar-series', clean)]);
        expect(report.staleAllowlistEntries).toEqual([]);
    });

    it('survives a JSON round trip for axe-report.json', () => {
        const report = groupAxeResults([entry('bar-series', clean)], [allow('region', 'bar-series/simple')]);
        expect(JSON.parse(JSON.stringify(report)).staleAllowlistEntries).toEqual([
            { rule: 'region', example: 'bar-series/simple', reason: 'accepted' },
        ]);
    });
});

describe('gate wording and stale list in the rendered reports', () => {
    const allow = (rule: string, example: string): AxeAllowlistEntry => ({ rule, example, reason: 'accepted' });
    const report = groupAxeResults(
        [
            entry('bar-series', [
                { pass: 'load', violations: [violation('region', 'moderate', [true])] },
                { pass: 'focus', violations: [violation('region', 'moderate', [true])] },
            ]),
            entry('line-series', [
                { pass: 'load', violations: [] },
                { pass: 'focus', violations: [] },
            ]),
        ],
        [allow('region', 'bar-series/simple'), allow('region', 'line-series/simple')]
    );

    it('describes the gate in the markdown summary instead of "Report-only"', () => {
        const markdown = renderAxeReportMarkdown(report);

        expect(markdown).not.toContain('Report-only');
        expect(markdown).not.toContain('do not fail CI');
        expect(markdown).toMatch(/axe-allowlist\.json/);
        expect(markdown).toMatch(/fails CI/);
    });

    it('shows the new-examples count per rule in the markdown table', () => {
        expect(renderAxeReportMarkdown(report)).toContain('| New examples |');
        expect(renderAxeReportMarkdown(report)).toContain(
            '| [region](https://example.com/region) | moderate | 1 | 0 | 2 | 2 / 0 |'
        );
    });

    it('lists stale entries under "Stale allowlist entries: remove these" in the markdown, with the count in the headline', () => {
        const markdown = renderAxeReportMarkdown(report);

        expect(markdown).toContain('1 stale allowlist entries');
        expect(markdown).toContain('### Stale allowlist entries: remove these');
        expect(markdown).toContain('- region on line-series/simple');
        expect(markdown).not.toContain('- region on bar-series/simple');
    });

    it('omits the stale heading from the markdown when no entry is stale', () => {
        const markdown = renderAxeReportMarkdown(
            groupAxeResults([entry('bar-series', [{ pass: 'load', violations: [] }])])
        );
        expect(markdown).not.toContain('Stale allowlist entries: remove these');
        expect(markdown).toContain('0 stale allowlist entries');
    });

    it('marks violations as allowlisted or new, lists stale entries and describes the gate in the HTML', () => {
        const html = renderAxeReportHtml(report);
        expect(html).toContain('New examples');
        expect(html).toContain('(load, allowlisted)');
        expect(html).toContain('<h2>Stale allowlist entries: remove these</h2>');
        expect(html).toContain('<li>region on line-series/simple</li>');
        expect(html).not.toContain('<li>region on bar-series/simple</li>');
        expect(html).not.toContain('Report-only');

        const fresh = renderAxeReportHtml(
            groupAxeResults([
                entry('bar-series', [{ pass: 'load', violations: [violation('region', 'moderate', [true])] }]),
            ])
        );
        expect(fresh).toContain('(load, <strong>new</strong>)');
    });

    it('escapes stale entries in the HTML', () => {
        const html = renderAxeReportHtml(
            groupAxeResults(
                [
                    entry('bar-series', [
                        { pass: 'load', violations: [] },
                        { pass: 'focus', violations: [] },
                    ]),
                ],
                [allow('<b>rule</b>', 'bar-series/simple')]
            )
        );
        expect(html).not.toContain('<b>rule</b>');
        expect(html).toContain('&lt;b&gt;rule&lt;/b&gt; on bar-series/simple');
    });

    it('escapes pipes in stale entries in the markdown', () => {
        const markdown = renderAxeReportMarkdown(
            groupAxeResults(
                [
                    entry('bar-series', [
                        { pass: 'load', violations: [] },
                        { pass: 'focus', violations: [] },
                    ]),
                ],
                [allow('a|b', 'bar-series/simple')]
            )
        );
        expect(markdown).toContain('- a\\|b on bar-series/simple');
    });
});
