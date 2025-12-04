import { _ModuleSupport } from 'ag-charts-community';
import type { DistantObject } from 'ag-charts-core';
import { SceneChangeDetection, lineDistanceSquared } from 'ag-charts-core';

const { BBox, Path } = _ModuleSupport;

const delta = 1e-6;
function pointsEq([ax, ay]: readonly [number, number], [bx, by]: readonly [number, number]) {
    return Math.abs(ax - bx) <= delta && Math.abs(ay - by) <= delta;
}

export class FunnelConnector<D = any> extends Path<D> implements DistantObject {
    @SceneChangeDetection()
    x0: number = 0;

    @SceneChangeDetection()
    y0: number = 0;

    @SceneChangeDetection()
    x1: number = 0;

    @SceneChangeDetection()
    y1: number = 0;

    @SceneChangeDetection()
    x2: number = 0;

    @SceneChangeDetection()
    y2: number = 0;

    @SceneChangeDetection()
    x3: number = 0;

    @SceneChangeDetection()
    y3: number = 0;

    get midPoint(): { x: number; y: number } {
        const { x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        return {
            x: (x0 + x1 + x2 + x3) / 4,
            y: (y0 + y1 + y2 + y3) / 4,
        };
    }

    override distanceSquared(x: number, y: number): number {
        if (this.containsPoint(x, y)) return 0;

        const { x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        return Math.min(
            lineDistanceSquared(x, y, x0, y0, x1, y1, Infinity),
            lineDistanceSquared(x, y, x1, y1, x2, y2, Infinity),
            lineDistanceSquared(x, y, x2, y2, x3, y3, Infinity),
            lineDistanceSquared(x, y, x3, y3, x0, y0, Infinity)
        );
    }

    protected override computeBBox(): _ModuleSupport.BBox | undefined {
        const { x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        const x = Math.min(x0, x1, x2, x3);
        const width = Math.max(x0, x1, x2, x3) - x;
        const y = Math.min(y0, y1, y2, y3);
        const height = Math.max(y0, y1, y2, y3) - y;
        return new BBox(x, y, width, height);
    }

    override updatePath(): void {
        const { path, x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        const points = [
            [x0, y0],
            [x1, y1],
            [x2, y2],
            [x3, y3],
        ] as const;

        path.clear();

        let start: readonly [number, number] | undefined;
        let current: readonly [number, number] | undefined;

        // Required because path hit detection is flaky when the points are the same
        for (const p of points) {
            if ((start != null && pointsEq(start, p)) || (current != null && pointsEq(current, p))) {
                continue;
            }

            const [x, y] = p;
            if (start == null) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }

            start ??= p;
            current = p;
        }

        path.closePath();
    }
}
