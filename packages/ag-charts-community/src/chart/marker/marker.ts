import type { RenderContext } from '../../integrated-charts-scene';
import { BBox } from '../../scene/bbox';
import type { Point } from '../../scene/point';
import { Path, ScenePathChangeDetection } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';
import { Rotatable, Scalable, Translatable } from '../../scene/transformable';

export type MarkerPathMove = { x: number; y: number; t?: 'move' };

const BUILTIN_MARKERS: readonly string[] = [
    'ArrowDown',
    'ArrowUp',
    'Circle',
    'Cross',
    'Diamond',
    'Heart',
    'MapPin',
    'Plus',
    'Square',
    'Star',
    'Triangle',
];

const DEFAULT_CENTER_POINT = Object.freeze({ x: 0.5, y: 0.5 });
class InternalMarker extends Path {
    @ScenePathChangeDetection()
    x: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    @ScenePathChangeDetection({ convertor: Math.abs })
    size: number = 12;

    private isBuiltIn(): boolean {
        return BUILTIN_MARKERS.includes((this.constructor as { className?: string }).className ?? '');
    }

    protected override computeBBox(): BBox {
        if (!this.isBuiltIn()) {
            this.updatePathIfDirty();
            return this.path.computeBBox();
        }

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

    protected override executeFill(ctx: CanvasContext, path?: Path2D | undefined): void {
        if (!path) return;

        return super.executeFill(ctx, path);
    }

    protected override executeStroke(ctx: CanvasContext, path?: Path2D | undefined): void {
        if (!path) return;

        return super.executeStroke(ctx, path);
    }
}

// Needed to ensure correct order of operations WRT computeBBox().
export class Marker extends Rotatable(Scalable(Translatable(InternalMarker))) {
    public static readonly center: Point = DEFAULT_CENTER_POINT;
}
