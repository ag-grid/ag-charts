import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    compareImageSnapshot,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../test/utils';
import ukTopology from './map-test/ukTopology.json';

const ELLIPSIS = '…';

// The label-fit options are undocumented, so labels are built untyped and cast at the AgCharts.create
// boundary; `setupMockConsole` fails the test on any "property is unknown" warning.
describe('series label fit', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
    });

    const renderAndSnapshot = async (options: object) => {
        prepareEnterpriseTestOptions(options as AgChartOptions);
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
        // Waterfall labels are configured per item type (positive/negative/total), not at the series root, and default
        // to an outside placement — force `inside-center` so the label fits the bar rect container.
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

        const render = async (options: object) => {
            prepareEnterpriseTestOptions(options as AgChartOptions);
            chart = deproxy(AgCharts.create(options as AgChartOptions));
            await waitForChartStability(chart);
        };
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
});
