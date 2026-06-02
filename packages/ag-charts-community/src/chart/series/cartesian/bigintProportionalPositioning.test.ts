import { describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgCartesianSeriesOptions } from 'ag-charts-types';

import { createChart, setupMockCanvas, setupMockConsole } from '../../test/utils';

/**
 * Proportional-identity tests: a series scaled by a constant `K` must render at identical pixel
 * positions, because the axis domain scales with the data. This holds trivially for `K` within the
 * Number range; these tests assert it still holds when `K` pushes every value beyond Number.MAX_VALUE,
 * so the values must be carried as bigint end-to-end into `yScale.convert()`. Without the bigint
 * domain-derivation + value pass-through the scaled chart collapses (values coerce to Infinity) and the
 * positions diverge — i.e. these fail on `main`.
 */

// K large enough that every scaled value exceeds Number.MAX_VALUE and cannot be represented as a Number.
const K = BigInt(Number.MAX_VALUE);

// nice:false keeps the y-domain exactly equal to the (zero-extended) data extent, so the baseline and
// scaled domains are exactly proportional and positions must match to full precision.
const axes = {
    x: { type: 'number' as const, position: 'bottom' as const },
    y: { type: 'number' as const, position: 'left' as const, nice: false },
};
const SIZE = { width: 400, height: 300 };
// Markers expose the per-datum cumulative-top position for area/line; bars render rects (no marker option).
const markerFor = (type: 'area' | 'line' | 'bar') => (type === 'bar' ? {} : { marker: { enabled: true } });

type ChartInstance = Awaited<ReturnType<typeof createChart>>;

// Geometry that must be proportional, read per family: area/line markers expose `point.y`; bars expose
// the rect `y` (top) and `height`.
function seriesGeometry(chart: ChartInstance, type: 'area' | 'line' | 'bar'): number[][] {
    return chart.series.map((s) => {
        const nodeData: any[] = (s as any).contextNodeData?.nodeData ?? [];
        return type === 'bar'
            ? nodeData.flatMap((d) => [d.y as number, d.height as number])
            : nodeData.map((d) => d.point.y as number);
    });
}

async function render(
    type: 'area' | 'line' | 'bar',
    series: AgCartesianSeriesOptions[],
    data: any[]
): Promise<number[][]> {
    const chart = await createChart({ ...SIZE, data, series, axes } as AgCartesianChartOptions);
    const geometry = seriesGeometry(chart, type);
    chart.destroy();
    return geometry;
}

function expectProportional(baseline: number[][], scaled: number[][]) {
    expect(scaled.length).toBe(baseline.length);
    expect(scaled.flat().length).toBeGreaterThan(0);
    for (let i = 0; i < baseline.length; i++) {
        const values = baseline[i];
        expect(scaled[i].length).toBe(values.length);
        for (let j = 0; j < values.length; j++) {
            expect(scaled[i][j]).toBeCloseTo(values[j], 6);
        }
    }
}

describe('bigint proportional positioning', () => {
    setupMockConsole();
    setupMockCanvas();

    for (const type of ['area', 'line', 'bar'] as const) {
        it(`positions a non-stacked ${type} series identically when scaled beyond Number.MAX_VALUE`, async () => {
            const small = [3, 4, 5];
            const series: AgCartesianSeriesOptions[] = [{ type, xKey: 'x', yKey: 'y', ...markerFor(type) }];
            const baseline = await render(
                type,
                series,
                small.map((y, i) => ({ x: i + 1, y }))
            );
            const scaled = await render(
                type,
                series,
                small.map((y, i) => ({ x: i + 1, y: BigInt(y) * K }))
            );
            expectProportional(baseline, scaled);
        });

        it(`positions a stacked ${type} series identically when scaled beyond Number.MAX_VALUE`, async () => {
            const a = [1, 2, 2];
            const b = [2, 2, 3];
            const series: AgCartesianSeriesOptions[] = [
                { type, xKey: 'x', yKey: 'a', stacked: true, ...markerFor(type) },
                { type, xKey: 'x', yKey: 'b', stacked: true, ...markerFor(type) },
            ];
            const baseline = await render(
                type,
                series,
                a.map((av, i) => ({ x: i + 1, a: av, b: b[i] }))
            );
            const scaled = await render(
                type,
                series,
                a.map((av, i) => ({ x: i + 1, a: BigInt(av) * K, b: BigInt(b[i]) * K }))
            );
            expectProportional(baseline, scaled);
        });
    }

    for (const type of ['area', 'line', 'bar'] as const) {
        it(`positions a straddling-zero ${type} series identically when scaled beyond Number.MAX_VALUE`, async () => {
            const small = [-3, 4, -5];
            const series: AgCartesianSeriesOptions[] = [{ type, xKey: 'x', yKey: 'y', ...markerFor(type) }];
            const baseline = await render(
                type,
                series,
                small.map((y, i) => ({ x: i + 1, y }))
            );
            const scaled = await render(
                type,
                series,
                small.map((y, i) => ({ x: i + 1, y: BigInt(y) * K }))
            );
            expectProportional(baseline, scaled);
        });
    }
});

describe('bigint render edge cases', () => {
    setupMockConsole();
    setupMockCanvas();

    // Beyond Number.MAX_SAFE_INTEGER but well within the Number range, so normalisation's Number division
    // stays finite — normalizedTo is Number-safe by design (it divides to a [0,1] fraction).
    const M = 10n ** 20n;

    it('does not throw when a bigint series is stacked with a fractional Number series', async () => {
        // addAccumulated's BigInt() path would throw on a fractional Number; the mixed stack must degrade.
        const chart = await createChart({
            ...SIZE,
            data: [
                { x: 1, a: 1000n, b: 1.5 },
                { x: 2, a: 2000n, b: 2.5 },
            ],
            series: [
                { type: 'bar', xKey: 'x', yKey: 'a', stacked: true },
                { type: 'bar', xKey: 'x', yKey: 'b', stacked: true },
            ],
            axes,
        } as AgCartesianChartOptions);
        expect(chart).toBeDefined();
        chart.destroy();
    });

    it('renders a 100% stacked bar with bigint values without throwing (normalizedTo degrades to Number)', async () => {
        // normalizedTo divides to a [0,1] fraction in Number space; a bigint must narrow there rather than
        // crash the normalise processor. Proportional identity is out of scope for normalizedTo (the doc).
        const a = [1, 2, 2];
        const b = [2, 2, 3];
        const chart = await createChart({
            ...SIZE,
            data: a.map((av, i) => ({ x: i + 1, a: BigInt(av) * M, b: BigInt(b[i]) * M })),
            series: [
                { type: 'bar', xKey: 'x', yKey: 'a', stacked: true, normalizedTo: 100 },
                { type: 'bar', xKey: 'x', yKey: 'b', stacked: true, normalizedTo: 100 },
            ],
            axes,
        } as AgCartesianChartOptions);
        expect(chart).toBeDefined();
        expect((chart.series[0] as any).contextNodeData?.nodeData?.length ?? 0).toBeGreaterThan(0);
        chart.destroy();
    });
});
