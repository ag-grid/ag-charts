import { BBox } from '../bbox';
import type { NodeOptions, RenderContext } from '../node';
import { SceneChangeDetection } from '../node';
import { Shape } from './shape';

export class Range<D = any> extends Shape<D> {
    static override readonly className = 'Range';

    constructor(opts: NodeOptions = {}) {
        super(opts);
        this.strokeWidth = 1;
    }

    @SceneChangeDetection()
    x1: number = 0;

    @SceneChangeDetection()
    y1: number = 0;

    @SceneChangeDetection()
    x2: number = 0;

    @SceneChangeDetection()
    y2: number = 0;

    @SceneChangeDetection()
    startLine: boolean = false;

    @SceneChangeDetection()
    endLine: boolean = false;

    @SceneChangeDetection()
    horizontal: boolean = false;

    protected override computeBBox(): BBox {
        return new BBox(this.x1, this.y1, this.x2 - this.x1, this.y2 - this.y1);
    }

    isPointInPath(_x: number, _y: number): boolean {
        return false;
    }

    override render(renderCtx: RenderContext) {
        const { ctx } = renderCtx;

        let { x1, y1, x2, y2 } = this;

        x1 = this.align(x1);
        y1 = this.align(y1);
        x2 = this.align(x2);
        y2 = this.align(y2);

        const { fill, horizontal } = this;

        const { globalAlpha } = ctx;

        if (fill != null) {
            this.applyFillAndAlpha(ctx);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x1, y2);
            ctx.closePath();

            ctx.fill();

            ctx.globalAlpha = globalAlpha;
        }

        const { stroke, strokeWidth, startLine, endLine } = this;
        const strokeActive = !!((startLine || endLine) && stroke && strokeWidth);

        if (strokeActive) {
            const { lineDash, lineDashOffset, lineCap, lineJoin } = this;

            this.applyStrokeAndAlpha(ctx);

            ctx.lineWidth = strokeWidth;
            if (lineDash) {
                ctx.setLineDash([...lineDash]);
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

            ctx.beginPath();

            if (startLine) {
                ctx.moveTo(x1, y1);
                if (horizontal) {
                    ctx.lineTo(x1, y2);
                } else {
                    ctx.lineTo(x2, y1);
                }
            }

            if (endLine) {
                ctx.moveTo(x2, y2);
                if (horizontal) {
                    ctx.lineTo(x2, y1);
                } else {
                    ctx.lineTo(x1, y2);
                }
            }

            ctx.stroke();

            ctx.globalAlpha = globalAlpha;
        }

        this.fillShadow?.markClean();
        super.render(renderCtx);
    }
}
