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
        const width = Math.abs(x2 - x1);
        const midX = (x1 + x2) / 2;
        const dy = y2 - y1;
        path.clear();
        if (inset > height / 2 || inset > width / 2) return;
        // Make the link have as a consistent width as possible
        const cpOffset =
            Math.sign(dy) *
            Math.min(
                (dy * dy) / (2 * width),
                // Prioritize the link having a 'wave' shape over the consistent width
                width / 8,
                height / 2
            );
        path.moveTo(x1 + inset, y1 + inset);
        path.cubicCurveTo(midX + cpOffset, y1 + inset, midX + cpOffset, y2 + inset, x2 - inset, y2 + inset);
        path.lineTo(x2 - inset, y2 + height - inset);
        path.cubicCurveTo(
            midX - cpOffset,
            y2 + height - inset,
            midX - cpOffset,
            y1 + height - inset,
            x1 + inset,
            y1 + height - inset
        );
        path.closePath();
    }
}
