import { lineDistanceSquared } from '../../util/distance';
import type { DistantObject } from '../../util/nearest';
import { BBox } from '../bbox';
import type { NodeOptions, RenderContext } from '../node';
import { RedrawType, SceneChangeDetection } from '../node';
import { Shape } from './shape';

export class Line extends Shape implements DistantObject {
    static readonly className = 'Line';

    protected static override defaultStyles = Object.assign({}, Shape.defaultStyles, {
        fill: undefined,
        strokeWidth: 1,
    });

    constructor(opts: NodeOptions = {}) {
        super(opts);
        this.restoreOwnStyles();
    }

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    x1: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    y1: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    x2: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    y2: number = 0;

    set x(value: number) {
        this.x1 = value;
        this.x2 = value;
    }

    set y(value: number) {
        this.y1 = value;
        this.y2 = value;
    }

    override computeBBox(): BBox {
        return new BBox(
            Math.min(this.x1, this.x2),
            Math.min(this.y1, this.y2),
            Math.abs(this.x2 - this.x1),
            Math.abs(this.y2 - this.y1)
        );
    }

    isPointInPath(px: number, py: number): boolean {
        if (this.x1 === this.x2 || this.y1 === this.y2) {
            const { x, y } = this.transformPoint(px, py);
            return this.computeBBox()
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
        const { ctx, forceRender, stats, devicePixelRatio } = renderCtx;

        if (this.dirty === RedrawType.NONE && !forceRender) {
            if (stats) stats.nodesSkipped += this.nodeCount.count;
            return;
        }

        this.computeTransformMatrix();
        this.matrix.toContext(ctx);

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
}
