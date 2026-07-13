import {
    type ColorSpace,
    DeclaredSceneChangeDetection,
    DeclaredSceneObjectChangeDetection,
    type InternalAgGradientColor,
    SceneArrayChangeDetection,
    SceneObjectChangeDetection,
    TRIPLE_EQ,
    boxesEqual,
    clamp,
    generateUUID,
    getOffscreenCanvas,
    isGradientFill,
    isImageFill,
    isPatternFill,
    isString,
    objectsEqual,
} from 'ag-charts-core';
import type {
    AgDrawingMode,
    AgImageFill,
    AgPatternColor,
    CssColor,
    LineDashOptions,
    StrokeOptions,
} from 'ag-charts-types';

import type { BBox } from '../bbox';
import type { DropShadow } from '../dropShadow';
import { ConicGradient } from '../gradient/conicGradient';
import { Gradient, type GradientParams } from '../gradient/gradient';
import { LinearGradient } from '../gradient/linearGradient';
import { RadialGradient } from '../gradient/radialGradient';
import { getColorStops } from '../gradient/stops';
import { Image } from '../image/image';
import type { SerializedNodeState, SerializedShapeProps } from '../node';
import { Node } from '../node';
import { Pattern } from '../pattern/pattern';
import { align } from '../util/pixel';
import { setSvgLineDashAttributes, setSvgStrokeAttributes } from './svgUtils';

export type ShapeLineCap = 'butt' | 'round' | 'square';
export type ShapeLineJoin = 'round' | 'bevel' | 'miter';

export type CanvasContext = CanvasFillStrokeStyles &
    CanvasCompositing &
    CanvasShadowStyles &
    CanvasPathDrawingStyles &
    CanvasDrawPath &
    CanvasPath &
    CanvasTransform &
    CanvasState;

export type ShapeGradientColor = Omit<InternalAgGradientColor, 'bounds'> & { colorSpace?: ColorSpace };

export type ShapeColor = CssColor | ShapeGradientColor | AgPatternColor | AgImageFill;

type SvgAttributes = StrokeOptions & LineDashOptions;

type SilhouetteContext = CanvasContext & { setLineDash(lineDash: readonly number[]): void };
type ShadowLayerContext = CanvasContext & CanvasDrawImage & { canvas: { width: number; height: number } };

/**
 * Distance the shadow-casting silhouette is drawn off-canvas so only its shadow — offset back
 * by the same amount — lands on the canvas. Kept far outside any realistic canvas extent.
 */
const SPREAD_SHADOW_OFFSET = 100_000;

export abstract class Shape<TDatum = unknown> extends Node<TDatum> {
    @DeclaredSceneChangeDetection()
    drawingMode: AgDrawingMode = 'overlay';
    declare __drawingMode: AgDrawingMode; // optimised field accessor

    @DeclaredSceneChangeDetection()
    fillOpacity: number = 1;
    declare __fillOpacity: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    strokeOpacity: number = 1;
    declare __strokeOpacity: number; // optimised field accessor

    @DeclaredSceneObjectChangeDetection({
        equals: objectsEqual,
        changeCb: Shape.handleFillChange,
    })
    fill: ShapeColor | undefined = 'black';
    declare __fill: ShapeColor | undefined; // optimised field accessor

    private getGradient(fill: ShapeColor | undefined) {
        if (isGradientFill(fill)) return this.createGradient(fill);
    }

    private createGradient(fill: ShapeGradientColor) {
        const { colorSpace = 'rgb', gradient = 'linear', colorStops, rotation = 0, reverse = false } = fill;
        if (colorStops == null) return;

        let stops = getColorStops(colorStops, ['black'], [0, 1]);
        if (reverse) {
            stops = stops.map((s) => ({ color: s.color, stop: 1 - s.stop })).reverse();
        }

        switch (gradient) {
            case 'linear':
                return new LinearGradient(colorSpace, stops, rotation);
            case 'radial':
                return new RadialGradient(colorSpace, stops);
            case 'conic':
                return new ConicGradient(colorSpace, stops, rotation);
        }
    }

    private getPattern(fill: ShapeColor | undefined) {
        if (isPatternFill(fill)) return this.createPattern(fill);
    }

    private createPattern(fill: AgPatternColor) {
        return new Pattern(fill);
    }

    private getImage(fill: ShapeColor | undefined) {
        if (isImageFill(fill)) return this.createImage(fill);
    }

    private createImage(fill: AgImageFill) {
        return new Image(this.imageLoader, fill);
    }

    private _cachedFill?: ShapeColor;
    protected onFillChange() {
        if (typeof this.fill === 'object') {
            if (objectsEqual(this._cachedFill ?? {}, this.fill)) {
                return;
            }
        }

        this.fillGradient = this.getGradient(this.fill);
        this.fillPattern = this.getPattern(this.fill);
        this.fillImage = this.getImage(this.fill);
        this._cachedFill = this.fill;
    }

    protected fillGradient: Gradient | undefined;
    protected fillPattern: Pattern | undefined;
    protected fillImage: Image | undefined;

    /**
     * Note that `strokeStyle = null` means invisible stroke,
     * while `lineWidth = 0` means no stroke, and sometimes this can mean different things.
     * For example, a rect shape with an invisible stroke may not align to the pixel grid
     * properly because the stroke affects the rules of alignment, and arc shapes forming
     * a pie chart will have a gap between them if they have an invisible stroke, whereas
     * there would be not gap if there was no stroke at all.
     * The preferred way of making the stroke invisible is setting the `lineWidth` to zero,
     * unless specific looks that is achieved by having an invisible stroke is desired.
     */
    @SceneObjectChangeDetection({ equals: objectsEqual, changeCb: Shape.handleStrokeChange })
    stroke?: ShapeColor;
    declare __stroke: ShapeColor | undefined; // optimised field accessor

    protected onStrokeChange() {
        this.strokeGradient = this.getGradient(this.stroke);
    }

    protected strokeGradient?: Gradient;

    @DeclaredSceneChangeDetection()
    strokeWidth: number = 0;
    declare __strokeWidth: number; // optimised field accessor

    /**
     * Returns a device-pixel aligned coordinate (or length if length is supplied).
     *
     * NOTE: Not suitable for strokes, since the stroke needs to be offset to the middle
     * of a device pixel.
     */
    align(start: number, length?: number) {
        return align(this.layerManager?.canvas?.pixelRatio ?? 1, start, length);
    }

    @SceneArrayChangeDetection()
    lineDash?: readonly number[];
    declare __lineDash: readonly number[] | undefined; // optimised field accessor

    @DeclaredSceneChangeDetection()
    lineDashOffset: number = 0;
    declare __lineDashOffset: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    lineCap?: ShapeLineCap;
    declare __lineCap: ShapeLineCap | undefined; // optimised field accessor

    @DeclaredSceneChangeDetection()
    lineJoin?: ShapeLineJoin;
    declare __lineJoin: ShapeLineJoin | undefined; // optimised field accessor

    @DeclaredSceneChangeDetection()
    miterLimit?: number;
    declare __miterLimit: number | undefined; // optimised field accessor

    @DeclaredSceneChangeDetection({ convertor: (v: number) => clamp(0, v ?? 1, 1) })
    opacity: number = 1;
    declare __opacity: number; // optimised field accessor

    /** Every concrete shape must declare which {@link SerializedNodeState} variant it serialises as. */
    abstract override serialize(): SerializedNodeState;

    protected override serializeProps(): SerializedShapeProps {
        return {
            ...super.serializeProps(),
            opacity: this.opacity,
            drawingMode: this.drawingMode,
            hasFill: this.fill != null,
            hasStroke: this.stroke != null,
        };
    }

    @SceneObjectChangeDetection({ equals: TRIPLE_EQ, checkDirtyOnAssignment: true })
    fillShadow: DropShadow | undefined;
    declare __fillShadow: DropShadow | undefined; // optimised field accessor

    @SceneObjectChangeDetection({ equals: TRIPLE_EQ, checkDirtyOnAssignment: true })
    strokeShadow: DropShadow | undefined;
    declare __strokeShadow: DropShadow | undefined; // optimised field accessor

    @DeclaredSceneObjectChangeDetection({ equals: boxesEqual, changeCb: (s) => s.onFillChange() })
    fillBBox?: BBox;
    declare __fillBBox: BBox | undefined; // optimised field accessor

    @DeclaredSceneObjectChangeDetection({ equals: objectsEqual, changeCb: (s) => s.onFillChange() })
    fillParams?: GradientParams;
    declare __fillParams: GradientParams | undefined; // optimised field accessor

    private cachedDefaultGradientFillBBox?: BBox;

    override markDirty(property?: string): void {
        super.markDirty(property);
        this.cachedDefaultGradientFillBBox = undefined;
    }

    protected fillStroke(ctx: CanvasContext, path?: Path2D, bboxOverride?: BBox, fillBBoxOverride?: BBox) {
        if (this.__drawingMode === 'cutout') {
            ctx.globalCompositeOperation = 'destination-out';
            this.executeFill(ctx, path);
            ctx.globalCompositeOperation = 'source-over';
        }

        this.renderFill(ctx, path, bboxOverride, fillBBoxOverride);
        this.renderStroke(ctx, path, bboxOverride);
    }

    protected renderFill(ctx: CanvasContext, path?: Path2D, bboxOverride?: BBox, fillBBoxOverride?: BBox) {
        const { __fill: fill, __fillOpacity: fillOpacity = 1, fillImage, __fillShadow: fillShadow } = this;
        if (fill != null && fill !== 'none' && fillOpacity > 0) {
            const globalAlpha = ctx.globalAlpha;
            if (fillImage) {
                // image pattern background fill
                ctx.globalAlpha = fillImage.backgroundFillOpacity;
                ctx.fillStyle = fillImage.backgroundFill;
                this.executeFill(ctx, path);
                ctx.globalAlpha = globalAlpha;
            }

            this.applyFillAndAlpha(ctx, bboxOverride, fillBBoxOverride);

            if (fillShadow?.enabled && fillShadow.spread !== 0) {
                this.castSpreadShadow(ctx, fillShadow, (silhouetteCtx) =>
                    this.drawSpreadFillSilhouette(silhouetteCtx, path, fillShadow.spread)
                );
                this.executeFill(ctx, path);
                ctx.globalAlpha = globalAlpha;
            } else {
                this.applyShadow(ctx);
                this.executeFill(ctx, path);
                ctx.globalAlpha = globalAlpha;
                if (fillShadow?.enabled) {
                    ctx.shadowColor = 'rgba(0, 0, 0, 0)';
                }
            }
        }
    }

    protected executeFill(ctx: CanvasContext, path?: Path2D) {
        if (path) {
            ctx.fill(path);
        } else {
            ctx.fill();
        }
    }

    protected applyFillAndAlpha(ctx: CanvasContext, bboxOverride?: BBox, fillBBoxOverride?: BBox) {
        const {
            __fill: fill,
            fillGradient,
            fillPattern,
            fillImage,
            __fillOpacity: fillOpacity = 1,
            __opacity: opacity = 1,
        } = this;

        const combinedOpacity = opacity * fillOpacity;
        if (combinedOpacity !== 1) {
            ctx.globalAlpha *= combinedOpacity;
        }

        if (fillGradient) {
            const fillBBox =
                fillBBoxOverride ??
                this.fillBBox ??
                this.getDefaultGradientFillBBox() ??
                bboxOverride ??
                this.getBBox();
            const { fillParams } = this;
            ctx.fillStyle = fillGradient.createGradient(ctx as any, fillBBox, fillParams) ?? 'black';
        } else if (fillPattern) {
            const { x, y } = bboxOverride ?? this.getBBox();
            const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
            const pattern = fillPattern.createPattern(ctx as any, pixelRatio);
            fillPattern.setPatternTransform(pattern, pixelRatio, x, y);
            if (pattern) {
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = fillPattern.fill;
                ctx.globalAlpha *= fillPattern.fillOpacity;
            }
        } else if (fillImage) {
            const bbox = bboxOverride ?? this.getBBox();
            const image = fillImage.createPattern(ctx as any, bbox.width, bbox.height, this);
            fillImage.setImageTransform(image, bbox);
            ctx.fillStyle = image ?? 'transparent';
        } else {
            ctx.fillStyle = typeof fill === 'string' ? fill : 'black';
        }
    }

    protected applyStrokeAndAlpha(ctx: CanvasContext, bboxOverride?: BBox) {
        const { __stroke: stroke, __strokeOpacity: strokeOpacity = 1, strokeGradient, __opacity: opacity = 1 } = this;

        ctx.strokeStyle =
            strokeGradient?.createGradient(ctx as any, bboxOverride ?? this.getBBox()) ??
            (typeof stroke === 'string' ? stroke : undefined) ??
            'black';

        const combinedOpacity = opacity * strokeOpacity;
        if (combinedOpacity !== 1) {
            ctx.globalAlpha *= combinedOpacity;
        }
    }

    protected applyShadow(ctx: CanvasContext) {
        // The canvas context scaling (depends on the device's pixel ratio)
        // has no effect on shadows, so we have to account for the pixel ratio
        // manually here.
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const { __fillShadow: fillShadow } = this;
        if (fillShadow?.enabled) {
            ctx.shadowColor = fillShadow.color;
            ctx.shadowOffsetX = fillShadow.xOffset * pixelRatio;
            ctx.shadowOffsetY = fillShadow.yOffset * pixelRatio;
            ctx.shadowBlur = fillShadow.blur * pixelRatio;
        }
    }

    /**
     * Casts a shadow from a dilated silhouette without that silhouette painting on-canvas.
     * Canvas 2D has no `shadowSpread`, so the silhouette is drawn opaque into an off-screen
     * layer, then a single shadow is cast from it far off-canvas and offset back into place.
     */
    protected castSpreadShadow(
        ctx: CanvasContext,
        shadow: DropShadow,
        drawSilhouette: (silhouetteCtx: SilhouetteContext) => void
    ) {
        const shadowCtx = ctx as ShadowLayerContext;
        const { canvas } = shadowCtx;
        const OffscreenCanvasCtor = getOffscreenCanvas();
        const layer = new OffscreenCanvasCtor(canvas.width, canvas.height);
        const layerCtx = layer.getContext('2d') as SilhouetteContext | null;
        if (layerCtx == null) return;

        layerCtx.setTransform(shadowCtx.getTransform());
        layerCtx.fillStyle = 'black';
        layerCtx.strokeStyle = 'black';
        drawSilhouette(layerCtx);

        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        shadowCtx.save();
        shadowCtx.setTransform(1, 0, 0, 1, 0, 0);
        shadowCtx.shadowColor = shadow.color;
        shadowCtx.shadowBlur = shadow.blur * pixelRatio;
        shadowCtx.shadowOffsetX = shadow.xOffset * pixelRatio + SPREAD_SHADOW_OFFSET;
        shadowCtx.shadowOffsetY = shadow.yOffset * pixelRatio + SPREAD_SHADOW_OFFSET;
        shadowCtx.drawImage(layer, -SPREAD_SHADOW_OFFSET, -SPREAD_SHADOW_OFFSET);
        shadowCtx.restore();
    }

    /**
     * Draws the dilated fill silhouette (opaque) whose shadow becomes the `spread` shadow. The
     * generic implementation fattens the outline with a round-joined stroke; primitives with
     * parametric geometry (e.g. `Rect`) override this for an exact silhouette that also contracts
     * on negative spread.
     */
    protected drawSpreadFillSilhouette(ctx: SilhouetteContext, path: Path2D | undefined, spread: number) {
        if (path == null) return;
        ctx.fill(path);
        if (spread > 0) {
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.lineWidth = 2 * spread;
            ctx.stroke(path);
        }
    }

    /** Silhouette path for casting a stroke shadow when the caller supplies no explicit path
     *  (e.g. `Line`, which strokes an inline context path). */
    protected strokeSilhouettePath(): Path2D | undefined {
        return undefined;
    }

    protected castStrokeShadow(
        ctx: SilhouetteContext,
        shadow: DropShadow,
        path: Path2D | undefined,
        strokeWidth: number,
        lineDash: readonly number[] | undefined,
        lineCap: ShapeLineCap | undefined,
        lineJoin: ShapeLineJoin | undefined
    ) {
        if (path == null) return;
        const shadowStrokeWidth = Math.max(strokeWidth + 2 * shadow.spread, 0);
        if (shadowStrokeWidth <= 0) return;
        this.castSpreadShadow(ctx, shadow, (silhouetteCtx) => {
            silhouetteCtx.lineWidth = shadowStrokeWidth;
            if (lineDash) silhouetteCtx.setLineDash(lineDash);
            if (lineCap) silhouetteCtx.lineCap = lineCap;
            if (lineJoin) silhouetteCtx.lineJoin = lineJoin;
            silhouetteCtx.stroke(path);
        });
    }

    protected renderStroke(
        ctx: CanvasContext & { setLineDash(lineDash: readonly number[]): void },
        path?: Path2D,
        bboxOverride?: BBox
    ) {
        const {
            __stroke: stroke,
            __strokeWidth: strokeWidth = 0,
            __strokeOpacity: strokeOpacity = 1,
            __lineDash: lineDash,
            __lineDashOffset: lineDashOffset,
            __lineCap: lineCap,
            __lineJoin: lineJoin,
            __miterLimit: miterLimit,
            __strokeShadow: strokeShadow,
        } = this;
        if (stroke != null && stroke !== 'none' && strokeWidth > 0 && strokeOpacity > 0) {
            const { globalAlpha } = ctx;
            this.applyStrokeAndAlpha(ctx, bboxOverride);

            ctx.lineWidth = strokeWidth;
            if (lineDash) {
                ctx.setLineDash(lineDash);
            }
            if (lineDashOffset) {
                ctx.lineDashOffset = lineDashOffset;
            }
            if (lineCap) {
                ctx.lineCap = lineCap;
            }
            if (lineJoin) {
                ctx.lineJoin = lineJoin;
            }
            if (miterLimit != null) {
                ctx.miterLimit = miterLimit;
            }

            if (strokeShadow?.enabled) {
                this.castStrokeShadow(
                    ctx,
                    strokeShadow,
                    path ?? this.strokeSilhouettePath(),
                    strokeWidth,
                    lineDash,
                    lineCap,
                    lineJoin
                );
            }

            this.executeStroke(ctx, path);
            ctx.globalAlpha = globalAlpha;
        }
    }

    protected executeStroke(ctx: CanvasContext, path?: Path2D) {
        if (path) {
            ctx.stroke(path);
        } else {
            ctx.stroke();
        }
    }

    getDefaultGradientFillBBox(): BBox {
        this.cachedDefaultGradientFillBBox ??= Object.freeze(this.computeDefaultGradientFillBBox()) as BBox;
        return this.cachedDefaultGradientFillBBox;
    }

    protected computeDefaultGradientFillBBox(): BBox | undefined {
        return;
    }

    override containsPoint(x: number, y: number): boolean {
        return this.isPointInPath(x, y);
    }

    abstract isPointInPath(x: number, y: number): boolean;

    protected applySvgFillAttributes(element: SVGElement, defs?: SVGElement[]) {
        const { fill, fillOpacity } = this;

        if (typeof fill === 'string') {
            element.setAttribute('fill', fill);
        } else if (isGradientFill(fill) && this.fillGradient) {
            defs ??= [];

            const gradient = this.fillGradient.toSvg(this.fillBBox ?? this.getBBox());

            const id = generateUUID();
            gradient.setAttribute('id', id);

            defs.push(gradient);

            element.setAttribute('fill', `url(#${id})`);
        } else if (isPatternFill(fill) && this.fillPattern) {
            defs ??= [];

            const pattern = this.fillPattern.toSvg();

            const id = generateUUID();
            pattern.setAttribute('id', id);

            defs.push(pattern);

            element.setAttribute('fill', `url(#${id})`);
        } else if (isImageFill(fill) && this.fillImage) {
            defs ??= [];

            const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
            const pattern = this.fillImage.toSvg(this.getBBox(), pixelRatio);

            const id = generateUUID();
            pattern.setAttribute('id', id);

            defs.push(pattern);

            element.setAttribute('fill', `url(#${id})`);
        } else {
            element.setAttribute('fill', 'none');
        }

        element.setAttribute('fill-opacity', String(fillOpacity));

        return defs;
    }

    protected applySvgStrokeAttributes(element: SVGElement) {
        const { stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = this as SvgAttributes;
        setSvgStrokeAttributes(element, { stroke: isString(stroke) ? stroke : undefined, strokeOpacity, strokeWidth });
        setSvgLineDashAttributes(element, { lineDash, lineDashOffset });
    }

    private static handleFillChange(this: void, shape: Shape): void {
        shape.onFillChange();
    }

    private static handleStrokeChange(this: void, shape: Shape): void {
        shape.onStrokeChange();
    }

    /**
     * Sets style properties on the shape, optimizing by writing directly to __ prefix fields
     * where possible to avoid setter overhead.
     */
    setStyleProperties(
        style?: Partial<
            Pick<
                Shape,
                | 'fill'
                | 'fillOpacity'
                | 'stroke'
                | 'strokeOpacity'
                | 'strokeWidth'
                | 'lineDash'
                | 'lineDashOffset'
                | 'opacity'
            >
        >,
        fillBBox?: { series: BBox; axis: BBox },
        fillParams?: GradientParams
    ): void {
        // Opacity is managed by animation - so don't set it on the shape
        const opacity = style?.opacity ?? 1;
        const fill = style?.fill;

        // Write directly to __ prefix fields for fields with @DeclaredSceneChangeDetection/@SceneArrayChangeDetection
        // to avoid setter overhead. Fields with change callbacks (fill, stroke, fillBBox, fillParams) must use setters.
        const computedFillOpacity = (style?.fillOpacity ?? 1) * opacity;
        const computedStrokeOpacity = (style?.strokeOpacity ?? 1) * opacity;
        const computedStrokeWidth = style?.strokeWidth ?? 0;
        const computedLineDashOffset = style?.lineDashOffset ?? 0;

        let hasDirectChanges = false;
        if (this.__fillOpacity !== computedFillOpacity) {
            this.__fillOpacity = computedFillOpacity;
            hasDirectChanges = true;
        }
        if (this.__strokeOpacity !== computedStrokeOpacity) {
            this.__strokeOpacity = computedStrokeOpacity;
            hasDirectChanges = true;
        }
        if (this.__strokeWidth !== computedStrokeWidth) {
            this.__strokeWidth = computedStrokeWidth;
            hasDirectChanges = true;
        }
        if (this.__lineDashOffset !== computedLineDashOffset) {
            this.__lineDashOffset = computedLineDashOffset;
            hasDirectChanges = true;
        }
        if (this.__lineDash !== style?.lineDash) {
            this.__lineDash = style?.lineDash;
            hasDirectChanges = true;
        }

        // fillBBox and fillParams are decorated (@SceneObjectChangeDetection), so we need to use setters
        // to trigger their change callbacks (onFillChange)
        this.setFillProperties(fill, fillBBox, fillParams);
        if (fill !== this.fill) {
            this.fill = fill;
        }
        if (style?.stroke !== this.stroke) {
            this.stroke = style?.stroke;
        }

        // Ensure node is marked dirty if direct field writes changed values
        if (hasDirectChanges) {
            this.markDirty();
        }
    }

    /**
     * Sets fill-related properties (fillBBox and fillParams) on the shape.
     * Used for gradient fills that need bounding box information.
     */
    setFillProperties(
        fill: ShapeColor | undefined,
        fillBBox?: { series: BBox; axis: BBox },
        fillParams?: GradientParams
    ): void {
        const computedFillBBox =
            fillBBox == null || !isGradientFill(fill) || fill.bounds == null || fill.bounds === 'item'
                ? undefined
                : fillBBox[fill.bounds];

        let hasDirectChanges = false;
        if (this.__fillBBox !== computedFillBBox) {
            this.__fillBBox = computedFillBBox;
            hasDirectChanges = true;
        }
        if (this.__fillParams !== fillParams) {
            this.__fillParams = fillParams;
            hasDirectChanges = true;
        }

        if (hasDirectChanges) {
            this.onFillChange();
            this.markDirty();
        }
    }
}
