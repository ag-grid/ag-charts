import type {
    AlignedInterval,
    ColorSpace,
    InternalAgGradientColor,
    Logger,
    NormalisedDropShadowOptions,
    SerializedNodeState,
    SerializedShapeProps,
} from 'ag-charts-core';
import {
    Color,
    DeclaredSceneChangeDetection,
    DeclaredSceneObjectChangeDetection,
    SceneArrayChangeDetection,
    SceneObjectChangeDetection,
    TRIPLE_EQ,
    align,
    alignCentre,
    boxesEqual,
    centreSnapApplies,
    clamp,
    deviceDimension,
    generateUUID,
    isFiniteNumber,
    isGradientFill,
    isImageFill,
    isPatternFill,
    isString,
    objectsEqual,
    setSvgLineDashAttributes,
    setSvgStrokeAttributes,
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
import { getSpreadCanvas } from '../canvas/spreadCanvas';
import { ConicGradient } from '../gradient/conicGradient';
import { Gradient, type GradientParams } from '../gradient/gradient';
import { LinearGradient } from '../gradient/linearGradient';
import { RadialGradient } from '../gradient/radialGradient';
import { getColorStops } from '../gradient/stops';
import { Image } from '../image/image';
import { Node } from '../node';
import { Pattern } from '../pattern/pattern';
import { shadowPass } from '../shadowPass';

export type ShapeLineCap = 'butt' | 'round' | 'square';
export type ShapeLineJoin = 'round' | 'bevel' | 'miter';

/** Half the width of the region, in a shape's own units, that a shadow mask clips a fill out of its dilation within. */
const KNOCK_OUT_EXTENT = 1e6;

/**
 * The miter limit of the stroke that dilates a shape for its shadow `spread`. Right angles keep their sharp corners,
 * like a CSS `box-shadow` spread, while acute vertices are bevelled instead of spiking out.
 */
const DILATION_MITER_LIMIT = 2;

/** The alpha of a plain colour, which a shadow cast from an opaque copy of the shape has to follow. */
function colourAlpha(colour: unknown): number {
    if (!isString(colour)) return 1;
    try {
        return Color.fromString(colour).a;
    } catch {
        return 1;
    }
}

function paintAlpha(colour: unknown, opacity: unknown = 1): number {
    if (colour == null) return 0;
    return colourAlpha(colour) * (typeof opacity === 'number' ? opacity : 1);
}

/**
 * The most that a fill can contribute to a shadow mask: the alpha of a colour, the strongest stop of a gradient and the
 * strongest part of a pattern. Anything else (e.g. an image) counts as opaque, because it can't be told without drawing.
 */
function maxFillAlpha(fill: unknown): number {
    if (typeof fill !== 'object' || fill == null) return colourAlpha(fill);

    const paint = fill as Record<string, any>;
    if (paint.type === 'gradient' && Array.isArray(paint.colorStops)) {
        return Math.max(0, ...paint.colorStops.map((stop: { color?: unknown }) => colourAlpha(stop?.color)));
    }
    if (paint.type === 'pattern') {
        return Math.max(
            paint.fill == null ? 1 : paintAlpha(paint.fill, paint.fillOpacity),
            paintAlpha(paint.backgroundFill, paint.backgroundFillOpacity),
            paintAlpha(paint.stroke, paint.strokeOpacity)
        );
    }
    return 1;
}

interface SpreadBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    canvasWidth?: number;
    canvasHeight?: number;
    shadowX: number;
    shadowY: number;
    blur: number;
}

/** The device-space bounds of the shape whose spread shadow is being drawn, reused to avoid a per-shape allocation. */
const spreadBounds: SpreadBounds = {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    canvasWidth: undefined,
    canvasHeight: undefined,
    shadowX: 0,
    shadowY: 0,
    blur: 0,
};

/** The region of the layer that the spread shadow being drawn needs, reused to avoid a per-shape allocation. */
const spreadRegion = { x: 0, y: 0, width: 0, height: 0, maxWidth: 0, maxHeight: 0 };

/**
 * Sets the region of the layer that a spread shadow has to draw: only the part of the silhouette whose shadow can land
 * on the canvas. Returns false when there is none.
 */
function setSpreadRegion(): boolean {
    const { minX, minY, maxX, maxY, canvasWidth, canvasHeight, shadowX, shadowY, blur } = spreadBounds;
    const blurReach = Math.ceil(blur * 1.5);
    const left = Math.floor(canvasWidth == null ? minX : Math.max(minX, -shadowX - blurReach));
    const top = Math.floor(canvasHeight == null ? minY : Math.max(minY, -shadowY - blurReach));
    const right = Math.ceil(canvasWidth == null ? maxX : Math.min(maxX, canvasWidth - shadowX + blurReach));
    const bottom = Math.ceil(canvasHeight == null ? maxY : Math.min(maxY, canvasHeight - shadowY + blurReach));
    // Not capped to the canvas: the region can be `2 × blurReach` larger, so the blurred edge falls off the canvas.
    const width = right - left;
    const height = bottom - top;
    if (!(isFiniteNumber(width) && isFiniteNumber(height) && width > 0 && height > 0)) return false;

    spreadRegion.x = left;
    spreadRegion.y = top;
    spreadRegion.width = width;
    spreadRegion.height = height;
    // The region never exceeds the canvas plus the blur margin on each side, so that is the largest scratch canvas needed.
    spreadRegion.maxWidth = canvasWidth == null ? width : canvasWidth + 2 * blurReach;
    spreadRegion.maxHeight = canvasHeight == null ? height : canvasHeight + 2 * blurReach;
    return true;
}

/**
 * Which part of a shape casts its {@link Shape.fillShadow}: `fill` (default), `stroke`, or `silhouette` (both).
 * `silhouette` isn't a true union: overlapping fill and stroke shadows stack. `Path`, `Line` and `Marker` support it;
 * `Rect` and `BarShape` fall back to `fill`.
 */
export type ShapeShadowMode = 'fill' | 'stroke' | 'silhouette';

export type CanvasContext = CanvasFillStrokeStyles &
    CanvasCompositing &
    CanvasDrawImage &
    CanvasShadowStyles &
    CanvasPathDrawingStyles &
    CanvasDrawPath &
    CanvasPath &
    CanvasTransform &
    CanvasState;

function hasCanvas(ctx: CanvasContext): ctx is CanvasContext & { canvas: { width: number; height: number } } {
    return 'canvas' in ctx;
}

/** Nodes with their own transform matrix, whose `getBBox()` is in parent space rather than the space they draw in. */
function hasLocalTransform(node: Node): node is Node & { computeBBoxWithoutTransforms(): BBox | undefined } {
    return 'computeBBoxWithoutTransforms' in node;
}

export type ShapeGradientColor = Omit<InternalAgGradientColor, 'bounds'> & { colorSpace?: ColorSpace };

export type ShapeColor = CssColor | ShapeGradientColor | AgPatternColor | AgImageFill;

type SvgAttributes = StrokeOptions & LineDashOptions;

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

    /** The alpha of {@link _alphaFill}, so a spread shadow doesn't re-parse an unchanged fill on every render. */
    private _alphaFill?: ShapeColor;
    private _fillAlpha: number = 1;
    private getFillAlpha(fill: ShapeColor): number {
        if (fill !== this._alphaFill) {
            this._alphaFill = fill;
            this._fillAlpha = colourAlpha(fill);
        }
        return this._fillAlpha;
    }

    /** The alpha of {@link _alphaStroke}, cached like {@link _fillAlpha}. */
    private _alphaStroke?: ShapeColor;
    private _strokeAlpha: number = 1;
    private getStrokeAlpha(stroke: ShapeColor | undefined): number {
        if (stroke !== this._alphaStroke) {
            this._alphaStroke = stroke;
            this._strokeAlpha = colourAlpha(stroke);
        }
        return this._strokeAlpha;
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

    /**
     * Device-pixel aligns an edge-pair while preserving its centre. See {@link alignCentre}.
     */
    alignCentre(start: number, length: number, out?: AlignedInterval) {
        return alignCentre(this.layerManager?.canvas?.pixelRatio ?? 1, start, length, out);
    }

    /** Whether {@link alignCentre} centre-snaps a bar of this length rather than edge-snapping it. */
    centreSnapApplies(length: number) {
        return centreSnapApplies(this.layerManager?.canvas?.pixelRatio ?? 1, length);
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

    @SceneObjectChangeDetection({ equals: TRIPLE_EQ })
    fillShadow: NormalisedDropShadowOptions | undefined;
    declare __fillShadow: NormalisedDropShadowOptions | undefined; // optimised field accessor

    @DeclaredSceneChangeDetection({ changeCb: (s: Shape) => s.onShadowModeChange() })
    shadowMode: ShapeShadowMode = 'fill';
    declare __shadowMode: ShapeShadowMode; // optimised field accessor

    /** How much wider than the shape the spread shadow's stroke is drawn. Zero except while that stroke is drawn. */
    protected shadowStrokeGrowth: number = 0;

    /** Lets a shape that can't honour every {@link ShapeShadowMode} fall back to a supported one. */
    protected onShadowModeChange() {
        // Nothing to do by default.
    }

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

    protected fillStroke(
        ctx: CanvasContext,
        logger: Logger,
        path?: Path2D,
        bboxOverride?: BBox,
        fillBBoxOverride?: BBox
    ) {
        if (shadowPass.state === 'mask') {
            this.renderShadowMask(ctx, logger, path, bboxOverride, fillBBoxOverride);
            return;
        }

        if (this.__drawingMode === 'cutout') {
            ctx.globalCompositeOperation = 'destination-out';
            this.executeFill(ctx, path);
            ctx.globalCompositeOperation = 'source-over';
        }

        if (path != null && this.castsShadowFromPrePass()) {
            this.renderShadowPrePass(ctx, logger, path, bboxOverride, fillBBoxOverride);
        }

        this.renderFill(ctx, logger, path, bboxOverride, fillBBoxOverride);
        this.renderStroke(ctx, path, bboxOverride);
    }

    /**
     * Whether the shadow is cast by the off-canvas pre-pass rather than inline with the fill or stroke. That is the
     * `silhouette` mode, and any mode with a `spread`, which has to dilate a copy of the shape. Without a Path2D
     * (e.g. Line) the pre-pass can't be moved by the transform, so the stroke casts the shadow inline instead.
     */
    private castsShadowFromPrePass(): boolean {
        const shadow = this.__fillShadow;
        if (!this.castsOwnShadow() || shadow == null) return false;
        return this.__shadowMode === 'silhouette' || (shadow.spread ?? 0) > 0;
    }

    /** False while a layer shadow batch casts the shadow for this shape, instead of the shape itself. */
    private castsOwnShadow(): boolean {
        return shadowPass.state === 'none' && this.__fillShadow?.enabled === true;
    }

    /** True while the shape is drawing into a layer shadow batch's mask, where {@link renderSilhouetteExtras} is drawn. */
    protected isDrawingShadowMask(): boolean {
        return shadowPass.state === 'mask';
    }

    /**
     * Draws the silhouette that casts this shape's shadow into the scratch canvas of a layer shadow batch, which blurs
     * the silhouettes of the whole batch once. The silhouette is drawn with the shape's real paint, so a fully
     * transparent gradient, pattern or stroke casts nothing, and a translucent one casts a weaker shadow. A `spread`
     * dilates it with a solid stroke in the same paint. Strokes cast only in the `stroke` and `silhouette` modes.
     */
    private renderShadowMask(
        ctx: CanvasContext,
        logger: Logger,
        path?: Path2D,
        bboxOverride?: BBox,
        fillBBoxOverride?: BBox
    ) {
        const shadow = this.__fillShadow;
        if (shadow?.enabled !== true) return;

        const spread = shadow.spread ?? 0;
        const { __fill: fill, __fillOpacity: fillOpacity = 1, __shadowMode: mode } = this;
        // A fill with no alpha casts nothing, so it must not knock the dilation of a stroke out below.
        const drawsFill =
            mode !== 'stroke' && fill != null && fill !== 'none' && fillOpacity > 0 && maxFillAlpha(fill) > 0;
        // A transparent stroke colour casts nothing, so it must not take the place of the fill's dilation below.
        const drawsStroke = mode !== 'fill' && this.hasVisibleStroke() && this.getStrokeAlpha(this.__stroke) > 0;
        const hasExtras = mode !== 'fill' && this.getSilhouetteExtrasOpacity() > 0;

        if (spread > 0) {
            // The dilation is always solid, and an open stroke is capped so that its ends spread too.
            const lineCap = this.__lineCap;
            let dilationCap: ShapeLineCap = lineCap == null || lineCap === 'butt' ? 'square' : lineCap;
            if (mode === 'fill') dilationCap = 'round';
            ctx.lineCap = dilationCap;
            ctx.lineJoin = drawsStroke ? (this.__lineJoin ?? 'miter') : 'miter';
            ctx.miterLimit = drawsStroke ? (this.__miterLimit ?? 10) : DILATION_MITER_LIMIT;
            ctx.lineWidth = (drawsStroke ? this.__strokeWidth : 0) + spread * 2;
        }

        if (drawsFill) {
            this.renderFill(ctx, logger, path, bboxOverride, fillBBoxOverride);
        }

        if (spread <= 0) {
            if (drawsStroke) {
                this.renderStroke(ctx, path, bboxOverride);
            }
        } else if (drawsStroke) {
            const globalAlpha = ctx.globalAlpha;
            const dilatesInFillPaint = drawsFill && path != null;
            if (dilatesInFillPaint) {
                this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
                ctx.strokeStyle = ctx.fillStyle;
            } else {
                this.applyStrokeAndAlpha(ctx, bboxOverride);
            }
            this.shadowStrokeGrowth = spread * 2;
            ctx.save();
            try {
                // A shape with a fill casts as strongly as the fill, and so does the dilation of its stroke. It is also
                // knocked out of the fill, so that a translucent paint casts a uniform shadow, as it does without a
                // batch, instead of a darker one where the two overlap.
                if (dilatesInFillPaint) this.clipOutsideFill(ctx, path);
                this.executeStroke(ctx, path);
            } finally {
                this.shadowStrokeGrowth = 0;
                ctx.restore();
            }
            ctx.globalAlpha = globalAlpha;
        } else if (drawsFill && path != null) {
            const globalAlpha = ctx.globalAlpha;
            this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
            ctx.strokeStyle = ctx.fillStyle;
            // Knock the fill out of the dilation, so that a translucent fill casts a uniform shadow, as it does
            // without a batch, instead of a darker one where the dilation overlaps its own edge.
            ctx.save();
            try {
                this.clipOutsideFill(ctx, path);
                this.dilateFill(ctx, path);
            } finally {
                ctx.restore();
            }
            ctx.globalAlpha = globalAlpha;
        }

        if (hasExtras) {
            const globalAlpha = ctx.globalAlpha;
            ctx.save();
            try {
                if (spread > 0) {
                    // The dilation covers the extras themselves, so they are not also drawn at their own width, which would
                    // darken a translucent paint down their middle. They are as strong as `renderSilhouetteExtras` draws them.
                    // A shape whose extras have a paint of their own sets it in `dilateSilhouetteExtras`.
                    this.applyStrokeAndAlpha(ctx, bboxOverride);
                    ctx.globalAlpha = globalAlpha * this.getSilhouetteExtrasOpacity();
                    this.dilateSilhouetteExtras(ctx, spread * 2);
                } else {
                    this.renderSilhouetteExtras(ctx);
                }
            } finally {
                ctx.restore();
            }
        }
    }

    /**
     * Clips the context to what is outside the path, so that nothing drawn after it covers the fill. A shape's Path2D is
     * edited in place, so the clip can't be cached against it.
     */
    private clipOutsideFill(ctx: CanvasContext, path: Path2D) {
        const outside = new Path2D();
        outside.rect(-KNOCK_OUT_EXTENT, -KNOCK_OUT_EXTENT, KNOCK_OUT_EXTENT * 2, KNOCK_OUT_EXTENT * 2);
        outside.addPath(path);
        ctx.clip(outside, 'evenodd');
    }

    /** True when the shape paints a stroke, which {@link renderStroke} skips otherwise. */
    private hasVisibleStroke(): boolean {
        const { __stroke: stroke, __strokeWidth: strokeWidth = 0, __strokeOpacity: strokeOpacity = 1 } = this;
        return stroke != null && stroke !== 'none' && strokeWidth > 0 && strokeOpacity > 0;
    }

    /** How far the pre-pass's strokes reach past the shape's bounds, in the shape's own units. */
    private getShadowStrokeReach(spread: number): number {
        const fillOnly = this.__shadowMode === 'fill';
        const halfStroke = (fillOnly ? 0 : this.getSilhouetteStrokeWidth() / 2) + spread;
        // A miter join reaches up to `miterLimit` half-strokes past a vertex (canvas default limit is 10).
        const miterLimit = fillOnly ? DILATION_MITER_LIMIT : (this.__miterLimit ?? 10);
        const joinReach = fillOnly || (this.__lineJoin ?? 'miter') === 'miter' ? halfStroke * miterLimit : halfStroke;
        // A square cap reaches a half-stroke along the diagonal. A spread dilation caps its open strokes too.
        const squareCap = spread > 0 || (!fillOnly && this.__lineCap === 'square');
        return squareCap ? Math.max(joinReach, halfStroke * Math.SQRT2) : joinReach;
    }

    /** Draws the shape off-canvas and shifts only its shadow back, so the stroke's shadow never lands on the fill. */
    private renderShadowPrePass(
        ctx: CanvasContext,
        logger: Logger,
        path: Path2D,
        bboxOverride?: BBox,
        fillBBoxOverride?: BBox
    ) {
        const { __fillShadow: shadow, __fill: fill, __fillOpacity: fillOpacity = 1 } = this;
        if (shadow?.enabled !== true) return;

        const layerCanvas = this.layerManager?.canvas;
        const pixelRatio = layerCanvas?.pixelRatio ?? 1;
        let canvasWidth: number | undefined;
        let canvasHeight: number | undefined;
        if (layerCanvas != null) {
            canvasWidth = deviceDimension(pixelRatio, layerCanvas.width);
            canvasHeight = deviceDimension(pixelRatio, layerCanvas.height);
        } else if (hasCanvas(ctx)) {
            canvasWidth = ctx.canvas.width;
            canvasHeight = ctx.canvas.height;
        }
        const reach = shadow.blur * pixelRatio;
        const shadowX = shadow.xOffset * pixelRatio;
        const shadowY = shadow.yOffset * pixelRatio;
        const spread = shadow.spread ?? 0;

        // `ctx` already has the shape's own transform, so the local bbox is taken to device space through it.
        const matrix = ctx.getTransform();
        const { a, b, c, d, e, f } = matrix;
        const localBBox: BBox | undefined =
            bboxOverride ?? (hasLocalTransform(this) ? this.computeBBoxWithoutTransforms() : this.getBBox());
        // Without bounds, the canvas width plus the dilation is as far right as a shape on the canvas can reach.
        let minX = 0;
        let minY = 0;
        let maxX = (canvasWidth ?? 0) + spread * pixelRatio;
        let maxY = canvasHeight ?? 0;
        if (localBBox != null) {
            const strokeReach = this.getShadowStrokeReach(spread);
            const halfWidth = localBBox.width / 2 + strokeReach;
            const halfHeight = localBBox.height / 2 + strokeReach;
            const centreX = localBBox.x + localBBox.width / 2;
            const centreY = localBBox.y + localBBox.height / 2;
            const deviceCentreX = a * centreX + c * centreY + e;
            const deviceCentreY = b * centreX + d * centreY + f;
            // A crisp shape can snap up to a device pixel past its bounds, so pad it even without a stroke. That is
            // a device pixel whatever the shape's own transform, so it is added after the bounds are transformed.
            const crispPad = this.isCrisp() ? 1 : 0;
            const reachX = Math.abs(a) * halfWidth + Math.abs(c) * halfHeight + crispPad;
            const reachY = Math.abs(b) * halfWidth + Math.abs(d) * halfHeight + crispPad;
            minX = deviceCentreX - reachX;
            maxX = deviceCentreX + reachX;
            minY = deviceCentreY - reachY;
            maxY = deviceCentreY + reachY;

            if (canvasWidth != null && canvasHeight != null) {
                // The visible blur extends to about 1.5 × `blur`.
                const blurReach = reach * 1.5;
                const offCanvas =
                    maxX + shadowX + blurReach < 0 ||
                    minX + shadowX - blurReach > canvasWidth ||
                    maxY + shadowY + blurReach < 0 ||
                    minY + shadowY - blurReach > canvasHeight;
                if (offCanvas) return;
            }
        }

        // The source copy is never blurred; `reach` is only slack to keep it clear of the left edge.
        const distance = Math.max(0, Math.ceil(maxX + reach));
        if (
            !isFiniteNumber(reach) ||
            !isFiniteNumber(distance) ||
            !isFiniteNumber(shadowX) ||
            !isFiniteNumber(shadowY)
        ) {
            return;
        }

        if (spread > 0) {
            spreadBounds.minX = minX;
            spreadBounds.minY = minY;
            spreadBounds.maxX = maxX;
            spreadBounds.maxY = maxY;
            spreadBounds.canvasWidth = canvasWidth;
            spreadBounds.canvasHeight = canvasHeight;
            spreadBounds.shadowX = shadowX;
            spreadBounds.shadowY = shadowY;
            spreadBounds.blur = reach;
            if (setSpreadRegion()) {
                this.castSpreadShadow(ctx, logger, path, matrix, spread, distance, bboxOverride, fillBBoxOverride);
            }
            return;
        }

        ctx.save();
        ctx.setTransform(a, b, c, d, e - distance, f);
        this.applyShadow(ctx);
        ctx.shadowOffsetX += distance;

        if (fill != null && fill !== 'none' && fillOpacity > 0) {
            const globalAlpha = ctx.globalAlpha;
            this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
            this.executeFill(ctx, path);
            ctx.globalAlpha = globalAlpha;
        }
        this.renderStroke(ctx, path, bboxOverride);
        this.renderSilhouetteExtras(ctx);

        ctx.restore();
    }

    /**
     * Draws the shape, dilated by `spread`, opaque into the layer's scratch canvas, then blits that off-canvas so that
     * a single draw casts the shadow. Two draws (fill, then a stroke) would stack their shadows where they overlap.
     */
    private castSpreadShadow(
        ctx: CanvasContext,
        logger: Logger,
        path: Path2D,
        matrix: DOMMatrix,
        spread: number,
        distance: number,
        bboxOverride?: BBox,
        fillBBoxOverride?: BBox
    ) {
        const { __fill: fill, __fillOpacity: fillOpacity = 1, __shadowMode: mode } = this;
        const { x, y, width, height, maxWidth, maxHeight } = spreadRegion;

        const fillAlpha =
            mode === 'stroke' || fill == null || fill === 'none' || fillOpacity <= 0 ? 0 : this.getFillAlpha(fill);
        const drawsFill = fillAlpha > 0;
        // A transparent stroke colour casts nothing, so it must not suppress the extras' shadow below.
        const strokeAlpha = mode !== 'fill' && this.hasVisibleStroke() ? this.getStrokeAlpha(this.__stroke) : 0;
        const drawsStroke = strokeAlpha > 0;
        const extrasOpacity = mode === 'fill' ? 0 : this.getSilhouetteExtrasOpacity();
        if (!drawsFill && !drawsStroke && extrasOpacity <= 0) return;

        // The shadow is as strong as what casts it, as it is without a spread.
        const globalAlpha = ctx.globalAlpha;
        let strength = 1;
        if (drawsFill) {
            this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
            strength = fillAlpha;
        } else if (drawsStroke) {
            this.applyStrokeAndAlpha(ctx, bboxOverride);
            strength = strokeAlpha;
        } else {
            strength = extrasOpacity * (this.__opacity ?? 1);
        }
        strength *= ctx.globalAlpha;
        ctx.globalAlpha = globalAlpha;
        if (strength <= 0) return;

        const { canvas, context: scratch } = getSpreadCanvas(ctx, width, height, maxWidth, maxHeight);
        scratch.setTransform(1, 0, 0, 1, 0, 0);
        scratch.clearRect(0, 0, width, height);
        scratch.save();
        scratch.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e - x, matrix.f - y);
        scratch.fillStyle = '#000';
        scratch.strokeStyle = '#000';

        // The dilation is always solid, and an open stroke is capped so that its ends spread too.
        const lineCap = this.__lineCap;
        if (mode === 'fill') {
            scratch.lineCap = 'round';
        } else {
            scratch.lineCap = lineCap == null || lineCap === 'butt' ? 'square' : lineCap;
        }
        scratch.lineJoin = drawsStroke ? (this.__lineJoin ?? 'miter') : 'miter';
        scratch.miterLimit = drawsStroke ? (this.__miterLimit ?? 10) : DILATION_MITER_LIMIT;
        scratch.lineWidth = (drawsStroke ? this.__strokeWidth : 0) + spread * 2;

        if (drawsFill) {
            this.executeFill(scratch, path);
        }
        if (drawsStroke) {
            this.shadowStrokeGrowth = spread * 2;
            try {
                this.executeStroke(scratch, path);
            } finally {
                this.shadowStrokeGrowth = 0;
            }
        } else if (drawsFill) {
            this.dilateFill(scratch, path);
        }
        if (mode !== 'fill') {
            this.dilateSilhouetteExtras(scratch, spread * 2);
        }
        scratch.restore();

        ctx.save();
        ctx.resetTransform();
        this.applyShadow(ctx);
        ctx.shadowOffsetX += distance;
        ctx.globalAlpha = strength;
        ctx.drawImage(canvas, 0, 0, width, height, x - distance, y, width, height);
        ctx.restore();
    }

    /** Strokes the filled geometry as a solid line, to dilate it. Open subpaths the fill does not paint are skipped. */
    protected dilateFill(ctx: CanvasContext, path: Path2D) {
        ctx.stroke(path);
    }

    /** Draws strokes the shape paints apart from its main path, so the silhouette pre-pass casts them too. */
    protected renderSilhouetteExtras(_ctx: CanvasContext) {
        // Nothing to do by default.
    }

    /** Strokes the paths the shape paints apart from its main one as a solid line `growth` wider, to dilate the shadow. */
    protected dilateSilhouetteExtras(_ctx: CanvasContext, _growth: number) {
        // Nothing to do by default.
    }

    /** The opacity the shape strokes its extra paths with, or 0 when it paints none, so they cast no shadow. */
    protected getSilhouetteExtrasOpacity(): number {
        return 0;
    }

    /** Whether the shape snaps its geometry to the device pixel grid, which can move it up to a pixel past its bounds. */
    protected isCrisp(): boolean {
        return false;
    }

    /** The widest stroke cast into the silhouette shadow, which the shape's off-canvas pre-pass has to clear. */
    protected getSilhouetteStrokeWidth(): number {
        return this.__strokeWidth;
    }

    protected renderFill(
        ctx: CanvasContext,
        logger: Logger,
        path?: Path2D,
        bboxOverride?: BBox,
        fillBBoxOverride?: BBox
    ) {
        const { __fill: fill, __fillOpacity: fillOpacity = 1, fillImage } = this;
        if (fill != null && fill !== 'none' && fillOpacity > 0) {
            const globalAlpha = ctx.globalAlpha;
            if (fillImage) {
                // image pattern background fill
                ctx.globalAlpha = fillImage.backgroundFillOpacity;
                ctx.fillStyle = fillImage.backgroundFill;
                this.executeFill(ctx, path);
                ctx.globalAlpha = globalAlpha;
            }

            this.applyFillAndAlpha(ctx, logger, bboxOverride, fillBBoxOverride);
            const shadowed =
                this.__shadowMode === 'fill' &&
                this.castsOwnShadow() &&
                (path == null || !this.castsShadowFromPrePass());
            if (shadowed) {
                this.applyShadow(ctx);
            }
            this.executeFill(ctx, path);
            ctx.globalAlpha = globalAlpha;
            if (shadowed) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0)';
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

    protected applyFillAndAlpha(ctx: CanvasContext, logger: Logger, bboxOverride?: BBox, fillBBoxOverride?: BBox) {
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
            const pattern = fillPattern.createPattern(ctx as any, pixelRatio, logger);
            fillPattern.setPatternTransform(pattern, pixelRatio, x, y);
            if (pattern) {
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = fillPattern.fill;
                ctx.globalAlpha *= fillPattern.fillOpacity;
            }
        } else if (fillImage) {
            const bbox = bboxOverride ?? this.getBBox();
            const image = fillImage.createPattern(ctx as any, bbox.width, bbox.height, this, logger);
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
        } = this;
        if (stroke != null && stroke !== 'none' && strokeWidth > 0 && strokeOpacity > 0) {
            const { globalAlpha } = ctx;
            this.applyStrokeAndAlpha(ctx, bboxOverride);

            ctx.lineWidth = strokeWidth;
            if (lineDash) {
                ctx.setLineDash(lineDash);
            }
            if (lineDashOffset !== 0) {
                ctx.lineDashOffset = lineDashOffset;
            }
            if (lineCap != null) {
                ctx.lineCap = lineCap;
            }
            if (lineJoin != null) {
                ctx.lineJoin = lineJoin;
            }
            if (miterLimit != null) {
                ctx.miterLimit = miterLimit;
            }

            // Silhouette mode without a Path2D has no pre-pass, so the stroke casts the shadow.
            const shadowed =
                this.__shadowMode !== 'fill' &&
                this.castsOwnShadow() &&
                (path == null || !this.castsShadowFromPrePass());
            if (shadowed) {
                this.applyShadow(ctx);
            }
            this.executeStroke(ctx, path);
            ctx.globalAlpha = globalAlpha;
            if (shadowed) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            }
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
