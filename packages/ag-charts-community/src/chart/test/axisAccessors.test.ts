import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import {
    findAxis,
    getAxisBandExtent,
    getAxisBandwidth,
    getAxisLabelNodes,
    getAxisLabelTexts,
    getAxisTitleText,
    getSeriesRect,
} from './axisAccessors';
import { createChart, setupMockCanvas, setupMockConsole } from './utils';

describe('axis test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const options: AgCartesianChartOptions = {
        data: [
            { category: 'A', value: 10 },
            { category: 'B', value: 20 },
            { category: 'C', value: 15 },
        ],
        axes: {
            x: {
                type: 'category',
                position: 'bottom',
                title: { enabled: true, text: 'Letters' },
                // An empty label is laid out as a hidden node: it stays in the scene graph, undrawn.
                label: { formatter: ({ value }) => (value === 'B' ? '' : String(value)) },
            },
            y: { type: 'number', position: 'left' },
        },
        series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
    };

    describe('findAxis', () => {
        it('finds an axis by position and by id', async () => {
            chart = await createChart(options);

            expect(findAxis(chart, 'bottom').type).toBe('category');
            expect(findAxis(chart, 'left').type).toBe('number');
            expect(findAxis(chart, 'x')).toBe(findAxis(chart, 'bottom'));
            expect(findAxis(chart, 'y')).toBe(findAxis(chart, 'left'));
        });

        it('fails for an axis the chart does not have', async () => {
            chart = await createChart(options);

            expect(() => findAxis(chart, 'top')).toThrow();
        });
    });

    describe('getAxisLabelNodes', () => {
        it('returns the drawn label nodes by default', async () => {
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'bottom');
            expect(nodes.map((node) => node.datum.text)).toEqual(['A', 'C']);
            expect(nodes.every((node) => node.datum.visible)).toBe(true);
        });

        it('returns the hidden label nodes too with `visibleOnly: false`', async () => {
            chart = await createChart(options);

            const nodes = getAxisLabelNodes(chart, 'bottom', { visibleOnly: false });
            expect(nodes.map((node) => node.datum.text)).toEqual(['A', '', 'C']);
            expect(nodes.filter((node) => !node.datum.visible)).toHaveLength(1);
        });

        it('returns no nodes when the labels are disabled', async () => {
            chart = await createChart({
                ...options,
                axes: { ...options.axes, x: { type: 'category', position: 'bottom', label: { enabled: false } } },
            });

            expect(getAxisLabelNodes(chart, 'bottom', { visibleOnly: false })).toHaveLength(0);
        });
    });

    describe('getAxisLabelTexts', () => {
        it('returns the rendered text of the labels, in both modes', async () => {
            chart = await createChart(options);

            expect(getAxisLabelTexts(chart, 'bottom')).toEqual(['A', 'C']);
            expect(getAxisLabelTexts(chart, 'bottom', { visibleOnly: false })).toEqual(['A', 'C']);
            expect(getAxisLabelTexts(chart, 'left').length).toBeGreaterThan(1);
        });
    });

    describe('getAxisTitleText', () => {
        it('returns the title as laid out', async () => {
            chart = await createChart(options);

            expect(getAxisTitleText(chart, 'bottom')).toBe('Letters');
        });
    });

    describe('getSeriesRect', () => {
        it('returns the laid out series rect', async () => {
            chart = await createChart(options);

            const { width, height } = getSeriesRect(chart);
            expect(width).toBeGreaterThan(0);
            expect(height).toBeGreaterThan(0);
        });
    });

    describe('band accessors', () => {
        it('reports the bandwidth of a category axis and none for a continuous one', async () => {
            chart = await createChart(options);

            expect(getAxisBandwidth(chart, 'bottom')).toBeGreaterThan(1);
            expect(getAxisBandwidth(chart, 'left')).toBe(0);
        });

        it('reports the extent of the band a value sits in', async () => {
            chart = await createChart(options);

            const bandwidth = getAxisBandwidth(chart, 'bottom');
            const a = getAxisBandExtent(chart, 'bottom', 'A');
            const c = getAxisBandExtent(chart, 'bottom', 'C');
            expect(a.bandwidth).toBe(bandwidth);
            expect(a.end - a.start).toBeCloseTo(bandwidth, 5);
            expect(c.start).toBeGreaterThan(a.end);
        });

        it('orders the extent of a band on a reversed axis', async () => {
            chart = await createChart({
                ...options,
                axes: { ...options.axes, x: { type: 'category', position: 'bottom', reverse: true } },
            });

            const { start, end, bandwidth } = getAxisBandExtent(chart, 'bottom', 'A');
            expect(bandwidth).toBeGreaterThan(1);
            expect(end - start).toBeCloseTo(bandwidth, 5);
        });
    });
});
