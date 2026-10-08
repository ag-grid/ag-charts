import type { LineDashOptions } from 'ag-charts-types';

import { getPath2D } from '../../dom/globalsProxy';
import { type Logger } from '../../logging/logger';
import {
    type NormalisedFillOptions,
    type NormalisedStrokeOptions,
} from '../../options/normalised/normalisedCommonOptions';
import { SceneRefChangeDetection } from '../../rendering/changeDetectable';
import { Path } from './path';

export interface ClipRect {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}

export interface Segment extends NormalisedStrokeOptions, NormalisedFillOptions, LineDashOptions {
    clipRect: ClipRect;
}

export class SegmentedPath<D = any> extends Path<D> {
    @SceneRefChangeDetection()
    segments?: Segment[];

    private readonly segmentPath = new Path();

    override drawPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, logger: Logger): void {
        if (!this.segments || this.segments.length === 0) {
            super.drawPath(ctx, logger);
            return;
        }

        // Draw the gaps
        ctx.save();
        const Path2DCtor = getPath2D();
        const inverse = new Path2DCtor();
        rect(inverse, getCanvasRect(ctx), false);
        for (const s of this.segments) {
            rect(inverse, s.clipRect);
        }
        ctx.clip(inverse);
        super.drawPath(ctx, logger);
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

            const clipPath = new Path2DCtor();
            rect(clipPath, clipRect);
            ctx.clip(clipPath);

            segmentPath.drawPath(ctx, logger);

            ctx.restore();
        }
    }
}

/**
 * The canvas of `ctx` in its current coordinates. The canvas is in device pixels, which the transform maps to logical units
 * by the pixel ratio, or, for the mask of a shadow, by a resolution below it as well.
 */
function getCanvasRect(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): ClipRect {
    const { width, height } = ctx.canvas;
    const { a, b, c, d, e, f } = ctx.getTransform();
    const det = a * d - b * c;
    if (!Number.isFinite(det) || Math.abs(det) <= Number.EPSILON) return { x0: 0, y0: 0, x1: width, y1: height };

    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [px, py] of [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
    ]) {
        const dx = px - e;
        const dy = py - f;
        const x = (d * dx - c * dy) / det;
        const y = (a * dy - b * dx) / det;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
    }
    return { x0, y0, x1, y1 };
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
