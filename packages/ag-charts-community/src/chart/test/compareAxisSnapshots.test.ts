import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartInstance } from 'ag-charts-types';

import { calculateAxisBBox, compareAxisSnapshots } from './axisTestCases';
import { compareImageSnapshot, createChart, deproxy, setupMockCanvas, setupMockConsole } from './utils';

// The images are not compared here: the baselines are keyed to the order and number of comparisons made.
vi.mock('./utils', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./utils')>()),
    compareImageSnapshot: vi.fn(),
}));

describe('compareAxisSnapshots', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        chart.destroy();
        vi.mocked(compareImageSnapshot).mockClear();
    });

    const createBarChart = async () => {
        chart = await createChart({
            data: [
                { c: 'A', v: 1 },
                { c: 'B', v: 2 },
            ],
            series: [{ type: 'bar', xKey: 'c', yKey: 'v' }],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
            },
        });
    };

    it('compares each axis cropped to its bounding box, in axis order', async () => {
        await createBarChart();

        await compareAxisSnapshots(chart, ctx);

        const axes = deproxy(chart).axes;
        expect(axes.map((axis) => axis.type)).toEqual(['category', 'number']);
        const calls = vi.mocked(compareImageSnapshot).mock.calls;
        expect(calls).toHaveLength(2);
        axes.forEach((axis, index) => {
            const bbox = calculateAxisBBox(axis);
            expect(bbox.width * bbox.height).toBeGreaterThan(0);
            expect(calls[index][1]).toMatchObject({ bbox });
        });
    });

    it('compares only the axes of the given types', async () => {
        await createBarChart();

        await compareAxisSnapshots(chart, ctx, { types: ['number'] });

        const [axis] = deproxy(chart).axes.filter((a) => a.type === 'number');
        const calls = vi.mocked(compareImageSnapshot).mock.calls;
        expect(calls).toHaveLength(1);
        expect(calls[0][1]).toMatchObject({ bbox: calculateAxisBBox(axis) });
    });

    it('compares nothing when no axis is of the given types', async () => {
        await createBarChart();

        await compareAxisSnapshots(chart, ctx, { types: ['log'] });

        expect(compareImageSnapshot).not.toHaveBeenCalled();
    });
});
