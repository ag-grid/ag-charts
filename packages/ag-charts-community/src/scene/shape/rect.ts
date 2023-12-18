import { Logger } from '../../sparklines-util';
import { BBox } from '../bbox';
import { Path2D } from '../path2D';
import { Path, ScenePathChangeDetection } from './path';
import { Shape } from './shape';

export class Rect extends Path {
    static override className = 'Rect';

    readonly borderPath = new Path2D();

    @ScenePathChangeDetection()
    x: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    @ScenePathChangeDetection()
    width: number = 10;

    @ScenePathChangeDetection()
    height: number = 10;

    @ScenePathChangeDetection()
    cornerRadius: number = 0;

    @ScenePathChangeDetection()
    cornerRadiusBbox?: BBox = undefined;

    /**
     * If `true`, the rect is aligned to the pixel grid for crisp looking lines.
     * Animated rects may not look nice with this option enabled, for example
     * when a rect is translated by a sub-pixel value on each frame.
     */
    @ScenePathChangeDetection()
    crisp: boolean = false;

    private borderClipPath?: Path2D;

    private lastUpdatePathStrokeWidth: number = Shape.defaultStyles.strokeWidth;

    protected override isDirtyPath() {
        if (this.lastUpdatePathStrokeWidth !== this.strokeWidth) {
            return true;
        }

        return !!(this.path.isDirty() || this.borderPath.isDirty() || this.clipPath?.isDirty());
    }

    private effectiveStrokeWidth: number = Shape.defaultStyles.strokeWidth;

    /**
     * When the rectangle's width or height is less than a pixel
     * and crisp mode is on, the rectangle will still fit into the pixel,
     * but will be less opaque to make an effect of holding less space.
     */
    protected microPixelEffectOpacity: number = 1;

    private insetCornerRadiusRect(
        path: Path2D,
        x: number,
        y: number,
        width: number,
        height: number,
        _cornerRadius: number,
        cornerRadiusBbox: BBox | undefined
    ) {
        if (_cornerRadius <= 0) {
            path.rect(x, y, width, height);
            return;
        }

        const cornerBoundsX = cornerRadiusBbox?.x ?? x;
        const cornerBoundsY = cornerRadiusBbox?.y ?? y;
        const cornerBoundsWidth = cornerRadiusBbox?.width ?? width;
        const cornerBoundsHeight = cornerRadiusBbox?.height ?? height;
        const cornerRadius = Math.min(_cornerRadius, cornerBoundsWidth / 2, cornerBoundsHeight / 2);

        const cornerInsetLeft = cornerBoundsX - x + cornerRadius;
        const cornerInsetTop = cornerBoundsY - y + cornerRadius;
        const cornerInsetRight = -(cornerBoundsX + cornerBoundsWidth - (x + width) - cornerRadius);
        const cornerInsetBottom = -(cornerBoundsY + cornerBoundsHeight - (y + height) - cornerRadius);

        if (
            cornerInsetLeft > cornerRadius ||
            cornerInsetRight > cornerRadius ||
            cornerInsetBottom > cornerRadius ||
            cornerInsetTop > cornerRadius
        ) {
            Logger.warnOnce('Corner radius bbox should contain rect bbox');
        }

        // Go round the rect clockwise, starting from the top left
        if (Math.hypot(cornerInsetLeft, cornerInsetTop) > cornerRadius) {
            const cornerBoxWidth = cornerInsetLeft;
            const cornerBoxHeight = cornerInsetTop;
            const x0 = x;
            const y0 = y + cornerBoxHeight - Math.sqrt(cornerRadius ** 2 - cornerBoxWidth ** 2);
            const x1 = x + cornerBoxWidth - Math.sqrt(cornerRadius ** 2 - cornerBoxHeight ** 2);
            const y1 = y;
            const r0 = Math.atan2(y0 - y - cornerBoxHeight, -cornerBoxWidth);
            const r1 = Math.atan2(-cornerBoxHeight, x1 - x - cornerBoxWidth);
            path.moveTo(x0, y0);
            path.arc(cornerBoundsX + cornerRadius, cornerBoundsY + cornerRadius, cornerRadius, r0, r1);
            path.lineTo(x1, y1);
        } else {
            path.moveTo(x, y);
        }

        if (Math.hypot(cornerInsetTop, cornerInsetRight) > cornerRadius) {
            const cornerBoxWidth = cornerInsetRight;
            const cornerBoxHeight = cornerInsetTop;
            const x0 = x + width - (cornerBoxWidth - Math.sqrt(cornerRadius ** 2 - cornerBoxHeight ** 2));
            const y0 = y;
            const x1 = x + width;
            const y1 = y + cornerBoxHeight - Math.sqrt(cornerRadius ** 2 - cornerBoxWidth ** 2);
            const r0 = Math.atan2(-cornerBoxHeight, cornerBoxWidth - (x + width - x0));
            const r1 = Math.atan2(-(cornerBoxHeight - (y1 - y)), cornerBoxWidth);
            path.lineTo(x0, y0);
            path.arc(
                cornerBoundsX + cornerBoundsWidth - cornerRadius,
                cornerBoundsY + cornerRadius,
                cornerRadius,
                r0,
                r1
            );
            path.lineTo(x1, y1);
        } else {
            path.lineTo(x + width, y);
        }

        if (Math.hypot(cornerInsetRight, cornerInsetBottom) > cornerRadius) {
            const cornerBoxWidth = cornerInsetRight;
            const cornerBoxHeight = cornerInsetBottom;
            const x0 = x + width;
            const y0 = y + height - (cornerBoxHeight - Math.sqrt(cornerRadius ** 2 - cornerBoxWidth ** 2));
            const x1 = x + width - (cornerBoxWidth - Math.sqrt(cornerRadius ** 2 - cornerBoxHeight ** 2));
            const y1 = y + height;
            const r0 = Math.atan2(cornerBoxHeight - (y + height - y0), cornerBoxWidth);
            const r1 = Math.atan2(cornerBoxHeight, cornerBoxWidth - (x + width - x1));
            path.lineTo(x0, y0);
            path.arc(
                cornerBoundsX + cornerBoundsWidth - cornerRadius,
                cornerBoundsY + cornerBoundsHeight - cornerRadius,
                cornerRadius,
                r0,
                r1
            );
            path.lineTo(x1, y1);
        } else {
            path.lineTo(x + width, y + height);
        }

        if (Math.hypot(cornerInsetBottom, cornerInsetLeft) > cornerRadius) {
            const cornerBoxWidth = cornerInsetLeft;
            const cornerBoxHeight = cornerInsetBottom;
            const x0 = x + cornerBoxWidth - Math.sqrt(cornerRadius ** 2 - cornerBoxHeight ** 2);
            const y0 = y + height;
            const x1 = x;
            const y1 = y + height - (cornerBoxHeight - Math.sqrt(cornerRadius ** 2 - cornerBoxWidth ** 2));
            const r0 = Math.atan2(cornerBoxHeight, -(cornerBoxWidth + (x - x0)));
            const r1 = Math.atan2(cornerBoxHeight - (y + height - y1), -cornerBoxWidth);
            path.lineTo(x0, y0);
            path.arc(
                cornerBoundsX + cornerRadius,
                cornerBoundsY + cornerBoundsHeight - cornerRadius,
                cornerRadius,
                r0,
                r1
            );
            path.lineTo(x1, y1);
        } else {
            path.lineTo(x, y + height);
        }

        path.closePath();
    }

    override updatePath() {
        const { path, borderPath, crisp } = this;
        let { x, y, width: w, height: h, strokeWidth } = this;
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const pixelSize = 1 / pixelRatio;
        let microPixelEffectOpacity = 1;

        path.clear({ trackChanges: true });
        borderPath.clear({ trackChanges: true });

        if (crisp) {
            if (w <= pixelSize) {
                microPixelEffectOpacity *= w / pixelSize;
            }
            if (h <= pixelSize) {
                microPixelEffectOpacity *= h / pixelSize;
            }
            w = this.align(x, w);
            h = this.align(y, h);
            x = this.align(x);
            y = this.align(y);
        }

        if (strokeWidth) {
            if (w < pixelSize) {
                // Too narrow, draw a vertical stroke
                const lx = x + pixelSize / 2;
                borderPath.moveTo(lx, y);
                borderPath.lineTo(lx, y + h);
                strokeWidth = pixelSize;
                this.borderClipPath = undefined;
            } else if (h < pixelSize) {
                // Too narrow, draw a horizontal stroke
                const ly = y + pixelSize / 2;
                borderPath.moveTo(x, ly);
                borderPath.lineTo(x + w, ly);
                strokeWidth = pixelSize;
                this.borderClipPath = undefined;
            } else if (strokeWidth < w && strokeWidth < h) {
                const halfStrokeWidth = strokeWidth / 2;
                x += halfStrokeWidth;
                y += halfStrokeWidth;
                w -= strokeWidth;
                h -= strokeWidth;

                // Clipping not needed in this case; fill to center of stroke.
                this.borderClipPath = undefined;
                path.rect(x, y, w, h);
                borderPath.rect(x, y, w, h);
            } else {
                // Skip the fill and just render the stroke.
                this.borderClipPath = this.borderClipPath ?? new Path2D();
                this.borderClipPath.clear({ trackChanges: true });
                this.borderClipPath.rect(x, y, w, h);
                borderPath.rect(x, y, w, h);
            }
        } else {
            // No borderPath needed, and thus no clipPath needed either. Fill to full extent of
            // Rect.
            this.borderClipPath = undefined;
            this.insetCornerRadiusRect(path, x, y, w, h, this.cornerRadius, this.cornerRadiusBbox);
        }

        this.effectiveStrokeWidth = strokeWidth;
        this.lastUpdatePathStrokeWidth = strokeWidth;
        this.microPixelEffectOpacity = microPixelEffectOpacity;
    }

    override computeBBox(): BBox {
        const { x, y, width, height } = this;
        return new BBox(x, y, width, height);
    }

    override isPointInPath(x: number, y: number): boolean {
        const point = this.transformPoint(x, y);
        const bbox = this.computeBBox();

        return bbox.containsPoint(point.x, point.y);
    }

    protected override applyFillAlpha(ctx: CanvasRenderingContext2D) {
        const { fillOpacity, microPixelEffectOpacity, opacity } = this;
        const { globalAlpha } = ctx;
        ctx.globalAlpha = globalAlpha * opacity * fillOpacity * microPixelEffectOpacity;
    }

    protected override renderStroke(ctx: CanvasRenderingContext2D) {
        const { stroke, effectiveStrokeWidth, borderPath, borderClipPath, opacity, microPixelEffectOpacity } = this;

        const borderActive = !!stroke && !!effectiveStrokeWidth;
        if (borderActive) {
            const { strokeOpacity, lineDash, lineDashOffset, lineCap, lineJoin } = this;
            if (borderClipPath) {
                // strokeWidth is larger than width or height, so use clipping to render correctly.
                // This is the simplest way to achieve the correct rendering due to nuances with ~0
                // width/height lines in Canvas operations.
                borderClipPath.draw(ctx);
                ctx.clip();
            }

            borderPath.draw(ctx);

            const { globalAlpha } = ctx;
            ctx.strokeStyle = stroke!;
            ctx.globalAlpha = globalAlpha * opacity * strokeOpacity * microPixelEffectOpacity;

            ctx.lineWidth = effectiveStrokeWidth;
            if (lineDash) {
                ctx.setLineDash(lineDash);
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

            ctx.stroke();
            ctx.globalAlpha = globalAlpha;
        }
    }
}
