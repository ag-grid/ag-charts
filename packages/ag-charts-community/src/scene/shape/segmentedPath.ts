import type { FillOptions, LineDashOptions, StrokeOptions } from 'ag-charts-types';

import type { BBox } from '../bbox';
import { ExtendedPath2D } from '../extendedPath2D';
import { type RenderContext } from '../node';
import { Path } from './path';

export interface Segment extends StrokeOptions, FillOptions, LineDashOptions {
    clipRect: BBox;
}

export class SegmentedPath extends Path {
    segments: Segment[] = [];
    override render(renderCtx: RenderContext) {
        const { ctx } = renderCtx;

        ctx.save();

        try {
            // Animation clipping
            if (this.clip && !isNaN(this._clipX) && !isNaN(this._clipY)) {
                // AG-10477 avoid clipping thick lines that touch the top, bottom and left edges of the clip rect
                const margin = this.strokeWidth / 2;
                this._clipPath ??= new ExtendedPath2D();
                this._clipPath.clear();
                this._clipPath.rect(-margin, -margin, this._clipX + margin, this._clipY + margin + margin);

                ctx.clip(this._clipPath?.getPath2D());
            } else {
                this._clipPath = undefined;
            }

            // Draw the gaps
            ctx.save();
            const inverse = new Path2D();
            inverse.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
            for (const s of this.segments) {
                inverse.rect(s.clipRect.x, s.clipRect.y, s.clipRect.width, s.clipRect.height);
            }
            ctx.clip(inverse, 'evenodd');
            this.drawPath(ctx);
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
        } finally {
            ctx.restore();
            this.fillShadow?.markClean();
        }
    }
}
