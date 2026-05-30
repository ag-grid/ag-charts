import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-types';

import { createChart, setupMockCanvas, setupMockConsole, waitForChartStability } from '../../test/utils';

/**
 * Render smoke test for large `bigint` data values across community cartesian series families.
 *
 * Motivation: the `isNegative` crash (Math.sign throws on bigint) reached production through the bar
 * animation path and was caught only by a browser example — unit/scale tests and example type-checks
 * missed it because none rendered a real series with out-of-safe-range bigint data. This test renders
 * each family with bigint values beyond Number.MAX_SAFE_INTEGER and asserts the render completes
 * without throwing, flushing out any other number-only-math-on-bigint crash of the same class.
 */

// Beyond Number.MAX_SAFE_INTEGER (2^53 - 1) so values cannot be represented exactly as numbers.
const BIG = 9_007_199_254_740_993n; // MAX_SAFE_INTEGER + 2
const NEG_BIG = -9_007_199_254_740_993n; // negative arm exercises the isNegative path

const numericData = [
    { x: 1, y: BIG, lo: NEG_BIG, hi: BIG },
    { x: 2, y: BIG * 2n, lo: NEG_BIG, hi: BIG * 2n },
    { x: 3, y: NEG_BIG, lo: NEG_BIG * 2n, hi: BIG },
    { x: 4, y: BIG * 3n, lo: NEG_BIG, hi: BIG * 4n },
];

const numericAxes = { x: { type: 'number' as const }, y: { type: 'number' as const } };

const cases: Array<{ name: string; options: AgChartOptions }> = [
    {
        name: 'bar',
        options: { data: numericData, series: [{ type: 'bar', xKey: 'x', yKey: 'y' }], axes: numericAxes },
    },
    {
        name: 'line',
        options: { data: numericData, series: [{ type: 'line', xKey: 'x', yKey: 'y' }], axes: numericAxes },
    },
    {
        name: 'area',
        options: { data: numericData, series: [{ type: 'area', xKey: 'x', yKey: 'y' }], axes: numericAxes },
    },
    {
        name: 'scatter',
        options: { data: numericData, series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }], axes: numericAxes },
    },
    {
        name: 'bubble',
        options: {
            data: numericData,
            series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'hi' }],
            axes: numericAxes,
        },
    },
    {
        name: 'histogram',
        options: {
            data: numericData,
            series: [{ type: 'histogram', xKey: 'x', yKey: 'y', aggregation: 'sum' }],
            axes: numericAxes,
        },
    },
];

describe('community series bigint render smoke', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Awaited<ReturnType<typeof createChart>> | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it.each(cases)('renders $name with out-of-safe-range bigint values', async ({ options }) => {
        chart = await createChart(options);
        await waitForChartStability(chart);
        expect(chart).toBeDefined();
    });
});
