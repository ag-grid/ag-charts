import { clamp } from '../../util/number';
import type { DropShadow } from '../dropShadow';
import { Gradient } from '../gradient/gradient';
import { LinearGradient } from '../gradient/linearGradient';
import { Node, SceneChangeDetection } from '../node';
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

interface DefaultStyles {
    fill?: string;
    stroke?: string;
    strokeWidth: number;
    lineDash?: number[];
    lineDashOffset: number;
    lineCap?: ShapeLineCap;
    lineJoin?: ShapeLineJoin;
    opacity: number;
    fillShadow?: DropShadow;
}

const LINEAR_GRADIENT_REGEXP = /^linear-gradient\((-?[\d.]+)deg,(.*?)\)$/i;

export abstract class Shape extends Node {
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
    fill?: string | Gradient = Shape.defaultStyles.fill;

    private getGradient(pattern: string | Gradient | undefined) {
        let linearGradientMatch: RegExpMatchArray | null;
        if (pattern instanceof Gradient) {
            return pattern;
        } else if (
            pattern?.startsWith('linear-gradient') &&
            (linearGradientMatch = LINEAR_GRADIENT_REGEXP.exec(pattern))
        ) {
            const angle = parseFloat(linearGradientMatch[1]);
            const colors = [];
            const colorsPart = linearGradientMatch[2];
            const colorRegex = /(#[0-9a-f]+)|(rgba?\(.+?\))|([a-z]+)/gi;
            let c: RegExpExecArray | null;
            while ((c = colorRegex.exec(colorsPart))) {
                colors.push(c[0]);
            }
            return new LinearGradient(
                'rgb',
                colors.map((color, index) => ({ color, offset: index / (colors.length - 1) })),
                angle
            );
        } else {
            return undefined;
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
        ctx.fillStyle =
            this.fillGradient?.createGradient(ctx as any, this.getBBox()) ??
            (typeof this.fill === 'string' ? this.fill : undefined) ??
            'black';
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

    override containsPoint(x: number, y: number): boolean {
        return this.isPointInPath(x, y);
    }

    abstract isPointInPath(x: number, y: number): boolean;

    protected applySvgFillAttributes(element: SVGElement) {
        const { fill, fillOpacity } = this;
        element.setAttribute('fill', typeof fill === 'string' ? fill : 'none');
        element.setAttribute('fill-opacity', String(fillOpacity));
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
