import { clamp } from '../../util/number';
import type { DropShadow } from '../dropShadow';
import { LinearGradient } from '../gradient/linearGradient';
import { Node, RedrawType, SceneChangeDetection } from '../node';

export type ShapeLineCap = 'butt' | 'round' | 'square';
type ShapeLineJoin = 'round' | 'bevel' | 'miter';

type CanvasContext = CanvasFillStrokeStyles &
    CanvasCompositing &
    CanvasShadowStyles &
    CanvasPathDrawingStyles &
    CanvasDrawPath;

const LINEAR_GRADIENT_REGEXP = /^linear-gradient\((.*?)deg,\s*(.*?)\s*\)$/i;

export abstract class Shape extends Node {
    /**
     * Defaults for style properties. Note that properties that affect the position
     * and shape of the node are not considered style properties, for example:
     * `x`, `y`, `width`, `height`, `radius`, `rotation`, etc.
     * Can be used to reset to the original styling after some custom styling
     * has been applied (using the `restoreOwnStyles` method).
     * These static defaults are meant to be inherited by subclasses.
     */
    protected static defaultStyles = {
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

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    fillOpacity: number = 1;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    strokeOpacity: number = 1;

    @SceneChangeDetection({ redraw: RedrawType.MINOR, changeCb: (s: Shape) => s.onFillChange() })
    fill?: string = Shape.defaultStyles.fill;

    protected onFillChange() {
        const { fill } = this;

        let linearGradientMatch: RegExpMatchArray | null;
        if (fill?.startsWith('linear-gradient') && (linearGradientMatch = LINEAR_GRADIENT_REGEXP.exec(fill))) {
            const angle = parseFloat(linearGradientMatch[1]);
            const colors = [];
            const colorsPart = linearGradientMatch[2];
            const colorRegex = /(#[0-9a-f]+)|(rgba?\(.+?\))|([a-z]+)/gi;
            let c: RegExpExecArray | null;
            while ((c = colorRegex.exec(colorsPart))) {
                colors.push(c[0]);
            }
            this.gradient = new LinearGradient(
                colors.map((color, index) => ({ color, offset: index / (colors.length - 1) })),
                angle
            );
        } else {
            this.gradient = undefined;
        }
    }

    protected gradient: LinearGradient | undefined;

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
    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    stroke?: string = Shape.defaultStyles.stroke;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    strokeWidth: number = Shape.defaultStyles.strokeWidth;

    /**
     * Returns a device-pixel aligned coordinate (or length if length is supplied).
     *
     * NOTE: Not suitable for strokes, since the stroke needs to be offset to the middle
     * of a device pixel.
     */
    align(start: number, length?: number) {
        const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;
        const alignedStart = Math.round(start * pixelRatio) / pixelRatio;

        if (length == null) {
            return alignedStart;
        } else if (length === 0) {
            return 0;
        } else if (length < 1) {
            // Avoid hiding crisp shapes
            return Math.ceil(length * pixelRatio) / pixelRatio;
        }

        // Account for the rounding of alignedStart by increasing length to compensate before alignment.
        return Math.round((length + start) * pixelRatio) / pixelRatio - alignedStart;
    }

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineDash?: number[] = Shape.defaultStyles.lineDash;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineDashOffset: number = Shape.defaultStyles.lineDashOffset;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineCap?: ShapeLineCap = Shape.defaultStyles.lineCap;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineJoin?: ShapeLineJoin = Shape.defaultStyles.lineJoin;

    @SceneChangeDetection({
        redraw: RedrawType.MINOR,
        convertor: (v: number) => clamp(0, v, 1),
    })
    opacity: number = Shape.defaultStyles.opacity;

    @SceneChangeDetection({ redraw: RedrawType.MINOR, checkDirtyOnAssignment: true })
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
            path ? ctx.fill(path) : ctx.fill();
            ctx.globalAlpha = globalAlpha;
        }
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    }

    protected applyFill(ctx: CanvasContext) {
        ctx.fillStyle = this.gradient?.createGradient(ctx as any, this.computeBBox()!) ?? this.fill!;
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
            ctx.strokeStyle = this.stroke;
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

            path ? ctx.stroke(path) : ctx.stroke();
            ctx.globalAlpha = globalAlpha;
        }
    }

    override containsPoint(x: number, y: number): boolean {
        return this.isPointInPath(x, y);
    }

    abstract isPointInPath(x: number, y: number): boolean;
}
