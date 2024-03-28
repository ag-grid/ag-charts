import { BBox } from '../bbox';
import { InternalPath2D } from '../internalPath2D';
import type { DistantObject } from '../nearest';
import { Path, ScenePathChangeDetection } from './path';
import { Shape } from './shape';

type CornerRadii = {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
};

type Corner = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    cx: number;
    cy: number;
};

const epsilon = 1e-6;

const cornerEdges = (
    leadingEdge: number,
    trailingEdge: number,
    leadingInset: number,
    trailingInset: number,
    cornerRadius: number
) => {
    let leadingClipped = false;
    let trailingClipped = false;
    let leading0 = trailingInset - Math.sqrt(Math.max(cornerRadius ** 2 - leadingInset ** 2, 0));
    let leading1 = 0;
    let trailing0 = 0;
    let trailing1 = leadingInset - Math.sqrt(Math.max(cornerRadius ** 2 - trailingInset ** 2, 0));

    if (leading0 > leadingEdge) {
        leadingClipped = true;
        leading0 = leadingEdge;
        leading1 = leadingInset - Math.sqrt(Math.max(cornerRadius ** 2 - (trailingInset - leadingEdge) ** 2));
    } else if (leading0 < epsilon) {
        leading0 = 0;
    }

    if (trailing1 > trailingEdge) {
        trailingClipped = true;
        trailing0 = trailingInset - Math.sqrt(Math.max(cornerRadius ** 2 - (leadingInset - trailingEdge) ** 2));
        trailing1 = trailingEdge;
    } else if (trailing1 < epsilon) {
        trailing1 = 0;
    }

    return { leading0, leading1, trailing0, trailing1, leadingClipped, trailingClipped };
};

const drawCorner = (path: InternalPath2D, { x0, y0, x1, y1, cx, cy }: Corner, cornerRadius: number, move: boolean) => {
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

const insetCornerRadiusRect = (
    path: InternalPath2D,
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadii: CornerRadii,
    clipBBox: BBox | undefined
) => {
    let {
        topLeft: topLeftCornerRadius,
        topRight: topRightCornerRadius,
        bottomRight: bottomRightCornerRadius,
        bottomLeft: bottomLeftCornerRadius,
    } = cornerRadii;

    const maxVerticalCornerRadius = Math.max(
        topLeftCornerRadius + bottomLeftCornerRadius,
        topRightCornerRadius + bottomRightCornerRadius
    );
    const maxHorizontalCornerRadius = Math.max(
        topLeftCornerRadius + topRightCornerRadius,
        bottomLeftCornerRadius + bottomRightCornerRadius
    );
    if (maxVerticalCornerRadius <= 0 && maxHorizontalCornerRadius <= 0) {
        if (clipBBox == null) {
            path.rect(x, y, width, height);
        } else {
            path.rect(clipBBox.x, clipBBox.y, clipBBox.width, clipBBox.height);
        }
        return;
    } else if (
        clipBBox == null &&
        topLeftCornerRadius === topRightCornerRadius &&
        topLeftCornerRadius === bottomRightCornerRadius &&
        topLeftCornerRadius === bottomLeftCornerRadius
    ) {
        path.roundRect(x, y, width, height, topLeftCornerRadius);
        return;
    }

    if (width < 0) {
        x += width;
        width = Math.abs(width);
    }

    if (height < 0) {
        y += height;
        height = Math.abs(height);
    }

    if (width <= 0 || height <= 0) return;

    if (clipBBox == null) {
        clipBBox = new BBox(x, y, width, height);
    } else {
        const x0 = Math.max(x, clipBBox.x);
        const x1 = Math.min(x + width, clipBBox.x + clipBBox.width);
        const y0 = Math.max(y, clipBBox.y);
        const y1 = Math.min(y + height, clipBBox.y + clipBBox.height);

        clipBBox = new BBox(x0, y0, x1 - x0, y1 - y0);
    }

    const borderScale = Math.max(maxVerticalCornerRadius / height, maxHorizontalCornerRadius / width, 1);

    if (borderScale > 1) {
        topLeftCornerRadius /= borderScale;
        topRightCornerRadius /= borderScale;
        bottomRightCornerRadius /= borderScale;
        bottomLeftCornerRadius /= borderScale;
    }

    let drawTopLeftCorner = true;
    let drawTopRightCorner = true;
    let drawBottomRightCorner = true;
    let drawBottomLeftCorner = true;

    let topLeftCorner: Corner | undefined;
    let topRightCorner: Corner | undefined;
    let bottomRightCorner: Corner | undefined;
    let bottomLeftCorner: Corner | undefined;

    if (drawTopLeftCorner) {
        const nodes = cornerEdges(
            clipBBox.height,
            clipBBox.width,
            Math.max(x + topLeftCornerRadius - clipBBox.x, 0),
            Math.max(y + topLeftCornerRadius - clipBBox.y, 0),
            topLeftCornerRadius
        );

        if (nodes.leadingClipped) drawBottomLeftCorner = false;
        if (nodes.trailingClipped) drawTopRightCorner = false;

        const x0 = Math.max(clipBBox.x + nodes.leading1, clipBBox.x);
        const y0 = Math.max(clipBBox.y + nodes.leading0, clipBBox.y);
        const x1 = Math.max(clipBBox.x + nodes.trailing1, clipBBox.x);
        const y1 = Math.max(clipBBox.y + nodes.trailing0, clipBBox.y);
        const cx = x + topLeftCornerRadius;
        const cy = y + topLeftCornerRadius;
        topLeftCorner = { x0, y0, x1, y1, cx, cy };
    }

    if (drawTopRightCorner) {
        const nodes = cornerEdges(
            clipBBox.width,
            clipBBox.height,
            Math.max(y + topRightCornerRadius - clipBBox.y, 0),
            Math.max(clipBBox.x + clipBBox.width - (x + width - topRightCornerRadius), 0),
            topRightCornerRadius
        );

        if (nodes.leadingClipped) drawTopLeftCorner = false;
        if (nodes.trailingClipped) drawBottomRightCorner = false;

        const x0 = Math.min(clipBBox.x + clipBBox.width - nodes.leading0, clipBBox.x + clipBBox.width);
        const y0 = Math.max(clipBBox.y + nodes.leading1, clipBBox.y);
        const x1 = Math.min(clipBBox.x + clipBBox.width - nodes.trailing0, clipBBox.x + clipBBox.width);
        const y1 = Math.max(clipBBox.y + nodes.trailing1, clipBBox.y);
        const cx = x + width - topRightCornerRadius;
        const cy = y + topRightCornerRadius;
        topRightCorner = { x0, y0, x1, y1, cx, cy };
    }

    if (drawBottomRightCorner) {
        const nodes = cornerEdges(
            clipBBox.height,
            clipBBox.width,
            Math.max(clipBBox.x + clipBBox.width - (x + width - bottomRightCornerRadius), 0),
            Math.max(clipBBox.y + clipBBox.height - (y + height - bottomRightCornerRadius), 0),
            bottomRightCornerRadius
        );

        if (nodes.leadingClipped) drawTopRightCorner = false;
        if (nodes.trailingClipped) drawBottomLeftCorner = false;

        const x0 = Math.min(clipBBox.x + clipBBox.width - nodes.leading1, clipBBox.x + clipBBox.width);
        const y0 = Math.min(clipBBox.y + clipBBox.height - nodes.leading0, clipBBox.y + clipBBox.height);
        const x1 = Math.min(clipBBox.x + clipBBox.width - nodes.trailing1, clipBBox.x + clipBBox.width);
        const y1 = Math.min(clipBBox.y + clipBBox.height - nodes.trailing0, clipBBox.y + clipBBox.height);
        const cx = x + width - bottomRightCornerRadius;
        const cy = y + height - bottomRightCornerRadius;
        bottomRightCorner = { x0, y0, x1, y1, cx, cy };
    }

    if (drawBottomLeftCorner) {
        const nodes = cornerEdges(
            clipBBox.width,
            clipBBox.height,
            Math.max(clipBBox.y + clipBBox.height - (y + height - bottomLeftCornerRadius), 0),
            Math.max(x + bottomLeftCornerRadius - clipBBox.x, 0),
            bottomLeftCornerRadius
        );

        if (nodes.leadingClipped) drawBottomRightCorner = false;
        if (nodes.trailingClipped) drawTopLeftCorner = false;

        const x0 = Math.max(clipBBox.x + nodes.leading0, clipBBox.x);
        const y0 = Math.min(clipBBox.y + clipBBox.height - nodes.leading1, clipBBox.y + clipBBox.height);
        const x1 = Math.max(clipBBox.x + nodes.trailing0, clipBBox.x);
        const y1 = Math.min(clipBBox.y + clipBBox.height - nodes.trailing1, clipBBox.y + clipBBox.height);
        const cx = x + bottomLeftCornerRadius;
        const cy = y + height - bottomLeftCornerRadius;
        bottomLeftCorner = { x0, y0, x1, y1, cx, cy };
    }

    let didMove = false;
    if (drawTopLeftCorner && topLeftCorner != null) {
        drawCorner(path, topLeftCorner, topLeftCornerRadius, !didMove);
        didMove ||= true;
    }
    if (drawTopRightCorner && topRightCorner != null) {
        drawCorner(path, topRightCorner, topRightCornerRadius, !didMove);
        didMove ||= true;
    }
    if (drawBottomRightCorner && bottomRightCorner != null) {
        drawCorner(path, bottomRightCorner, bottomRightCornerRadius, !didMove);
        didMove ||= true;
    }
    if (drawBottomLeftCorner && bottomLeftCorner != null) {
        drawCorner(path, bottomLeftCorner, bottomLeftCornerRadius, !didMove);
        didMove ||= true;
    }
    path.closePath();
};

export class Rect extends Path implements DistantObject {
    static override readonly className: string = 'Rect';

    readonly borderPath = new InternalPath2D();

    @ScenePathChangeDetection()
    x: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    @ScenePathChangeDetection()
    width: number = 10;

    @ScenePathChangeDetection()
    height: number = 10;

    @ScenePathChangeDetection()
    topLeftCornerRadius: number = 0;

    @ScenePathChangeDetection()
    topRightCornerRadius: number = 0;

    @ScenePathChangeDetection()
    bottomRightCornerRadius: number = 0;

    @ScenePathChangeDetection()
    bottomLeftCornerRadius: number = 0;

    set cornerRadius(cornerRadius: number) {
        this.topLeftCornerRadius = cornerRadius;
        this.topRightCornerRadius = cornerRadius;
        this.bottomRightCornerRadius = cornerRadius;
        this.bottomLeftCornerRadius = cornerRadius;
    }

    @ScenePathChangeDetection()
    clipBBox?: BBox = undefined;

    /**
     * If `true`, the rect is aligned to the pixel grid for crisp looking lines.
     * Animated rects may not look nice with this option enabled, for example
     * when a rect is translated by a sub-pixel value on each frame.
     */
    @ScenePathChangeDetection()
    crisp: boolean = false;

    private borderClipPath?: InternalPath2D;

    private lastUpdatePathStrokeWidth: number = Shape.defaultStyles.strokeWidth;

    protected override isDirtyPath() {
        if (this.lastUpdatePathStrokeWidth !== this.strokeWidth) {
            return true;
        }

        return !!(this.path.isDirty() || this.borderPath.isDirty());
    }

    private effectiveStrokeWidth: number = Shape.defaultStyles.strokeWidth;

    private hittester = super.isPointInPath;

    /**
     * When the rectangle's width or height is less than a pixel
     * and crisp mode is on, the rectangle will still fit into the pixel,
     * but will be less opaque to make an effect of holding less space.
     */
    protected microPixelEffectOpacity: number = 1;

    override updatePath() {
        const {
            path,
            borderPath,
            crisp,
            topLeftCornerRadius: topLeft,
            topRightCornerRadius: topRight,
            bottomRightCornerRadius: bottomRight,
            bottomLeftCornerRadius: bottomLeft,
        } = this;
        let { x, y, width: w, height: h, strokeWidth, clipBBox } = this;
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const pixelSize = 1 / pixelRatio;
        let microPixelEffectOpacity = 1;

        path.clear(true);
        borderPath.clear(true);

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

            clipBBox =
                clipBBox != null
                    ? new BBox(
                          this.align(clipBBox.x),
                          this.align(clipBBox.y),
                          this.align(clipBBox.x, clipBBox.width),
                          this.align(clipBBox.y, clipBBox.height)
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

                const adjustedClipBBox = clipBBox?.clone().shrink(halfStrokeWidth);

                const cornerRadii: CornerRadii = {
                    topLeft: topLeft > 0 ? topLeft - strokeWidth : 0,
                    topRight: topRight > 0 ? topRight - strokeWidth : 0,
                    bottomRight: bottomRight > 0 ? bottomRight - strokeWidth : 0,
                    bottomLeft: bottomLeft > 0 ? bottomLeft - strokeWidth : 0,
                };

                // Clipping not needed in this case; fill to center of stroke.
                this.borderClipPath = undefined;
                insetCornerRadiusRect(path, x, y, w, h, cornerRadii, adjustedClipBBox);
                insetCornerRadiusRect(borderPath, x, y, w, h, cornerRadii, adjustedClipBBox);
            } else {
                // Skip the fill and just render the stroke.
                this.borderClipPath = this.borderClipPath ?? new InternalPath2D();
                this.borderClipPath.clear(true);
                this.borderClipPath.rect(x, y, w, h);
                borderPath.rect(x, y, w, h);
            }
        } else {
            const cornerRadii: CornerRadii = { topLeft, topRight, bottomRight, bottomLeft };
            // No borderPath needed, and thus no clipPath needed either. Fill to full extent of
            // Rect.
            this.borderClipPath = undefined;
            insetCornerRadiusRect(path, x, y, w, h, cornerRadii, clipBBox);
        }

        // Path.isPointInPath is expensive, so just use a BBox if the corners aren't rounded.
        if ([topLeft, topRight, bottomRight, bottomLeft].every((r) => r === 0)) {
            this.hittester = (hitX: number, hitY: number) => {
                const point = this.transformPoint(hitX, hitY);
                return this.getCachedBBox().containsPoint(point.x, point.y);
            };
        } else {
            this.hittester = super.isPointInPath;
        }

        this.effectiveStrokeWidth = strokeWidth;
        this.lastUpdatePathStrokeWidth = strokeWidth;
        this.microPixelEffectOpacity = microPixelEffectOpacity;
    }

    override computeBBox(): BBox {
        const { x, y, width, height, clipBBox } = this;
        return clipBBox?.clone() ?? new BBox(x, y, width, height);
    }

    override isPointInPath(x: number, y: number): boolean {
        return this.hittester(x, y);
    }

    get midPoint(): { x: number; y: number } {
        return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }

    distanceSquared(x: number, y: number): number {
        return this.getCachedBBox().distanceSquared(x, y);
    }

    protected override applyFillAlpha(ctx: CanvasRenderingContext2D) {
        const { fillOpacity, microPixelEffectOpacity, opacity } = this;
        const { globalAlpha } = ctx;
        ctx.globalAlpha = globalAlpha * opacity * fillOpacity * microPixelEffectOpacity;
    }

    protected override renderStroke(ctx: CanvasRenderingContext2D) {
        const { stroke, effectiveStrokeWidth, borderPath, borderClipPath, opacity, microPixelEffectOpacity } = this;

        if (stroke && effectiveStrokeWidth) {
            const { strokeOpacity, lineDash, lineDashOffset, lineCap, lineJoin } = this;
            if (borderClipPath) {
                // strokeWidth is larger than width or height, so use clipping to render correctly.
                // This is the simplest way to achieve the correct rendering due to nuances with ~0
                // width/height lines in Canvas operations.
                ctx.clip(borderClipPath.getPath2D());
            }

            const { globalAlpha } = ctx;
            ctx.strokeStyle = stroke;
            ctx.globalAlpha *= opacity * strokeOpacity * microPixelEffectOpacity;

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

            ctx.stroke(borderPath.getPath2D());
            ctx.globalAlpha = globalAlpha;
        }
    }
}
