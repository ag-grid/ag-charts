import type { Point } from 'ag-charts-core';
import { DeclaredSceneChangeDetection, DeclaredSceneObjectChangeDetection, Logger, TRIPLE_EQ } from 'ag-charts-core';
import type { AgMarkerShape } from 'ag-charts-types';

import { BBox } from '../../scene/bbox';
import type { ExtendedPath2D } from '../../scene/extendedPath2D';
import { type NodeOptions } from '../../scene/node';
import { Path } from '../../scene/shape/path';
import type { CanvasContext } from '../../scene/shape/shape';
import { Rotatable, Scalable, Translatable } from '../../scene/transformable';
import { align } from '../../scene/util/pixel';
import { getSharedMarkerPath } from './markerPathCache';

// Anchor lookups happen in the per-frame hot path (drawPath, computeBBox, distanceSquared,
// svgPathData). Returning shared frozen literals keeps the call allocation-free.
const PIN_ANCHOR: Point = Object.freeze({ x: 0.5, y: 1 });
const CENTRE_ANCHOR: Point = Object.freeze({ x: 0.5, y: 0.5 });

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

    /**
     * Origin-centred Path2D shared across all markers using the same `(shape, size)`. Populated
     * by {@link updatePath} from the global cache; the per-marker position is applied by
     * {@link drawPath} via `ctx.translate` rather than baked into the path geometry.
     */
    private _sharedPath?: ExtendedPath2D;

    // While drawing, fills/strokes/gradients/patterns are configured against the canvas context
    // *before* the per-marker translate is applied. Their bboxes must therefore be expressed in
    // pre-translate (origin) coordinates so they line up with the origin-centred shared path.
    // We track the active draw translation here and shift {@link getBBox} accordingly.
    private _drawTranslateActive: boolean = false;
    private _drawTranslateX: number = 0;
    private _drawTranslateY: number = 0;
    // Scratch BBoxes reused across draws to avoid per-frame allocations. Only ever read inside
    // the synchronous span of {@link drawPath}, so a single instance per marker is safe.
    private readonly _scratchFillBBox: BBox = new BBox(0, 0, 0, 0);
    private readonly _scratchDrawBBox: BBox = new BBox(0, 0, 0, 0);

    override getBBox(): BBox {
        const bbox = super.getBBox();
        if (this._drawTranslateActive) {
            const out = this._scratchDrawBBox;
            out.x = bbox.x - this._drawTranslateX;
            out.y = bbox.y - this._drawTranslateY;
            out.width = bbox.width;
            out.height = bbox.height;
            return out;
        }
        return bbox;
    }

    /**
     * Path geometry depends only on `shape` and `size` — `x` and `y` are applied as a render-time
     * translation. Treat position changes as a dirty scene but not a dirty path so the shared
     * Path2D is reused across zoom/pan frames.
     */
    override onChangeDetection(property: string): void {
        if (property === '__x' || property === '__y') {
            this.markDirty(property);
            return;
        }
        super.onChangeDetection(property);
    }

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

    /**
     * Marker geometry lives on the shared cache via {@link _sharedPath}; the inherited
     * `this.path` is unused for built-in markers. Override the complexity hook so
     * {@link Path.preRender} never lazy-allocates an unused `ExtendedPath2D` per marker.
     */
    protected override pathComplexity(): number {
        return this._sharedPath?.commands.length ?? 0;
    }

    override updatePath(): void {
        const { shape, size } = this;
        // `!(size > 0)` rather than `size <= 0` so `NaN` size is treated as no path.
        // eslint-disable-next-line sonarjs/no-inverted-boolean-check
        if (shape == null || !(size > 0)) {
            this._sharedPath = undefined;
            return;
        }
        this._sharedPath = getSharedMarkerPath(shape, size);
    }

    protected override computeBBox(): BBox {
        const { x, y, size } = this;
        const anchor = Marker.anchor(this.shape);

        return new BBox(x - size * anchor.x, y - size * anchor.y, size, size);
    }

    override drawPath(ctx: CanvasContext): void {
        if (this._sharedPath === undefined) return;

        const { shape, x, y, size } = this;
        const anchor = Marker.anchor(shape);
        const ax = x - (anchor.x - 0.5) * size;
        const ay = y - (anchor.y - 0.5) * size;
        // Apply pixel-snapping for crisp axis-aligned squares by aligning the left/top edge to
        // the device-pixel grid; with an integer `size` this leaves all four edges crisp. The
        // shared path stays pixel-ratio independent.
        const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
        const hs = size / 2;
        const tx = shape === 'square' ? align(pixelRatio, ax - hs) + hs : ax;
        const ty = shape === 'square' ? align(pixelRatio, ay - hs) + hs : ay;

        const originalFillBBox = this.__fillBBox;
        if (originalFillBBox) {
            // fillBBox bounds (e.g. axis-bounded gradients) must follow the translate to stay
            // anchored on screen.
            const shifted = this._scratchFillBBox;
            shifted.x = originalFillBBox.x - tx;
            shifted.y = originalFillBBox.y - ty;
            shifted.width = originalFillBBox.width;
            shifted.height = originalFillBBox.height;
            this.__fillBBox = shifted;
        }
        this._drawTranslateActive = true;
        this._drawTranslateX = tx;
        this._drawTranslateY = ty;

        ctx.save();
        ctx.translate(tx, ty);
        try {
            this.fillStroke(ctx, this._sharedPath.getPath2D());
        } finally {
            ctx.restore();
            this._drawTranslateActive = false;
            this.__fillBBox = originalFillBBox;
        }
    }

    override svgPathData(): string {
        if (this._sharedPath === undefined) {
            this.updatePath();
        }
        const { shape, x, y, size } = this;
        const anchor = Marker.anchor(shape);
        const ax = x - (anchor.x - 0.5) * size;
        const ay = y - (anchor.y - 0.5) * size;
        return this._sharedPath!.toSVG((px, py) => ({ x: px + ax, y: py + ay }));
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

// Lock-in: markers must use `x`/`y` for positioning, never the `Translatable` mixin's
// `translationX`/`translationY`. A previous experiment moved positioning to those fields and
// caused hit-testing and other regressions; warn (once) if anyone reaches for them again.
function installMarkerTranslationGuard(key: 'translationX' | 'translationY') {
    const proto = Marker.prototype as any;
    const descriptor = Object.getOwnPropertyDescriptor(proto, key);
    if (!descriptor?.set) return;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- intentional prototype rebinding
    const originalSet: (this: Marker, value: number) => void = descriptor.set;
    Object.defineProperty(proto, key, {
        ...descriptor,
        set(this: Marker, value: number) {
            if (value !== 0) {
                Logger.warnOnce(`Marker.${key} must not be used for positioning — assign Marker.x/y instead.`);
            }
            originalSet.call(this, value);
        },
    });
}
installMarkerTranslationGuard('translationX');
installMarkerTranslationGuard('translationY');
