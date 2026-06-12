import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { expectPixelIdenticalAcrossUpdate } from '../test/bigintExamples';
import {
    createChart,
    deproxy,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

// BigInt numeric-axis ticks must render at full precision. These tests drive a real chart so the
// bigint values flow through domain extraction, scale conversion, tick generation and the axis
// label formatter end-to-end.
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
        // A unit-span window straddling 2^53: each integer is its own tick. Odd values above 2^53
        // (…991, …993, …995) are unrepresentable as Number — they would collapse onto an even
        // neighbour — so their exact labels prove the tick value reached the formatter as a BigInt.
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
        // A formatter receives the raw bigint tick value and may return it; output validation must
        // accept the bigint (not reject it as an invalid callback result) and render it like a number.
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
