import { describe, expect, it } from 'vitest';

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
        expect(markdown).toContain('| [region](https://example.com/region) | moderate | 1 | 2 | 1 / 1 |');
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
