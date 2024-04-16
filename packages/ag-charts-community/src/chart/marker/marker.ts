import { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { Path, ScenePathChangeDetection } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';

export type MarkerPathMove = { x: number; y: number; t?: 'move' };

export class Marker extends Path {
    public static center: Point = { x: 0.5, y: 0.5 };

    @ScenePathChangeDetection()
    x: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    @ScenePathChangeDetection({ convertor: Math.abs })
    size: number = 12;

    @ScenePathChangeDetection()
    repeat?: { x: number; y: number }[];

    override computeBBox(): BBox {
        const { x, y, size } = this;
        const { center } = this.constructor as any;

        return new BBox(x - size * center.x, y - size * center.y, size, size);
    }

    protected applyPath(s: number, moves: MarkerPathMove[]) {
        const { path } = this;
        let { x, y } = this;

        if (this.repeat != null) {
            x = 0;
            y = 0;
        }

        path.clear();
        for (const { x: mx, y: my, t } of moves) {
            x += mx * s;
            y += my * s;
            if (t === 'move') {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        }
        path.closePath();
    }

    protected override executeFill(ctx: CanvasContext, path?: Path2D | undefined): void {
        if (!path) return;

        if (this.repeat == null) {
            return super.executeFill(ctx, path);
        }

        ctx.save();
        let x = this.translationX;
        let y = this.translationY;
        for (const translation of this.repeat) {
            ctx.translate(translation.x - x, translation.y - y);
            ctx.fill(path);
            x = translation.x;
            y = translation.y;
        }
        ctx.restore();
    }

    protected override executeStroke(ctx: CanvasContext, path?: Path2D | undefined): void {
        if (!path) return;

        if (this.repeat == null) {
            return super.executeStroke(ctx, path);
        }

        ctx.save();
        let x = this.translationX;
        let y = this.translationY;
        for (const translation of this.repeat) {
            ctx.translate(translation.x - x, translation.y - y);
            ctx.stroke(path);
            x = translation.x;
            y = translation.y;
        }
        ctx.restore();
    }
}
