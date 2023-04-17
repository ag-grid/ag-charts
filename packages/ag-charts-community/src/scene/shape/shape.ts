import { Node, RedrawType, SceneChangeDetection } from '../node';
import { DropShadow } from '../dropShadow';
import { LinearGradient } from '../gradient/linearGradient';

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
     * Creates a light-weight instance of the given shape (that serves as a template).
     * The created instance only stores the properites set on the instance itself
     * and the rest of the properties come via the prototype chain from the template.
     * This can greatly reduce memory usage in cases where one has many similar shapes,
     * for example, circles of different size, position and color. The exact memory usage
     * reduction will depend on the size of the template and the number of own properties
     * set on its lightweight instances, but will typically be around an order of magnitude
     * or more.
     *
     * Note: template shapes are not supposed to be part of the scene graph (they should not
     * have a parent).
     *
     * @param template
     */
    static createInstance<T extends Shape>(template: T): T {
        const shape = Object.create(template);
        shape._setParent(undefined);
        shape.id = template.id + '-Instance-' + String(++template.lastInstanceId);
        return shape;
    }

    private lastInstanceId = 0;

    /**
     * Defaults for style properties. Note that properties that affect the position
     * and shape of the node are not considered style properties, for example:
     * `x`, `y`, `width`, `height`, `radius`, `rotation`, etc.
     * Can be used to reset to the original styling after some custom styling
     * has been applied (using the `restoreOwnStyles` and `restoreAllStyles` methods).
     * These static defaults are meant to be inherited by subclasses.
     */
    protected static defaultStyles = Object.assign(
        {},
        {
            fill: 'black',
            stroke: undefined,
            strokeWidth: 0,
            lineDash: undefined,
            lineDashOffset: 0,
            lineCap: undefined,
            lineJoin: undefined,
            opacity: 1,
            fillShadow: undefined,
        }
    );

    /**
     * Restores the default styles introduced by this subclass.
     */
    protected restoreOwnStyles() {
        const styles = (this.constructor as any).defaultStyles;
        const keys = Object.getOwnPropertyNames(styles);

        // getOwnPropertyNames is about 2.5 times faster than
        // for..in with the hasOwnProperty check and in this
        // case, where most properties are inherited, can be
        // more then an order of magnitude faster.
        for (let i = 0, n = keys.length; i < n; i++) {
            const key = keys[i];
            (this as any)[key] = styles[key];
        }
    }

    protected restoreAllStyles() {
        const styles = (this.constructor as any).defaultStyles;

        for (const property in styles) {
            (this as any)[property] = styles[property];
        }
    }

    /**
     * Restores the base class default styles that have been overridden by this subclass.
     */
    protected restoreOverriddenStyles() {
        const styles = (this.constructor as any).defaultStyles;
        const protoStyles = Object.getPrototypeOf(styles);

        for (const property in styles) {
            if (
                Object.prototype.hasOwnProperty.call(styles, property) &&
                Object.prototype.hasOwnProperty.call(protoStyles, property)
            ) {
                (this as any)[property] = styles[property];
            }
        }
    }

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    fillOpacity: number = 1;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    strokeOpacity: number = 1;

    @SceneChangeDetection({ redraw: RedrawType.MINOR, changeCb: (s: Shape) => s.updateGradient() })
    fill: string | undefined = Shape.defaultStyles.fill;

    protected updateGradient() {
        const { fill } = this;

        let linearGradientMatch: RegExpMatchArray | null;
        if (fill?.startsWith('linear-gradient') && (linearGradientMatch = fill.match(LINEAR_GRADIENT_REGEXP))) {
            const angle = parseFloat(linearGradientMatch[1]);
            const colors = [];
            const colorsPart = linearGradientMatch[2];
            const colorRegex = /(#[0-9a-f]+)|(rgba?\(.+?\))|([a-z]+)/gi;
            let c: RegExpExecArray | null;
            while ((c = colorRegex.exec(colorsPart))) {
                colors.push(c[0]);
            }
            this.gradient = new LinearGradient();
            this.gradient.angle = angle;
            this.gradient.stops = colors.map((color, index) => {
                const offset = index / (colors.length - 1);
                return { offset, color };
            });
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
    stroke: string | undefined = Shape.defaultStyles.stroke;

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
        if (length == undefined) {
            return alignedStart;
        }

        if (length === 0) {
            return 0;
        }

        if (length < 1) {
            // Avoid hiding crisp shapes
            return Math.ceil(length * pixelRatio) / pixelRatio;
        }

        // Account for the rounding of alignedStart by increasing length to compensate before
        // alignment.
        return Math.round((length + start) * pixelRatio) / pixelRatio - alignedStart;
    }

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineDash: number[] | undefined = Shape.defaultStyles.lineDash;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineDashOffset: number = Shape.defaultStyles.lineDashOffset;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineCap?: ShapeLineCap = Shape.defaultStyles.lineCap;

    @SceneChangeDetection({ redraw: RedrawType.MINOR })
    lineJoin?: ShapeLineJoin = Shape.defaultStyles.lineJoin;

    @SceneChangeDetection({
        redraw: RedrawType.MINOR,
        convertor: (v: number) => Math.min(1, Math.max(0, v)),
    })
    opacity: number = Shape.defaultStyles.opacity;

    @SceneChangeDetection({ redraw: RedrawType.MINOR, checkDirtyOnAssignment: true })
    fillShadow: DropShadow | undefined = Shape.defaultStyles.fillShadow;

    protected fillStroke(ctx: CanvasContext) {
        this.renderFill(ctx);
        this.renderStroke(ctx);
    }

    protected renderFill(ctx: CanvasContext) {
        if (this.fill) {
            const { globalAlpha } = ctx;
            this.applyFill(ctx);
            this.applyFillAlpha(ctx);
            this.applyShadow(ctx);
            ctx.fill();
            ctx.globalAlpha = globalAlpha;
        }
        ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    }

    protected applyFill(ctx: CanvasContext) {
        if (this.gradient) {
            ctx.fillStyle = this.gradient.createGradient(ctx as any, this.computeBBox()!);
        } else {
            ctx.fillStyle = this.fill!;
        }
    }

    protected applyFillAlpha(ctx: CanvasContext) {
        const { globalAlpha } = ctx;
        ctx.globalAlpha = globalAlpha * this.opacity * this.fillOpacity;
    }

    protected applyShadow(ctx: CanvasContext) {
        // The canvas context scaling (depends on the device's pixel ratio)
        // has no effect on shadows, so we have to account for the pixel ratio
        // manually here.
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const fillShadow = this.fillShadow;
        if (fillShadow && fillShadow.enabled) {
            ctx.shadowColor = fillShadow.color;
            ctx.shadowOffsetX = fillShadow.xOffset * pixelRatio;
            ctx.shadowOffsetY = fillShadow.yOffset * pixelRatio;
            ctx.shadowBlur = fillShadow.blur * pixelRatio;
        }
    }

    protected renderStroke(ctx: CanvasContext) {
        if (this.stroke && this.strokeWidth) {
            const { globalAlpha } = ctx;
            ctx.strokeStyle = this.stroke;
            ctx.globalAlpha = globalAlpha * this.opacity * this.strokeOpacity;

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

            ctx.stroke();
            ctx.globalAlpha = globalAlpha;
        }
    }

    containsPoint(x: number, y: number): boolean {
        return this.isPointInPath(x, y);
    }

    abstract isPointInPath(x: number, y: number): boolean;
}
