import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../test/utils';
import ukTopology from './map-test/ukTopology.json';
import { usData } from './map-test/usData';
import usTopology from './map-test/usTopology.json';

const ELLIPSIS = '…';

type BBox = { x: number; y: number; width: number; height: number };
const contains = (outer: BBox, inner: BBox, tolerance = 0.5) =>
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance;

// The label-fit options are undocumented, so labels are built untyped and cast at the AgCharts.create
// boundary; `setupMockConsole` fails the test on any "property is unknown" warning.
describe('series label fit', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    const render = async (options: object) => {
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = deproxy(AgCharts.create(options as AgChartOptions));
        await waitForChartStability(chart);
    };

    const renderAndSnapshot = async (options: object, size?: { width: number; height: number }) => {
        prepareEnterpriseTestOptions(options as AgChartOptions);
        Object.assign(options, size);
        chart = deproxy(AgCharts.create(options as AgChartOptions));
        await compareImageSnapshot(chart, ctx);
    };

    // Range-bar and range-area carry the fitted text flat on each `labelData` entry; waterfall, radar and
    // map-marker nest it under `.label`.
    type RenderedLabel = { text?: unknown; fittedText?: unknown; hidden?: boolean };
    const renderedText = (label: RenderedLabel | undefined) =>
        label == null || label.hidden === true ? '' : (label.fittedText ?? label.text);
    const flatLabelTexts = (seriesIndex = 0): unknown[] => {
        const series = chart.series[seriesIndex] as { contextNodeData?: { labelData?: RenderedLabel[] } };
        return (series.contextNodeData?.labelData ?? []).map(renderedText);
    };
    const nestedLabelTexts = (seriesIndex = 0): unknown[] => {
        const series = chart.series[seriesIndex] as {
            contextNodeData?: { labelData?: { label?: RenderedLabel }[] };
        };
        return (series.contextNodeData?.labelData ?? []).map((d) => renderedText(d.label));
    };
    const someWrapped = (texts: unknown[]) => texts.some((text) => String(text).includes('\n'));
    const someTruncated = (texts: unknown[]) => texts.some((text) => String(text).includes(ELLIPSIS));

    const cartesianAxes = {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    };
    const perDatumLabel = (extra: object) => ({ enabled: true, formatter: (p: any) => p.datum.label, ...extra });

    it('wraps range-bar inside labels to the bar rect across bars of varied span', async () => {
        // Spans stay tall enough to keep each bar's low/high labels separated; a span short enough to
        // ellipsise would overlap them, so inside-rect truncation is left to the waterfall case.
        const data = [
            { cat: 'A', low: 30, high: 70, label: 'One Two Three Four Five Six' },
            { cat: 'B', low: 5, high: 95, label: 'A long range label that wraps neatly' },
            { cat: 'C', low: 38, high: 62, label: 'Short' },
            { cat: 'D', low: 25, high: 75, label: 'Another wrapping range label' },
            { cat: 'E', low: 20, high: 80, label: 'Medium length label' },
        ];
        await renderAndSnapshot({
            data,
            legend: { enabled: false },
            axes: cartesianAxes,
            series: [
                {
                    type: 'range-bar',
                    xKey: 'cat',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: perDatumLabel({ placement: 'inside', wrapping: 'on-space', truncate: true }),
                },
            ],
        });
        const texts = flatLabelTexts();
        expect(someWrapped(texts)).toBe(true);
    });

    it('renders range-bar labels whole when wrapping is set with truncate disabled', async () => {
        // `wrapping: 'never'` with `truncate: false` leaves nothing to bound the text, so it overhangs the bar rect
        // untouched; `alwaysShow` is explicit because either option otherwise opts the label into hiding.
        const data = [
            { cat: 'A', low: 40, high: 60, label: 'A long range label that overhangs its bar' },
            { cat: 'B', low: 45, high: 55, label: 'Another overly long range label' },
            { cat: 'C', low: 42, high: 58, label: 'Short' },
        ];
        await renderAndSnapshot({
            data,
            legend: { enabled: false },
            axes: cartesianAxes,
            series: [
                {
                    type: 'range-bar',
                    xKey: 'cat',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: perDatumLabel({
                        placement: 'inside',
                        wrapping: 'never',
                        truncate: false,
                        collision: { alwaysShow: true },
                    }),
                },
            ],
        });
        expect(someTruncated(flatLabelTexts())).toBe(false);
    });

    describe('waterfall (fits inside the bar rect)', () => {
        // Waterfall labels default to an outside placement — force `inside-center` so the label fits
        // the bar rect container. Configured per item type here; `series.label` would apply to all three.
        const waterfallChart = (label: object, data: object[]) => {
            const itemLabel = { label: { enabled: true, placement: 'inside-center', ...label } };
            return {
                data,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'cat',
                        yKey: 'value',
                        item: { positive: itemLabel, negative: itemLabel, total: itemLabel },
                    },
                ],
            };
        };

        it('wraps and truncates inside labels across bars of varied height', async () => {
            const data = [
                { cat: 'A', value: 100, label: 'One Two Three Four Five' },
                {
                    cat: 'B',
                    value: 30,
                    label: 'A very long waterfall label that overflows the bar badly and keeps on going',
                },
                { cat: 'C', value: 55, label: 'Short' },
                {
                    cat: 'D',
                    value: 35,
                    label: 'Another overflowing waterfall label that also runs well past the bar edge',
                },
                { cat: 'E', value: 45, label: 'Medium sized label' },
            ];
            await renderAndSnapshot(
                waterfallChart({ wrapping: 'on-space', truncate: true, formatter: (p: any) => p.datum.label }, data)
            );
            const texts = nestedLabelTexts();
            expect(someWrapped(texts)).toBe(true);
            expect(someTruncated(texts)).toBe(true);
        });

        it('hides oversized labels when alwaysShow is false', async () => {
            const data = Array.from({ length: 10 }, (_, i) => ({ cat: `Category ${i}`, value: 100 }));
            await renderAndSnapshot(
                waterfallChart(
                    {
                        collision: { alwaysShow: false },
                        formatter: () => 'A very long waterfall label that cannot possibly fit inside the bar',
                    },
                    data
                )
            );
            const texts = nestedLabelTexts();
            // alwaysShow: false → overflow 'hide': oversized labels drop to empty rather than ellipsising.
            expect(texts.some((text) => text === '' || text == null)).toBe(true);
            expect(someTruncated(texts)).toBe(false);
        });
    });

    // `minimumFontSize` shrinks a bar-family label into its bar before wrapping, truncating or hiding it.
    describe('minimumFontSize', () => {
        const FONT_SIZE = 20;
        // Enough bars that none is wide enough for its label at 20px, so the fit layer has to act.
        const bars = Array.from({ length: 6 }, (_, i) => ({ cat: `Cat ${i}`, low: 5, high: 95 - i, value: 100 - i }));
        const shrinkableLabel = (extra: object) => ({
            enabled: true,
            fontSize: FONT_SIZE,
            wrapping: 'never',
            truncate: true,
            formatter: () => 'Alpha Bravo Charlie',
            ...extra,
        });

        type LabelNode = { visible: boolean; fontSize: number; text: string };
        const drawnLabels = (): LabelNode[] =>
            (chart.series[0].labelSelection.nodes() as LabelNode[]).filter((node) => node.visible && node.text !== '');

        it('shrinks waterfall labels into their bars rather than truncating them', async () => {
            const itemLabel = { label: shrinkableLabel({ placement: 'inside-center', minimumFontSize: 4 }) };
            await render({
                data: bars,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'cat',
                        yKey: 'value',
                        item: { positive: itemLabel, negative: itemLabel, total: itemLabel },
                    },
                ],
            });
            const rendered = drawnLabels();
            expect(rendered.length).toBe(bars.length);
            for (const node of rendered) {
                expect(node.fontSize).toBeLessThan(FONT_SIZE);
                expect(node.text).not.toContain(ELLIPSIS);
            }
        });

        it('shrinks both range-bar labels into their shared bar', async () => {
            await render({
                data: bars,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'cat',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: shrinkableLabel({ placement: 'inside', minimumFontSize: 4 }),
                    },
                ],
            });
            const rendered = drawnLabels();
            expect(rendered.length).toBe(bars.length * 2);
            for (const node of rendered) {
                expect(node.fontSize).toBeLessThan(FONT_SIZE);
                expect(node.text).not.toContain(ELLIPSIS);
            }
        });

        it('stops shrinking range-bar labels at minimumFontSize and truncates from there', async () => {
            await render({
                data: bars,
                legend: { enabled: false },
                axes: cartesianAxes,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'cat',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: shrinkableLabel({ placement: 'inside', minimumFontSize: 16 }),
                    },
                ],
            });
            const rendered = drawnLabels();
            expect(rendered.map((node) => node.fontSize)).toEqual(rendered.map(() => 16));
            expect(rendered.some((node) => node.text.includes(ELLIPSIS))).toBe(true);
        });

        describe('range-area', () => {
            const rangeAreaChart = (label: object, theme?: object) => ({
                data: bars,
                legend: { enabled: false },
                axes: cartesianAxes,
                theme,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'cat',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: shrinkableLabel({ maxWidth: 60, collision: { alwaysShow: true }, ...label }),
                    },
                ],
            });

            const expectAllTruncatedAt = (fontSize: number) => {
                const rendered = drawnLabels();
                expect(rendered.length).toBe(bars.length * 2);
                expect(rendered.map((node) => node.fontSize)).toEqual(rendered.map(() => fontSize));
                expect(rendered.every((node) => node.text.includes(ELLIPSIS))).toBe(true);
            };
            const expectAllShrunkWhole = () => {
                const rendered = drawnLabels();
                expect(rendered.length).toBe(bars.length * 2);
                for (const node of rendered) {
                    expect(node.fontSize).toBeLessThan(FONT_SIZE);
                    expect(node.text).not.toContain(ELLIPSIS);
                }
            };

            it('keeps labels at their configured size when minimumFontSize is unset', async () => {
                await render(rangeAreaChart({}));
                expectAllTruncatedAt(FONT_SIZE);
            });

            it('shrinks labels to fit rather than truncating them', async () => {
                await render(rangeAreaChart({ minimumFontSize: 4 }));
                expectAllShrunkWhole();
            });

            it('stops shrinking at minimumFontSize and truncates from there', async () => {
                await render(rangeAreaChart({ minimumFontSize: 16 }));
                expectAllTruncatedAt(16);
            });

            it('stops shrinking at minimumFontSize and hides from there when alwaysShow is false', async () => {
                await render(
                    rangeAreaChart({ minimumFontSize: 16, truncate: false, collision: { alwaysShow: false } })
                );
                expect(drawnLabels()).toEqual([]);
            });

            it('takes minimumFontSize from the theme', async () => {
                const theme = { overrides: { 'range-area': { series: { label: { minimumFontSize: 4 } } } } };
                await render(rangeAreaChart({}, theme));
                expectAllShrunkWhole();
            });

            it('shrinks only the labels crowding a neighbour, with a themed minimumFontSize alone', async () => {
                const crowdedChart = (theme?: object) => ({
                    data: Array.from({ length: 8 }, (_, i) => ({ cat: `Cat ${i}`, low: 20, high: 80 })),
                    legend: { enabled: false },
                    axes: { ...cartesianAxes, y: { type: 'number', position: 'left', min: 0, max: 100 } },
                    theme,
                    series: [
                        {
                            type: 'range-area',
                            xKey: 'cat',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            label: { enabled: true, fontSize: FONT_SIZE, formatter: () => 'Alpha Bravo' },
                        },
                    ],
                });
                await render(crowdedChart());
                expect(drawnLabels().map((node) => node.fontSize)).toEqual(Array(16).fill(FONT_SIZE));

                chart.destroy();
                await render(
                    crowdedChart({ overrides: { 'range-area': { series: { label: { minimumFontSize: 6 } } } } })
                );
                const sizes = drawnLabels().map((node) => node.fontSize);
                expect(sizes).toHaveLength(16);
                expect(sizes).toContain(FONT_SIZE);
                expect(sizes.some((size) => size < FONT_SIZE)).toBe(true);
            });
        });

        // The scene-graph cases above pin the exact sizes; these pin how they look side by side.
        describe('visual', () => {
            it('renders waterfall labels across the shrink spectrum', async () => {
                // Waterfall styles its three item kinds separately, so one series compares three
                // configurations at matching bar widths.
                const spectrum = [
                    { cat: 'Opening', value: 60, label: 'Cash' },
                    { cat: 'Sales', value: 34, label: 'Merchandising revenue' },
                    { cat: 'Refunds', value: -18, label: 'Customer refunds' },
                    { cat: 'Services', value: 26, label: 'Subscription renewals' },
                    { cat: 'Costs', value: -22, label: 'Operating costs' },
                ];
                const itemLabel = (extra: object) => ({
                    label: shrinkableLabel({
                        placement: 'inside-center',
                        collision: { alwaysShow: true },
                        // The synthesised total row has no source datum of its own.
                        formatter: (p: any) => p.datum?.label ?? 'Closing balance',
                        ...extra,
                    }),
                });
                await renderAndSnapshot({
                    data: spectrum,
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'cat',
                            yKey: 'value',
                            item: {
                                positive: itemLabel({ minimumFontSize: 6, wrapping: 'on-space' }),
                                negative: itemLabel({ minimumFontSize: 14 }),
                                total: itemLabel({}),
                            },
                            totals: [{ totalType: 'total', index: spectrum.length - 1, axisLabel: 'Closing' }],
                        },
                    ],
                });
            });

            it('renders range-area labels across the shrink spectrum', async () => {
                // One band per configuration; the last datum is inverted so its labels face the opposite sides.
                const spectrum = [
                    { cat: 'A', label: 'Bid' },
                    { cat: 'B', label: 'Lowest bid' },
                    { cat: 'C', label: 'Ceiling price' },
                    { cat: 'D', label: 'Lowest recorded closing value' },
                    { cat: 'E', label: 'Closing quote', inverted: true },
                ];
                const series = [
                    { offset: 0, label: { placement: 'outside' } },
                    { offset: 35, label: { placement: 'inside', minimumFontSize: 6 } },
                    { offset: 70, label: { placement: 'outside', minimumFontSize: 12, wrapping: 'on-space' } },
                ].map(({ offset, label }, index) => ({
                    type: 'range-area',
                    xKey: 'cat',
                    yLowKey: `low${index}`,
                    yHighKey: `high${index}`,
                    label: shrinkableLabel({
                        maxWidth: 60,
                        maxHeight: 28,
                        collision: { alwaysShow: true },
                        formatter: (p: any) => p.datum.label,
                        ...label,
                    }),
                    data: spectrum.map((d) => ({
                        ...d,
                        [`low${index}`]: offset + (d.inverted ? 22 : 8),
                        [`high${index}`]: offset + (d.inverted ? 8 : 22),
                    })),
                }));
                await renderAndSnapshot({
                    legend: { enabled: false },
                    axes: {
                        ...cartesianAxes,
                        y: { type: 'number', position: 'left', min: -10, max: 115, label: { enabled: false } },
                    },
                    series,
                });
            });

            it('renders range-bar labels across the shrink spectrum', async () => {
                // Both labels of a bar fit the same rect, so the spread comes from the data; wrapping stays
                // off to isolate shrinking on a single line.
                const spectrum = [
                    { cat: 'A', low: 10, high: 90, label: 'Bid' },
                    { cat: 'B', low: 15, high: 85, label: 'Lowest bid' },
                    { cat: 'C', low: 20, high: 80, label: 'Ceiling price' },
                    { cat: 'D', low: 25, high: 75, label: 'Opening quote' },
                    { cat: 'E', low: 30, high: 70, label: 'Lowest recorded closing value' },
                ];
                await renderAndSnapshot({
                    data: spectrum,
                    legend: { enabled: false },
                    axes: cartesianAxes,
                    series: [
                        {
                            type: 'range-bar',
                            xKey: 'cat',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            label: shrinkableLabel({
                                placement: 'inside',
                                minimumFontSize: 8,
                                collision: { alwaysShow: true },
                                formatter: (p: any) => p.datum.label,
                            }),
                        },
                    ],
                });
            });
        });

        // Cone-funnel's default `start-center` is not bounded by the cone, so its labels move into the stage.
        describe.each([
            ['funnel', 'inside-center', [100, 30, 10, 4, 2]],
            ['cone-funnel', 'middle-center', [100, 30, 10, 4, 2]],
            ['pyramid', 'inside-center', [100, 60, 30, 15, 8]],
        ])('%s', (type, placement, values) => {
            const stages = values.map((value, i) => ({ stage: `Stage ${i}`, value }));
            const stageChart = (label: object, theme?: object) => ({
                data: stages,
                legend: { enabled: false },
                theme,
                series: [
                    {
                        type,
                        stageKey: 'stage',
                        valueKey: 'value',
                        label: shrinkableLabel({ placement, collision: { alwaysShow: true }, ...label }),
                    },
                ],
            });

            it('keeps labels at their configured size when minimumFontSize is unset', async () => {
                await render(stageChart({}));
                const rendered = drawnLabels();
                expect(rendered.length).toBe(stages.length);
                expect(rendered.map((node) => node.fontSize)).toEqual(rendered.map(() => FONT_SIZE));
                expect(rendered.some((node) => node.text.includes(ELLIPSIS))).toBe(true);
            });

            it('shrinks a label into its stage rather than truncating it', async () => {
                await render(stageChart({ minimumFontSize: 4 }));
                const shrunk = drawnLabels().filter((node) => node.fontSize < FONT_SIZE);
                expect(shrunk.length).toBeGreaterThan(0);
                expect(shrunk.some((node) => !node.text.includes(ELLIPSIS))).toBe(true);
            });

            it('stops shrinking at minimumFontSize and truncates from there', async () => {
                await render(stageChart({ minimumFontSize: 16 }));
                const rendered = drawnLabels();
                expect(rendered.length).toBe(stages.length);
                expect(rendered.every((node) => node.fontSize >= 16)).toBe(true);
                expect(rendered.some((node) => node.fontSize === 16 && node.text.includes(ELLIPSIS))).toBe(true);
            });

            it('shrinks before hiding when collision.alwaysShow is left to the theme', async () => {
                await render(stageChart({ minimumFontSize: 4, collision: {} }));
                expect(drawnLabels().some((node) => node.fontSize < FONT_SIZE && !node.text.includes(ELLIPSIS))).toBe(
                    true
                );

                await render(stageChart({ minimumFontSize: 16, collision: {} }));
                const rendered = drawnLabels();
                expect(rendered.length).toBeLessThan(stages.length);
                expect(rendered.every((node) => node.fontSize >= 16)).toBe(true);
            });

            it('takes minimumFontSize from the theme', async () => {
                await render(stageChart({}, { overrides: { [type]: { series: { label: { minimumFontSize: 4 } } } } }));
                expect(drawnLabels().some((node) => node.fontSize < FONT_SIZE)).toBe(true);
            });
        });

        describe('small funnel-family charts', () => {
            const MINIMUM = 8;
            const stages = [
                { stage: 'Visits', value: 100, label: 'Site visits' },
                { stage: 'Sign-ups', value: 45, label: 'Newsletter sign-ups' },
                { stage: 'Trials', value: 20, label: 'Free trial activations' },
                { stage: 'Paid', value: 9, label: 'Paid subscriptions' },
                { stage: 'Renewed', value: 4, label: 'Annual renewals completed' },
            ];
            const renderAt = (width: number, height: number, type: string, label: object) => {
                const options = {
                    data: stages,
                    legend: { enabled: false },
                    series: [
                        {
                            type,
                            stageKey: 'stage',
                            valueKey: 'value',
                            label: shrinkableLabel({
                                minimumFontSize: MINIMUM,
                                collision: { alwaysShow: true },
                                formatter: (p: any) => p.datum.label,
                                ...label,
                            }),
                        },
                    ],
                };
                prepareEnterpriseTestOptions(options as AgChartOptions);
                Object.assign(options, { width, height });
                chart = deproxy(AgCharts.create(options as AgChartOptions));
                return waitForChartStability(chart);
            };

            type StageLabel = LabelNode & {
                datum: { datumIndex: number };
                getBBox(): { x: number; y: number; width: number; height: number };
            };
            type StageRect = { x: number; y: number; width: number; height: number };
            const stageLabels = () => drawnLabels() as StageLabel[];
            const stageRect = (node: StageLabel): StageRect =>
                chart.series[0].contextNodeData.nodeData[node.datum.datumIndex];
            const centreX = (box: StageRect) => box.x + box.width / 2;

            it('shrinks outside-end funnel labels into the gap between stages, centred on their stage', async () => {
                await renderAt(380, 440, 'funnel', { placement: 'outside-end' });
                const rendered = stageLabels();
                expect(rendered.length).toBe(stages.length);
                for (const node of rendered) {
                    expect(centreX(node.getBBox())).toBeCloseTo(centreX(stageRect(node)), 0);
                    expect(node.text).not.toContain(ELLIPSIS);
                }
                expect(rendered.slice(0, -1).every((node) => node.fontSize < FONT_SIZE)).toBe(true);
                // The last label overflows at any size, so it is kept at the smallest one it may take.
                expect(rendered.at(-1)!.fontSize).toBe(MINIMUM);
            });

            it('never slides an outside-end funnel label off its stage when alwaysShow is false', async () => {
                await renderAt(380, 440, 'funnel', { placement: 'outside-end', collision: { alwaysShow: false } });
                const rendered = stageLabels();
                // The last stage ends at the bottom of the series area, leaving its label no room beneath it.
                expect(rendered.map((node) => node.datum.datumIndex)).toEqual([0, 1, 2, 3]);
                for (const node of rendered) {
                    expect(centreX(node.getBBox())).toBeCloseTo(centreX(stageRect(node)), 0);
                }
            });

            it.each([
                ['start-center', 'cone-funnel'],
                ['end-center', 'cone-funnel'],
            ])('shrinks %s cone-funnel labels before truncating them', async (placement, type) => {
                await renderAt(220, 440, type, { placement });
                const rendered = stageLabels();
                expect(rendered.length).toBe(stages.length);
                const truncatedAboveMinimum = rendered.filter(
                    (n) => n.text.includes(ELLIPSIS) && n.fontSize !== MINIMUM
                );
                expect(truncatedAboveMinimum).toEqual([]);
                expect(rendered.some((node) => node.fontSize < FONT_SIZE)).toBe(true);
            });

            // Cone-funnel labels sit on a stage divider rather than inside a stage, so are not height-bound.
            const stageBound = [
                ['funnel', 'inside-start'],
                ['funnel', 'inside-center'],
                ['pyramid', 'inside-center'],
            ];

            it.each(stageBound)('shrinks unwrapped %s %s labels to the stage height', async (type, placement) => {
                await renderAt(380, 120, type, { placement });
                const rendered = stageLabels();
                expect(rendered.length).toBe(stages.length);
                const tallerAboveMinimum = rendered.filter(
                    (n) => n.getBBox().height > stageRect(n).height + 0.5 && n.fontSize !== MINIMUM
                );
                expect(tallerAboveMinimum).toEqual([]);
                expect(rendered.some((node) => node.fontSize < FONT_SIZE)).toBe(true);
            });

            describe.each([...stageBound, ['cone-funnel', 'middle-center']])('%s %s', (type, placement) => {
                it.each([
                    ['never', 380, 80, MINIMUM],
                    ['on-space', 380, 120, MINIMUM],
                    ['on-space', 380, 200, MINIMUM],
                    ['on-space', 380, 200, undefined],
                ])(
                    'keeps every %s-wrapped label at %ix%i with minimumFontSize %s when alwaysShow is true',
                    async (wrapping, width, height, minimumFontSize) => {
                        await renderAt(width, height, type, { placement, wrapping, minimumFontSize });
                        const rendered = stageLabels();
                        expect(rendered.length).toBe(stages.length);
                        expect(rendered.filter((node) => node.text === ELLIPSIS)).toEqual([]);
                    }
                );
            });

            it.each([
                ['outside-end', 'on-space', 380, 440],
                ['inside-center', 'never', 380, 80],
            ])('renders %s %s-wrapped funnel labels at %ix%i', async (placement, wrapping, width, height) => {
                await renderAt(width, height, 'funnel', { placement, wrapping });
                await compareImageSnapshot(chart, ctx);
            });
        });

        // One chart per series, as they cannot share a chart; each stage label exercises a different fit outcome.
        describe('visual: funnel family', () => {
            const spectrum = [
                { stage: 'Visits', value: 100, label: 'Site visits' },
                { stage: 'Sign-ups', value: 45, label: 'Newsletter sign-ups' },
                { stage: 'Trials', value: 20, label: 'Free trial activations' },
                { stage: 'Paid', value: 9, label: 'Paid subscriptions' },
                { stage: 'Renewed', value: 4, label: 'Annual renewals completed' },
            ];
            const stageSeries = (type: string, label: object) => ({
                data: spectrum,
                legend: { enabled: false },
                series: [
                    {
                        type,
                        stageKey: 'stage',
                        valueKey: 'value',
                        label: shrinkableLabel({
                            collision: { alwaysShow: true },
                            formatter: (p: any) => p.datum.label,
                            ...label,
                        }),
                    },
                ],
            });

            it('renders funnel labels across the shrink spectrum', async () => {
                await renderAndSnapshot(stageSeries('funnel', { minimumFontSize: 8, wrapping: 'on-space' }));
            });

            it('renders cone-funnel labels across the shrink spectrum', async () => {
                await renderAndSnapshot(stageSeries('cone-funnel', { placement: 'middle-center', minimumFontSize: 6 }));
            });

            it('renders pyramid labels across the shrink spectrum', async () => {
                // Even stage heights with the longest labels nearest the apex, so the narrowing triangle bounds them.
                await renderAndSnapshot({
                    ...stageSeries('pyramid', { minimumFontSize: 8, wrapping: 'on-space' }),
                    data: spectrum.map((d, i) => ({ ...d, value: 20, label: spectrum.at(-1 - i)!.label })),
                });
            });
        });
    });

    it('wraps and truncates range-area labels within an explicit maxWidth/maxHeight', async () => {
        const data = [
            { cat: 'A', low: 10, high: 90, label: 'Hi' },
            { cat: 'B', low: 20, high: 80, label: 'A medium length label' },
            { cat: 'C', low: 30, high: 70, label: 'A very long range-area label that will not fit at all' },
            { cat: 'D', low: 15, high: 85, label: 'Two words' },
        ];
        await renderAndSnapshot({
            data,
            legend: { enabled: false },
            axes: cartesianAxes,
            series: [
                {
                    type: 'range-area',
                    xKey: 'cat',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: perDatumLabel({ maxWidth: 50, maxHeight: 32, wrapping: 'on-space', truncate: true }),
                },
            ],
        });
        expect(someTruncated(flatLabelTexts())).toBe(true);
    });

    it('wraps and truncates radar labels within an explicit maxWidth/maxHeight', async () => {
        const data = [
            { subject: 'Maths', grade: 8, label: 'Hi' },
            { subject: 'English', grade: 7, label: 'A medium length label' },
            { subject: 'History', grade: 6, label: 'A very long radar label that will not fit at all' },
            { subject: 'Science', grade: 9, label: 'Two words' },
        ];
        await renderAndSnapshot({
            data,
            series: [
                {
                    type: 'radar-line',
                    angleKey: 'subject',
                    radiusKey: 'grade',
                    label: perDatumLabel({ maxWidth: 50, maxHeight: 32, wrapping: 'on-space', truncate: true }),
                },
            ],
        });
        expect(someTruncated(nestedLabelTexts())).toBe(true);
    });

    it('wraps and truncates map-marker labels within an explicit maxWidth/maxHeight', async () => {
        await renderAndSnapshot({
            topology: ukTopology,
            series: [
                { type: 'map-shape-background' },
                {
                    type: 'map-marker',
                    // Well separated so no marker is dropped by the default marker collision avoidance.
                    data: [
                        { name: 'A', lat: 51.5, lon: -3.5, label: 'Hi' },
                        { name: 'B', lat: 55, lon: 0, label: 'A very long marker label that will not fit at all' },
                        { name: 'C', lat: 53, lon: -4.5, label: 'A medium length label' },
                    ],
                    latitudeKey: 'lat',
                    longitudeKey: 'lon',
                    labelKey: 'name',
                    label: perDatumLabel({ maxWidth: 50, maxHeight: 32, wrapping: 'on-space', truncate: true }),
                },
            ],
        });
        expect(someTruncated(nestedLabelTexts(1))).toBe(true);
    });

    describe('sankey (fits between the nodes)', () => {
        const FONT_SIZE = 14;
        const flows = [
            { from: 'Organic search', to: 'Product page visits from every channel', size: 10 },
            { from: 'Paid advertising', to: 'Product page visits from every channel', size: 6 },
            { from: 'Paid advertising', to: 'Pricing', size: 4 },
            { from: 'Product page visits from every channel', to: 'Free trial sign-up', size: 9 },
            { from: 'Product page visits from every channel', to: 'Bounced', size: 7 },
            { from: 'Pricing', to: 'Free trial sign-up', size: 4 },
        ];
        const sankeyChart = (label: object, theme?: object) => ({
            data: flows,
            theme,
            series: [
                {
                    type: 'sankey',
                    fromKey: 'from',
                    toKey: 'to',
                    sizeKey: 'size',
                    label: { fontSize: FONT_SIZE, ...label },
                },
            ],
        });
        const renderNarrow = async (options: object) => {
            prepareEnterpriseTestOptions(options as AgChartOptions);
            chart = deproxy(AgCharts.create({ ...options, width: 500 } as AgChartOptions));
            await waitForChartStability(chart);
        };
        type LabelNode = { visible: boolean; fontSize: number; text: string; getBBox(): { width: number } };
        const drawnLabels = (): LabelNode[] =>
            (chart.series[0].labelSelection.nodes() as LabelNode[]).filter((node) => node.visible && node.text !== '');
        const isWrapped = (node: LabelNode) => node.text.includes('\n');
        const isTruncated = (node: LabelNode) => node.text.includes(ELLIPSIS);

        it('truncates labels on one line at their configured size when no fit option is set', async () => {
            await renderNarrow(sankeyChart({}));
            const rendered = drawnLabels();
            expect(rendered.length).toBe(6);
            expect(rendered.every((node) => node.fontSize === FONT_SIZE && !isWrapped(node))).toBe(true);
            expect(rendered.some(isTruncated)).toBe(true);
        });

        it('wraps a label rather than truncating it', async () => {
            await renderNarrow(sankeyChart({ wrapping: 'on-space' }));
            expect(drawnLabels().some((node) => isWrapped(node) && !isTruncated(node))).toBe(true);
        });

        it('keeps every label within maxWidth', async () => {
            await renderNarrow(sankeyChart({ maxWidth: 60 }));
            const rendered = drawnLabels();
            expect(rendered.length).toBe(6);
            expect(rendered.every((node) => node.getBBox().width <= 60.5)).toBe(true);
            expect(rendered.some(isWrapped)).toBe(true);
        });

        it('truncates the lines that do not fit within maxHeight', async () => {
            await renderNarrow(sankeyChart({ maxWidth: 60, maxHeight: FONT_SIZE * 1.5 }));
            const rendered = drawnLabels();
            expect(rendered.some(isWrapped)).toBe(false);
            expect(rendered.some(isTruncated)).toBe(true);
        });

        it('hides a label that does not fit when truncate is false', async () => {
            await renderNarrow(sankeyChart({ wrapping: 'never', truncate: false }));
            const rendered = drawnLabels();
            expect(rendered.length).toBeGreaterThan(0);
            expect(rendered.length).toBeLessThan(6);
            expect(rendered.some(isTruncated)).toBe(false);
        });

        it('shrinks a label rather than truncating it', async () => {
            await renderNarrow(sankeyChart({ wrapping: 'never', minimumFontSize: 6 }));
            expect(drawnLabels().some((node) => node.fontSize < FONT_SIZE && !isTruncated(node))).toBe(true);
        });

        it('stops shrinking at minimumFontSize and truncates from there', async () => {
            await renderNarrow(sankeyChart({ wrapping: 'never', minimumFontSize: 12 }));
            const rendered = drawnLabels();
            expect(rendered.every((node) => node.fontSize >= 12)).toBe(true);
            expect(rendered.some((node) => node.fontSize === 12 && isTruncated(node))).toBe(true);
        });

        it('resolves the other fit options once one is set', async () => {
            await renderNarrow(sankeyChart({}));
            const { wrapping, truncate } = chart.series[0].options.label;
            expect([wrapping, truncate]).toEqual([undefined, undefined]);

            chart.destroy();
            await renderNarrow(sankeyChart({ minimumFontSize: 6 }));
            expect(chart.series[0].options.label).toMatchObject({ wrapping: 'on-space', truncate: true });
        });

        it('takes the fit options from the theme', async () => {
            await renderNarrow(
                sankeyChart({}, { overrides: { sankey: { series: { label: { wrapping: 'on-space' } } } } })
            );
            expect(drawnLabels().some(isWrapped)).toBe(true);
        });

        it('renders labels that fit, wrap, shrink and truncate clear of the nodes', async () => {
            const options = {
                ...sankeyChart({ wrapping: 'on-space', minimumFontSize: 9, maxHeight: 30 }),
                data: [
                    { from: 'Search', to: 'Product page visits from every channel', size: 12 },
                    { from: 'Search', to: 'Pricing', size: 4 },
                    { from: 'Adverts', to: 'Product page visits from every channel', size: 5 },
                    { from: 'Adverts', to: 'Competitor comparison and independent reviews', size: 2 },
                    { from: 'Adverts', to: 'Documentation', size: 3 },
                    {
                        from: 'Product page visits from every channel',
                        to: 'Trial started from a landing page, a webinar, a partner referral link or a booked sales demo',
                        size: 10,
                    },
                    { from: 'Product page visits from every channel', to: 'Bounced', size: 7 },
                    {
                        from: 'Pricing',
                        to: 'Trial started from a landing page, a webinar, a partner referral link or a booked sales demo',
                        size: 4,
                    },
                    {
                        from: 'Competitor comparison and independent reviews',
                        to: 'Industry analyst coverage, awards and press',
                        size: 2,
                    },
                    {
                        from: 'Documentation',
                        to: 'Trial started from a landing page, a webinar, a partner referral link or a booked sales demo',
                        size: 3,
                    },
                    {
                        from: 'Trial started from a landing page, a webinar, a partner referral link or a booked sales demo',
                        to: 'Paid subscription',
                        size: 9,
                    },
                    {
                        from: 'Trial started from a landing page, a webinar, a partner referral link or a booked sales demo',
                        to: 'Churned during the trial',
                        size: 8,
                    },
                    { from: 'Industry analyst coverage, awards and press', to: 'Paid subscription', size: 2 },
                ],
            };
            prepareEnterpriseTestOptions(options as AgChartOptions);
            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await compareImageSnapshot(chart, ctx);
        });
    });

    describe('map-shape (fits inside the shape polygon)', () => {
        const ukSeries = (label: object, labelText = 'A long label that has to wrap inside its shape') => ({
            topology: ukTopology,
            series: [
                {
                    type: 'map-shape',
                    data: [
                        { name: 'England', label: labelText },
                        { name: 'Scotland', label: labelText },
                        { name: 'Wales', label: labelText },
                        { name: 'Northern Ireland', label: labelText },
                    ],
                    idKey: 'name',
                    labelKey: 'label',
                    label,
                },
            ],
        });
        type MapShapeLabel = { text: unknown; fontSize: number; idValue: string };
        const mapShapeLabels = (): MapShapeLabel[] =>
            (chart.series[0].contextNodeData?.labelData ?? []) as MapShapeLabel[];
        const expectCornersInside = (shape: any, box: { x: number; y: number; width: number; height: number }) => {
            for (const [x, y] of [
                [box.x, box.y],
                [box.x + box.width, box.y],
                [box.x, box.y + box.height],
                [box.x + box.width, box.y + box.height],
            ]) {
                // Shape edges are drawn with a stroke, so a corner on the edge is allowed 1px of slack.
                expect(shape.distanceSquared(x, y)).toBeLessThanOrEqual(1);
            }
        };
        const eachLabelShape = (visit: (shape: any, text: any) => void) => {
            const series = chart.series[0];
            const shapes = new Map<unknown, any>();
            series.datumSelection.each((node: any, datum: any) => shapes.set(datum.idValue, node));
            series.labelSelection.each((text: any, labelDatum: any) => visit(shapes.get(labelDatum.idValue), text));
        };
        // Every drawn line box must sit inside its shape, which is the contract the region fit makes.
        const everyLineInsideItsShape = () => {
            let checked = 0;
            eachLabelShape((shape, text) => {
                for (const box of text.getLineBoxes()) {
                    checked += 1;
                    expectCornersInside(shape, box);
                }
            });
            return checked;
        };

        it('wraps labels within their shape by default', async () => {
            await renderAndSnapshot(ukSeries({ fontSize: 10 }));
            expect(someWrapped(flatLabelTexts())).toBe(true);
            expect(everyLineInsideItsShape()).toBeGreaterThan(1);
        });

        // A filled label draws one rectangle round the whole block, which has to fit the shape as a rectangle:
        // in a triangle the lines nearer the apex are narrower than the widest line the box is drawn to.
        it('keeps the box drawn round a label inside the shape', async () => {
            const triangle = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: { name: 'Apex' },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [3, 0],
                                    [1.5, 12],
                                    [0, 0],
                                ],
                            ],
                        },
                    },
                ],
            };
            await renderAndSnapshot({
                topology: triangle,
                series: [
                    {
                        type: 'map-shape',
                        data: [{ name: 'Apex', label: 'A long label that has to wrap inside its shape' }],
                        idKey: 'name',
                        labelKey: 'label',
                        label: { fontSize: 18, color: 'black', fill: 'white', padding: 4, truncate: true },
                    },
                ],
            });
            let checked = 0;
            eachLabelShape((shape, text) => {
                const boxes: { x: number; y: number; width: number; height: number }[] = text.getLineBoxes();
                if (boxes.length === 0) return;
                checked += 1;
                // The line boxes tile the drawn box, padding included, so their union is the rectangle drawn.
                const x = Math.min(...boxes.map((box) => box.x));
                const y = Math.min(...boxes.map((box) => box.y));
                const right = Math.max(...boxes.map((box) => box.x + box.width));
                const bottom = Math.max(...boxes.map((box) => box.y + box.height));
                expectCornersInside(shape, { x, y, width: right - x, height: bottom - y });
            });
            expect(checked).toBe(1);
        });

        // Setting `wrapping` is one of the shared triggers that turns `truncate` on, so it is disabled again here.
        it('hides a label that does not fit at all rather than truncating it', async () => {
            await renderAndSnapshot(ukSeries({ fontSize: 14, wrapping: 'never', truncate: false }));
            expect(someTruncated(flatLabelTexts())).toBe(false);
            expect(flatLabelTexts().length).toBeLessThan(4);
        });

        it('truncates within an explicit maxWidth/maxHeight', async () => {
            await renderAndSnapshot(ukSeries({ fontSize: 10, maxWidth: 40, maxHeight: 30, truncate: true }));
            const boxes: any[] = [];
            chart.series[0].labelSelection.each((text: any) => boxes.push(...text.getLineBoxes()));
            expect(boxes.length).toBeGreaterThan(0);
            expect(boxes.every((box) => box.width <= 40 + 1)).toBe(true);
            expect(someTruncated(flatLabelTexts())).toBe(true);
        });

        // Two 10px lines exactly fill a 20px maxHeight, which must not be mistaken for filling the shape.
        describe('with a block that fills maxHeight', () => {
            const usSeries = () => ({
                data: usData,
                topology: usTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                        labelKey: 'name',
                        label: { fontSize: 8, wrapping: 'on-space', maxWidth: 40, maxHeight: 20, lineHeight: 10 },
                    },
                ],
            });
            const bounds = (boxes: { x: number; y: number; width: number; height: number }[]) => {
                const y = Math.min(...boxes.map((box) => box.y));
                const bottom = Math.max(...boxes.map((box) => box.y + box.height));
                return { y, height: bottom - y };
            };
            const labelledIds = () => mapShapeLabels().map((label) => label.idValue);

            it('centres the labels in their shapes', async () => {
                await renderAndSnapshot(usSeries());
                expect(labelledIds()).toContain('New Mexico');
                const offCentre = new Map<string, number>();
                eachLabelShape((shape, text) => {
                    const shapeBox = shape.getBBox();
                    const labelBox = bounds(text.getLineBoxes());
                    const offset = labelBox.y + labelBox.height / 2 - (shapeBox.y + shapeBox.height / 2);
                    offCentre.set(text.datum.idValue, Math.abs(offset) / shapeBox.height);
                });
                const blocky = ['North Dakota', 'South Dakota', 'Colorado', 'Utah', 'Nevada', 'Kansas', 'Wyoming'];
                expect(Object.fromEntries(blocky.map((id) => [id, offCentre.get(id)! < 0.15]))).toEqual(
                    Object.fromEntries(blocky.map((id) => [id, true]))
                );
                expect(everyLineInsideItsShape()).toBeGreaterThan(0);
            });

            it('keeps a label that fits as the chart grows', async () => {
                const options = usSeries() as AgChartOptions;
                prepareEnterpriseTestOptions(options);
                Object.assign(options, { width: 890, height: 600 });
                const api = AgCharts.create(options);
                chart = deproxy(api);
                await waitForChartStability(chart);
                const grown = ['North Carolina', 'South Dakota'];
                expect(labelledIds()).toEqual(expect.arrayContaining(grown));

                await api.updateDelta({ width: 900 });
                await compareImageSnapshot(chart, ctx);
                expect(labelledIds()).toEqual(expect.arrayContaining(grown));
                expect(everyLineInsideItsShape()).toBeGreaterThan(0);
            });
        });

        it('shrinks labels to minimumFontSize before wrapping or hiding them', async () => {
            await renderAndSnapshot(
                ukSeries({ fontSize: 14, wrapping: 'never', minimumFontSize: 6, truncate: false }, 'Tiny label')
            );
            const labels = mapShapeLabels();
            expect(labels.length).toBe(4);
            expect(labels.some((label) => label.fontSize < 14)).toBe(true);
            expect(labels.every((label) => label.fontSize >= 6)).toBe(true);
            expect(someTruncated(flatLabelTexts())).toBe(false);
            expect(everyLineInsideItsShape()).toBe(labels.length);
        });
    });

    // A pyramid stage is a trapezoid, and the apex one is a triangle: the room a line of text gets depends on
    // where in the stage it sits, so a long apex label wraps into the narrowing point rather than against one
    // inscribed rectangle's width.
    it('wraps a long value label into the narrowing apex of a pyramid', async () => {
        await renderAndSnapshot({
            data: [
                { stage: 'Awareness', value: 20 },
                { stage: 'Interest', value: 40 },
                { stage: 'Consideration', value: 60 },
                { stage: 'Purchase', value: 80 },
            ],
            legend: { enabled: false },
            padding: { top: 20, right: 120, bottom: 20, left: 120 },
            series: [
                {
                    type: 'pyramid',
                    stageKey: 'stage',
                    valueKey: 'value',
                    label: {
                        enabled: true,
                        wrapping: 'on-space',
                        truncate: true,
                        formatter: () => 'A rather long value label that has to find room inside the stage it sits in',
                    },
                },
            ],
        });
    });
    describe('tile labels (heatmap, treemap, sunburst)', () => {
        const tileNames = [
            'Supercalifragilistic',
            'Antidisestablishment',
            'Floccinaucinihilipilification',
            'Pneumonoultramicroscopic',
            'Hippopotomonstrosesquipedalian',
            'Incomprehensibilities',
        ];
        const treemapData = [
            { name: 'A broad tile label', value: 200 },
            ...tileNames.map((name) => ({ name, value: 3 })),
        ];
        const treemapChart = (label: object, secondaryLabel?: object) => ({
            data: treemapData.map((d) => ({ ...d, detail: 'Secondary detail text' })),
            series: [
                {
                    type: 'treemap',
                    labelKey: 'name',
                    sizeKey: 'value',
                    secondaryLabelKey: secondaryLabel ? 'detail' : undefined,
                    tile: { label: { fontSize: 14, minimumFontSize: 10, ...label }, secondaryLabel },
                },
            ],
        });
        const sunburstChart = (label: object) => ({
            data: tileNames.map((name) => ({ name: 'Group', children: tileNames.map(() => ({ name, value: 1 })) })),
            series: [
                {
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'value',
                    label: { fontSize: 14, minimumFontSize: 10, ...label },
                },
            ],
        });
        const heatmapChart = (label: object) => ({
            data: tileNames.flatMap((name, x) => tileNames.map((_, y) => ({ x, y, color: x + y, name }))),
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'category', position: 'left' },
            },
            series: [
                {
                    type: 'heatmap',
                    xKey: 'x',
                    yKey: 'y',
                    colorKey: 'color',
                    label: { enabled: true, fontSize: 14, formatter: (p: any) => p.datum.name, ...label },
                },
            ],
        });

        const hierarchyLabelTexts = (): string[] => {
            const texts: string[] = [];
            chart.series[0].rootNode?.walk((node: any) => {
                if (node.children.length === 0 && node.label != null) texts.push(String(node.label.text));
            });
            return texts;
        };
        const heatmapLabelTexts = (): string[] =>
            (chart.series[0].contextNodeData?.labelData ?? [])
                .filter((d: { hidden?: boolean }) => d.hidden !== true)
                .map((d: { text: unknown; fittedText?: unknown }) => String(d.fittedText ?? d.text));
        const longNameShown = (texts: string[]) => tileNames.filter((name) => texts.includes(name)).length;

        it.each([
            ['treemap', treemapChart, hierarchyLabelTexts],
            ['sunburst', sunburstChart, hierarchyLabelTexts],
            ['heatmap', heatmapChart, heatmapLabelTexts],
        ] as const)(
            '%s truncates by default, hides with truncate off and keeps with alwaysShow',
            async (_, build, texts) => {
                await render(build({}));
                expect(someTruncated(texts())).toBe(true);
                const truncatedCount = texts().length;

                await render(build({ truncate: false }));
                expect(someTruncated(texts())).toBe(false);
                expect(texts().length).toBeLessThan(truncatedCount);

                await render(build({ truncate: false, collision: { alwaysShow: true } }));
                expect(someTruncated(texts())).toBe(false);
                expect(texts().length).toBe(truncatedCount);
                expect(longNameShown(texts())).toBeGreaterThan(0);
            }
        );

        it('keeps overflowing sunburst labels at a finite position', async () => {
            await render({
                data: [{ name: 'Root', children: tileNames.map((name) => ({ name: name.repeat(8), value: 1 })) }],
                series: [
                    {
                        type: 'sunburst',
                        labelKey: 'name',
                        sizeKey: 'value',
                        label: { wrapping: 'never', truncate: false, collision: { alwaysShow: true } },
                    },
                ],
            });
            const labels: any[] = [];
            chart.series[0].rootNode?.walk((node: any) => {
                if (node.label != null) labels.push(node.label);
            });
            expect(labels.length).toBeGreaterThan(0);
            for (const label of labels) {
                expect(Number.isFinite(label.radius)).toBe(true);
            }
        });

        it('keeps a secondary label that alwaysShow marks when the stack does not fit', async () => {
            const options = treemapChart({}, { fontSize: 14, minimumFontSize: 14, truncate: false });
            await render(options);
            const secondaryCount = () => {
                let count = 0;
                chart.series[0].rootNode?.walk((node: any) => {
                    if (node.children.length === 0 && node.secondaryLabel != null) count += 1;
                });
                return count;
            };
            const hidden = treemapData.length - secondaryCount();
            expect(hidden).toBeGreaterThan(0);

            await render(
                treemapChart(
                    {},
                    { fontSize: 14, minimumFontSize: 14, truncate: false, collision: { alwaysShow: true } }
                )
            );
            expect(secondaryCount()).toBe(treemapData.length);
        });

        it('warns on the deprecated overflowStrategy and maps `hide` onto truncate off', async () => {
            await render(treemapChart({ overflowStrategy: 'hide' }));
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`series[0].tile.label.overflowStrategy\` is deprecated. Use \`truncate\` instead.",
                ],
              ]
            `);
            expect(chart.series[0].options.tile.label.truncate).toBe(false);
            expect(someTruncated(hierarchyLabelTexts())).toBe(false);
        });

        it('renders whole, truncated, overflowing and hidden treemap labels', async () => {
            // Mid-sized tiles truncate, `alwaysShow` keeps the slivers' labels overflowing, secondaries hide.
            const data = [
                { name: 'A broad tile label', value: 200 },
                ...tileNames.map((name, i) => ({ name, value: i < 3 ? 8 : 0.1 })),
            ];
            await renderAndSnapshot({
                data: data.map((d) => ({ ...d, detail: 'Secondary detail text' })),
                series: [
                    {
                        type: 'treemap',
                        labelKey: 'name',
                        sizeKey: 'value',
                        secondaryLabelKey: 'detail',
                        tile: {
                            label: { fontSize: 14, minimumFontSize: 10, collision: { alwaysShow: true } },
                            secondaryLabel: { truncate: false },
                        },
                    },
                ],
            });
            const texts = hierarchyLabelTexts();
            expect(someTruncated(texts)).toBe(true);
            expect(texts.length).toBe(data.length);
        });

        it('shrinks heatmap labels towards minimumFontSize to keep them inside their cells', async () => {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
            const regions = ['Americas', 'EMEA', 'APAC'];
            await renderAndSnapshot(
                {
                    title: { text: 'minimumFontSize: 8 only' },
                    data: regions.flatMap((region, r) =>
                        quarters.map((quarter, q) => ({ region, quarter, growth: 10 + r * 7 + q * 3 }))
                    ),
                    series: [
                        {
                            type: 'heatmap',
                            xKey: 'quarter',
                            yKey: 'region',
                            colorKey: 'growth',
                            label: {
                                enabled: true,
                                fontSize: 14,
                                minimumFontSize: 8,
                                formatter: ({ value }: any) => `Revenue growth of ${value} percent year on year`,
                            },
                        },
                    ],
                    legend: { enabled: false },
                },
                { width: 460, height: 340 }
            );
            const series = chart.series[0];
            const cells = new Map<number, BBox>();
            for (const rect of series.datumSelection.nodes()) {
                cells.set(rect.datum.datumIndex, Transformable.toCanvas(rect));
            }
            const labels = (series.labelSelection.nodes() as any[]).filter((node) => node.visible && node.text !== '');
            expect(labels.length).toBe(cells.size);
            const overflowing = labels.filter(
                (node) => !contains(cells.get(node.datum.datumIndex)!, Transformable.toCanvas(node))
            );
            expect(overflowing.map((node) => ({ text: node.text, fontSize: node.fontSize }))).toEqual([]);
            expect(labels.some((node) => node.fontSize < 14)).toBe(true);
        });

        it('keeps sunburst labels shrunk and inside the chart when it is too small for them', async () => {
            const leaf = (name: string, note: string, size: number) => ({ name, note, size });
            await renderAndSnapshot(
                {
                    title: { text: 'minimumFontSize only' },
                    data: [
                        {
                            name: 'Information Technology',
                            note: 'Largest sector by market capitalisation',
                            children: [
                                leaf('Semiconductors and Semiconductor Equipment', 'Up 2.4% on the day', 40),
                                leaf('Cloud', 'Up 0.9%', 14),
                                leaf('Cybersecurity and Network Infrastructure', 'Down 1.2% on the day', 9),
                                leaf('AI', 'Up 3.1%', 4),
                            ],
                        },
                        {
                            name: 'Health Care and Life Sciences',
                            note: 'Defensive sector',
                            children: [
                                leaf('Pharmaceuticals and Biotechnology', 'Down 0.3% on the day', 30),
                                leaf('Medical Devices', 'Up 0.4%', 12),
                                leaf('Diagnostics and Research Tools', 'Up 1.7% on the day', 6),
                            ],
                        },
                        {
                            name: 'Financials',
                            note: 'Rate sensitive',
                            children: [
                                leaf('Banks and Diversified Financial Services', 'Up 0.6% on the day', 25),
                                leaf('Insurance', 'Flat', 10),
                                leaf('Asset Management', 'Down 2.0%', 5),
                            ],
                        },
                    ],
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            secondaryLabelKey: 'note',
                            sizeKey: 'size',
                            label: { fontSize: 16, minimumFontSize: 8 },
                            secondaryLabel: { fontSize: 14, minimumFontSize: 8 },
                        },
                    ],
                },
                { width: 220, height: 220 }
            );
            const drawn: { text: string; fontSize: number; box: BBox }[] = [];
            chart.series[0].labelSelection.each((group: any) => {
                for (const node of group.children()) {
                    if (node.visible && node.text) {
                        drawn.push({ text: node.text, fontSize: node.fontSize, box: Transformable.toCanvas(node) });
                    }
                }
            });
            expect(drawn.length).toBeGreaterThan(0);
            expect(drawn.filter((label) => label.fontSize >= 14).map((label) => label.text)).toEqual([]);
            const canvas = { x: 0, y: 0, width: 220, height: 220 };
            expect(drawn.filter(({ box }) => !contains(canvas, box)).map((label) => label.text)).toEqual([]);
        });
    });

    describe('gauge labels', () => {
        const longText = 'Supercalifragilistic'.repeat(6);
        const visibleTexts = (selection: any): string[] =>
            selection
                .nodes()
                .filter((node: any) => node.visible)
                .map((node: any) => String(node.text));
        const gaugeLabelTexts = () => visibleTexts(chart.series[0].labelSelection);
        const renderGauge = async (options: object) => {
            prepareEnterpriseTestOptions(options as AgChartOptions);
            chart = deproxy(AgCharts.createGauge(options as any));
            await waitForChartStability(chart);
        };
        const radialGauge = (label: object, secondaryLabel?: object) => ({
            type: 'radial-gauge',
            value: 50,
            scale: { min: 0, max: 100 },
            label: { text: longText, wrapping: 'never', fontSize: 14, minimumFontSize: 14, ...label },
            secondaryLabel,
        });
        const linearGauge = (label: object) => ({
            type: 'linear-gauge',
            value: 50,
            scale: { min: 0, max: 100 },
            label: { enabled: true, text: longText, wrapping: 'never', ...label },
        });

        it.each([
            ['radial-gauge', radialGauge],
            ['linear-gauge', linearGauge],
        ] as const)('%s truncates by default, hides with truncate off and keeps with alwaysShow', async (_, build) => {
            await renderGauge(build({}));
            expect(someTruncated(gaugeLabelTexts())).toBe(true);

            await renderGauge(build({ truncate: false }));
            expect(gaugeLabelTexts()).toEqual([]);

            await renderGauge(build({ truncate: false, collision: { alwaysShow: true } }));
            expect(gaugeLabelTexts()).toEqual([longText]);
        });

        it('keeps radial-gauge labels that alwaysShow marks when the stack does not fit', async () => {
            const secondaryLabel = { text: longText, truncate: false };
            await renderGauge(radialGauge({ text: 'Score' }, secondaryLabel));
            expect(gaugeLabelTexts()).toEqual([]);

            await renderGauge(
                radialGauge(
                    { text: 'Score', collision: { alwaysShow: true } },
                    { ...secondaryLabel, collision: { alwaysShow: true } }
                )
            );
            expect(gaugeLabelTexts()).toEqual(['Score', longText]);
        });

        it('never hides a radial-gauge secondary label for colliding with its own primary label', async () => {
            await renderGauge(radialGauge({ text: 'Score' }, { text: 'Label', collision: { threshold: 30 } }));
            expect(gaugeLabelTexts()).toEqual(['Score', 'Label']);
        });

        const targetLabelTexts = () => visibleTexts(chart.series[0].targetLabelSelection);
        const scaleLabelTexts = () => visibleTexts(chart.series[0].tickSelection);
        const firstLabelNode = () => chart.series[0].labelSelection.nodes()[0];
        const horizontalLinearGauge = (options: object) => ({
            type: 'linear-gauge',
            direction: 'horizontal',
            value: 10,
            scale: { min: 0, max: 100 },
            width: 600,
            height: 300,
            ...options,
        });

        it('falls back through a linear-gauge placement list until one fits', async () => {
            const label = { enabled: true, text: 'A long label text' };
            await renderGauge(horizontalLinearGauge({ label: { ...label, placement: 'bar-inside' } }));
            expect(gaugeLabelTexts()).toEqual([]);

            await renderGauge(horizontalLinearGauge({ label: { ...label, placement: ['bar-inside', 'inside-end'] } }));
            expect(gaugeLabelTexts()).toEqual([label.text]);
            expect(firstLabelNode().textAlign).toBe('right');
        });

        it.each([
            ['horizontal', 'inside-center', 60, 20],
            ['vertical', 'inside-center', 60, 20],
            ['horizontal', 'bar-inside', 0, 60],
        ])(
            'reserves room for a %s linear-gauge outside fallback when %s does not fit',
            async (direction, first, value, thickness) => {
                const options = (placement: string | string[]) =>
                    horizontalLinearGauge({
                        direction,
                        value,
                        thickness,
                        scale: { min: 0, max: 100, label: { enabled: false } },
                        label: { enabled: true, text: 'Fallback', padding: 8, border: { enabled: true }, placement },
                    });
                await renderGauge(options('outside-end'));
                const { x, y } = firstLabelNode();

                await renderGauge(options(first));
                expect(gaugeLabelTexts()).toEqual([]);

                await renderGauge(options([first, 'outside-end']));
                expect(gaugeLabelTexts()).toEqual(['Fallback']);
                expect(firstLabelNode()).toMatchObject({ x, y });
            }
        );

        it('colours linear-gauge labels from insideStyle or outsideStyle by where they land', async () => {
            const label = {
                enabled: true,
                text: 'Label',
                insideStyle: { color: 'red' },
                outsideStyle: { color: 'blue' },
            };
            await renderGauge(horizontalLinearGauge({ value: 80, label: { ...label, placement: 'bar-inside' } }));
            expect(firstLabelNode().fill).toBe('red');

            await renderGauge(horizontalLinearGauge({ value: 80, label: { ...label, placement: 'inside-end' } }));
            expect(firstLabelNode().fill).toBe('blue');

            await renderGauge(
                horizontalLinearGauge({ value: 80, label: { ...label, placement: 'bar-inside', color: 'green' } })
            );
            expect(firstLabelNode().fill).toBe('red');

            await renderGauge(
                horizontalLinearGauge({
                    value: 80,
                    label: { enabled: true, text: 'Label', placement: 'bar-inside', color: 'green' },
                })
            );
            expect(firstLabelNode().fill).toBe('green');
        });

        it('boxes linear-gauge labels from insideStyle or outsideStyle and fits the box', async () => {
            const label = {
                enabled: true,
                text: 'Label',
                truncate: false,
                insideStyle: { fill: 'yellow', padding: 4 },
                outsideStyle: { fill: 'grey', border: { stroke: 'black' } },
            };
            await renderGauge(horizontalLinearGauge({ value: 80, label: { ...label, placement: 'bar-inside' } }));
            expect(firstLabelNode().getBoxingProperties()).toMatchObject({ fill: 'yellow', padding: 4 });

            await renderGauge(horizontalLinearGauge({ value: 80, label: { ...label, placement: 'inside-end' } }));
            expect(firstLabelNode().getBoxingProperties()).toMatchObject({ fill: 'grey', border: { enabled: true } });

            const paddedOut = { ...label, insideStyle: { fill: 'yellow', padding: 300 }, placement: 'bar-inside' };
            await renderGauge(horizontalLinearGauge({ value: 80, label: paddedOut }));
            expect(gaugeLabelTexts()).toEqual([]);

            await renderGauge(horizontalLinearGauge({ value: 80, label: { enabled: true, text: 'Label' } }));
            expect(firstLabelNode().hasBoxing()).toBe(false);
        });

        it('boxes radial-gauge labels and fits the boxes within the gauge', async () => {
            const label = { text: 'Score', fill: 'yellow', padding: 4 };
            const secondaryLabel = { text: 'Label', border: { stroke: 'red' } };
            await renderGauge(radialGauge(label, secondaryLabel));
            const [primaryNode, secondaryNode] = chart.series[0].labelSelection.nodes();
            expect(primaryNode.getBoxingProperties()).toMatchObject({ fill: 'yellow', padding: 4 });
            expect(secondaryNode.getBoxingProperties()).toMatchObject({ border: { enabled: true, stroke: 'red' } });
            expect(primaryNode.getBBox().y + primaryNode.getBBox().height).toBeLessThanOrEqual(
                secondaryNode.getBBox().y
            );

            await renderGauge(radialGauge({ ...label, padding: 300 }));
            expect(gaugeLabelTexts()).toEqual([]);
        });

        it.each([
            ['radial-gauge', { type: 'radial-gauge', value: 50, scale: { min: 0, max: 100 } }],
            ['linear-gauge', { type: 'linear-gauge', value: 50, scale: { min: 0, max: 100 } }],
        ] as const)('boxes %s target labels', async (_, options) => {
            const label = { fill: 'yellow', padding: 3, border: { stroke: 'red' } };
            await renderGauge({ ...options, targets: [{ value: 30, text: 'Target', label }] });
            const [node] = chart.series[0].targetLabelSelection.nodes();
            expect(node.getBoxingProperties()).toMatchObject({ fill: 'yellow', padding: 3, border: { enabled: true } });

            await renderGauge({ ...options, targets: [{ value: 30, text: 'Target' }] });
            expect(chart.series[0].targetLabelSelection.nodes()[0].hasBoxing()).toBe(false);
        });

        it('falls back to an outside linear-gauge placement rather than overflowing inside-end with alwaysShow', async () => {
            await renderGauge(
                horizontalLinearGauge({
                    value: 95,
                    label: {
                        enabled: true,
                        text: 'A long label text',
                        placement: ['inside-end', 'outside-end'],
                        truncate: false,
                        collision: { alwaysShow: true },
                    },
                })
            );
            expect(gaugeLabelTexts()).toEqual(['A long label text']);
            expect(firstLabelNode().textAlign).toBe('left');
        });

        it('reserves room for an outside linear-gauge label within its maxWidth', async () => {
            const label = { enabled: true, text: 'A much longer label text', spacing: 10, placement: 'outside-start' };
            await renderGauge(horizontalLinearGauge({ label: { ...label, maxWidth: 60 } }));
            expect(chart.series[0].gaugeRect.x).toBeLessThanOrEqual(70);
        });

        it.each([
            ['radial-gauge', radialGauge],
            ['linear-gauge', linearGauge],
        ] as const)('%s keeps its label within maxWidth and maxHeight', async (_, build) => {
            const text = 'A long label text';
            await renderGauge(build({ text, minimumFontSize: undefined, maxWidth: 60 }));
            expect(gaugeLabelTexts()).toHaveLength(1);
            expect(firstLabelNode().getBBox().width).toBeLessThanOrEqual(60);

            await renderGauge(build({ text, minimumFontSize: undefined, maxHeight: 20 }));
            expect(gaugeLabelTexts()).toHaveLength(1);
            expect(firstLabelNode().getBBox().height).toBeLessThanOrEqual(20);
        });

        it('wraps a linear-gauge label within maxWidth', async () => {
            await renderGauge(linearGauge({ text: 'A long label text', wrapping: 'on-space', maxWidth: 60 }));
            expect(gaugeLabelTexts()[0]).toContain('\n');
        });

        it('drops the scale labels a linear-gauge label overlaps only when collision is set', async () => {
            const label = { enabled: true, text: 'Label', fontSize: 40, spacing: 0, placement: 'outside-end' };
            const allScaleLabels = ['0', '20', '40', '60', '80', '100'];
            await renderGauge(horizontalLinearGauge({ thickness: 10, label }));
            expect(gaugeLabelTexts()).toEqual(['Label']);
            expect(scaleLabelTexts()).toEqual(allScaleLabels);

            await renderGauge(horizontalLinearGauge({ thickness: 10, label: { ...label, collision: {} } }));
            expect(gaugeLabelTexts()).toEqual(['Label']);
            expect(scaleLabelTexts()).toEqual(['0', '20', '40', '60', '80']);
        });

        it.each([
            ['radial-gauge', { type: 'radial-gauge', width: 400, height: 400 }],
            ['linear-gauge', horizontalLinearGauge({})],
        ] as const)('%s drops the scale labels under a target only when its label sets collision', async (_, base) => {
            const options = (label?: object) => ({
                ...base,
                value: 50,
                scale: { min: 0, max: 100 },
                targets: [{ value: 40, text: 'Target label text', label }],
            });
            await renderGauge(options());
            expect(targetLabelTexts()).toEqual(['Target label text']);
            expect(scaleLabelTexts()).toEqual(['0', '20', '40', '60', '80', '100']);

            await renderGauge(options({ collision: {} }));
            expect(targetLabelTexts()).toEqual(['Target label text']);
            expect(scaleLabelTexts()).toEqual(['0', '20', '60', '80', '100']);
        });

        it('warns once on the deprecated avoidCollisions and keeps the label at its natural size', async () => {
            const text = 'A long label text';
            await renderGauge(
                horizontalLinearGauge({
                    label: { enabled: true, text, avoidCollisions: false, placement: 'bar-inside' },
                })
            );
            expectWarningsCalls().toMatchInlineSnapshot(`
              [
                [
                  "AG Charts - Option \`label.avoidCollisions\` is deprecated. Use \`collision.alwaysShow\` instead.",
                ],
              ]
            `);
            expect(gaugeLabelTexts()).toEqual([text]);
        });

        it('styles and fits linear-gauge target labels', async () => {
            const label = { color: 'red', fontSize: 16, spacing: 12 };
            await renderGauge(horizontalLinearGauge({ targets: [{ value: 50, text: 'Target label text', label }] }));
            const [node] = chart.series[0].targetLabelSelection.nodes();
            expect(node).toMatchObject({ fill: 'red', fontSize: 16, text: 'Target label text' });

            await renderGauge(
                horizontalLinearGauge({ targets: [{ value: 50, text: 'Target label text', label: { maxWidth: 40 } }] })
            );
            expect(targetLabelTexts()).toEqual(['Target\nlabel\ntext']);
            expect(chart.series[0].targetLabelSelection.nodes()[0].getBBox().width).toBeLessThanOrEqual(40);

            await renderGauge(
                horizontalLinearGauge({
                    targets: [{ value: 50, text: 'Target label text', label: { maxWidth: 40, maxHeight: 15 } }],
                })
            );
            expect(someTruncated(targetLabelTexts())).toBe(true);
        });

        it.each([
            ['radial-gauge', { type: 'radial-gauge', width: 400, height: 400 }],
            ['linear-gauge', horizontalLinearGauge({})],
        ] as const)('%s hides a target label that is not enabled', async (_, base) => {
            await renderGauge({
                ...base,
                value: 50,
                scale: { min: 0, max: 100 },
                targets: [
                    { value: 30, text: 'Shown' },
                    { value: 70, text: 'Hidden', label: { enabled: false } },
                ],
            });
            expect(targetLabelTexts()).toEqual(['Shown']);
        });

        it('ignores linear-gauge targets without text as collision obstacles', async () => {
            await renderGauge(
                horizontalLinearGauge({
                    targets: [{ value: 50 }, { value: 51, text: 'B', label: { collision: { threshold: 4 } } }],
                })
            );
            expect(targetLabelTexts()).toEqual(['B']);
        });

        it.each([
            ['radial-gauge', { type: 'radial-gauge', width: 400, height: 400 }],
            ['linear-gauge', horizontalLinearGauge({})],
        ] as const)('%s hides colliding target labels only when collision is set', async (_, base) => {
            const options = (label?: object) => ({
                ...base,
                value: 50,
                scale: { min: 0, max: 100 },
                targets: [
                    { value: 50, text: 'Target label text' },
                    { value: 52, text: 'Overlap', label },
                ],
            });
            await renderGauge(options());
            expect(targetLabelTexts()).toEqual(['Target label text', 'Overlap']);

            await renderGauge(options({ collision: {} }));
            expect(targetLabelTexts()).toEqual(['Target label text']);

            await renderGauge(options({ collision: { alwaysShow: true } }));
            expect(targetLabelTexts()).toEqual(['Target label text', 'Overlap']);
        });

        const renderGaugeAndSnapshot = async (options: object) => {
            prepareEnterpriseTestOptions(options as AgChartOptions);
            chart = deproxy(AgCharts.createGauge(options as any));
            await compareImageSnapshot(chart, ctx);
        };

        const fittedLinearGauge = (targetLabel: object) =>
            horizontalLinearGauge({
                value: 90,
                label: {
                    enabled: true,
                    text: 'Fallback label',
                    placement: ['bar-outside-end', 'bar-inside'],
                    insideStyle: { color: 'white' },
                    outsideStyle: { color: 'black' },
                },
                targets: [
                    {
                        value: 20,
                        text: 'Wrapped target text',
                        label: { maxWidth: 50, color: 'red', spacing: 4, ...targetLabel },
                    },
                    { value: 80, text: 'Target', label: { fontSize: 16, fontWeight: 'bold', ...targetLabel } },
                    { value: 82, text: 'Hidden', label: { collision: {} } },
                ],
            });
        const fittedRadialGauge = (targetLabel: object) => ({
            type: 'radial-gauge',
            width: 400,
            height: 400,
            value: 60,
            scale: { min: 0, max: 100 },
            label: { text: 'A long radial gauge label', fontSize: 30, maxWidth: 120 },
            targets: [
                { value: 20, text: 'Wrapped target text', label: { maxWidth: 50, color: 'red', ...targetLabel } },
                { value: 70, text: 'Target', label: { fontSize: 16, fontWeight: 'bold', ...targetLabel } },
                { value: 71, text: 'Hidden', label: { fontSize: 16, collision: {} } },
            ],
        });

        it('renders linear-gauge label fallback, placement styles and fitted target labels always shown without collision', async () => {
            await renderGaugeAndSnapshot(fittedLinearGauge({}));
            expect(targetLabelTexts()).toEqual(['Wrapped\ntarget\ntext', 'Target']);
        });

        it('renders linear-gauge fitted target labels dropping the scale labels they overlap with collision', async () => {
            await renderGaugeAndSnapshot(fittedLinearGauge({ collision: {} }));
            expect(targetLabelTexts()).toEqual(['Wrapped\ntarget\ntext', 'Target']);
            expect(scaleLabelTexts()).toEqual(['0', '40', '60', '100']);
        });

        it('renders radial-gauge fitted labels and target labels always shown without collision', async () => {
            await renderGaugeAndSnapshot(fittedRadialGauge({}));
            expect(targetLabelTexts()).toEqual(['Wrapped\ntarget\ntext', 'Target']);
        });

        it('renders radial-gauge fitted target labels dropping the scale labels they overlap with collision', async () => {
            await renderGaugeAndSnapshot(fittedRadialGauge({ collision: {} }));
            expect(targetLabelTexts()).toEqual(['Wrapped\ntarget\ntext', 'Target']);
            expect(scaleLabelTexts()).toEqual(['0', '40', '60', '80', '100']);
        });

        it('renders a boxed linear-gauge label falling back to an outside placement', async () => {
            await renderGaugeAndSnapshot(
                horizontalLinearGauge({
                    value: 60,
                    thickness: 20,
                    scale: { min: 0, max: 100, label: { enabled: false } },
                    label: {
                        enabled: true,
                        text: 'Fallback',
                        placement: ['inside-center', 'outside-end'],
                        color: '#222',
                        fill: '#fff3b0',
                        border: { enabled: true, stroke: '#c0392b', strokeWidth: 2 },
                        padding: 8,
                        cornerRadius: 6,
                    },
                })
            );
            expect(gaugeLabelTexts()).toEqual(['Fallback']);
        });

        it('renders boxed linear-gauge labels and target labels', async () => {
            await renderGaugeAndSnapshot(
                horizontalLinearGauge({
                    value: 70,
                    label: {
                        enabled: true,
                        text: 'Boxed label',
                        placement: 'bar-inside',
                        insideStyle: {
                            color: 'black',
                            fill: 'white',
                            cornerRadius: 6,
                            padding: { left: 12, right: 12 },
                        },
                        outsideStyle: { fill: 'black' },
                    },
                    targets: [
                        { value: 30, text: 'Filled', label: { fill: 'gold', padding: 4 } },
                        { value: 85, text: 'Bordered', label: { border: { stroke: 'red', strokeWidth: 2 } } },
                    ],
                })
            );
            expect(gaugeLabelTexts()).toEqual(['Boxed label']);
            expect(targetLabelTexts()).toEqual(['Filled', 'Bordered']);
        });

        it('renders boxed radial-gauge labels and target labels', async () => {
            await renderGaugeAndSnapshot({
                type: 'radial-gauge',
                width: 400,
                height: 400,
                value: 60,
                scale: { min: 0, max: 100 },
                label: { text: 'Boxed label', fontSize: 30, fill: 'gold', cornerRadius: 8 },
                secondaryLabel: { text: 'Bordered', border: { stroke: 'red' }, padding: 4 },
                targets: [{ value: 30, text: 'Target', label: { fill: 'lightblue', padding: 4 } }],
            });
            expect(gaugeLabelTexts()).toEqual(['Boxed label', 'Bordered']);
            expect(targetLabelTexts()).toEqual(['Target']);
        });
    });
});
