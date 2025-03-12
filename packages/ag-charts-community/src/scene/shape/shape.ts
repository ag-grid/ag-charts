<<<<<<< HEAD
=======
import { clamp } from 'ag-charts-core';
>>>>>>> 5c6aeb9e1b5105414a64810d553f5d082b85463a
import type { AgGradientFill } from 'ag-charts-types';

import { generateUUID } from '../../util/id';
import type { BBox } from '../bbox';
import type { DropShadow } from '../dropShadow';
import { ConicGradient } from '../gradient/conicGradient';
import { Gradient, type GradientParams } from '../gradient/gradient';
import { LinearGradient } from '../gradient/linearGradient';
import { RadialGradient } from '../gradient/radialGradient';
import { getColorStops } from '../gradient/stops';
import { Node, SceneChangeDetection } from '../node';
import { isGradientFill } from '../util/fill';
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

export type ShapeGradientFill = Omit<AgGradientFill, 'bounds'>;

export type ShapeFill = string | Gradient | ShapeGradientFill;

export interface DefaultStyles {
    fill?: ShapeFill;
    stroke?: string;
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

    @SceneChangeDetection({ changeCb: (s: Shape) => s.onFillChange() })
    fill: ShapeFill | undefined = Shape.defaultStyles.fill;

<<<<<<< HEAD
    private getGradient(pattern: ShapeFill | undefined) {
=======
    private getGradient(pattern: Gradient | ShapeFill | undefined) {
>>>>>>> 5c6aeb9e1b5105414a64810d553f5d082b85463a
        if (pattern instanceof Gradient) {
            return pattern;
        } else if (typeof pattern !== 'string' && pattern?.type === 'gradient') {
            return this.createGradient(pattern);
        }

        return undefined;
    }

    private createGradient(fill: ShapeGradientFill) {
        const { gradient = 'linear', colorStops, rotation = 0 } = fill;
        if (colorStops == null) return;

        const stops = getColorStops(colorStops, ['black'], [0, 1]);

        switch (gradient) {
            case 'linear':
                return new LinearGradient('rgb', stops, rotation);
            case 'radial':
                return new RadialGradient('rgb', stops);
            case 'conic':
                return new ConicGradient('rgb', stops, rotation);
        }
    }

    protected onFillChange() {
        this.fillGradient = this.getGradient(this.fill);
    }

    protected fillGradient: Gradient | undefined;

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
    @SceneChangeDetection({ changeCb: (s: Shape) => s.onStrokeChange() })
    stroke?: string | Gradient = Shape.defaultStyles.stroke;

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

    @SceneChangeDetection()
    lineDash?: number[] = Shape.defaultStyles.lineDash;

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

    @SceneChangeDetection({ checkDirtyOnAssignment: true })
    fillShadow: DropShadow | undefined = Shape.defaultStyles.fillShadow;

    @SceneChangeDetection({ changeCb: (s: Shape) => s.onFillChange() })
    fillBBox?: BBox;

    @SceneChangeDetection({ changeCb: (s: Shape) => s.onFillChange() })
    fillParams?: GradientParams;

<<<<<<< HEAD
=======
    private cachedDefaultGradientFillBBox?: BBox;

>>>>>>> 5c6aeb9e1b5105414a64810d553f5d082b85463a
    protected fillStroke(ctx: CanvasContext, path?: Path2D) {
        this.renderFill(ctx, path);
        this.renderStroke(ctx, path);
    }

    protected renderFill(ctx: CanvasContext, path?: Path2D) {
        if (this.fill) {
            const { globalAlpha } = ctx;
            this.applyFill(ctx);
            this.applyFillAlpha(ctx);
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

    protected applyFill(ctx: CanvasContext) {
<<<<<<< HEAD
        const { fill, fillGradient, fillBBox = this.getBBox(), fillParams } = this;
=======
        const { fill, fillGradient, fillBBox = this.getDefaultGradientFillBBox() ?? this.getBBox(), fillParams } = this;
>>>>>>> 5c6aeb9e1b5105414a64810d553f5d082b85463a
        const gradientFill = fillBBox ? fillGradient?.createGradient(ctx as any, fillBBox, fillParams) : undefined;
        ctx.fillStyle = gradientFill ?? (typeof fill === 'string' ? fill : undefined) ?? 'black';
    }

    protected applyStroke(ctx: CanvasContext) {
        ctx.strokeStyle =
            this.strokeGradient?.createGradient(ctx as any, this.getBBox()) ??
            (typeof this.stroke === 'string' ? this.stroke : undefined) ??
            'black';
    }

    protected applyFillAlpha(ctx: CanvasContext) {
        ctx.globalAlpha *= this.opacity * this.fillOpacity;
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

    protected renderStroke(ctx: CanvasContext, path?: Path2D) {
        if (this.stroke && this.strokeWidth) {
            const { globalAlpha } = ctx;
            this.applyStroke(ctx);
            ctx.globalAlpha *= this.opacity * this.strokeOpacity;

            ctx.lineWidth = this.strokeWidth;
            if (this.lineDash) {
                ctx.setLineDash(this.lineDash);
            }
            if (this.lineDashOffset) {
                ctx.lineDashOffset = this.lineDashOffset;
            }
            if (this.lineCap) {
                ctx.lineCap = this.lineCap;
            }
            if (this.lineJoin) {
                ctx.lineJoin = this.lineJoin;
            }
            if (this.miterLimit != null) {
                ctx.miterLimit = this.miterLimit;
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
