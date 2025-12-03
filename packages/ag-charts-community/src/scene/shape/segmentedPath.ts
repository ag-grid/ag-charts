import { SceneRefChangeDetection } from 'ag-charts-core';
import type { FillOptions, LineDashOptions, StrokeOptions } from 'ag-charts-types';

import { Path } from './path';

export interface ClipRect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export interface Segment extends StrokeOptions, FillOptions, LineDashOptions {
    clipRect: ClipRect;
}

export class SegmentedPath<D = any> extends Path<D> {
    @SceneRefChangeDetection()
    segments?: Segment[];

    private readonly segmentPath = new Path();

    override drawPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
        if (!this.segments || this.segments.length === 0) {
            super.drawPath(ctx);
            return;
        }

        // Draw the gaps
        ctx.save();
        const inverse = new Path2D();
        rect(inverse, { x0: 0, y0: 0, x1: ctx.canvas.width, y1: ctx.canvas.height }, false);
        for (const s of this.segments) {
            rect(inverse, s.clipRect);
        }
        ctx.clip(inverse);
        super.drawPath(ctx);
        ctx.restore();

        // Draw the segments
        const { segmentPath } = this;
        segmentPath.setProperties({
            opacity: this.opacity,
            visible: this.visible,
            lineCap: this.lineCap,
            lineJoin: this.lineJoin,
            pointerEvents: this.pointerEvents,
        });

        for (const { clipRect, fill, stroke, ...styles } of this.segments) {
            ctx.save();

            segmentPath.path = this.path;
            segmentPath.setProperties(styles);

            segmentPath.fill = this.fill == null ? 'none' : fill;
            segmentPath.stroke = this.stroke == null ? 'none' : stroke;

            const clipPath = new Path2D();
            rect(clipPath, clipRect);
            ctx.clip(clipPath);

            segmentPath.drawPath(ctx);

            ctx.restore();
        }
    }
}

export function rect(path: Path2D, { x0, y0, x1, y1 }: ClipRect, clockwise = true) {
    const minX = Math.min(x0, x1);
    const minY = Math.min(y0, y1);
    const maxX = Math.max(x0, x1);
    const maxY = Math.max(y0, y1);

    path.moveTo(minX, minY);
    if (clockwise) {
        path.lineTo(maxX, minY);
        path.lineTo(maxX, maxY);
        path.lineTo(minX, maxY);
    } else {
        path.lineTo(minX, maxY);
        path.lineTo(maxX, maxY);
        path.lineTo(maxX, minY);
    }

    path.closePath();
}
