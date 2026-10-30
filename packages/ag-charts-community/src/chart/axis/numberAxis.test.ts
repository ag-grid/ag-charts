import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { getAxisDomain, getAxisLabelTexts } from '../test/axisAccessors';
import { expectPixelIdenticalAcrossUpdate } from '../test/bigintExamples';
import { createChart, setupMockCanvas, setupMockConsole } from '../test/utils';

// BigInt numeric-axis ticks must render at full precision end-to-end, so these drive a real chart.
describe('NumberAxis BigInt labels', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const lineOptions = (data: unknown[]): AgCartesianChartOptions => ({
        data: data as AgCartesianChartOptions['data'],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    });

    it('renders exact labels for a span larger than Number.MAX_SAFE_INTEGER (AC #16)', async () => {
        const span = 10n ** 21n;
        chart = await createChart(
            lineOptions([
                { x: 0, y: 0n },
                { x: 1, y: span },
            ])
        );

        const labels = getAxisLabelTexts(chart, 'left');
        // 2 × 10^20 — exact only if the tick value reached the formatter as a BigInt.
        expect(labels).toContain('200,000,000,000,000,000,000');
        expect(labels).toContain('1,000,000,000,000,000,000,000');
    });

    it('preserves precision past the float64 boundary (AC #15e)', async () => {
        // Odd values above 2^53 are unrepresentable as Number, so exact labels prove the tick stayed a BigInt.
        chart = await createChart(
            lineOptions([
                { x: 0, y: 9_007_199_254_740_990n },
                { x: 1, y: 9_007_199_254_740_995n },
            ])
        );

        const labels = getAxisLabelTexts(chart, 'left');
        expect(labels).toContain('9,007,199,254,740,991');
        expect(labels).toContain('9,007,199,254,740,993');
        expect(labels).toContain('9,007,199,254,740,995');
    });

    it('accepts a bigint returned from a label formatter (AG-16608)', async () => {
        // Output validation must accept a bigint returned from a formatter rather than reject it as invalid.
        const span = 10n ** 21n;
        const options: AgCartesianChartOptions = {
            data: [
                { x: 0, y: 0n },
                { x: 1, y: span },
            ],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            axes: {
                x: { type: 'number', position: 'bottom' },
                y: {
                    type: 'number',
                    position: 'left',
                    label: { formatter: ({ value }) => value },
                },
            },
        };
        chart = await createChart(options);

        // The custom formatter returns the bigint verbatim, so labels are plain digit strings (no grouping).
        expect(getAxisLabelTexts(chart, 'left')).toContain('1000000000000000000000');
    });
});

// Value-preserving widening checks: the same value supplied as `number` and as `bigint`
// must render pixel-identically and without validation warnings.
describe('NumberAxis bigint bounds and interval (AG-16608)', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    const buildOptions = (yAxis: object): AgCartesianChartOptions => ({
        data: [
            { x: 0, y: 10 },
            { x: 1, y: 60 },
            { x: 2, y: 35 },
            { x: 3, y: 90 },
        ],
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'number', position: 'bottom' },
            y: { type: 'number', position: 'left', ...yAxis },
        },
    });

    const compareVariants = (numberAxis: object, bigintAxis: object) =>
        expectPixelIdenticalAcrossUpdate(ctx, createChart, buildOptions(numberAxis), buildOptions(bigintAxis));

    it('renders bigint min/max identically to number min/max', async () => {
        await compareVariants({ min: 0, max: 100, nice: false }, { min: 0n, max: 100n, nice: false });
    });

    it('renders bigint preferredMin/preferredMax identically to numbers', async () => {
        await compareVariants({ preferredMin: -20, preferredMax: 120 }, { preferredMin: -20n, preferredMax: 120n });
    });

    it('renders a bigint interval step identically to a number step', async () => {
        await compareVariants({ interval: { step: 25 } }, { interval: { step: 25n } });
    });
});

// Explicit `interval.values` leave the domain niced against the tick count, not fitted tightly to the data.
describe('NumberAxis interval values domain', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('shows the 100 tick for values 50, 88, 100 over the axes-intervals values example data', async () => {
        chart = await createChart({
            data: [
                { os: 'Windows', share: 88.07 },
                { os: 'macOS', share: 9.44 },
                { os: 'Linux', share: 1.87 },
            ],
            series: [{ type: 'bar', xKey: 'os', yKey: 'share' }],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left', interval: { values: [50, 88, 100] } },
            },
        });

        expect(getAxisLabelTexts(chart, 'left')).toEqual(['50', '88', '100']);
        expect(getAxisDomain(chart, 'left').map(Number)).toEqual([0, 100]);
    });

    it('keeps the earliest bubble-with-images datum inside the x domain', async () => {
        const years = [1500, 1000, -5000, 1896, 1892, 1100, -600, 300, 1920, 1761];
        chart = await createChart({
            data: years.map((year, i) => ({ year, difficulty: i % 10 })),
            series: [{ type: 'scatter', xKey: 'year', yKey: 'difficulty' }],
            axes: {
                x: { type: 'number', position: 'bottom', interval: { values: [-250, 250] } },
                y: { type: 'number', position: 'right', min: 0, max: 10, interval: { values: [0, 10] } },
            },
        });

        // The earliest datum (-5000) sits well inside the domain rather than on its left edge, as in 14.2.0.
        expect(getAxisDomain(chart, 'bottom').map(Number)).toEqual([-6000, 2000]);
    });
});
