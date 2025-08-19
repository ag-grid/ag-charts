import { SceneRefChangeDetection } from './changeDetectable';
import { TranslatableGroup } from './group';
import { type RenderContext } from './node';
import { Path } from './shape/path';
import type { Segment } from './shape/segmentedPath';

export class SegmentedGroup extends TranslatableGroup {
    @SceneRefChangeDetection()
    segments?: Segment[] = [];

    protected override renderInContext(childRenderCtx: RenderContext) {
        const { ctx } = childRenderCtx;

        if (!this.segments || this.segments?.length === 0) {
            return super.renderInContext(childRenderCtx);
        }

        // Draw the gaps
        ctx.save();
        const inverse = new Path2D();
        inverse.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for (const s of this.segments) {
            inverse.rect(s.clipRect.x, s.clipRect.y, s.clipRect.width, s.clipRect.height);
        }
        ctx.clip(inverse, 'evenodd');

        for (const child of this.children()) {
            if (!child.visible) continue;
            child.render(childRenderCtx);
        }
        ctx.restore();

        // Draw the segments
        const segment = new Path();
        for (const { clipRect, ...styles } of this.segments) {
            ctx.save();

            const clipPath = new Path2D();
            clipPath.rect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
            ctx.clip(clipPath);

            segment.setProperties(styles);

            for (const child of this.children()) {
                if (!child.visible || !(child instanceof Path)) continue;
                segment.setProperties({
                    opacity: child.opacity,
                    lineCap: child.lineCap,
                    lineJoin: child.lineJoin,
                    pointerEvents: child.pointerEvents,
                });

                segment.drawPath(ctx, child.path.getPath2D());
            }

            ctx.restore();
        }
    }
}
