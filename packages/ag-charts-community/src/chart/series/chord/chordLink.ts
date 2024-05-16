import { Path, ScenePathChangeDetection } from '../../../scene/shape/path';

export class ChordLink extends Path {
    @ScenePathChangeDetection()
    centerX: number = 0;

    @ScenePathChangeDetection()
    centerY: number = 0;

    @ScenePathChangeDetection()
    radius: number = 0;

    @ScenePathChangeDetection()
    startAngle1: number = 0;

    @ScenePathChangeDetection()
    endAngle1: number = 0;

    @ScenePathChangeDetection()
    startAngle2: number = 0;

    @ScenePathChangeDetection()
    endAngle2: number = 0;

    override updatePath(): void {
        const { path, centerX, centerY, radius } = this;
        let { startAngle1, endAngle1, startAngle2, endAngle2 } = this;
        if (startAngle1 > startAngle2) {
            [startAngle1, startAngle2] = [startAngle2, startAngle1];
            [endAngle1, endAngle2] = [endAngle2, endAngle1];
        }

        path.clear();
        path.moveTo(centerX + radius * Math.cos(startAngle1), centerY + radius * Math.sin(startAngle1));
        path.cubicCurveTo(
            centerX,
            centerY,
            centerX,
            centerY,
            centerX + radius * Math.cos(endAngle2),
            centerY + radius * Math.sin(endAngle2)
        );
        path.arc(centerX, centerY, radius, endAngle2, startAngle2, true);
        path.cubicCurveTo(
            centerX,
            centerY,
            centerX,
            centerY,
            centerX + radius * Math.cos(endAngle1),
            centerY + radius * Math.sin(endAngle1)
        );
        path.arc(centerX, centerY, radius, endAngle1, startAngle1, true);
        path.closePath();
    }
}
