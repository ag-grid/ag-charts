import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { deproxy, prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

// AG-16608 — BigInt numeric-axis ticks render at full precision (AC #15e, #16). These tests drive a
// real chart so the bigint values flow through domain extraction, scale conversion, tick generation
// and the axis label formatter end-to-end.
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

    const createChart = async (data: unknown[]): Promise<AgChartInstance> => {
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
        chart = await createChart([
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
        chart = await createChart([
            { x: 0, y: 9_007_199_254_740_990n },
            { x: 1, y: 9_007_199_254_740_995n },
        ]);

        const labels = yAxisLabelText(chart);
        expect(labels).toContain('9,007,199,254,740,991');
        expect(labels).toContain('9,007,199,254,740,993');
        expect(labels).toContain('9,007,199,254,740,995');
    });
});
