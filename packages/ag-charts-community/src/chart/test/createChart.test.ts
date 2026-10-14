import { afterEach, describe, expect, expectTypeOf, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../util/test/mockCanvas';
import { createChart, deproxy, setupMockCanvas, setupMockConsole } from './utils';

describe('createChart', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    const barOptions = (): AgChartOptions => ({
        data: [
            { c: 'A', v: 1 },
            { c: 'B', v: 2 },
        ],
        series: [{ type: 'bar', xKey: 'c', yKey: 'v' }],
    });

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it('is typed as returning the public chart instance', () => {
        expectTypeOf(createChart).returns.resolves.toEqualTypeOf<AgChartInstance>();
    });

    it('returns the public instance rather than the internal chart', async () => {
        chart = await createChart(barOptions());

        const internal = deproxy(chart);

        expect(internal).not.toBe(chart);
        // The public instance and the internal chart point at each other.
        expect(internal.publicApi).toBe(chart);
        // Public API only: the internal chart's members are not reachable without `deproxy()`.
        expect(chart).not.toHaveProperty('series');
        expect(chart).not.toHaveProperty('axes');
        expect(chart).not.toHaveProperty('ctx');
    });

    it('exposes the public API on the returned instance', async () => {
        chart = await createChart(barOptions());

        for (const method of ['update', 'updateDelta', 'getOptions', 'destroy'] as const) {
            expect(chart[method]).toBeTypeOf('function');
        }
    });

    it('lets a test opt in to internals with deproxy()', async () => {
        chart = await createChart(barOptions());

        const internal = deproxy(chart);

        expect(internal.series).toHaveLength(1);
        expect(internal.series[0].type).toBe('bar');
    });

    it('resolves only once the chart has been laid out', async () => {
        chart = await createChart(barOptions());

        const internal = deproxy(chart);

        expect(internal.width).toBe(CANVAS_WIDTH);
        expect(internal.height).toBe(CANVAS_HEIGHT);
        expect(internal.series[0].visible).toBe(true);
    });

    it('applies the test options: fixed canvas size', async () => {
        chart = await createChart(barOptions());

        const options = chart.getOptions();

        expect(options.width).toBe(CANVAS_WIDTH);
        expect(options.height).toBe(CANVAS_HEIGHT);
    });

    it('leaves the caller options object untouched', async () => {
        const options = barOptions();

        chart = await createChart(options);

        expect(options).toEqual(barOptions());
        expect(options).not.toHaveProperty('width');
        expect(options).not.toHaveProperty('container');
    });
});
