import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import type { AgChartInstance, AgGaugeOptions } from 'ag-charts-community';
import {
    compareImageSnapshot,
    getSeriesAt,
    getSeriesOptions,
    glowSeries,
    optionAt,
    prepareProcessedOptions,
    resetMockConsole,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { ENTERPRISE_GLOW_SERIES } from './test/glowSeriesCases';
import { collectShapes, createEnterpriseChart, drawnLineDashes, prepareEnterpriseTestOptions } from './test/utils';

type Location = [label: string, options: object, path: string];

const DATA = [{ x: 'a', y: 1 }];

const series = (overrides: object, extra: object = {}): object => ({ data: DATA, series: [overrides], ...extra });

/** The same dash name at each enterprise option location whose theme has to resolve it. */
function locations(): Location[] {
    const highlight = (state: string, nested?: string) =>
        nested == null ? { [state]: { lineDash: 'dash' } } : { [state]: { [nested]: { lineDash: 'dash' } } };

    const candlestick = { type: 'candlestick', xKey: 'x', openKey: 'y', highKey: 'y', lowKey: 'y', closeKey: 'y' };
    const boxPlot = { type: 'box-plot', xKey: 'x', minKey: 'y', q1Key: 'y', medianKey: 'y', q3Key: 'y', maxKey: 'y' };
    const stages = { stageKey: 'x', valueKey: 'y' };
    const errorBar = { yLowerKey: 'y', yUpperKey: 'y', lineDash: 'dash', cap: { lineDash: 'dash' } };

    return [
        ['error bar', series({ type: 'bar', xKey: 'x', yKey: 'y', errorBar }), 'series[0].errorBar.lineDash'],
        ['error bar cap', series({ type: 'bar', xKey: 'x', yKey: 'y', errorBar }), 'series[0].errorBar.cap.lineDash'],
        [
            'candlestick wick',
            series({ ...candlestick, item: { up: { wick: { lineDash: 'dash' } } } }),
            'series[0].item.up.wick.lineDash',
        ],
        [
            'candlestick highlight wick',
            series({ ...candlestick, highlight: highlight('highlightedSeries', 'wick') }),
            'series[0].highlight.highlightedSeries.wick.lineDash',
        ],
        [
            'box plot highlight whisker',
            series({ ...boxPlot, highlight: highlight('unhighlightedItem', 'whisker') }),
            'series[0].highlight.unhighlightedItem.whisker.lineDash',
        ],
        [
            'waterfall selection',
            series({ type: 'waterfall', xKey: 'x', yKey: 'y', selection: highlight('selectedItem') }),
            'series[0].selection.selectedItem.lineDash',
        ],
        [
            'funnel selection',
            series({ type: 'funnel', ...stages, selection: highlight('unselectedItem') }),
            'series[0].selection.unselectedItem.lineDash',
        ],
        [
            'pyramid selection',
            series({ type: 'pyramid', ...stages, selection: highlight('unselectedSeries') }),
            'series[0].selection.unselectedSeries.lineDash',
        ],
        [
            'map line highlight',
            {
                topology: { type: 'FeatureCollection', features: [] },
                series: [{ type: 'map-line', idKey: 'name', highlight: highlight('unhighlightedSeries') }],
            },
            'series[0].highlight.unhighlightedSeries.lineDash',
        ],
        [
            'cone funnel highlight',
            series({ type: 'cone-funnel', ...stages, highlight: highlight('highlightedItem') }),
            'series[0].highlight.highlightedItem.lineDash',
        ],
    ];
}

/** `style` at the location that the dotted `lineDash` path sits in. */
const styleAt = (path: string, style: object): object =>
    path
        .split('.')
        .slice(0, -1)
        .reduceRight<object>((inner, key) => ({ [key]: inner }), style);

/** A chart whose navigator mini chart draws `mini`, which sets its own series options rather than the main series'. */
const withMiniChart = (mini: object, main: object = { type: 'bar', xKey: 'x', yKey: 'y' }): object => ({
    data: DATA,
    series: [main],
    navigator: { enabled: true, miniChart: { enabled: true, series: [mini] } },
});

/** The same dash name at each location that a mini-chart series of each type takes it. */
function miniChartLocations(): Location[] {
    const xy = { xKey: 'x', yKey: 'y' };
    const range = { xKey: 'x', yLowKey: 'y', yHighKey: 'y' };
    const ohlc = { xKey: 'x', openKey: 'y', highKey: 'y', lowKey: 'y', closeKey: 'y' };
    const hlc = { xKey: 'x', highKey: 'y', lowKey: 'y', closeKey: 'y' };
    const boxPlot = { xKey: 'x', minKey: 'y', q1Key: 'y', medianKey: 'y', q3Key: 'y', maxKey: 'y' };
    const markers = (...items: string[]) => items.map((item) => `${item}.marker.lineDash`);

    const types: Array<[type: string, keys: object, paths: string[]]> = [
        ['line', xy, ['lineDash', 'marker.lineDash']],
        ['area', xy, ['lineDash', 'marker.lineDash']],
        ['bar', xy, ['lineDash']],
        ['box-plot', boxPlot, ['lineDash', 'whisker.lineDash']],
        ['scatter', xy, ['lineDash']],
        ['bubble', { ...xy, sizeKey: 'y' }, ['lineDash']],
        ['histogram', { xKey: 'x' }, ['lineDash']],
        ['waterfall', xy, ['item.positive.lineDash', 'item.negative.lineDash', 'item.total.lineDash', 'line.lineDash']],
        ['range-bar', range, ['lineDash']],
        [
            'range-area',
            range,
            [
                'lineDash',
                'marker.lineDash',
                'item.low.lineDash',
                'item.high.lineDash',
                ...markers('item.low', 'item.high'),
            ],
        ],
        [
            'candlestick',
            ohlc,
            ['item.up.lineDash', 'item.down.lineDash', 'item.up.wick.lineDash', 'item.down.wick.lineDash'],
        ],
        ['ohlc', ohlc, ['item.up.lineDash', 'item.down.lineDash']],
        [
            'hlc',
            hlc,
            [
                'marker.lineDash',
                'item.high.lineDash',
                'item.low.lineDash',
                'item.close.lineDash',
                ...markers('item.high', 'item.low', 'item.close'),
            ],
        ],
    ];

    return types.flatMap(([type, keys, paths]) =>
        paths.map((path): Location => {
            const mini = { type, ...keys, ...styleAt(path, { lineDash: 'dash' }) };
            // The same type, so that the mini chart series copies nothing that its type does not take.
            return [
                `mini chart ${type} ${path}`,
                withMiniChart(mini, { type, ...keys }),
                `navigator.miniChart.series[0].${path}`,
            ];
        })
    );
}

/** `dash` is `[3, 2]` in multiples of the stroke width, whatever the width resolves to. */
function expectDash(dash: unknown) {
    expect(dash).toBeInstanceOf(Array);
    const [on, off] = dash as number[];
    expect(on * 2).toBeCloseTo(off * 3);
}

describe('named line dash patterns in enterprise options', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each([...locations(), ...miniChartLocations()])(
        'resolves a stock dash name on %s to its array',
        (_, options, path) => {
            expectDash(optionAt(prepareProcessedOptions(options).processedOptions, path));
        }
    );

    // The width of a type's default is only filled in after theming, so a location that its main series does not
    // supply must mirror it: the dash is that of the same location on a main series.
    it.each(miniChartLocations())(
        'scales a stock dash name on %s by the default width, without a main series of its type',
        (_, options, path) => {
            const mini = (options as any).navigator.miniChart.series[0];
            const seriesPath = path.replace('navigator.miniChart.series[0].', 'series[0].');
            const main = prepareProcessedOptions({ data: DATA, series: [mini] }).processedOptions;
            const other = { type: mini.type === 'bar' ? 'line' : 'bar', xKey: 'x', yKey: 'y' };
            const unpaired = prepareProcessedOptions({ ...options, series: [other] }).processedOptions;
            // The mini chart series copies options that its type does not take from the main series.
            resetMockConsole();

            expect(optionAt(unpaired, path)).toEqual(optionAt(main, seriesPath));
        }
    );

    it.each(miniChartLocations())(
        'rescales the dash of the main series on %s to the width set on the mini chart series',
        (_, options, path) => {
            const keys = (options as any).series[0];
            const location = path.replace('navigator.miniChart.series[0].', '');
            const main = { ...keys, ...styleAt(location, { strokeWidth: 5, lineDash: 'dash' }) };
            const mini = { ...keys, ...styleAt(location, { strokeWidth: 1 }) };

            expect(optionAt(prepareProcessedOptions(withMiniChart(mini, main)).processedOptions, path)).toEqual([3, 2]);
        }
    );

    describe('mini chart series', () => {
        const miniOption = (options: object, key: string) =>
            optionAt(prepareProcessedOptions(options).processedOptions, `navigator.miniChart.series[0].${key}`);
        const dashAt = (options: object) => miniOption(options, 'lineDash');

        it('rescales the dash of the main series to the default width of a mini chart line', () => {
            const line = { type: 'line', xKey: 'x', yKey: 'y' };
            const main = { ...line, strokeWidth: 5, lineDash: 'dash', lineDashOffset: 4 };
            const mirrored = { data: DATA, series: [main], navigator: { enabled: true, miniChart: { enabled: true } } };

            expect(dashAt(mirrored)).toEqual([6, 4]);
            expect(miniOption(mirrored, 'strokeWidth')).toBe(2);
            expect(miniOption(mirrored, 'lineDashOffset')).toBe(4);
            expect(dashAt({ ...mirrored, series: [{ ...main, lineDash: [10, 5] }] })).toEqual([4, 2]);
            expect(dashAt(withMiniChart(line, main))).toEqual([6, 4]);
            expect(dashAt(withMiniChart({ ...line, lineDash: [1, 1] }, main))).toEqual([1, 1]);
        });

        it('scales a stock dash name by the width of the mini chart series', () => {
            const main = { type: 'line', xKey: 'x', yKey: 'y' };
            const mini = { ...main, lineDash: 'dash' };

            expect(dashAt(withMiniChart({ ...mini, strokeWidth: 4 }, main))).toEqual([12, 8]);
            expect(dashAt(withMiniChart({ ...mini, strokeWidth: 1 }, main))).toEqual([3, 2]);
        });

        it('scales a stock dash name on a mini chart line by its default width, as on a main line', () => {
            const line = { type: 'line', xKey: 'x', yKey: 'y', lineDash: 'dash' };
            const mainDash = optionAt(
                prepareProcessedOptions({ data: DATA, series: [line] }).processedOptions,
                'series[0].lineDash'
            );

            expect(mainDash).toEqual([6, 4]);
            expect(dashAt(withMiniChart(line, { ...line, lineDash: undefined }))).toEqual(mainDash);
        });

        it('scales a stock dash name on a box plot and its whisker by the default width, without a main box plot', () => {
            const boxPlot = {
                type: 'box-plot',
                xKey: 'x',
                minKey: 'y',
                q1Key: 'y',
                medianKey: 'y',
                q3Key: 'y',
                maxKey: 'y',
            };
            const processed = prepareProcessedOptions(
                withMiniChart(
                    { ...boxPlot, lineDash: 'dash', whisker: { lineDash: 'dot' } },
                    { type: 'histogram', xKey: 'x' }
                )
            ).processedOptions;

            // The mini chart series copies options that a box plot does not take from the histogram main series.
            resetMockConsole();

            expect(optionAt(processed, 'navigator.miniChart.series[0].lineDash')).toEqual([6, 4]);
            expect(optionAt(processed, 'navigator.miniChart.series[0].whisker.lineDash')).toEqual([2, 3]);
        });

        it('leaves an array in pixels, and follows the main series when it sets none', () => {
            const mini = { type: 'bar', xKey: 'x', yKey: 'y' };
            const main = { type: 'bar', xKey: 'x', yKey: 'y', strokeWidth: 2, lineDash: 'dash' };
            const withMain = (miniOptions: object) => ({ ...withMiniChart(miniOptions), series: [main] });

            expect(dashAt(withMain({ ...mini, strokeWidth: 4, lineDash: [5, 5] }))).toEqual([5, 5]);
            expect(dashAt(withMain(mini))).toEqual([6, 4]);
        });
    });

    // Gauge presets expand into a series only when the chart is created.
    it.each(['linear-gauge', 'radial-gauge'] as const)('resolves a stock dash name on a %s target', async (type) => {
        const options = { type, value: 5, targets: [{ value: 3, lineDash: 'dash' }] } as AgGaugeOptions;
        chart = AgCharts.createGauge(prepareEnterpriseTestOptions(options));
        await waitForChartStability(chart);

        expectDash(optionAt(getSeriesOptions(chart), 'targets[0].lineDash'));
    });

    it('renders stock dash names on error bars', async () => {
        const dates = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
        const bars = dates.map((month, i) => ({ month, y: 20 + i * 5, lower: 15 + i * 5, upper: 27 + i * 5 }));
        chart = await createEnterpriseChart({
            width: 600,
            height: 300,
            data: bars,
            series: [
                {
                    type: 'line',
                    xKey: 'month',
                    yKey: 'y',
                    errorBar: {
                        yLowerKey: 'lower',
                        yUpperKey: 'upper',
                        strokeWidth: 2,
                        lineDash: 'long-dash',
                        cap: { lineDash: 'long-dash', length: 12 },
                    },
                },
            ],
        } as never);
        await compareImageSnapshot(chart, ctx);
    });

    it('renders stock dash names on mini chart series', async () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        chart = await createEnterpriseChart({
            width: 600,
            height: 300,
            data: months.map((month, i) => ({ month, y: 20 + i * 5, z: 45 - i * 4 })),
            series: [{ type: 'line', xKey: 'month', yKey: 'y' }],
            navigator: {
                enabled: true,
                height: 80,
                miniChart: {
                    enabled: true,
                    series: [
                        {
                            type: 'line',
                            xKey: 'month',
                            yKey: 'y',
                            strokeWidth: 3,
                            lineDash: 'dash',
                            marker: { enabled: true, size: 8, strokeWidth: 2, lineDash: 'dot' },
                        },
                        {
                            type: 'line',
                            xKey: 'month',
                            yKey: 'z',
                            strokeWidth: 3,
                            lineDash: 'dot',
                            marker: { enabled: false },
                        },
                    ],
                },
            },
        } as never);
        await compareImageSnapshot(chart, ctx);
    });

    it('renders a stock dash name on candlestick wicks', async () => {
        chart = await createEnterpriseChart({
            width: 600,
            height: 300,
            data: [
                { date: new Date(2026, 0, 1), open: 20, high: 30, low: 10, close: 25 },
                { date: new Date(2026, 0, 2), open: 25, high: 35, low: 15, close: 18 },
                { date: new Date(2026, 0, 3), open: 18, high: 32, low: 12, close: 28 },
            ],
            series: [
                {
                    type: 'candlestick',
                    xKey: 'date',
                    openKey: 'open',
                    highKey: 'high',
                    lowKey: 'low',
                    closeKey: 'close',
                    item: {
                        up: { wick: { strokeWidth: 2, lineDash: 'dash' } },
                        down: { wick: { strokeWidth: 2, lineDash: 'dot' } },
                    },
                },
            ],
        } as never);
        await compareImageSnapshot(chart, ctx);
    });

    // A name in an `itemStyler` result must reach the canvas as an array, not as a string `setLineDash` rejects. Series
    // resolve it against the options graph at the path that holds the dash defaults; error bars resolve it themselves,
    // after merging, at each line's own width.
    describe('itemStyler results', () => {
        /** A `dot` at the 2px width that the styler sets: `[1, 1.5]` in multiples of it. */
        const DOT = [2, 3];
        /** A `dash` at the 2px width: `[3, 2]` in multiples of it. */
        const DASH = [6, 4];

        type Row = readonly [label: string, options: object, expected: number[][]];

        const styled = { strokeWidth: 2, lineDash: 'dot' };
        const flow = (name: string): Row => {
            const flowCase = ENTERPRISE_GLOW_SERIES.find((c) => c.name === name);
            if (flowCase == null) throw new Error(`No glow series case named "${name}"`);
            return [name, { data: flowCase.data, series: [glowSeries(flowCase, { itemStyler: () => styled })] }, [DOT]];
        };
        const organization = (part: 'node' | 'link' | 'expander'): Row => {
            const styler = { itemStyler: () => styled };
            return [
                `organization ${part}s`,
                {
                    data: [
                        { id: 'ceo', name: 'Alice', parentId: null },
                        { id: 'cto', name: 'Bob', parentId: 'ceo' },
                        { id: 'cfo', name: 'Carol', parentId: 'ceo' },
                    ],
                    series: [
                        {
                            type: 'organization',
                            idKey: 'id',
                            parentIdKey: 'parentId',
                            // Only the styled part has a dash, so the other parts must stay solid.
                            node: { title: { key: 'name' }, ...(part === 'node' ? styler : {}) },
                            ...(part === 'node' ? {} : { [part]: styler }),
                        },
                    ],
                },
                [DOT],
            ];
        };
        const errorBar = (label: string, options: object, expected: number[][]): Row => [
            label,
            {
                data: [
                    { x: 'a', y: 5, lower: 3, upper: 7 },
                    { x: 'b', y: 6, lower: 4, upper: 8 },
                ],
                series: [
                    {
                        type: 'bar',
                        xKey: 'x',
                        yKey: 'y',
                        errorBar: { yLowerKey: 'lower', yUpperKey: 'upper', ...options },
                    },
                ],
            },
            expected,
        ];

        it.each([
            flow('sankey nodes'),
            flow('sankey links'),
            flow('chord nodes'),
            flow('chord links'),
            organization('node'),
            organization('link'),
            organization('expander'),
            // A cap of its own name, so that a cap left as a string cannot hide behind the whisker.
            errorBar('error bar and cap', { itemStyler: () => ({ ...styled, cap: { lineDash: 'dash' } }) }, [
                DOT,
                DASH,
            ]),
            // The name scales by the width of the line that it draws, not the whisker's.
            errorBar(
                'error bar cap of its own width',
                { strokeWidth: 2, cap: { strokeWidth: 4 }, itemStyler: () => ({ lineDash: 'dot' }) },
                [DOT, [4, 6]]
            ),
        ])('resolves a stock dash name returned for %s', async (_, options, expected) => {
            chart = await createEnterpriseChart({
                width: 600,
                height: 300,
                animation: { enabled: false },
                legend: { enabled: false },
                ...options,
            } as never);
            await waitForChartStability(chart);

            const group = getSeriesAt(chart);
            const { unresolved, drawn } = drawnLineDashes([
                ...collectShapes(group.contentGroup),
                ...collectShapes(group.annotationGroup),
            ]);

            expect(unresolved).toEqual([]);
            expect(drawn).toEqual(new Set(expected.map((dash) => dash.join())));
            await compareImageSnapshot(chart, ctx);
        });
    });
});
