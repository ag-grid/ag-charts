import { afterEach, describe, expect, it } from 'vitest';

import { setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgChartOptions } from 'ag-charts-types';

import { createEnterpriseChart } from '../test/utils';

/**
 * Render smoke test for large `bigint` data values across enterprise series families.
 *
 * Companion to the community smoke test: the `isNegative` crash (Math.sign throws on bigint) reached
 * production via a number-only operation on a bigint data value. This renders each enterprise family
 * with values beyond Number.MAX_SAFE_INTEGER and asserts the render completes without throwing.
 */

const BIG = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
const NEG_BIG = -9_007_199_254_740_993n;

const numericAxes = { x: { type: 'number' as const }, y: { type: 'number' as const } };

const rangeData = [
    { x: 1, lo: NEG_BIG, hi: BIG },
    { x: 2, lo: NEG_BIG * 2n, hi: BIG * 2n },
    { x: 3, lo: NEG_BIG, hi: BIG * 3n },
];

const boxData = [
    { x: 1, min: NEG_BIG, q1: NEG_BIG / 2n, median: 0n, q3: BIG / 2n, max: BIG },
    { x: 2, min: NEG_BIG * 2n, q1: NEG_BIG, median: BIG / 2n, q3: BIG, max: BIG * 2n },
];

const heatmapData = [
    { col: 'a', row: 'x', temp: BIG },
    { col: 'a', row: 'y', temp: NEG_BIG },
    { col: 'b', row: 'x', temp: BIG * 2n },
];

const waterfallData = [
    { x: 'a', amount: BIG },
    { x: 'b', amount: NEG_BIG },
    { x: 'c', amount: BIG * 2n },
];

// Funnel-family value columns: the proportional layout sums them, so values are positive.
const stageData = [
    { stage: 'a', value: BIG * 3n },
    { stage: 'b', value: BIG * 2n },
    { stage: 'c', value: BIG },
];

const ohlcData = [
    { x: 1, low: BIG, open: BIG * 2n, close: BIG * 3n, high: BIG * 4n },
    { x: 2, low: BIG * 2n, open: BIG * 3n, close: BIG * 2n, high: BIG * 5n },
    { x: 3, low: NEG_BIG, open: 0n, close: BIG, high: BIG * 2n },
];

const radialData = [
    { quarter: 'Q1', value: BIG },
    { quarter: 'Q2', value: BIG * 2n },
    { quarter: 'Q3', value: BIG * 3n },
];

const cases: Array<{ name: string; options: AgChartOptions }> = [
    {
        name: 'range-bar',
        options: {
            data: rangeData,
            series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }],
            axes: numericAxes,
        },
    },
    {
        name: 'range-area',
        options: {
            data: rangeData,
            series: [{ type: 'range-area', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi' }],
            axes: numericAxes,
        },
    },
    {
        name: 'box-plot',
        options: {
            data: boxData,
            series: [
                {
                    type: 'box-plot',
                    xKey: 'x',
                    minKey: 'min',
                    q1Key: 'q1',
                    medianKey: 'median',
                    q3Key: 'q3',
                    maxKey: 'max',
                },
            ],
            axes: { x: { type: 'category' as const }, y: { type: 'number' as const } },
        },
    },
    {
        name: 'heatmap',
        options: {
            data: heatmapData,
            series: [{ type: 'heatmap', xKey: 'col', yKey: 'row', colorKey: 'temp' }],
            axes: { x: { type: 'category' as const }, y: { type: 'category' as const } },
        },
    },
    {
        name: 'waterfall',
        options: {
            data: waterfallData,
            series: [{ type: 'waterfall', xKey: 'x', yKey: 'amount' }],
            axes: { x: { type: 'category' as const }, y: { type: 'number' as const } },
        },
    },
    {
        name: 'pyramid',
        options: {
            data: stageData,
            series: [{ type: 'pyramid', stageKey: 'stage', valueKey: 'value' }],
        },
    },
    {
        name: 'ohlc',
        options: {
            data: ohlcData,
            series: [{ type: 'ohlc', xKey: 'x', lowKey: 'low', openKey: 'open', closeKey: 'close', highKey: 'high' }],
            axes: numericAxes,
        },
    },
    {
        name: 'radial-bar',
        options: {
            data: radialData,
            series: [{ type: 'radial-bar', angleKey: 'value', radiusKey: 'quarter' }],
            axes: { angle: { type: 'angle-number' as const }, radius: { type: 'radius-category' as const } },
        },
    },
    {
        name: 'radial-column',
        options: {
            data: radialData,
            series: [{ type: 'radial-column', angleKey: 'quarter', radiusKey: 'value' }],
            axes: { angle: { type: 'angle-category' as const }, radius: { type: 'radius-number' as const } },
        },
    },
];

describe('enterprise series bigint render smoke', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createEnterpriseChart>> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each(cases)('renders $name with out-of-safe-range bigint values', async ({ options }) => {
        chart = await createEnterpriseChart(options);
        await waitForChartStability(chart);
        expect(chart).toBeDefined();
    });
});
