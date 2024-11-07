import { lineDistanceSquared } from '../../util/distance';
import type { DistantObject } from '../../util/nearest';
import { BBox } from '../bbox';
import type { NodeOptions, RenderContext } from '../node';
import { SceneChangeDetection } from '../node';
import { Shape } from './shape';

export class Line extends Shape implements DistantObject {
    static readonly className = 'Line';

    protected static override defaultStyles = { ...Shape.defaultStyles, fill: undefined, strokeWidth: 1 };

    constructor(opts: NodeOptions = {}) {
        super(opts);
        this.restoreOwnStyles();
    }

    @SceneChangeDetection()
    x1: number = 0;

    @SceneChangeDetection()
    y1: number = 0;

    @SceneChangeDetection()
    x2: number = 0;

    @SceneChangeDetection()
    y2: number = 0;

    set x(value: number) {
        this.x1 = value;
        this.x2 = value;
    }

    set y(value: number) {
        this.y1 = value;
        this.y2 = value;
    }

    get midPoint(): { x: number; y: number } {
        return { x: (this.x1 + this.x2) / 2, y: (this.y1 + this.y2) / 2 };
    }

    protected override computeBBox(): BBox {
        return new BBox(
            Math.min(this.x1, this.x2),
            Math.min(this.y1, this.y2),
            Math.abs(this.x2 - this.x1),
            Math.abs(this.y2 - this.y1)
        );
    }

    isPointInPath(x: number, y: number): boolean {
        if (this.x1 === this.x2 || this.y1 === this.y2) {
            return this.getBBox()
                .clone()
                .grow(this.strokeWidth / 2)
                .containsPoint(x, y);
        }
        return false;
    }

    distanceSquared(px: number, py: number): number {
        const { x1, y1, x2, y2 } = this;
        return lineDistanceSquared(px, py, x1, y1, x2, y2, Infinity);
    }

    override render(renderCtx: RenderContext) {
        const { ctx, devicePixelRatio } = renderCtx;

        let { x1, y1, x2, y2 } = this;

        // Align to the pixel grid if the line is strictly vertical
        // or horizontal (but not both, i.e. a dot).
        if (x1 === x2) {
            const { strokeWidth } = this;
            const x =
                Math.round(x1 * devicePixelRatio) / devicePixelRatio +
                (Math.trunc(strokeWidth * devicePixelRatio) % 2) / (devicePixelRatio * 2);
            x1 = x;
            x2 = x;
        } else if (y1 === y2) {
            const { strokeWidth } = this;
            const y =
                Math.round(y1 * devicePixelRatio) / devicePixelRatio +
                (Math.trunc(strokeWidth * devicePixelRatio) % 2) / (devicePixelRatio * 2);
            y1 = y;
            y2 = y;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        this.fillStroke(ctx);

        this.fillShadow?.markClean();
        super.render(renderCtx);
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible) return;

        const element = document.createElementNS('http://www.w3.org/2000/svg', 'line');

        element.setAttribute('x1', String(this.x1));
        element.setAttribute('y1', String(this.y1));
        element.setAttribute('x2', String(this.x2));
        element.setAttribute('y2', String(this.y2));
        element.setAttribute('stroke', this.stroke ?? 'none');
        element.setAttribute('stroke-opacity', String(this.strokeOpacity));
        element.setAttribute('stroke-width', String(this.strokeWidth));

        return {
            elements: [element],
        };
    }
}
