import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

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
        vi.restoreAllMocks();
    });

    // An axis with nothing to draw takes no space.
    const BARE_Y_AXIS = {
        type: 'number',
        position: 'left',
        line: { enabled: false },
        tick: { enabled: false },
        label: { enabled: false },
    } as const;

    const createBarChart = async (axes?: Partial<AgCartesianChartOptions['axes']>) => {
        chart = await createChart({
            data: [
                { c: 'A', v: 1 },
                { c: 'B', v: 2 },
            ],
            series: [{ type: 'bar', xKey: 'c', yKey: 'v' }],
            axes: {
                x: { type: 'category', position: 'bottom' },
                y: { type: 'number', position: 'left' },
                ...axes,
            },
        });
    };

    /** Replaces the matcher behind `toMatchSnapshot`, so the bounding boxes it is given can be read without baselines. */
    const spyOnTextSnapshots = () => {
        const { snapshotState } = expect.getState() as unknown as {
            snapshotState: { match(...args: unknown[]): unknown };
        };
        return vi
            .spyOn(snapshotState, 'match')
            .mockImplementation(() => ({ pass: true, actual: '', expected: '', key: '' }));
    };

    it('compares each axis cropped to its bounding box, in axis order', async () => {
        await createBarChart();

        await compareAxisSnapshots(chart, ctx);

        const axes = deproxy(chart).axes;
        expect(axes.map((axis) => axis.type)).toEqual(['category', 'number']);
        const calls = vi.mocked(compareImageSnapshot).mock.calls;
        expect(calls).toHaveLength(2);
        for (const [index, axis] of axes.entries()) {
            const bbox = calculateAxisBBox(axis);
            expect(bbox.width * bbox.height).toBeGreaterThan(0);
            expect(calls[index][1]).toMatchObject({ bbox });
        }
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

    it('records no bounding box text snapshots by default', async () => {
        await createBarChart();
        const match = spyOnTextSnapshots();

        await compareAxisSnapshots(chart, ctx);

        expect(match).not.toHaveBeenCalled();
    });

    it('records each bounding box before its image when snapshotBBox is set', async () => {
        await createBarChart();
        const match = spyOnTextSnapshots();

        await compareAxisSnapshots(chart, ctx, { snapshotBBox: true });

        const axes = deproxy(chart).axes;
        expect(match.mock.calls.map(([args]) => (args as { received: unknown }).received)).toEqual(
            axes.map((axis) => calculateAxisBBox(axis))
        );
        expect(vi.mocked(compareImageSnapshot)).toHaveBeenCalledTimes(2);
    });

    it('skips the image of an axis smaller than a pixel when snapshotBBox is set', async () => {
        await createBarChart({ y: BARE_Y_AXIS });
        const match = spyOnTextSnapshots();

        await compareAxisSnapshots(chart, ctx, { snapshotBBox: true });

        const [x, y] = deproxy(chart).axes;
        const hidden = calculateAxisBBox(y);
        expect(hidden.width < 1 || hidden.height < 1).toBe(true);
        expect(match).toHaveBeenCalledTimes(2);
        const calls = vi.mocked(compareImageSnapshot).mock.calls;
        expect(calls).toHaveLength(1);
        expect(calls[0][1]).toMatchObject({ bbox: calculateAxisBBox(x) });
    });

    it('still compares a smaller-than-a-pixel axis when snapshotBBox is not set', async () => {
        await createBarChart({ y: BARE_Y_AXIS });

        await compareAxisSnapshots(chart, ctx);

        expect(compareImageSnapshot).toHaveBeenCalledTimes(2);
    });
});
