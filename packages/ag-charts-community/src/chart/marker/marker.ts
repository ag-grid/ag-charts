import type { Point } from 'ag-charts-core';
import { DeclaredSceneChangeDetection, DeclaredSceneObjectChangeDetection, TRIPLE_EQ } from 'ag-charts-core';
import type { AgMarkerShape, AgMarkerShapeFnParams } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import { type NodeOptions } from '../../scene/node';
import { Path } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';
import { Rotatable, Scalable, Translatable } from '../../scene/transformable';
import { MARKER_SHAPES } from './shapes';

class InternalMarker<D = any> extends Path<D> {
    @DeclaredSceneObjectChangeDetection({ equals: TRIPLE_EQ })
    shape: AgMarkerShape = 'square';
    declare __shape: AgMarkerShape; // optimised field accessor

    @DeclaredSceneChangeDetection()
    x: number = 0;
    declare __x: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    y: number = 0;
    declare __y: number; // optimised field accessor

    @DeclaredSceneChangeDetection({ convertor: Math.abs })
    size: number = 12;
    declare __size: number; // optimised field accessor

    override isPointInPath(x: number, y: number): boolean {
        return this.distanceSquared(x, y) <= 0;
    }

    get midPoint(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    override distanceSquared(x: number, y: number): number {
        const anchor = Marker.anchor(this.shape);
        const dx = x - this.x + (anchor.x - 0.5) * this.size;
        const dy = y - this.y + (anchor.y - 0.5) * this.size;
        const radius = this.size / 2;
        return Math.max(dx * dx + dy * dy - radius * radius, 0);
    }

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
export class Marker<D = unknown> extends Rotatable(Scalable(Translatable(InternalMarker<any>))) {
    // Re-declare Scalable mixin backing fields so optimised hot-path writes (in
    // setVisibilityAndPosition / resetAnimationProperties) can address them without
    // routing through the public setter. Type-only declarations — runtime fields are
    // owned by the Scalable mixin.
    declare __scalingCenterX: number;
    declare __scalingCenterY: number;

    override get datum(): D | undefined {
        return super.datum;
    }
    override set datum(d: D | undefined) {
        super.datum = d;
    }
    override get previousDatum(): D | undefined {
        return super.previousDatum;
    }

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

    /**
     * Optimised reset for animation hot paths.
     * Bypasses SceneChangeDetection decorators by writing directly to backing fields.
     *
     * This avoids per-property overhead from:
     * - Equality checks (comparing old vs new values)
     * - Change callbacks (triggering downstream updates)
     * - Object.keys() iteration
     *
     * A single markDirty() call at the end ensures the scene graph is properly invalidated.
     * WARNING: Only use for animation hot paths where performance is critical.
     */
    resetAnimationProperties(
        x: number,
        y: number,
        size: number,
        opacity: number,
        scalingX: number,
        scalingY: number
    ): void {
        // Direct backing field writes bypass SceneChangeDetection decorators
        this.__x = x;
        this.__y = y;
        this.__size = size;
        this.__opacity = opacity;
        // Use encapsulated method for scaling properties from Scalable mixin
        this.resetScalingProperties(scalingX, scalingY, x, y);
        this.dirtyPath = true;

        // Single dirty notification for the batch
        this.markDirty();
    }

    /**
     * Optimised visibility/position write for the per-datum marker render hot path
     * (`Series.applyMarkerStyle`). Direct backing-field writes bypass the change-detection
     * setter chain. Path's onChangeDetection override unconditionally dirties the path on any
     * decorated write, so we mirror that — a single markDirty() + dirtyPath flip at the end
     * reproduces the same invalidation the setters would have produced.
     */
    setVisibilityAndPosition(visible: boolean, shape: AgMarkerShape, size: number, point?: Point): void {
        let dirty = false;
        if (this.__visible !== visible) {
            this.__visible = visible;
            dirty = true;
        }
        if (this.__shape !== shape) {
            this.__shape = shape;
            dirty = true;
        }
        // Size has a Math.abs convertor — match the setter contract by comparing the post-convert value.
        const absSize = Math.abs(size);
        if (this.__size !== absSize) {
            this.__size = absSize;
            dirty = true;
        }
        if (point) {
            const { x, y } = point;
            if (this.__x !== x) {
                this.__x = x;
                dirty = true;
            }
            if (this.__y !== y) {
                this.__y = y;
                dirty = true;
            }
            if (this.__scalingCenterX !== x) {
                this.__scalingCenterX = x;
                dirty = true;
            }
            if (this.__scalingCenterY !== y) {
                this.__scalingCenterY = y;
                dirty = true;
            }
        }
        if (dirty) {
            this.dirtyPath = true;
            this.markDirty();
        }
    }
}
