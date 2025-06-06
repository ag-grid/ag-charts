import type { BBox } from './bbox';
import { Group } from './group';
import { type RenderContext, SceneChangeDetection } from './node';
import { Path } from './shape/path';

export class ShapeOutlineGroup extends Group {
    @SceneChangeDetection()
    strokeWidth: number = 4;

    @SceneChangeDetection()
    outset: number = 1;

    constructor() {
        super();
        this.renderToOffscreenCanvas = true;
        this.optimizeForInfrequentRedraws = true;
    }

    protected override computeBBox(): BBox | undefined {
        const bbox = super.computeBBox();
        bbox?.grow(this.strokeWidth + this.outset);
        return bbox;
    }

    protected override renderInContext(childRenderCtx: RenderContext) {
        const { strokeWidth, outset } = this;
        const { ctx } = childRenderCtx;

        ctx.save();

        try {
            ctx.lineWidth = (strokeWidth + outset) * 2;
            ctx.lineJoin = 'miter';

            let subtractPath: Path2D | undefined;
            for (const child of this.children()) {
                if (!(child.visible && child instanceof Path)) continue;

                const { path, fill } = child;
                const path2d = path.getPath2D();
                if (subtractPath == null) {
                    subtractPath = path2d;
                } else {
                    subtractPath.addPath(path2d);
                }

                ctx.strokeStyle = typeof fill === 'string' ? fill : 'black';
                ctx.stroke(path2d);
            }

            if (subtractPath != null) {
                ctx.globalCompositeOperation = 'destination-out';

                if (outset > 0) {
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = outset * 2;
                    ctx.stroke(subtractPath);
                }

                ctx.fillStyle = 'black';
                ctx.fill(subtractPath);
            }
        } finally {
            ctx.restore();
        }
    }
}
