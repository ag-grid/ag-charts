import { afterEach, describe, expect, it, vi } from 'vitest';

import { SegmentedPath, getPath2D, shadowPass } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

describe('SegmentedPath', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        shadowPass.state = 'none';
        shadowPass.resolution = { x: 1, y: 1 };
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

    it('should size the inverse clip rect to the layer when a shadow mask is drawn at a lower resolution', () => {
        const Path2DCtor = getPath2D();
        const pointsReached: Array<[number, number]> = [];
        const record = (x: number, y: number) => pointsReached.push([x, y]);
        vi.spyOn(Path2DCtor.prototype, 'moveTo').mockImplementation(record);
        vi.spyOn(Path2DCtor.prototype, 'lineTo').mockImplementation(record);

        const path = new SegmentedPath();
        path.fill = 'none';
        path.stroke = 'none';
        path.segments = [{ clipRect: { x0: 100, y0: 100, x1: 200, y1: 200 } }];
        vi.spyOn(path, 'layerManager', 'get').mockReturnValue({ canvas: { pixelRatio: 2 } } as any);

        // The mask canvas is a quarter of the layer along x and half along y, and the context transform makes up for it.
        shadowPass.state = 'mask';
        shadowPass.resolution = { x: 0.25, y: 0.5 };
        const ctx = {
            canvas: { width: 400, height: 300 },
            save: vi.fn(),
            restore: vi.fn(),
            clip: vi.fn(),
        } as unknown as CanvasRenderingContext2D;

        path.drawPath(ctx, testLogger);

        expect(Math.max(...pointsReached.map(([x]) => x))).toBe(400 / (2 * 0.25));
        expect(Math.max(...pointsReached.map(([, y]) => y))).toBe(300 / (2 * 0.5));
    });
});
