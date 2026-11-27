import { describe, expect, it } from 'vitest';

import { groupAxeResults, renderAxeReportHtml, renderAxeReportMarkdown } from './axe-report';
import { allow, cleanExample, exampleResult as entry, violation } from './axe-test-fixtures';

describe('groupAxeResults', () => {
    it('groups a rule shared by several examples once, with counts', () => {
        const report = groupAxeResults([
            entry('bar-series', [
                { pass: 'load', violations: [violation('aria-label', [true, false], 'serious')], axeVersion: '4.13.0' },
                { pass: 'focus', violations: [violation('aria-label', [true], 'serious')] },
            ]),
            entry('line-series', [{ pass: 'load', violations: [violation('aria-label', [null], 'serious')] }]),
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
                        violation('minor-rule', [true], 'minor'),
                        violation('wide-serious', [true], 'serious'),
                        violation('critical-rule', [true], 'critical'),
                    ],
                },
            ]),
            entry('b', [{ pass: 'load', violations: [violation('wide-serious', [true], 'serious')] }]),
            entry('c', [{ pass: 'load', violations: [violation('narrow-serious', [true], 'serious')] }]),
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
                entry('bar-series', [{ pass: 'load', violations: [violation('<script>', [true], 'serious')] }]),
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
                        violations: [violation('region', [false, true], 'moderate')],
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
    it('marks each violation allowlisted or new and counts new examples per rule', () => {
        const report = groupAxeResults(
            [
                entry('bar-series', [
                    { pass: 'load', violations: [violation('region', [true], 'moderate')] },
                    { pass: 'focus', violations: [violation('region', [true], 'moderate')] },
                ]),
                entry('line-series', [{ pass: 'load', violations: [violation('region', [true], 'moderate')] }]),
                entry('pie-series', [{ pass: 'load', violations: [violation('region', [true], 'moderate')] }]),
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
                    violations: [violation('region', [true], 'moderate'), violation('x', [true], 'minor')],
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
            [entry('line-series', [{ pass: 'load', violations: [violation('region', [true], 'moderate')] }])],
            [allow('region', 'bar-series/simple')]
        );
        expect(report.rules[0].newExampleCount).toBe(1);
    });

    it('lists stale entries only for examples scanned cleanly in both passes', () => {
        const stale = allow('region', 'bar-series/simple');
        const report = groupAxeResults(
            [
                cleanExample('bar-series'),
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

    it('reports no stale entries without an allowlist', () => {
        const report = groupAxeResults([cleanExample('bar-series')]);
        expect(report.staleAllowlistEntries).toEqual([]);
    });

    it('survives a JSON round trip for axe-report.json', () => {
        const report = groupAxeResults([cleanExample('bar-series')], [allow('region', 'bar-series/simple')]);
        expect(JSON.parse(JSON.stringify(report)).staleAllowlistEntries).toEqual([
            { rule: 'region', example: 'bar-series/simple', reason: 'accepted' },
        ]);
    });
});

describe('gate wording and stale list in the rendered reports', () => {
    const report = groupAxeResults(
        [
            entry('bar-series', [
                { pass: 'load', violations: [violation('region', [true], 'moderate')] },
                { pass: 'focus', violations: [violation('region', [true], 'moderate')] },
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
                entry('bar-series', [{ pass: 'load', violations: [violation('region', [true], 'moderate')] }]),
            ])
        );
        expect(fresh).toContain('(load, <strong>new</strong>)');
    });

    it.each([
        [
            'HTML',
            (r: ReturnType<typeof groupAxeResults>) => renderAxeReportHtml(r),
            'a<b>',
            '&lt;b&gt; on bar-series/simple',
        ],
        [
            'markdown',
            (r: ReturnType<typeof groupAxeResults>) => renderAxeReportMarkdown(r),
            'a|b',
            'a\\|b on bar-series/simple',
        ],
    ])('escapes stale entries in the %s report', (_format, render, rule, escaped) => {
        const output = render(groupAxeResults([cleanExample('bar-series')], [allow(rule, 'bar-series/simple')]));
        expect(output).toContain(escaped);
        expect(output).not.toContain(`${rule} on bar-series/simple`);
    });
});

describe('report-only sweep (enforced = false)', () => {
    const entries = [
        entry('bar-series', [{ pass: 'load', violations: [violation('region', [true], 'moderate')] }]),
        entry('line-series', [{ pass: 'load', violations: [violation('region', [true], 'moderate')] }]),
    ];
    const allowlist = [allow('region', 'bar-series/simple')];

    it('is enforced unless the caller says otherwise', () => {
        expect(groupAxeResults(entries, allowlist).enforced).toBe(true);
        expect(groupAxeResults(entries, allowlist, false).enforced).toBe(false);
    });

    it.each([
        ['HTML', renderAxeReportHtml],
        ['markdown', renderAxeReportMarkdown],
    ])('says the %s report is report-only and does not claim that it fails CI', (_format, render) => {
        const output = render(groupAxeResults(entries, allowlist, false));
        expect(output).toContain('Report-only');
        expect(output).toContain('do not fail CI');
        expect(output).not.toMatch(/\bfails CI/);
    });

    it('still marks violations as new or allowlisted and lists stale entries', () => {
        const report = groupAxeResults(entries, [...allowlist, allow('region', 'pie-series/simple')], false);
        expect(report.rules[0].newExampleCount).toBe(1);
        expect(report.rules[0].examples.map((e) => e.allowlisted)).toEqual([true, false]);
        expect(renderAxeReportMarkdown(report)).toContain('| 2 | 1 | 2 | 2 / 0 |');
        expect(renderAxeReportHtml(report)).toContain('(load, <strong>new</strong>)');
    });
});
