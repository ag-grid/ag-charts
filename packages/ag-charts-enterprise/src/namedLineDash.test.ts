import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import type { AgChartInstance, AgGaugeOptions } from 'ag-charts-community';
import {
    compareImageSnapshot,
    getSeriesOptions,
    optionAt,
    prepareProcessedOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from './test/utils';

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

    it.each(locations())('resolves a stock dash name on %s to its array', (_, options, path) => {
        expectDash(optionAt(prepareProcessedOptions(options).processedOptions, path));
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
});
