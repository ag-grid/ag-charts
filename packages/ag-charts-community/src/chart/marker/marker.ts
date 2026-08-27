import type { Logger, Point } from 'ag-charts-core';
import { DeclaredSceneChangeDetection, DeclaredSceneObjectChangeDetection, TRIPLE_EQ } from 'ag-charts-core';
import type { AgMarkerShape } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import type { ExtendedPath2D } from '../../scene/extendedPath2D';
import { type NodeOptions } from '../../scene/node';
import { Path } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';
import { Rotatable, Scalable, Translatable } from '../../scene/transformable';
import { align } from '../../scene/util/pixel';
import { getSharedMarkerPath } from './markerPathCache';

// Frozen anchor literals returned from Marker.anchor() — avoids per-frame object allocation in hot paths.
const PIN_ANCHOR: Point = Object.freeze({ x: 0.5, y: 1 });
const CENTRE_ANCHOR: Point = Object.freeze({ x: 0.5, y: 0.5 });

// Scratch BBoxes shared across all markers — drawPath is synchronous and markers don't
// render recursively, so only one marker is mid-draw at any time.
const DRAW_BBOX_SCRATCH = new BBox(0, 0, 0, 0);
const FILL_BBOX_SCRATCH = new BBox(0, 0, 0, 0);

/** The only parts of a marker style the pick-inflation resolution reads. */
export type MarkerStrokePickStyle = { stroke?: unknown; strokeWidth?: number; strokeOpacity?: number };

/**
 * Half the width of the stroke this marker style actually draws, in local-space pixels — the amount
 * a node's pick region must grow by so that clicking/hovering the stroke counts as hitting the node
 * (AG-8173). A style that draws no stroke contributes nothing, so unstroked nodes keep exactly
 * today's hit region.
 */
export function markerStrokePickInflation(style: MarkerStrokePickStyle | undefined): number {
    if (style == null) return 0;
    const { stroke, strokeWidth = 0, strokeOpacity = 1 } = style;
    // Same predicate the renderer uses to decide whether to stroke at all (see `Shape.strokeIsDrawn`).
    const strokeIsDrawn = stroke != null && stroke !== 'none' && strokeWidth > 0 && strokeOpacity > 0;
    return strokeIsDrawn ? strokeWidth / 2 : 0;
}

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

    // Origin-centred Path2D shared across all markers with the same (shape, size, pixelRatio).
    // Per-marker position is applied via ctx.translate in drawPath, not baked into the path.
    private _sharedPath?: ExtendedPath2D;

    // Path geometry is invariant to x/y (applied as a render-time translate), so x/y mutations
    // dirty the scene but not the path.
    override onChangeDetection(property: string): void {
        if (property === '__x' || property === '__y') {
            this.markDirty(property);
            return;
        }
        super.onChangeDetection(property);
    }

    /**
     * Half the widest stroke the marker is drawn with, so `'exact'` hit testing includes the stroke
     * (AG-8173). Set by `Series.applyMarkerStyle`; not change-detected, as it is never rendered.
     */
    pickInflation: number = 0;

    override isPointInPath(x: number, y: number): boolean {
        // `distanceSquaredLocal` returns `d² - r²`, so `d² <= (r + i)²` is `d² - r² <= i² + 2·r·i`,
        // with `2·r` being `size`. `distanceSquared` (nearest/numeric ranges) is left untouched.
        const { pickInflation } = this;
        const tolerance = pickInflation > 0 ? pickInflation * (pickInflation + this.size) : 0;
        return this.distanceSquaredLocal(x, y) <= tolerance;
    }

    // Exact hit-test against the shared origin-centred path; for subclasses (e.g. AnnotationShape)
    // that need geometry-accurate picking instead of the radius approximation in isPointInPath.
    protected isPointInSharedPath(x: number, y: number): boolean {
        if (!this._sharedPath?.closedPath) return false;
        const anchor = Marker.anchor(this.shape);
        const tx = x - this.x + (anchor.x - 0.5) * this.size;
        const ty = y - this.y + (anchor.y - 0.5) * this.size;
        return this._sharedPath.isPointInPath(tx, ty);
    }

    get midPoint(): { x: number; y: number } {
        return { x: this.x, y: this.y };
    }

    override distanceSquared(x: number, y: number): number {
        return this.distanceSquaredLocal(x, y);
    }

    // Shared by both pick entry points so neither transforms twice: distanceSquared() is
    // transform-wrapped by MatrixTransform, while pickNode() already inverse-transforms the point.
    protected distanceSquaredLocal(x: number, y: number): number {
        const anchor = Marker.anchor(this.shape);
        const dx = x - this.x + (anchor.x - 0.5) * this.size;
        const dy = y - this.y + (anchor.y - 0.5) * this.size;
        const radius = this.size / 2;
        return Math.max(dx * dx + dy * dy - radius * radius, 0);
    }

    // this.path is unused — geometry lives on _sharedPath. Override so Path.preRender doesn't
    // lazy-allocate an unused ExtendedPath2D per marker.
    protected override pathComplexity(): number {
        return this._sharedPath?.commands.length ?? 0;
    }

    override updatePath(): void {
        const { shape, size } = this;
        // `!(size > 0)` rather than `size <= 0` so NaN size is treated as no path.
        // eslint-disable-next-line sonarjs/no-inverted-boolean-check
        if (shape == null || !(size > 0)) {
            this._sharedPath = undefined;
            return;
        }
        // Custom function shapes may bake pixelRatio into their geometry → cache per DPR.
        // Built-in shapes ignore it (pixel alignment is applied at draw-time translate).
        const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
        // Squares snap to an integer device-pixel width so both edges land on device pixels at
        // draw time (see drawPath). Other shapes use the requested size verbatim.
        const pathSize = shape === 'square' ? align(pixelRatio, size) : size;
        this._sharedPath = getSharedMarkerPath(shape, pathSize, pixelRatio);
    }

    protected override computeBBox(): BBox {
        const { x, y, size } = this;
        const anchor = Marker.anchor(this.shape);

        return new BBox(x - size * anchor.x, y - size * anchor.y, size, size);
    }

    override drawPath(ctx: CanvasContext, logger: Logger): void {
        if (this._sharedPath === undefined) return;

        const { shape, x, y, size } = this;
        const anchor = Marker.anchor(shape);
        const ax = x - (anchor.x - 0.5) * size;
        const ay = y - (anchor.y - 0.5) * size;
        // Pixel-snap axis-aligned squares so all four edges land on device pixels. updatePath()
        // authored the shared path with this snapped size, so both edges align at draw time.
        const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
        const pathHalfSize = (shape === 'square' ? align(pixelRatio, size) : size) / 2;
        const tx = shape === 'square' ? align(pixelRatio, ax - pathHalfSize) + pathHalfSize : ax;
        const ty = shape === 'square' ? align(pixelRatio, ay - pathHalfSize) + pathHalfSize : ay;

        // fillStroke references gradient/pattern bboxes before ctx.translate is applied, so shift
        // the marker bbox (and fillBBox, if present) by (-tx, -ty) into origin coordinates.
        const baseBBox = super.getBBox();
        DRAW_BBOX_SCRATCH.x = baseBBox.x - tx;
        DRAW_BBOX_SCRATCH.y = baseBBox.y - ty;
        DRAW_BBOX_SCRATCH.width = baseBBox.width;
        DRAW_BBOX_SCRATCH.height = baseBBox.height;

        let fillBBoxOverride: BBox | undefined;
        const originalFillBBox = this.__fillBBox;
        if (originalFillBBox) {
            FILL_BBOX_SCRATCH.x = originalFillBBox.x - tx;
            FILL_BBOX_SCRATCH.y = originalFillBBox.y - ty;
            FILL_BBOX_SCRATCH.width = originalFillBBox.width;
            FILL_BBOX_SCRATCH.height = originalFillBBox.height;
            fillBBoxOverride = FILL_BBOX_SCRATCH;
        }

        ctx.save();
        ctx.translate(tx, ty);
        try {
            this.fillStroke(ctx, logger, this._sharedPath.getPath2D(), DRAW_BBOX_SCRATCH, fillBBoxOverride);
        } finally {
            ctx.restore();
        }
    }

    override svgPathData(transform?: (x: number, y: number) => { x: number; y: number }): string {
        // Honour dirtyPath so shape/size mutations re-export fresh geometry instead of a stale cache hit.
        this.updatePathIfDirty();
        if (this._sharedPath === undefined) return '';
        const { shape, x, y, size } = this;
        const anchor = Marker.anchor(shape);
        const ax = x - (anchor.x - 0.5) * size;
        const ay = y - (anchor.y - 0.5) * size;
        if (transform) {
            return this._sharedPath.toSVG((px, py) => transform(px + ax, py + ay));
        }
        return this._sharedPath.toSVG((px, py) => ({ x: px + ax, y: py + ay }));
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
export class Marker<_D = unknown> extends Rotatable(Scalable(Translatable(InternalMarker<any>))) {
    // Type-only re-declarations of Scalable backing fields, exposed for the optimised hot-path writes.
    declare __scalingCenterX: number;
    declare __scalingCenterY: number;
    declare __translationX: number;
    declare __translationY: number;

    protected override get serializedType(): 'marker' {
        return 'marker';
    }

    static anchor(shape: AgMarkerShape | undefined): Point {
        if (shape === 'pin') {
            return PIN_ANCHOR;
        } else if (typeof shape === 'function' && 'anchor' in shape) {
            // Undocumented API - used by FC annotations
            return shape.anchor as any;
        }
        return CENTRE_ANCHOR;
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
        const sizeChanged = this.__size !== size;
        this.__x = x;
        this.__y = y;
        this.__size = size;
        this.__opacity = opacity;
        // Use encapsulated method for scaling properties from Scalable mixin
        this.resetScalingProperties(scalingX, scalingY, x, y);
        // Path is origin-centred and reused across markers; only re-author when size changes.
        if (sizeChanged) {
            this.dirtyPath = true;
        }

        // Single dirty notification for the batch
        this.markDirty();
    }

    /**
     * Hot-path visibility/position write — bypasses change-detection setters and consolidates
     * dirtying into a single dirtyPath + markDirty() at the end (matches Path's onChangeDetection).
     */
    setVisibilityAndPosition(visible: boolean, shape: AgMarkerShape, size: number, point?: Point): void {
        let dirty = false;
        let shapeOrSizeChanged = false;
        if (this.__visible !== visible) {
            this.__visible = visible;
            dirty = true;
        }
        if (this.__shape !== shape) {
            this.__shape = shape;
            dirty = true;
            shapeOrSizeChanged = true;
        }
        // Size has a Math.abs convertor — match the setter contract by comparing the post-convert value.
        const absSize = Math.abs(size);
        if (this.__size !== absSize) {
            this.__size = absSize;
            dirty = true;
            shapeOrSizeChanged = true;
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
            if (shapeOrSizeChanged) {
                this.dirtyPath = true;
            }
            this.markDirty();
        }
    }
}
