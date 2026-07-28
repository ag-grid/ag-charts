import { testLogger } from '_ag-charts-test';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPath2D } from 'ag-charts-core';

import { SegmentedPath } from './segmentedPath';

describe('SegmentedPath', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('AG-17460 should size the inverse clip rect in logical coordinates at sub-1 device pixel ratio', () => {
        const Path2DCtor = getPath2D();
        const pointsReached: Array<[number, number]> = [];
        const record = (x: number, y: number) => pointsReached.push([x, y]);
        vi.spyOn(Path2DCtor.prototype, 'moveTo').mockImplementation(record);
        vi.spyOn(Path2DCtor.prototype, 'lineTo').mockImplementation(record);

        const deviceWidth = 400;
        const deviceHeight = 300;
        const pixelRatio = 0.5;

        const path = new SegmentedPath();
        path.fill = 'none';
        path.stroke = 'none';
        // Segment kept well inside the canvas so the full logical extent can only come from the
        // inverse full-canvas rect, not from a segment clip rect.
        path.segments = [{ clipRect: { x0: 100, y0: 100, x1: 200, y1: 200 } }];
        // Drawn in logical space (the context transform scales by pixelRatio), so the inverse mask
        // must reach the logical canvas extent, not the smaller device-pixel extent.
        vi.spyOn(path, 'layerManager', 'get').mockReturnValue({ canvas: { pixelRatio } } as any);

        const ctx = {
            canvas: { width: deviceWidth, height: deviceHeight },
            save: vi.fn(),
            restore: vi.fn(),
            clip: vi.fn(),
        } as unknown as CanvasRenderingContext2D;

        path.drawPath(ctx, testLogger);

        const maxX = Math.max(...pointsReached.map(([x]) => x));
        const maxY = Math.max(...pointsReached.map(([, y]) => y));
        expect(maxX).toBe(deviceWidth / pixelRatio);
        expect(maxY).toBe(deviceHeight / pixelRatio);
    });
});
