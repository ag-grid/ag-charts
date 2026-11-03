import { getPath2D } from '../dom/globalsProxy';
import { SceneRefChangeDetection } from '../rendering/changeDetectable';
import { TranslatableGroup } from './group';
import { type RenderContext } from './node';
import type { ShadowCollector } from './shadowCollector';
import { Path } from './shape/path';
import { type Segment, rect } from './shape/segmentedPath';
import { Scalable, isScalable } from './transformable';

export class SegmentedGroup extends TranslatableGroup {
    @SceneRefChangeDetection()
    segments?: Segment[] = [];

    protected override gatherShadowClips(collector: ShadowCollector) {
        const { segments } = this;
        if (segments == null || segments.length === 0) return;

        collector.pushGaps(segments.map(({ clipRect: { x0, y0, x1, y1 } }) => [x0, y0, x1, y1]));
    }

    private readonly scalablePath = new (Scalable(Path))();

    protected override renderInContext(childRenderCtx: RenderContext) {
        if (!this.visible) return;

        const { ctx } = childRenderCtx;

        if (!this.segments || this.segments?.length === 0) {
            return super.renderInContext(childRenderCtx);
        }

        // Draw the gaps
        ctx.save();
        const Path2DCtor = getPath2D();
        const inverse = new Path2DCtor();
        rect(inverse, { x0: 0, y0: 0, x1: ctx.canvas.width, y1: ctx.canvas.height }, false);
        for (const s of this.segments) {
            rect(inverse, s.clipRect);
        }
        ctx.clip(inverse);

        if (this.hasBatchedShadows()) {
            this.renderChildren(childRenderCtx);
        } else {
            for (const child of this.children()) {
                if (!child.visible) continue;
                child.render(childRenderCtx);
            }
        }
        ctx.restore();

        // Draw the segments
        const { scalablePath } = this;
        for (const { clipRect, ...styles } of this.segments) {
            ctx.save();

            const clipPath = new Path2DCtor();
            rect(clipPath, clipRect);
            ctx.clip(clipPath);

            scalablePath.setProperties(styles);

            for (const child of this.children()) {
                if (!child.visible || !(child instanceof Path)) continue;
                scalablePath.path = child.path; // needed for computing bbox for gradient fills
                scalablePath.setProperties({
                    opacity: child.opacity,
                    lineCap: child.lineCap,
                    lineJoin: child.lineJoin,
                    ...(isScalable(child) && {
                        scalingX: child.scalingX,
                        scalingY: child.scalingY,
                        scalingCenterX: child.scalingCenterX,
                        scalingCenterY: child.scalingCenterY,
                    }),
                });

                scalablePath.render(childRenderCtx);
            }

            ctx.restore();
        }
    }
}
