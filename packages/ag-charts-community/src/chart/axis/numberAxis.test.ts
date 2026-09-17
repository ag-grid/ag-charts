import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { expectPixelIdenticalAcrossUpdate } from '../test/bigintExamples';
import {
    createChart,
    deproxy,
    expectWarningMessages,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

// BigInt numeric-axis ticks must render at full precision end-to-end, so these drive a real chart.
describe('NumberAxis BigInt labels', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const yAxisLabelText = (chartInstance: AgChartInstance): string[] => {
        const axis = deproxy(chartInstance as any).axes.find((a: any) => a.direction === 'y') as any;
        expect(axis).toBeDefined();
        return Array.from(axis.tickLabelGroupSelection.nodes() as Iterable<any>)
            .map((node) => node.text)
            .filter((text): text is string => text != null && text !== '');
    };

    const createLineChart = async (data: unknown[]): Promise<AgChartInstance> => {
        const options: AgCartesianChartOptions = {
            data: data as AgCartesianChartOptions['data'],
            series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        };
        prepareTestOptions(options);
        const instance = AgCharts.create(options);
        await waitForChartStability(instance);
        return instance;
    };

    it('renders exact labels for a span larger than Number.MAX_SAFE_INTEGER (AC #16)', async () => {
        const span = 10n ** 21n;
        chart = await createLineChart([
            { x: 0, y: 0n },
            { x: 1, y: span },
        ]);

        const labels = yAxisLabelText(chart);
        // 2 × 10^20 — exact only if the tick value reached the formatter as a BigInt.
        expect(labels).toContain('200,000,000,000,000,000,000');
        expect(labels).toContain('1,000,000,000,000,000,000,000');
    });

    it('preserves precision past the float64 boundary (AC #15e)', async () => {
        // Odd values above 2^53 are unrepresentable as Number, so exact labels prove the tick stayed a BigInt.
        chart = await createLineChart([
            { x: 0, y: 9_007_199_254_740_990n },
            { x: 1, y: 9_007_199_254_740_995n },
        ]);

        const labels = yAxisLabelText(chart);
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
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        // The custom formatter returns the bigint verbatim, so labels are plain digit strings (no grouping).
        expect(yAxisLabelText(chart)).toContain('1000000000000000000000');
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

// A fixed `interval.step` must never let the label-overlap search widen the domain beyond the data.
describe('NumberAxis interval.step too small to honour (AG-18574)', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it('keeps the x domain fitted to the data when interval.step is dense', async () => {
        const options: AgCartesianChartOptions = {
            data: [
                { x: 0, value: 2 },
                { x: 1000, value: 5 },
                { x: 2000, value: 3 },
                { x: 3000, value: 1 },
                { x: 4000, value: 2 },
                { x: 5000, value: 3 },
                { x: 9000, value: 1 },
                { x: 10000, value: 2 },
                { x: 11000, value: 2 },
            ],
            series: [{ type: 'bar', xKey: 'x', yKey: 'value' }],
            axes: {
                x: { type: 'number', position: 'bottom', interval: { step: 100 } },
                y: { type: 'number', position: 'left' },
            },
        };
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);

        const xAxis = deproxy(chart as any).axes.find((a: any) => a.direction === 'x') as any;
        const [d0, d1] = xAxis.scale.domain.map(Number);

        // Bars pad the 0..11000 keys by half the 1000 key interval, then the domain snaps to the 100 step.
        expect([d0, d1]).toEqual([-500, 11500]);
    });

    it('still reduces colliding labels when the step is too dense for the scale to honour', async () => {
        const options: AgCartesianChartOptions = {
            data: Array.from({ length: 9 }, (_, i) => ({ x: i * 1000, value: i })),
            series: [{ type: 'bar', xKey: 'x', yKey: 'value' }],
            axes: {
                // Over an 8000-wide domain this is far more than one tick per pixel, so the scale
                // rejects the step and falls back to automatic ticks driven by the tick count.
                x: {
                    type: 'number',
                    position: 'bottom',
                    interval: { step: 1 },
                    label: { formatter: ({ value }) => `an extremely long axis label text for value ${value}` },
                },
                y: { type: 'number', position: 'left' },
            },
        };
        prepareTestOptions(options);
        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        expectWarningMessages([
            'AG Charts - the configured interval results in more than 1 item per pixel, ignoring. Supply a larger interval or omit this configuration',
        ]);

        const xAxis = deproxy(chart as any).axes.find((a: any) => a.direction === 'x') as any;
        const labels = Array.from(xAxis.tickLabelGroupSelection.nodes() as Iterable<any>).filter(
            (node: any) => node.text != null && node.text !== ''
        );

        // Automatic ticks are not pinned, so the overlap search is still free to thin them:
        // ending the search after the first pass would leave three labels colliding here.
        expect(labels.length).toBe(2);
    });
});
