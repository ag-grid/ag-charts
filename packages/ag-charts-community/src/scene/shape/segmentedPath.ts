import type { FillOptions, LineDashOptions, StrokeOptions } from 'ag-charts-types';

import type { BBox } from '../bbox';
import { SceneRefChangeDetection } from '../changeDetectable';
import { Path } from './path';

export interface Segment extends StrokeOptions, FillOptions, LineDashOptions {
    clipRect: BBox;
}

export class SegmentedPath extends Path {
    @SceneRefChangeDetection()
    segments: Segment[] = [];

    override drawPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
        if (this.segments.length === 0) {
            super.drawPath(ctx);
            return;
        }

        // Draw the gaps
        ctx.save();
        const inverse = new Path2D();
        inverse.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for (const s of this.segments) {
            inverse.rect(s.clipRect.x, s.clipRect.y, s.clipRect.width, s.clipRect.height);
        }
        ctx.clip(inverse, 'evenodd');
        super.drawPath(ctx);
        ctx.restore();

        // Draw the segments
        for (const { clipRect, fill, stroke, ...styles } of this.segments) {
            ctx.save();

            const segment = new Path();
            segment.path = this.path;
            segment.fill = this.fill != null ? fill : 'none';
            segment.stroke = this.stroke != null ? stroke : 'none';
            segment.setProperties(styles);

            const clipPath = new Path2D();
            clipPath.rect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
            ctx.clip(clipPath);

            segment.drawPath(ctx);

            ctx.restore();
        }
    }
}
