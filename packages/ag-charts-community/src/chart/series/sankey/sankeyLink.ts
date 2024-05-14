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

    override updatePath(): void {
        const { path, x1, x2, y1, y2, height } = this;
        const midX = (x1 + x2) / 2;
        path.clear();
        path.moveTo(x1, y1);
        path.cubicCurveTo(midX, y1, midX, y2, x2, y2);
        path.lineTo(x2, y2 + height);
        path.cubicCurveTo(midX, y2 + height, midX, y1 + height, x1, y1 + height);
        path.closePath();
    }
}
