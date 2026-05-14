import type { Point } from 'ag-charts-core';
import { DeclaredSceneChangeDetection, DeclaredSceneObjectChangeDetection, TRIPLE_EQ } from 'ag-charts-core';
import type { AgMarkerShape } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import type { ExtendedPath2D } from '../../scene/extendedPath2D';
import { type Node, type NodeOptions, PointerEvents } from '../../scene/node';
import { Path } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';
import { Rotatable, Scalable, Translatable } from '../../scene/transformable';
import { align } from '../../scene/util/pixel';
import { getSharedMarkerPath } from './markerPathCache';

class InternalMarker<D = any> extends Path<D> {
    @DeclaredSceneObjectChangeDetection({ equals: TRIPLE_EQ })
    shape: AgMarkerShape = 'square';
    declare __shape: AgMarkerShape; // optimised field accessor

    @DeclaredSceneChangeDetection({ convertor: Math.abs })
    size: number = 12;
    declare __size: number; // optimised field accessor

    /**
     * Origin-centred Path2D shared across all markers using the same `(shape, size)`. The
     * per-marker position is applied by the `Translatable` mixin's transform matrix at render
     * time, never baked into the path geometry.
     *
     * Protected (not private) so subclasses that need an exact path-based hit-test can read the
     * recorded commands directly (e.g. annotation handles).
     */
    protected _sharedPath?: ExtendedPath2D;

    /**
     * `Shape.applyFillAndAlpha` reads `getBBox()` / `fillBBox` to configure gradients, patterns
     * and image fills, then `ctx.fill()` applies the path *with the canvas transform on top*.
     * For Translatable shapes that's a double-translate — the fillStyle would render offset by
     * the marker position. While drawing we therefore hand out *local* (pre-transform) bboxes
     * so the post-fill canvas transform places the fillStyle on top of the path correctly.
     *
     * This is a marker-local workaround for a Shape framework limitation: any Shape that uses
     * `Translatable` for positioning hits the same issue.
     */
    private _drawingActive: boolean = false;

    override getBBox(): BBox {
        if (this._drawingActive) {
            // Local (origin-centred) bbox of the path commands themselves. Bypass the
            // Translatable/Rotatable/Scalable mixin chain's `toParent` shift via the
            // `computeBBoxWithoutTransforms()` accessor MatrixTransform provides.
            const localBBox = (
                this as unknown as { computeBBoxWithoutTransforms?: () => BBox | undefined }
            ).computeBBoxWithoutTransforms?.();
            if (localBBox) return localBBox;
        }
        return super.getBBox();
    }

    /**
     * Marker position lives on `translationX/Y` via the `Translatable` mixin, so position changes
     * do not invalidate the shared Path2D — only `shape`/`size`/`pixelRatio` do. Filter
     * translation property writes out of `Path.onChangeDetection`'s `dirtyPath = true` behaviour
     * while still triggering the transform-matrix dirty (handled by `MatrixTransform`).
     */
    override onChangeDetection(property: string): void {
        if (property === '__translationX' || property === '__translationY') {
            this.markDirty(property);
            return;
        }
        super.onChangeDetection(property);
    }

    override isPointInPath(x: number, y: number): boolean {
        return this.distanceSquared(x, y) <= 0;
    }

    /**
     * Input coordinates are in parent (canvas) space. The quadtree hit-test calls this directly
     * with parent-space points, and {@link Marker.pickNode}/{@link Marker.pickNodes} bypass the
     * `MatrixTransform.pickNode` inverse-transform so the convention here stays consistent.
     */
    override distanceSquared(x: number, y: number): number {
        const tx = (this as unknown as { translationX?: number }).translationX ?? 0;
        const ty = (this as unknown as { translationY?: number }).translationY ?? 0;
        const anchor = Marker.anchor(this.shape);
        const dx = x - tx + (anchor.x - 0.5) * this.size;
        const dy = y - ty + (anchor.y - 0.5) * this.size;
        const radius = this.size / 2;
        return Math.max(dx * dx + dy * dy - radius * radius, 0);
    }

    override updatePath(): void {
        const { shape, size } = this;
        if (shape == null || size <= 0) {
            this._sharedPath = undefined;
            return;
        }
        this._sharedPath = getSharedMarkerPath(shape, size, Marker.anchor(shape));
    }

    /**
     * Origin-centred bbox. `Translatable.computeBBox` applies the transform via `toParent`,
     * yielding the absolute bbox consumers expect.
     */
    protected override computeBBox(): BBox {
        const { size } = this;
        const anchor = Marker.anchor(this.shape);

        return new BBox(-size * anchor.x, -size * anchor.y, size, size);
    }

    override drawPath(ctx: CanvasContext): void {
        if (this._sharedPath === undefined) return;
        // `MatrixTransform.render` has already applied this node's transform to the canvas
        // context, so the origin-centred shared path renders at the marker's position. While
        // `fillStroke` runs we expose local bboxes (see `_drawingActive`) and shift `fillBBox`
        // into local coords so the post-transform canvas places gradients/patterns on top of
        // the path rather than double-offset.
        const originalFillBBox = this.__fillBBox;
        if (originalFillBBox) {
            // `fillBBox` is set externally with parent-space (often axis) coordinates. Shift it
            // by the negation of this node's translate so the canvas transform restores it.
            const tx = (this as unknown as { __translationX?: number }).__translationX ?? 0;
            const ty = (this as unknown as { __translationY?: number }).__translationY ?? 0;
            this.__fillBBox = new BBox(
                originalFillBBox.x - tx,
                originalFillBBox.y - ty,
                originalFillBBox.width,
                originalFillBBox.height
            );
        }
        this._drawingActive = true;
        try {
            this.fillStroke(ctx, this._sharedPath.getPath2D());
        } finally {
            this._drawingActive = false;
            this.__fillBBox = originalFillBBox;
        }
    }

    /**
     * Emits origin-centred SVG path data. `MatrixTransform.toSVG` wraps the resulting element
     * in `<g transform="...">` so the SVG output ends up at the marker's absolute position.
     */
    override svgPathData(): string {
        if (this._sharedPath === undefined) {
            this.updatePath();
        }
        return this._sharedPath?.toSVG() ?? '';
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
    // Type-only re-declarations of mixin backing fields, exposed for the optimised hot-path writes.
    declare __scalingCenterX: number;
    declare __scalingCenterY: number;
    declare __translationX: number;
    declare __translationY: number;

    override get datum(): D | undefined {
        return super.datum;
    }
    override set datum(d: D | undefined) {
        super.datum = d;
    }
    override get previousDatum(): D | undefined {
        return super.previousDatum;
    }

    get midPoint(): { x: number; y: number } {
        return { x: this.translationX, y: this.translationY };
    }

    /**
     * Override `MatrixTransform.pickNode` to avoid pre-inverse-transforming the input — the
     * marker's `distanceSquared`/`isPointInPath` work in parent (canvas) space because the
     * quadtree hit-test calls them directly with parent-space points.
     */
    override pickNode(x: number, y: number) {
        if (!this.visible || this.pointerEvents === PointerEvents.None) return;
        if (this.containsPoint(x, y)) return this;
        return undefined;
    }

    override pickNodes(x: number, y: number, into: Node[] = []) {
        if (!this.visible || this.pointerEvents === PointerEvents.None) return into;
        if (this.containsPoint(x, y)) into.push(this);
        return into;
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
     * A single `onChangeDetection('__size')` at the end flips both `_dirtyPath` (so the cache
     * lookup re-runs if size changed) and `_dirtyTransform` (so the transform matrix recomputes).
     *
     * WARNING: Only use for animation hot paths where performance is critical.
     */
    resetAnimationProperties(
        translationX: number,
        translationY: number,
        size: number,
        opacity: number,
        scalingX: number,
        scalingY: number
    ): void {
        this.__translationX = translationX;
        this.__translationY = translationY;
        this.__size = size;
        this.__opacity = opacity;
        // Scaling pivots are in this node's local (origin-centred) space — translationX/Y is
        // applied on top by the Translatable mixin — so the scaling centre is the origin.
        this.resetScalingProperties(scalingX, scalingY, 0, 0);
        // `__size` fires the full dirty chain (path + transform); resetScalingProperties also
        // already fires onChangeDetection internally, so this is the single notification we need.
        this.onChangeDetection('__size');
        this.markDirty();
    }

    /**
     * Hot-path visibility/position write — bypasses change-detection setters and consolidates
     * dirtying into a single onChangeDetection() call at the end that flips `_dirtyPath`
     * (when shape/size changed) and/or `_dirtyTransform` (when translation changed).
     */
    setVisibilityAndPosition(visible: boolean, shape: AgMarkerShape, size: number, point?: Point): void {
        let dirty = false;
        let shapeOrSizeChanged = false;
        let translationChanged = false;
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
            // Pixel-snap square markers so their axis-aligned edges stay crisp on the device
            // pixel grid. Snapping at the setter (rather than at draw time) keeps bbox/hit-test
            // consistent with what was rendered.
            const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
            const hs = absSize / 2;
            const tx = shape === 'square' ? align(pixelRatio, point.x - hs) + hs : point.x;
            const ty = shape === 'square' ? align(pixelRatio, point.y - hs) + hs : point.y;
            if (this.__translationX !== tx) {
                this.__translationX = tx;
                dirty = true;
                translationChanged = true;
            }
            if (this.__translationY !== ty) {
                this.__translationY = ty;
                dirty = true;
                translationChanged = true;
            }
            // Scaling pivots are in this node's local (origin-centred) space — translationX/Y is
            // applied on top by the Translatable mixin — so the scaling centre is the origin.
            if (this.__scalingCenterX !== 0) {
                this.__scalingCenterX = 0;
                dirty = true;
            }
            if (this.__scalingCenterY !== 0) {
                this.__scalingCenterY = 0;
                dirty = true;
            }
        }
        if (dirty) {
            // `__size` fires both the path-dirty and transform-dirty chains; if only the
            // translation changed, `__translationX` fires the transform-dirty chain only.
            if (shapeOrSizeChanged) {
                this.onChangeDetection('__size');
            } else if (translationChanged) {
                this.onChangeDetection('__translationX');
            } else {
                this.markDirty();
            }
        }
    }
}
