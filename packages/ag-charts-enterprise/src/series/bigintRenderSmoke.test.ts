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
