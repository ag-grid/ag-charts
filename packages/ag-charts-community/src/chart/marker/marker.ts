import type { AgMarkerShape, AgMarkerShapeFnParams } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import type { NodeOptions } from '../../scene/node';
import type { Point } from '../../scene/point';
import { Path, ScenePathChangeDetection } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';
import { Rotatable, Scalable, Translatable } from '../../scene/transformable';
import { MARKER_SHAPES } from './shapes';

class InternalMarker<D = any> extends Path<D> {
    @ScenePathChangeDetection()
    shape: AgMarkerShape = 'square';

    @ScenePathChangeDetection()
    x: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    @ScenePathChangeDetection({ convertor: Math.abs })
    size: number = 12;

    override updatePath(): void {
        const { path, shape, x, y, size } = this;

        const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;

        const anchor = Marker.anchor(shape);
        const drawParams: AgMarkerShapeFnParams = {
            path,
            x: x - (anchor.x - 0.5) * size,
            y: y - (anchor.y - 0.5) * size,
            size,
            pixelRatio,
        };

        path.clear();
        if (typeof shape === 'string') {
            MARKER_SHAPES[shape](drawParams);
        } else if (typeof shape === 'function') {
            shape(drawParams);
        }
    }

    protected override computeBBox(): BBox {
        const { x, y, size } = this;
        const anchor = Marker.anchor(this.shape);

        return new BBox(x - size * anchor.x, y - size * anchor.y, size, size);
    }

    protected override executeFill(ctx: CanvasContext, path?: Path2D): void {
        if (!path) return;

        return super.executeFill(ctx, path);
    }

    protected override executeStroke(ctx: CanvasContext, path?: Path2D): void {
        if (!path) return;

        return super.executeStroke(ctx, path);
    }
}

// Needed to ensure correct order of operations WRT computeBBox().
export class Marker extends Rotatable(Scalable(Translatable(InternalMarker))) {
    static anchor(shape: AgMarkerShape | undefined): Point {
        if (shape === 'pin') {
            return { x: 0.5, y: 1 };
        } else if (typeof shape === 'function' && 'anchor' in shape) {
            // Undocumented API - used by FC annotations
            return shape.anchor as any;
        }
        return { x: 0.5, y: 0.5 };
    }

    constructor(options?: NodeOptions & { shape?: AgMarkerShape }) {
        super(options);
        if (options?.shape != null) {
            this.shape = options.shape;
        }
    }
}
