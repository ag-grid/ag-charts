import { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { Path, ScenePathChangeDetection } from '../../scene/shape/path';

export type MarkerPathMove = { x: number; y: number; t?: 'move' };

export class Marker extends Path {
    public static center: Point = { x: 0.5, y: 0.5 };

    @ScenePathChangeDetection()
    x: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    @ScenePathChangeDetection({ convertor: Math.abs })
    size: number = 12;

    override computeBBox(): BBox {
        const { x, y, size } = this;
        const { center } = this.constructor as any;

        return new BBox(x - size * center.x, y - size * center.y, size, size);
    }

    protected applyPath(s: number, moves: MarkerPathMove[]) {
        const { path } = this;
        let { x, y } = this;

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
}
