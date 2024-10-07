import { _Scene } from 'ag-charts-community';

const { BBox, Path, ScenePathChangeDetection } = _Scene;

const delta = 1e-6;
function pointsEq([ax, ay]: readonly [number, number], [bx, by]: readonly [number, number]) {
    return Math.abs(ax - bx) <= delta && Math.abs(ay - by) <= delta;
}

export class FunnelConnector extends Path {
    @ScenePathChangeDetection()
    x0: number = 0;

    @ScenePathChangeDetection()
    y0: number = 0;

    @ScenePathChangeDetection()
    x1: number = 0;

    @ScenePathChangeDetection()
    y1: number = 0;

    @ScenePathChangeDetection()
    x2: number = 0;

    @ScenePathChangeDetection()
    y2: number = 0;

    @ScenePathChangeDetection()
    x3: number = 0;

    @ScenePathChangeDetection()
    y3: number = 0;

    get midPoint(): { x: number; y: number } {
        const { x0, y0, x1, y1, x2, y2, x3, y3 } = this;
        return {
            x: (x0 + x1 + x2 + x3) / 4,
            y: (y0 + y1 + y2 + y3) / 4,
        };
    }

    protected override computeBBox(): _Scene.BBox | undefined {
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
        points.forEach((p) => {
            if ((start != null && pointsEq(start, p)) || (current != null && pointsEq(current, p))) {
                return;
            }

            const [x, y] = p;
            if (start == null) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }

            start ??= p;
            current = p;
        });

        path.closePath();
    }
}
