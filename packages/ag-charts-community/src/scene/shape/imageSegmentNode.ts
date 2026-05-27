import type { BorderOptions } from 'ag-charts-types';

import { BBox } from '../bbox';
import { Node, type RenderContext, SceneChangeDetection } from '../node';

// Renders an inline image segment: optional background fill, optional rounded border, then the image
// itself drawn inside the padded box. Async loading is handled via the scene's ImageLoader cache —
// rendering is non-blocking and re-runs once the image decodes. The image-error warning is emitted
// once per URL by the shared handler in scene.ts.
export class ImageSegmentNode extends Node {
    @SceneChangeDetection() x: number = 0;
    @SceneChangeDetection() y: number = 0;
    @SceneChangeDetection() boxWidth: number = 0;
    @SceneChangeDetection() boxHeight: number = 0;
    @SceneChangeDetection() imageWidth: number = 0;
    @SceneChangeDetection() imageHeight: number = 0;
    @SceneChangeDetection() paddingTop: number = 0;
    @SceneChangeDetection() paddingRight: number = 0;
    @SceneChangeDetection() paddingBottom: number = 0;
    @SceneChangeDetection() paddingLeft: number = 0;
    @SceneChangeDetection() borderRadius: number = 0;
    @SceneChangeDetection() opacity: number = 1;

    url: string = '';
    backgroundFill?: string;
    border?: BorderOptions;

    override render(renderCtx: RenderContext): void {
        const { ctx } = renderCtx;
        const { x, y, boxWidth, boxHeight, borderRadius, opacity } = this;

        if (boxWidth <= 0 || boxHeight <= 0 || !this.url) {
            super.render(renderCtx);
            return;
        }

        // Multiply our own opacity into the inherited alpha so series-label fade-in
        // animations (propagated through the parent group's globalAlpha) apply to the
        // image as well as the surrounding text segments.
        const previousAlpha = ctx.globalAlpha;
        ctx.globalAlpha = previousAlpha * opacity;

        const hasBackground = !!this.backgroundFill;
        const hasBorder =
            (this.border?.enabled ?? true) && !!this.border?.stroke && (this.border?.strokeWidth ?? 0) > 0;

        if (hasBackground || hasBorder) {
            this.tracePath(ctx, x, y, boxWidth, boxHeight, borderRadius);
            if (hasBackground) {
                ctx.fillStyle = this.backgroundFill!;
                ctx.fill();
            }
            if (hasBorder) {
                ctx.strokeStyle = this.border!.stroke!;
                ctx.lineWidth = this.border!.strokeWidth!;
                ctx.stroke();
            }
        }

        const image = this.imageLoader?.loadImage(this.url, this);
        if (image) {
            const imgX = x + this.paddingLeft;
            const imgY = y + this.paddingTop;
            // SVGs declared only via viewBox have a 0-sized intrinsic box in some browsers;
            // fall back to the 4-arg drawImage form so the browser scales onto our reserved box.
            const nw = image.naturalWidth;
            const nh = image.naturalHeight;
            if (nw > 0 && nh > 0) {
                ctx.drawImage(image, 0, 0, nw, nh, imgX, imgY, this.imageWidth, this.imageHeight);
            } else {
                ctx.drawImage(image, imgX, imgY, this.imageWidth, this.imageHeight);
            }
        }

        ctx.globalAlpha = previousAlpha;
        super.render(renderCtx);
    }

    private tracePath(
        ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
    ): void {
        ctx.beginPath();
        const radius = Math.max(0, Math.min(r, w / 2, h / 2));
        if (radius === 0) {
            ctx.rect(x, y, w, h);
            return;
        }
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    protected override computeBBox(): BBox {
        return new BBox(this.x, this.y, this.boxWidth, this.boxHeight);
    }
}
