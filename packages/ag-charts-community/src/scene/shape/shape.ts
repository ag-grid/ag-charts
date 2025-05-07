import { type InternalAgGradientColor, clamp, generateUUID } from 'ag-charts-core';
import type { AgImageFill, AgPatternColor } from 'ag-charts-types';

import { BBoxValues } from '../../util/bboxinterface';
import { objectsEqual } from '../../util/object';
import type { BBox } from '../bbox';
import { SceneArrayChangeDetection, SceneObjectChangeDetection, TRIPLE_EQ } from '../changeDetectable';
import type { DropShadow } from '../dropShadow';
import { ConicGradient } from '../gradient/conicGradient';
import { type ColorSpace, Gradient, type GradientParams } from '../gradient/gradient';
import { LinearGradient } from '../gradient/linearGradient';
import { RadialGradient } from '../gradient/radialGradient';
import { getColorStops } from '../gradient/stops';
import { Image } from '../image/image';
import { Node, type RenderContext, SceneChangeDetection } from '../node';
import { Pattern } from '../pattern/pattern';
import { isGradientFill, isImageFill, isPatternFill } from '../util/fill';
import { align } from '../util/pixel';

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

export type ShapeColor = string | ShapeGradientColor | AgPatternColor | AgImageFill;

export interface DefaultStyles {
    fill?: ShapeColor;
    stroke?: ShapeColor;
    strokeWidth: number;
    lineDash?: number[];
    lineDashOffset: number;
    lineCap?: ShapeLineCap;
    lineJoin?: ShapeLineJoin;
    opacity: number;
    fillShadow?: DropShadow;
}

export abstract class Shape<D = any> extends Node<D> {
    /**
     * Defaults for style properties. Note that properties that affect the position
     * and shape of the node are not considered style properties, for example:
     * `x`, `y`, `width`, `height`, `radius`, `rotation`, etc.
     * Can be used to reset to the original styling after some custom styling
     * has been applied (using the `restoreOwnStyles` method).
     * These static defaults are meant to be inherited by subclasses.
     */
    protected static readonly defaultStyles: DefaultStyles = {
        fill: 'black',
        stroke: undefined,
        strokeWidth: 0,
        lineDash: undefined,
        lineDashOffset: 0,
        lineCap: undefined,
        lineJoin: undefined,
        opacity: 1,
        fillShadow: undefined,
    };

    /**
     * Restores the default styles introduced by this subclass.
     */
    protected restoreOwnStyles() {
        const { defaultStyles } = this.constructor as typeof Shape;
        Object.assign(this, defaultStyles);
    }

    @SceneChangeDetection()
    fillOpacity: number = 1;

    @SceneChangeDetection()
    strokeOpacity: number = 1;

    @SceneObjectChangeDetection({ equals: objectsEqual, changeCb: (s: Shape) => s.onFillChange() })
    fill: ShapeColor | undefined = Shape.defaultStyles.fill;

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
    @SceneObjectChangeDetection({ equals: objectsEqual, changeCb: (s: Shape) => s.onStrokeChange() })
    stroke?: ShapeColor = Shape.defaultStyles.stroke;

    protected onStrokeChange() {
        this.strokeGradient = this.getGradient(this.stroke);
    }

    protected strokeGradient: Gradient | undefined;

    @SceneChangeDetection()
    strokeWidth: number = Shape.defaultStyles.strokeWidth;

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
    lineDash?: readonly number[] = Shape.defaultStyles.lineDash;

    @SceneChangeDetection()
    lineDashOffset: number = Shape.defaultStyles.lineDashOffset;

    @SceneChangeDetection()
    lineCap?: ShapeLineCap = Shape.defaultStyles.lineCap;

    @SceneChangeDetection()
    lineJoin?: ShapeLineJoin = Shape.defaultStyles.lineJoin;

    @SceneChangeDetection()
    miterLimit?: number = undefined;

    @SceneChangeDetection({ convertor: (v: number) => clamp(0, v, 1) })
    opacity: number = Shape.defaultStyles.opacity;

    @SceneObjectChangeDetection({ equals: TRIPLE_EQ, checkDirtyOnAssignment: true })
    fillShadow: DropShadow | undefined = Shape.defaultStyles.fillShadow;

    @SceneObjectChangeDetection({ equals: BBoxValues.equals, changeCb: (s: Shape) => s.onFillChange() })
    fillBBox?: BBox;

    @SceneObjectChangeDetection({ equals: objectsEqual, changeCb: (s: Shape) => s.onFillChange() })
    fillParams?: GradientParams;

    private cachedDefaultGradientFillBBox?: BBox;

    override preRender(renderCtx: RenderContext, thisComplexity?: number) {
        if (this.dirty) {
            this.cachedDefaultGradientFillBBox = undefined;
        }
        return super.preRender(renderCtx, thisComplexity);
    }

    protected fillStroke(ctx: CanvasContext, path?: Path2D) {
        this.renderFill(ctx, path);
        this.renderStroke(ctx, path);
    }

    protected renderFill(ctx: CanvasContext, path?: Path2D) {
        const { fill, fillImage } = this;
        if (fill && fill !== 'none') {
            const { globalAlpha } = ctx;
            if (fillImage) {
                // image pattern background fill
                ctx.globalAlpha = fillImage.backgroundFillOpacity;
                ctx.fillStyle = fillImage.backgroundFill;
                this.executeFill(ctx, path);
                ctx.globalAlpha = globalAlpha;
            }

            this.applyFillAndAlpha(ctx);
            this.applyShadow(ctx);
            this.executeFill(ctx, path);
            ctx.globalAlpha = globalAlpha;
        }
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    }

    protected executeFill(ctx: CanvasContext, path?: Path2D) {
        if (path) {
            ctx.fill(path);
        } else {
            ctx.fill();
        }
    }

    protected applyFillAndAlpha(ctx: CanvasContext) {
        const { fill, fillGradient, fillPattern, fillImage, fillOpacity, opacity } = this;

        ctx.globalAlpha *= opacity * fillOpacity;

        if (fillGradient) {
            const { fillBBox = this.getDefaultGradientFillBBox() ?? this.getBBox(), fillParams } = this;
            ctx.fillStyle = fillGradient.createGradient(ctx as any, fillBBox, fillParams) ?? 'black';
        } else if (fillPattern) {
            const { x, y } = this.getBBox();
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
            const { x, y, width, height } = this.getBBox();
            const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
            const image = fillImage.createPattern(ctx as any, pixelRatio, width, height, this);
            fillImage.setImageTransform(image, pixelRatio, x, y, width, height);
            ctx.fillStyle = image ?? 'transparent';
        } else {
            ctx.fillStyle = typeof fill === 'string' ? fill : 'black';
        }
    }

    protected applyStrokeAndAlpha(ctx: CanvasContext) {
        const { stroke, strokeOpacity, strokeGradient, opacity } = this;

        ctx.strokeStyle =
            strokeGradient?.createGradient(ctx as any, this.getBBox()) ??
            (typeof stroke === 'string' ? stroke : undefined) ??
            'black';

        ctx.globalAlpha *= opacity * strokeOpacity;
    }

    protected applyShadow(ctx: CanvasContext) {
        // The canvas context scaling (depends on the device's pixel ratio)
        // has no effect on shadows, so we have to account for the pixel ratio
        // manually here.
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const fillShadow = this.fillShadow;
        if (fillShadow?.enabled) {
            ctx.shadowColor = fillShadow.color;
            ctx.shadowOffsetX = fillShadow.xOffset * pixelRatio;
            ctx.shadowOffsetY = fillShadow.yOffset * pixelRatio;
            ctx.shadowBlur = fillShadow.blur * pixelRatio;
        }
    }

    protected renderStroke(ctx: CanvasContext & { setLineDash(lineDash: readonly number[]): void }, path?: Path2D) {
        const { stroke, strokeWidth, lineDash, lineDashOffset, lineCap, lineJoin, miterLimit } = this;
        if (stroke && strokeWidth) {
            const { globalAlpha } = ctx;
            this.applyStrokeAndAlpha(ctx);

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
        if (this.cachedDefaultGradientFillBBox == null) {
            this.cachedDefaultGradientFillBBox = Object.freeze(this.computeDefaultGradientFillBBox()) as BBox;
        }

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

            const { width, height, x, y } = this.getBBox();
            console.log(x, y);
            const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
            const pattern = this.fillImage.toSvg(width, height, pixelRatio);

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
        const { stroke, strokeOpacity, strokeWidth, lineDash, lineDashOffset } = this;
        if (stroke != null) {
            element.setAttribute('stroke', typeof stroke === 'string' ? stroke : 'none');
            element.setAttribute('stroke-opacity', String(strokeOpacity));
            element.setAttribute('stroke-width', String(strokeWidth));
        }
        if (lineDash?.some((d) => d !== 0) === true) {
            // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash#segments
            // If the number of elements in the array is odd, the elements of the array get copied and concatenated
            const svgLineDash = lineDash.length % 2 === 1 ? [...lineDash, ...lineDash] : lineDash;
            element.setAttribute('stroke-dasharray', svgLineDash.join(' '));
            element.setAttribute('stroke-dashoffset', String(lineDashOffset));
        }
    }
}
