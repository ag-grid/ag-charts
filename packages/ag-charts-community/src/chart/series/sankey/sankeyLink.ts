import { Path, ScenePathChangeDetection } from '../../../scene/shape/path';

export class SankeyLink extends Path {
    @ScenePathChangeDetection()
    x1: number = 0;

    @ScenePathChangeDetection()
    x2: number = 0;

    @ScenePathChangeDetection()
    y1: number = 0;

    @ScenePathChangeDetection()
    y2: number = 0;

    @ScenePathChangeDetection()
    height: number = 0;

    @ScenePathChangeDetection()
    inset: number = 0;

    override updatePath(): void {
        const { path, x1, x2, y1, y2, height, inset } = this;
        const midX = (x1 + x2) / 2;
        path.clear();
        if (inset > height || inset > Math.abs(x1 - x2)) return;
        path.moveTo(x1 + inset, y1 + inset);
        path.cubicCurveTo(midX, y1 + inset, midX, y2 + inset, x2 - inset, y2 + inset);
        path.lineTo(x2 - inset, y2 + height - inset);
        path.cubicCurveTo(midX, y2 + height - inset, midX, y1 + height - inset, x1 + inset, y1 + height - inset);
        path.closePath();
    }
}
