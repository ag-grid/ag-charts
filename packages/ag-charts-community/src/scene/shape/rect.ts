import { BBox } from '../bbox';
import { Path2D } from '../path2D';
import { Path, ScenePathChangeDetection } from './path';
import { Shape } from './shape';

type Corner = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    cx: number;
    cy: number;
};

const cornerEdges = (
    leadingEdge: number,
    trailingEdge: number,
    leadingInset: number,
    trailingInset: number,
    cornerRadius: number
) => {
    let leadingClipped = false;
    let trailingClipped = false;
    let leading0 = trailingInset - Math.sqrt(cornerRadius ** 2 - leadingInset ** 2);
    let leading1 = 0;
    let trailing0 = 0;
    let trailing1 = leadingInset - Math.sqrt(cornerRadius ** 2 - trailingInset ** 2);

    if (leading0 > leadingEdge) {
        leadingClipped = true;
        leading0 = leadingEdge;
        leading1 = leadingInset - Math.sqrt(cornerRadius ** 2 - (trailingInset - leadingEdge) ** 2);
    }

    if (trailing1 > trailingEdge) {
        trailingClipped = true;
        trailing0 = trailingInset - Math.sqrt(cornerRadius ** 2 - (leadingInset - trailingEdge) ** 2);
        trailing1 = trailingEdge;
    }

    return { leading0, leading1, trailing0, trailing1, leadingClipped, trailingClipped };
};

const drawCorner = (path: Path2D, { x0, y0, x1, y1, cx, cy }: Corner, cornerRadius: number, move: boolean) => {
    if (move) {
        path.moveTo(x0, y0);
    }

    if (x0 !== x1 || y0 !== y1) {
        const r0 = Math.atan2(y0 - cy, x0 - cx);
        const r1 = Math.atan2(y1 - cy, x1 - cx);
        path.arc(cx, cy, cornerRadius, r0, r1);
    } else {
        path.lineTo(x0, y0);
    }
};

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
        } else if (cornerRadiusBbox == null) {
            path.roundRect(x, y, width, height, _cornerRadius);
            return;
        }

        const cornerRadius = Math.min(_cornerRadius, cornerRadiusBbox.width / 2, cornerRadiusBbox.height / 2);

        const x0 = Math.max(x, cornerRadiusBbox.x);
        const x1 = Math.min(x + width, cornerRadiusBbox.x + cornerRadiusBbox.width);
        const y0 = Math.max(y, cornerRadiusBbox.y);
        const y1 = Math.min(y + height, cornerRadiusBbox.y + cornerRadiusBbox.height);

        x = x0;
        y = y0;
        width = x1 - x0;
        height = y1 - y0;

        if (width <= 0 || height <= 0) return;

        const cornerInsetLeft = Math.max(cornerRadiusBbox.x + cornerRadius - x, 0);
        const cornerInsetTop = Math.max(cornerRadiusBbox.y + cornerRadius - y, 0);
        const cornerInsetRight = Math.max(x + width - (cornerRadiusBbox.x + cornerRadiusBbox.width - cornerRadius), 0);
        const cornerInsetBottom = Math.max(
            y + height - (cornerRadiusBbox.y + cornerRadiusBbox.height - cornerRadius),
            0
        );

        let drawTopLeftCorner = true;
        let drawTopRightCorner = true;
        let drawBottomRightCorner = true;
        let drawBottomLeftCorner = true;

        let topLeftCorner: Corner | undefined;
        let topRightCorner: Corner | undefined;
        let bottomRightCorner: Corner | undefined;
        let bottomLeftCorner: Corner | undefined;

        if (drawTopLeftCorner) {
            const nodes = cornerEdges(height, width, cornerInsetLeft, cornerInsetTop, cornerRadius);

            if (nodes.leadingClipped) drawBottomLeftCorner = false;
            if (nodes.trailingClipped) drawTopRightCorner = false;

            const x0 = Math.max(x + nodes.leading1, x);
            const y0 = Math.max(y + nodes.leading0, y);
            const x1 = Math.max(x + nodes.trailing1, x);
            const y1 = Math.max(y + nodes.trailing0, y);
            const cx = cornerRadiusBbox.x + cornerRadius;
            const cy = cornerRadiusBbox.y + cornerRadius;
            topLeftCorner = { x0, y0, x1, y1, cx, cy };
        }

        if (drawTopRightCorner) {
            const nodes = cornerEdges(width, height, cornerInsetTop, cornerInsetRight, cornerRadius);

            if (nodes.leadingClipped) drawTopLeftCorner = false;
            if (nodes.trailingClipped) drawBottomRightCorner = false;

            const x0 = Math.min(x + width - nodes.leading0, x + width);
            const y0 = Math.max(y + nodes.leading1, y);
            const x1 = Math.min(x + width - nodes.trailing0, x + width);
            const y1 = Math.max(y + nodes.trailing1, y);
            const cx = cornerRadiusBbox.x + cornerRadiusBbox.width - cornerRadius;
            const cy = cornerRadiusBbox.y + cornerRadius;
            topRightCorner = { x0, y0, x1, y1, cx, cy };
        }

        if (drawBottomRightCorner) {
            const nodes = cornerEdges(height, width, cornerInsetRight, cornerInsetBottom, cornerRadius);

            if (nodes.leadingClipped) drawTopRightCorner = false;
            if (nodes.trailingClipped) drawBottomLeftCorner = false;

            const x0 = Math.min(x + width - nodes.leading1, x + width);
            const y0 = Math.min(y + height - nodes.leading0, y + height);
            const x1 = Math.min(x + width - nodes.trailing1, x + width);
            const y1 = Math.min(y + height - nodes.trailing0, y + height);
            const cx = cornerRadiusBbox.x + cornerRadiusBbox.width - cornerRadius;
            const cy = cornerRadiusBbox.y + cornerRadiusBbox.height - cornerRadius;
            bottomRightCorner = { x0, y0, x1, y1, cx, cy };
        }

        if (drawBottomLeftCorner) {
            const nodes = cornerEdges(height, width, cornerInsetBottom, cornerInsetLeft, cornerRadius);

            if (nodes.leadingClipped) drawBottomRightCorner = false;
            if (nodes.trailingClipped) drawTopLeftCorner = false;

            const x0 = Math.max(x + nodes.leading0, x);
            const y0 = Math.min(y + height - nodes.leading1, y + height);
            const x1 = Math.max(x + nodes.trailing0, x);
            const y1 = Math.min(y + height - nodes.trailing1, y + height);
            const cx = cornerRadiusBbox.x + cornerRadius;
            const cy = cornerRadiusBbox.y + cornerRadiusBbox.height - cornerRadius;
            bottomLeftCorner = { x0, y0, x1, y1, cx, cy };
        }

        let didMove = false;
        if (drawTopLeftCorner && topLeftCorner != null) {
            drawCorner(path, topLeftCorner, cornerRadius, !didMove);
            didMove ||= true;
        }
        if (drawTopRightCorner && topRightCorner != null) {
            drawCorner(path, topRightCorner, cornerRadius, !didMove);
            didMove ||= true;
        }
        if (drawBottomRightCorner && bottomRightCorner != null) {
            drawCorner(path, bottomRightCorner, cornerRadius, !didMove);
            didMove ||= true;
        }
        if (drawBottomLeftCorner && bottomLeftCorner != null) {
            drawCorner(path, bottomLeftCorner, cornerRadius, !didMove);
            didMove ||= true;
        }
        path.closePath();
    }

    override updatePath() {
        const { path, borderPath, crisp, cornerRadius } = this;
        let { x, y, width: w, height: h, strokeWidth, cornerRadiusBbox } = this;
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

            cornerRadiusBbox =
                cornerRadiusBbox != null
                    ? new BBox(
                          this.align(cornerRadiusBbox.x),
                          this.align(cornerRadiusBbox.y),
                          this.align(cornerRadiusBbox.x, cornerRadiusBbox.width),
                          this.align(cornerRadiusBbox.y, cornerRadiusBbox.height)
                      )
                    : undefined;
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

                const adjustedCornerRadiusBbox = cornerRadiusBbox?.clone().shrink(halfStrokeWidth);

                // Clipping not needed in this case; fill to center of stroke.
                this.borderClipPath = undefined;
                this.insetCornerRadiusRect(path, x, y, w, h, cornerRadius, adjustedCornerRadiusBbox);
                this.insetCornerRadiusRect(
                    borderPath,
                    x,
                    y,
                    w,
                    h,
                    cornerRadius > 0 ? cornerRadius - strokeWidth : 0,
                    adjustedCornerRadiusBbox
                );
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
            this.insetCornerRadiusRect(path, x, y, w, h, cornerRadius, cornerRadiusBbox);
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
