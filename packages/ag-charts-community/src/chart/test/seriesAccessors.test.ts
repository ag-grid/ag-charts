import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgChartInstance,
    AgStandaloneChartOptions,
} from 'ag-charts-types';

import {
    getLegendItemNodes,
    getSeriesAreaFocus,
    getSeriesAt,
    getSeriesContextNodeData,
    getSeriesNodeData,
    getSeriesOptions,
    getSeriesSelectionNodes,
    setAgChartsDebug,
} from './seriesAccessors';
import { createChart, deproxy, errorFrom, pressKey, setupMockCanvas, setupMockConsole, tabIntoChart } from './utils';

describe('series test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const barSeries: AgBarSeriesOptions[] = [
        { type: 'bar', xKey: 'category', yKey: 'value', yName: 'Value', fill: 'red', label: { enabled: true } },
        { type: 'bar', xKey: 'category', yKey: 'other', yName: 'Other', fill: 'blue' },
    ];
    const barOptions: AgCartesianChartOptions = {
        data: [
            { category: 'A', value: 10, other: 1 },
            { category: 'B', value: 20, other: 2 },
            { category: 'C', value: 15, other: 3 },
        ],
        series: barSeries,
    };
    const pieOptions: AgStandaloneChartOptions = {
        data: [
            { label: 'A', value: 10 },
            { label: 'B', value: 20 },
            { label: 'C', value: 15 },
            { label: 'D', value: 5 },
        ],
        series: [{ type: 'pie', angleKey: 'value', legendItemKey: 'label' }],
    };

    describe('getSeriesAt', () => {
        it('returns the series at the index, from a chart or its proxy', async () => {
            chart = await createChart(barOptions);

            expect(getSeriesAt(chart).visible).toBe(true);
            expect(getSeriesAt(chart, 1)).toBe(deproxy(chart).series[1]);
            expect(getSeriesAt(deproxy(chart), 1)).toBe(getSeriesAt(chart, 1));
            expect(getSeriesAt(chart, 0)).not.toBe(getSeriesAt(chart, 1));
        });

        it('fails for a series the chart does not have', async () => {
            chart = await createChart(barOptions);

            expect(errorFrom(() => getSeriesAt(chart, 2))?.name).toBe('AssertionError');
        });
    });

    describe('getSeriesOptions', () => {
        it('returns the options the series resolved', async () => {
            chart = await createChart(barOptions);

            expect(getSeriesOptions<AgBarSeriesOptions>(chart).fill).toBe('red');
            expect(getSeriesOptions<AgBarSeriesOptions>(chart, 1).fill).toBe('blue');
            expect(getSeriesOptions<AgBarSeriesOptions>(chart, 1).yName).toBe('Other');
        });

        it('includes the options the theme supplied', async () => {
            chart = await createChart(barOptions);

            expect(getSeriesOptions<AgBarSeriesOptions>(chart).strokeWidth).toBeDefined();
        });
    });

    describe('getSeriesNodeData', () => {
        it('returns the datums behind the series nodes', async () => {
            chart = await createChart(barOptions);

            const datums = getSeriesNodeData<{ xValue: unknown; yValue: number }>(chart);
            expect(datums.map(({ xValue }) => xValue)).toEqual(['A', 'B', 'C']);
            expect(datums.map(({ yValue }) => yValue)).toEqual([10, 20, 15]);
            expect(getSeriesNodeData<{ yValue: number }>(chart, 1).map(({ yValue }) => yValue)).toEqual([1, 2, 3]);
        });

        it('returns the datums of a polar series', async () => {
            chart = await createChart(pieOptions);

            expect(getSeriesNodeData<{ angleValue: number }>(chart).map(({ angleValue }) => angleValue)).toEqual([
                10, 20, 15, 5,
            ]);
        });

        it('returns no datums for a series without data', async () => {
            chart = await createChart({ ...barOptions, data: [] });

            expect(getSeriesNodeData(chart)).toEqual([]);
        });

        it('fails for a series the chart does not have', async () => {
            chart = await createChart(barOptions);

            expect(errorFrom(() => getSeriesNodeData(chart, 2))?.name).toBe('AssertionError');
        });
    });

    describe('getSeriesContextNodeData', () => {
        it('returns the node-data context of a cartesian series', async () => {
            chart = await createChart(barOptions);

            const context = getSeriesContextNodeData<{ yValue: number }>(chart);
            expect(context.nodeData.map(({ yValue }) => yValue)).toEqual([10, 20, 15]);
            expect(context.labelData).toHaveLength(3);
            expect(context.visible).toBe(true);
        });

        it('returns the context of the series at the index', async () => {
            chart = await createChart(barOptions);

            const second = getSeriesContextNodeData<{ yValue: number }>(chart, 1);
            expect(second.nodeData.map(({ yValue }) => yValue)).toEqual([1, 2, 3]);
            expect(second).not.toBe(getSeriesContextNodeData(chart, 0));
        });

        it('reports a hidden series as not visible', async () => {
            chart = await createChart({
                ...barOptions,
                series: [barSeries[0], { ...barSeries[1], visible: false }],
            });

            expect(getSeriesContextNodeData(chart, 0).visible).toBe(true);
            expect(getSeriesContextNodeData(chart, 1).visible).toBe(false);
        });

        it('fails for a series that keeps no context', async () => {
            chart = await createChart(pieOptions);

            expect(errorFrom(() => getSeriesContextNodeData(chart))?.name).toBe('AssertionError');
        });
    });

    describe('getSeriesSelectionNodes', () => {
        it('returns the nodes of a cartesian series selection', async () => {
            chart = await createChart(barOptions);

            expect(getSeriesSelectionNodes(chart, 'datumSelection')).toHaveLength(3);
            expect(getSeriesSelectionNodes(chart, 'labelSelection')).toHaveLength(3);
            expect(getSeriesSelectionNodes(chart, 'highlightSelection')).toHaveLength(0);
            expect(getSeriesSelectionNodes(chart, 'highlightLabelSelection')).toHaveLength(0);
        });

        it('returns the nodes of the series at the index', async () => {
            chart = await createChart(barOptions);

            const first = getSeriesSelectionNodes(chart, 'datumSelection', 0);
            const second = getSeriesSelectionNodes(chart, 'datumSelection', 1);
            expect(second).toHaveLength(3);
            expect(second).not.toEqual(first);
        });

        it('returns the nodes of a polar series selection', async () => {
            chart = await createChart(pieOptions);

            expect(getSeriesSelectionNodes(chart, 'itemSelection')).toHaveLength(4);
        });

        it('fails for a selection the series does not have', async () => {
            chart = await createChart(barOptions);

            expect(errorFrom(() => getSeriesSelectionNodes(chart, 'itemSelection'))?.name).toBe('AssertionError');
        });
    });

    describe('getLegendItemNodes', () => {
        it('returns an item per legend entry, in legend order', async () => {
            chart = await createChart(barOptions);

            expect(getLegendItemNodes(chart).map((node) => node.label.text)).toEqual(['Value', 'Other']);
        });

        it('returns an item per slice for a pie legend', async () => {
            chart = await createChart(pieOptions);

            expect(getLegendItemNodes(chart).map((node) => node.label.text)).toEqual(['A', 'B', 'C', 'D']);
        });

        it('returns no item when the legend is disabled', async () => {
            chart = await createChart({ ...barOptions, legend: { enabled: false } });

            expect(getLegendItemNodes(chart)).toEqual([]);
        });
    });

    describe('series-area manager accessors', () => {
        it('returns the series and datum the keyboard focus is on', async () => {
            chart = await createChart(barOptions);
            expect(getSeriesAreaFocus(chart)).toEqual({ seriesIndex: 0, datumIndex: 0 });

            await tabIntoChart(chart);
            // jsdom cannot detect :focus-visible, so an arrow key is what switches to the keyboard device.
            await pressKey(chart, 'ArrowRight');
            await pressKey(chart, 'ArrowRight');
            expect(getSeriesAreaFocus(chart)).toEqual({ seriesIndex: 0, datumIndex: 2 });

            await pressKey(chart, 'ArrowDown');
            expect(getSeriesAreaFocus(chart).seriesIndex).toBe(1);
        });
    });

    describe('setAgChartsDebug', () => {
        const read = () =>
            Reflect.has(globalThis, 'agChartsDebug') ? Reflect.get(globalThis, 'agChartsDebug') : 'unset';

        it('sets the flag and removes it again', () => {
            expect(read()).toBe('unset');

            const restore = setAgChartsDebug(['opts', 'theme']);
            expect(read()).toEqual(['opts', 'theme']);

            restore();
            expect(read()).toBe('unset');
        });

        it('puts back the value the flag had', () => {
            const restoreOuter = setAgChartsDebug('dev');
            const restoreInner = setAgChartsDebug(true);
            expect(read()).toBe(true);

            restoreInner();
            expect(read()).toBe('dev');

            restoreOuter();
            expect(read()).toBe('unset');
        });
    });
});
