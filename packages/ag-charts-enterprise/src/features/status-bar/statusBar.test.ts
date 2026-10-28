import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    compareImageSnapshot,
    computeLegendBBox,
    deproxy,
    expectWarningsCalls,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { toPlainText } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgCollectedValue,
    AgStatusBarRendererParams,
    NormalisedTextOrSegments,
} from 'ag-charts-types';

import { createEnterpriseChart } from '../../test/utils';

interface StatusBarTextNode {
    visible: boolean;
    text?: NormalisedTextOrSegments;
}

interface StatusBarInternals {
    itemsView?: {
        group: { visible: boolean };
        nodes: Array<{ label: StatusBarTextNode; value: StatusBarTextNode }>;
    };
}

const DATA = [
    { quarter: 'Q1', revenue: 120, costs: 80 },
    { quarter: 'Q2', revenue: 150, costs: 95 },
    { quarter: 'Q3', revenue: 170, costs: 110 },
    { quarter: 'Q4', revenue: 210, costs: 130 },
];

const shownValues = (values: readonly AgCollectedValue[]) => values.filter(({ category }) => !category);

const OPTIONS: AgCartesianChartOptions = {
    data: DATA,
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'revenue', yName: 'Revenue' },
        { type: 'bar', xKey: 'quarter', yKey: 'costs', yName: 'Costs' },
    ],
    legend: { enabled: false },
    statusBar: { enabled: true },
};

describe('StatusBar', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    function shownNodes() {
        const view = deproxy(chart!).modulesManager.getModule<StatusBarInternals>('statusBar')?.itemsView;
        if (view?.group.visible !== true) return [];
        return view.nodes.filter(({ value }) => value.visible);
    }

    function shownItems() {
        return shownNodes().map(({ label, value }) => {
            const labelText = label.visible ? toPlainText(label.text) : '';
            return `${labelText}${labelText === '' ? '' : ' '}${toPlainText(value.text)}`;
        });
    }

    function shownColors() {
        return shownNodes().map(({ value }) => {
            const [segment] = Array.isArray(value.text) ? value.text : [];
            return segment?.type === 'image' ? undefined : segment?.color;
        });
    }

    async function hoverCategory(index: number, count = DATA.length) {
        const { seriesRect } = deproxy(chart!);
        const x = seriesRect!.x + (seriesRect!.width * (index + 0.5)) / count - 10;
        const y = seriesRect!.y + seriesRect!.height - 5;
        await hoverAction(x, y)(deproxy(chart!));
        await waitForChartStability(chart!);
    }

    it('shows the last datum of every series when nothing is hovered', async () => {
        chart = await createEnterpriseChart(OPTIONS);
        expect(shownItems()).toEqual(['Revenue 210', 'Costs 130']);
    });

    it('shows every series at the hovered category', async () => {
        chart = await createEnterpriseChart(OPTIONS);
        await hoverCategory(1);
        expect(shownItems()).toEqual(['Revenue 150', 'Costs 95']);
    });

    it('hides when nothing is hovered and `inactive` is `hidden`', async () => {
        chart = await createEnterpriseChart({ ...OPTIONS, statusBar: { enabled: true, inactive: 'hidden' } });
        expect(shownItems()).toEqual([]);

        await hoverCategory(0);
        expect(shownItems()).toEqual(['Revenue 120', 'Costs 80']);
    });

    it('follows the hovered datum with the tooltip disabled', async () => {
        chart = await createEnterpriseChart({ ...OPTIONS, tooltip: { enabled: false } });
        await hoverCategory(1);
        expect(shownItems()).toEqual(['Revenue 150', 'Costs 95']);
    });

    it('applies status bar and collector changes from an update', async () => {
        chart = await createEnterpriseChart(OPTIONS);
        await chart.update({
            ...OPTIONS,
            series: [
                {
                    type: 'bar',
                    xKey: 'quarter',
                    yKey: 'revenue',
                    yName: 'Revenue',
                    collector: ({ datum }) => [{ key: 'costs', label: 'Costs', value: datum.costs }],
                },
            ],
        });
        await waitForChartStability(chart);
        expect(shownItems()).toEqual(['Costs 130']);

        await chart.update({ ...OPTIONS, statusBar: { enabled: false } });
        await waitForChartStability(chart);
        expect(shownItems()).toEqual([]);

        await chart.update(OPTIONS);
        await waitForChartStability(chart);
        expect(shownItems()).toEqual(['Revenue 210', 'Costs 130']);

        await chart.update({ ...OPTIONS, statusBar: { enabled: true, inactive: 'hidden' } });
        await waitForChartStability(chart);
        expect(shownItems()).toEqual([]);
    });

    it('uses the values a series collector returns', async () => {
        chart = await createEnterpriseChart({
            ...OPTIONS,
            series: [
                {
                    type: 'bar',
                    xKey: 'quarter',
                    yKey: 'revenue',
                    yName: 'Revenue',
                    collector: ({ datum, values }) => [
                        ...values,
                        { key: 'margin', label: 'Margin', value: datum.revenue - datum.costs },
                    ],
                },
            ],
        });
        expect(shownItems()).toEqual(['Revenue 210', 'Margin 80']);
    });

    it('runs the collector and renderer once per hovered datum', async () => {
        const collector = vi.fn(() => undefined);
        const renderer = vi.fn(({ values, active }: AgStatusBarRendererParams) => [
            {
                label: active ? 'Hovered' : 'Latest',
                value: shownValues(values)
                    .map(({ value }) => String(value))
                    .join('/'),
            },
        ]);
        chart = await createEnterpriseChart({
            ...OPTIONS,
            series: [{ type: 'bar', xKey: 'quarter', yKey: 'revenue', collector }],
            statusBar: { enabled: true, renderer },
        });
        expect(shownItems()).toEqual(['Latest 210']);

        collector.mockClear();
        renderer.mockClear();
        await hoverCategory(2);
        await hoverCategory(2);
        expect(collector).toHaveBeenCalledTimes(1);
        expect(renderer).toHaveBeenCalledTimes(1);
        expect(shownItems()).toEqual(['Hovered 170']);
    });

    it('colours each value as its series draws the datum, after any `itemStyler`', async () => {
        chart = await createEnterpriseChart({
            ...OPTIONS,
            series: [
                {
                    type: 'bar',
                    xKey: 'quarter',
                    yKey: 'revenue',
                    fill: 'blue',
                    itemStyler: ({ datum }) => (datum.quarter === 'Q2' ? { fill: 'red' } : {}),
                },
                { type: 'line', xKey: 'quarter', yKey: 'costs', stroke: 'green', marker: { enabled: false } },
            ],
        });
        expect(shownColors()).toEqual(['blue', 'green']);

        await hoverCategory(1);
        expect(shownColors()).toEqual(['red', 'green']);
    });

    it('shows the values of horizontal series rather than their categories', async () => {
        chart = await createEnterpriseChart({
            ...OPTIONS,
            series: OPTIONS.series!.map((series) => ({ ...series, direction: 'horizontal' as const })),
        });
        expect(shownItems()).toEqual(['Revenue 210', 'Costs 130']);
    });

    it('keeps the values of the last hovered datum while a legend item is hovered', async () => {
        chart = await createEnterpriseChart({
            ...OPTIONS,
            legend: { enabled: true },
            statusBar: { enabled: true, inactive: 'recent' },
        });
        await hoverCategory(1);

        const legend = computeLegendBBox(deproxy(chart));
        await hoverAction(legend.x + 5, legend.y + legend.height / 2)(deproxy(chart));
        await waitForChartStability(chart);
        expect(deproxy(chart).ctx.chartState.getValue('highlight')?.datumIndex).toBeNaN();
        expect(shownItems()).toEqual(['Revenue 150', 'Costs 95']);
    });

    it('tells the renderer when it is showing the `recent` fallback', async () => {
        chart = await createEnterpriseChart({
            ...OPTIONS,
            statusBar: {
                enabled: true,
                inactive: 'recent',
                renderer: ({ values, active }) => [
                    { label: active ? 'Hovered' : 'Recent', value: String(shownValues(values)[0]?.value) },
                ],
            },
        });
        await hoverCategory(2);
        expect(shownItems()).toEqual(['Hovered 170']);

        await hoverAction(1, 1)(deproxy(chart));
        await vi.waitFor(() => expect(shownItems()).toEqual(['Recent 170']));
    });

    it('keeps the last hovered histogram bin when there are more bins than rows', async () => {
        chart = await createEnterpriseChart({
            data: [{ v: 1 }, { v: 12 }],
            series: [
                {
                    type: 'histogram',
                    xKey: 'v',
                    yKey: 'v',
                    yName: 'V',
                    aggregation: 'sum',
                    bins: [
                        [0, 5],
                        [5, 10],
                        [10, 15],
                        [15, 20],
                    ],
                },
            ],
            statusBar: {
                enabled: true,
                inactive: 'recent',
                renderer: ({ values, active }) => [
                    { label: active ? 'Hovered' : 'Recent', value: String(shownValues(values).at(-1)?.value) },
                ],
            },
        });
        await hoverCategory(2, 4);
        expect(shownItems()).toEqual(['Hovered 12']);

        await hoverAction(1, 1)(deproxy(chart));
        await vi.waitFor(() => expect(shownItems()).toEqual(['Recent 12']));
    });

    it('has room for hover content when the renderer shows nothing until hovered', async () => {
        chart = await createEnterpriseChart({
            ...OPTIONS,
            statusBar: {
                enabled: true,
                renderer: ({ values, active }) =>
                    active ? shownValues(values).map(({ label, value }) => ({ label, value: String(value) })) : [],
            },
        });
        expect(shownItems()).toEqual([]);

        await hoverCategory(0);
        expect(shownItems()).toEqual(['Revenue 120', 'Costs 80']);
    });

    it('ignores a collector result that is not an array', async () => {
        chart = await createEnterpriseChart({
            ...OPTIONS,
            series: [
                {
                    // @ts-expect-error a JavaScript collector can return any value
                    type: 'bar',
                    xKey: 'quarter',
                    yKey: 'revenue',
                    yName: 'Revenue',
                    collector: () => ({ key: 'margin', value: 1 }),
                },
            ],
        });
        expect(shownItems()).toEqual(['Revenue 210']);
        expectWarningsCalls().toEqual([['AG Charts - Series `collector` must return an array of values, ignoring']]);
    });

    describe('series values', () => {
        it.each<[string, AgCartesianChartOptions, string[]]>([
            [
                'histogram bins',
                {
                    data: [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 8 }],
                    series: [
                        {
                            type: 'histogram',
                            xKey: 'v',
                            yKey: 'v',
                            yName: 'V',
                            aggregation: 'sum',
                            bins: [
                                [0, 5],
                                [5, 10],
                            ],
                        },
                    ],
                },
                ['Frequency 1', 'V (sum) 8'],
            ],
            [
                'waterfall totals',
                {
                    data: [
                        { q: 'A', v: 10 },
                        { q: 'B', v: -3 },
                    ],
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'q',
                            yKey: 'v',
                            yName: 'Amount',
                            totals: [{ totalType: 'total', index: 1, axisLabel: 'Total' }],
                        },
                    ],
                },
                ['Amount 7'],
            ],
            [
                'heatmap colour values',
                {
                    data: [{ x: 'a', y: 'b', c: 5 }],
                    series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'c', colorName: 'Score' }],
                },
                ['Score 5'],
            ],
            [
                'ohlc prices in reading order',
                {
                    data: [{ d: 'A', o: 1, h: 4, l: 0.5, c: 3 }],
                    series: [{ type: 'ohlc', xKey: 'd', openKey: 'o', highKey: 'h', lowKey: 'l', closeKey: 'c' }],
                },
                ['o 1', 'h 4', 'l 0.5', 'c 3'],
            ],
            [
                'range-area low and high',
                {
                    data: [{ x: 'A', lo: 1, hi: 5 }],
                    series: [{ type: 'range-area', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }],
                },
                ['lo 1', 'hi 5'],
            ],
            [
                'box-plot quartiles',
                {
                    data: [{ x: 'A', mn: 1, q1: 2, md: 3, q3: 4, mx: 5 }],
                    series: [
                        {
                            type: 'box-plot',
                            xKey: 'x',
                            minKey: 'mn',
                            q1Key: 'q1',
                            medianKey: 'md',
                            q3Key: 'q3',
                            maxKey: 'mx',
                        },
                    ],
                },
                ['mn 1', 'q1 2', 'md 3', 'q3 4', 'mx 5'],
            ],
            [
                'bubble positions and sizes',
                {
                    data: [{ x: 3, y: 4, s: 5 }],
                    series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 's' }],
                },
                ['x 3', 'y 4', 's 5'],
            ],
            [
                'missing values',
                {
                    data: [{ quarter: 'Q1', revenue: undefined }],
                    series: [{ type: 'line', xKey: 'quarter', yKey: 'revenue', yName: 'Revenue' }],
                },
                ['Revenue —'],
            ],
        ])('shows %s', async (_name, options, expected) => {
            chart = await createEnterpriseChart({
                ...options,
                legend: { enabled: false },
                statusBar: { enabled: true },
            });
            expect(shownItems()).toEqual(expected);
        });

        it('colours each hlc value as its item is drawn', async () => {
            chart = await createEnterpriseChart({
                data: [{ d: 'A', h: 4, l: 1, c: 3 }],
                series: [
                    {
                        type: 'hlc',
                        xKey: 'd',
                        highKey: 'h',
                        lowKey: 'l',
                        closeKey: 'c',
                        item: { high: { fill: 'green' }, low: { fill: 'red' }, close: { stroke: 'blue' } },
                    },
                ],
                legend: { enabled: false },
                statusBar: { enabled: true },
            });
            expect(shownColors()).toEqual(['green', 'red', 'blue']);
        });
    });

    describe('image snapshots', () => {
        it('should render above the series area by default', async () => {
            chart = await createEnterpriseChart(OPTIONS);
            await compareImageSnapshot(chart, ctx);
        });

        it('should render a styled, positioned status bar while hovering', async () => {
            chart = await createEnterpriseChart({
                ...OPTIONS,
                statusBar: {
                    enabled: true,
                    position: 'bottom',
                    fill: '#f4f4f4',
                    fillOpacity: 1,
                    border: { enabled: true, stroke: '#888888', strokeWidth: 1 },
                    cornerRadius: 4,
                    padding: { top: 4, right: 8, bottom: 4, left: 8 },
                    label: { fontWeight: 'bold' },
                },
            });
            await hoverCategory(1);
            await compareImageSnapshot(chart, ctx);
        });

        it('should clip items that exceed the series width at the default position', async () => {
            chart = await createEnterpriseChart({
                ...OPTIONS,
                axes: { y: { type: 'number', title: { text: 'A wide axis title' } }, x: { type: 'category' } },
                statusBar: {
                    enabled: true,
                    wrapping: 'never',
                    truncate: false,
                    renderer: ({ values }) =>
                        shownValues(values).flatMap(({ label, formattedValue }) =>
                            ['', ' (prior year)', ' (two years ago)', ' (forecast)'].map((suffix) => ({
                                label: `${label}${suffix}`,
                                value: formattedValue ?? '',
                            }))
                        ),
                },
            });
            await compareImageSnapshot(chart, ctx);
        });

        it('should wrap and truncate a floating status bar within its bounds', async () => {
            chart = await createEnterpriseChart({
                ...OPTIONS,
                statusBar: {
                    enabled: true,
                    position: { placement: 'top-right', floating: true },
                    maxWidth: 160,
                    maxHeight: 40,
                    fill: '#ffffff',
                    fillOpacity: 0.8,
                    renderer: ({ values }) =>
                        shownValues(values).flatMap(({ label, formattedValue }) => [
                            { label, value: formattedValue ?? '' },
                            { label: `${label} (prior year)`, value: formattedValue ?? '' },
                        ]),
                },
            });
            await compareImageSnapshot(chart, ctx);
        });
    });
});
