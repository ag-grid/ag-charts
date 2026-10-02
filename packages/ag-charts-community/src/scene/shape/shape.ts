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
    isFiniteNumber,
    isGradientFill,
    isImageFill,
    isPatternFill,
    isString,
    objectsEqual,
} from 'ag-charts-core';
import type { Logger, NormalisedDropShadowOptions, SerializedNodeState, SerializedShapeProps } from 'ag-charts-core';
import type {
    AgDrawingMode,
    AgImageFill,
    AgPatternColor,
    CssColor,
    LineDashOptions,
    StrokeOptions,
} from 'ag-charts-types';

import type { BBox } from '../bbox';
import { ConicGradient } from '../gradient/conicGradient';
import { Gradient, type GradientParams } from '../gradient/gradient';
import { LinearGradient } from '../gradient/linearGradient';
import { RadialGradient } from '../gradient/radialGradient';
import { getColorStops } from '../gradient/stops';
import { Image } from '../image/image';
import { Node } from '../node';
import { Pattern } from '../pattern/pattern';
import { type AlignedInterval, align, alignCentre, centreSnapApplies, deviceDimension } from '../util/pixel';
import { setSvgLineDashAttributes, setSvgStrokeAttributes } from './svgUtils';

export type ShapeLineCap = 'butt' | 'round' | 'square';
export type ShapeLineJoin = 'round' | 'bevel' | 'miter';

/**
 * Which part of a shape casts its {@link Shape.fillShadow}: `fill` (default), `stroke`, or `silhouette` (both).
 * `silhouette` isn't a true union: overlapping fill and stroke shadows stack. `Path`, `Line` and `Marker` support it;
 * `Rect` and `BarShape` fall back to `fill`.
 */
export type ShapeShadowMode = 'fill' | 'stroke' | 'silhouette';

export type CanvasContext = CanvasFillStrokeStyles &
    CanvasCompositing &
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
        if (this.__drawingMode === 'cutout') {
            ctx.globalCompositeOperation = 'destination-out';
            this.executeFill(ctx, path);
            ctx.globalCompositeOperation = 'source-over';
        }

        // Without a Path2D (e.g. Line) the pre-pass can't be moved by the transform, so renderStroke shadows instead.
        if (this.__shadowMode === 'silhouette' && path != null) {
            this.renderSilhouetteShadow(ctx, logger, path, bboxOverride, fillBBoxOverride);
        }

        this.renderFill(ctx, logger, path, bboxOverride, fillBBoxOverride);
        this.renderStroke(ctx, path, bboxOverride);
    }

    /** Draws the shape off-canvas and shifts only its shadow back, so the stroke's shadow never lands on the fill. */
    private renderSilhouetteShadow(
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

        // `ctx` already has the shape's own transform, so the local bbox is taken to device space through it.
        const { a, b, c, d, e, f } = ctx.getTransform();
        const localBBox: BBox | undefined =
            bboxOverride ?? (hasLocalTransform(this) ? this.computeBBoxWithoutTransforms() : this.getBBox());
        // Without bounds, the canvas width is as far right as a shape that is on the canvas can reach.
        let maxX = canvasWidth ?? 0;
        if (localBBox != null) {
            // A miter join reaches up to `miterLimit` half-strokes past a vertex (canvas default limit is 10).
            const halfStroke = this.__strokeWidth / 2;
            const strokeReach =
                (this.__lineJoin ?? 'miter') === 'miter' ? halfStroke * (this.__miterLimit ?? 10) : halfStroke;
            const halfWidth = localBBox.width / 2 + strokeReach;
            const halfHeight = localBBox.height / 2 + strokeReach;
            const centreX = localBBox.x + localBBox.width / 2;
            const centreY = localBBox.y + localBBox.height / 2;
            const deviceCentreX = a * centreX + c * centreY + e;
            const deviceCentreY = b * centreX + d * centreY + f;
            const reachX = Math.abs(a) * halfWidth + Math.abs(c) * halfHeight;
            const reachY = Math.abs(b) * halfWidth + Math.abs(d) * halfHeight;
            const minX = deviceCentreX - reachX;
            maxX = deviceCentreX + reachX;

            if (canvasWidth != null && canvasHeight != null) {
                // The visible blur extends to about 1.5 × `blur`.
                const blurReach = reach * 1.5;
                const offCanvas =
                    maxX + shadowX + blurReach < 0 ||
                    minX + shadowX - blurReach > canvasWidth ||
                    deviceCentreY + reachY + shadowY + blurReach < 0 ||
                    deviceCentreY - reachY + shadowY - blurReach > canvasHeight;
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

        ctx.restore();
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
            const shadowed = this.__shadowMode === 'fill' && this.__fillShadow?.enabled === true;
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
            const mode = this.__shadowMode;
            const shadowed =
                (mode === 'stroke' || (mode === 'silhouette' && path == null)) && this.__fillShadow?.enabled === true;
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
