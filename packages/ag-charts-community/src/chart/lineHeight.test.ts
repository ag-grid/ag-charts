import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgChartLabelStylerParams,
    AgChartOptions,
    AgChartThemeParams,
} from 'ag-charts-types';

import {
    compareImageSnapshot,
    createChart,
    deproxy,
    expectWarningsCalls,
    getVisibleLabelNodes,
    setupMockCanvas,
    setupMockConsole,
} from './test/utils';

describe('lineHeight', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createChart>> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    async function render(options: AgChartOptions) {
        chart = await createChart(options);
        expectWarningsCalls().toEqual([]);
        return chart;
    }

    describe('theme params', () => {
        async function resolvedX(options: AgChartOptions) {
            const { chartOptions } = deproxy(await render(options));
            const { axes } = chartOptions.processedOptions as AgCartesianChartOptions;
            return (axes as Record<string, any>).x;
        }

        function resolvedXAxis(params: AgChartThemeParams | undefined, label: object = {}) {
            return resolvedX({
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
                axes: { x: { type: 'category', position: 'bottom', label, title: { enabled: true } } },
                theme: params ? { params } : undefined,
            });
        }

        it('leaves lineHeight unset when no param is set', async () => {
            const axis = await resolvedXAxis(undefined);
            expect(axis.label.lineHeight).toBeUndefined();
            expect(axis.title.lineHeight).toBeUndefined();
        });

        it('derives each element from the top-level lineHeight ratio and its own font size', async () => {
            const axis = await resolvedXAxis({ lineHeight: 1.5 });
            expect(axis.label.lineHeight).toBe(axis.label.fontSize * 1.5);
            expect(axis.title.lineHeight).toBe(axis.title.fontSize * 1.5);
        });

        it('lets an element param override the top-level ratio', async () => {
            const axis = await resolvedXAxis({ lineHeight: 1.5, axisLabelLineHeight: 2 });
            expect(axis.label.lineHeight).toBe(axis.label.fontSize * 2);
            expect(axis.title.lineHeight).toBe(axis.title.fontSize * 1.5);
        });

        it('scales with the top-level fontSize', async () => {
            const axis = await resolvedXAxis({ lineHeight: 1.5, fontSize: 20 });
            expect(axis.label.fontSize).toBe(20);
            expect(axis.label.lineHeight).toBe(30);
        });

        it('uses the element font size set in options', async () => {
            const axis = await resolvedXAxis({ lineHeight: 1.5 }, { fontSize: 30 });
            expect(axis.label.lineHeight).toBe(45);
        });

        it('gives a lineHeight set in options precedence over the param', async () => {
            const axis = await resolvedXAxis({ lineHeight: 1.5 }, { lineHeight: 7 });
            expect(axis.label.lineHeight).toBe(7);
        });

        it('rejects a zero lineHeight', async () => {
            chart = await createChart({
                data: [{ x: 'a', y: 1 }],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', label: { lineHeight: 0 } }],
                theme: { params: { lineHeight: 0 } },
            });
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`theme.params.lineHeight\` cannot be set to \`0\`; expecting a number greater than 0, ignoring.",
                ],
                [
                  "AG Charts - Option \`series[0].label.lineHeight\` cannot be set to \`0\`; expecting a number greater than 0, ignoring.",
                ],
              ]
            `);
        });

        describe('time axis parent level labels', () => {
            async function resolvedParentLabel(label: object, parentLabel: object) {
                const axis = await resolvedX({
                    data: [{ x: new Date(2024, 0, 1), y: 1 }],
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    axes: {
                        x: { type: 'time', position: 'bottom', label, parentLevel: { label: parentLabel } },
                    },
                    theme: { params: { lineHeight: 1.5 } },
                });
                return axis.parentLevel.label;
            }

            it('derives lineHeight from their own fontSize', async () => {
                expect((await resolvedParentLabel({ fontSize: 10 }, { fontSize: 20 })).lineHeight).toBe(30);
            });

            it('inherits a lineHeight set on the axis label', async () => {
                expect((await resolvedParentLabel({ lineHeight: 18 }, { fontSize: 20 })).lineHeight).toBe(18);
            });
        });
    });

    describe('series labels', () => {
        const data = Array.from({ length: 6 }, (_, i) => ({ cat: `Cat ${i}`, value: 100 - i }));
        const barChart = (label: object): AgChartOptions => ({
            data,
            legend: { enabled: false },
            series: [
                {
                    type: 'bar',
                    xKey: 'cat',
                    yKey: 'value',
                    label: { enabled: true, placement: 'inside-center', ...label },
                },
            ],
        });

        it('keeps a pixel lineHeight in proportion as the label shrinks toward minimumFontSize', async () => {
            await render(
                barChart({
                    fontSize: 20,
                    lineHeight: 30,
                    minimumFontSize: 6,
                    wrapping: 'never',
                    formatter: () => 'Alpha Bravo Charlie',
                })
            );
            const labels = getVisibleLabelNodes(chart!);
            expect(labels.some((label) => label.fontSize < 20)).toBe(true);
            expect(labels.map((label) => label.lineHeight)).toEqual(labels.map((label) => label.fontSize * 1.5));
        });

        it('passes the line height that will be used to the itemStyler', async () => {
            const received: Array<number | undefined> = [];
            const itemStyler = (params: AgChartLabelStylerParams<unknown, unknown>) => {
                received.push(params.lineHeight);
                return {};
            };

            await render(barChart({ fontSize: 12, itemStyler }));
            expect(received.length).toBeGreaterThan(0);
            expect(received.every((lineHeight) => lineHeight != null && lineHeight > 12)).toBe(true);

            chart!.destroy();
            received.length = 0;
            await render(barChart({ fontSize: 12, lineHeight: 25, itemStyler }));
            expect(received.length).toBeGreaterThan(0);
            expect(received.every((lineHeight) => lineHeight === 25)).toBe(true);
        });

        it('applies a lineHeight returned by the itemStyler', async () => {
            await render(barChart({ itemStyler: () => ({ lineHeight: 40 }) }));
            const labels = getVisibleLabelNodes(chart!);
            expect(labels.length).toBeGreaterThan(0);
            expect(labels.every((label) => label.lineHeight === 40)).toBe(true);
        });

        it('keeps an echoed natural line height natural when the itemStyler restyles fontSize', async () => {
            await render(
                barChart({
                    itemStyler: ({ lineHeight }: AgChartLabelStylerParams<unknown, unknown>) => ({
                        lineHeight,
                        fontSize: 24,
                    }),
                })
            );
            const labels = getVisibleLabelNodes(chart!);
            expect(labels.length).toBeGreaterThan(0);
            expect(labels.every((label) => label.fontSize === 24 && label.lineHeight == null)).toBe(true);
        });

        it.each([
            ['restyles only fontSize', () => ({ fontSize: 24 })],
            [
                'echoes the line height back',
                ({ lineHeight }: AgChartLabelStylerParams<unknown, unknown>) => ({ lineHeight, fontSize: 24 }),
            ],
        ])('keeps a set line height in proportion when the itemStyler %s', async (_name, itemStyler) => {
            await render(barChart({ fontSize: 12, lineHeight: 18, itemStyler }));
            const labels = getVisibleLabelNodes(chart!);
            expect(labels.length).toBeGreaterThan(0);
            expect(labels.every((label) => label.fontSize === 24 && label.lineHeight === 36)).toBe(true);
        });
    });

    describe('rendering', () => {
        it('spaces multi-line text by the theme lineHeight in every chart element', async () => {
            await render({
                title: { text: 'Chart\ntitle' },
                subtitle: { text: 'Chart\nsubtitle' },
                footnote: { text: 'Chart\nfootnote' },
                data: [
                    { cat: 'First\ncategory', a: 40, b: 30 },
                    { cat: 'Second\ncategory', a: 25, b: 45 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'cat',
                        yKey: 'a',
                        yName: 'Series A',
                        label: { formatter: ({ value }) => `Value\n${value}` },
                    },
                    { type: 'bar', xKey: 'cat', yKey: 'b', yName: 'Series B' },
                ],
                axes: {
                    x: { type: 'category', position: 'bottom', title: { text: 'Axis\ntitle' } },
                    y: { type: 'number', position: 'left' },
                },
                theme: { params: { lineHeight: 2, axisLabelLineHeight: 1.5, titleLineHeight: 1.5 } },
            });
            await compareImageSnapshot(chart!, ctx);
        });
    });
});
