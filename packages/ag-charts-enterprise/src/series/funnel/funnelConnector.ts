import { _Scene } from 'ag-charts-community';

const { BBox, Path, ScenePathChangeDetection } = _Scene;

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

        path.clear();

        path.moveTo(x0, y0);
        path.lineTo(x1, y1);
        path.lineTo(x2, y2);
        path.lineTo(x3, y3);

        path.closePath();
    }
}
