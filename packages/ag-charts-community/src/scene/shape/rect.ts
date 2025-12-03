import { type DistantObject, boxesEqual, isNumberEqual } from 'ag-charts-core';
import type { AgDrawingMode } from 'ag-charts-types';

import { BBox } from '../bbox';
import { DeclaredSceneChangeDetection } from 'ag-charts-core';
import type { DropShadow } from '../dropShadow';
import { ExtendedPath2D } from '../extendedPath2D';
import { type Corner, drawCorner } from '../util/corner';
import { Path } from './path';
import { type CanvasContext } from './shape';

export interface CornerRadii {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
}

function cornerEdges(
    leadingEdge: number,
    trailingEdge: number,
    leadingInset: number,
    trailingInset: number,
    cornerRadius: number
) {
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
    } else if (isNumberEqual(leading0, 0)) {
        leading0 = 0;
    }

    if (trailing1 > trailingEdge) {
        trailingClipped = true;
        trailing0 = trailingInset - Math.sqrt(Math.max(cornerRadius ** 2 - (leadingInset - trailingEdge) ** 2));
        trailing1 = trailingEdge;
    } else if (isNumberEqual(trailing1, 0)) {
        trailing1 = 0;
    }

    return { leading0, leading1, trailing0, trailing1, leadingClipped, trailingClipped };
}

export function clippedRoundRect(
    path: ExtendedPath2D,
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadii: CornerRadii,
    clipBBox: BBox | undefined
) {
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
            const x0 = Math.max(x, clipBBox.x);
            const x1 = Math.min(x + width, clipBBox.x + clipBBox.width);
            const y0 = Math.max(y, clipBBox.y);
            const y1 = Math.min(y + height, clipBBox.y + clipBBox.height);

            path.rect(x0, y0, x1 - x0, y1 - y0);
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
    }
    path.closePath();
}

export class Rect<D = any> extends Path<D> implements DistantObject {
    static override readonly className: string = 'Rect';

    readonly borderPath = new ExtendedPath2D();

    @DeclaredSceneChangeDetection()
    x: number = 0;
    declare __x: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    y: number = 0;
    declare __y: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    width: number = 10;
    declare __width: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    height: number = 10;
    declare __height: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    topLeftCornerRadius: number = 0;
    declare __topLeftCornerRadius: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    topRightCornerRadius: number = 0;
    declare __topRightCornerRadius: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    bottomRightCornerRadius: number = 0;
    declare __bottomRightCornerRadius: number; // optimised field accessor

    @DeclaredSceneChangeDetection()
    bottomLeftCornerRadius: number = 0;
    declare __bottomLeftCornerRadius: number; // optimised field accessor

    set cornerRadius(cornerRadius: number) {
        this.topLeftCornerRadius = cornerRadius;
        this.topRightCornerRadius = cornerRadius;
        this.bottomRightCornerRadius = cornerRadius;
        this.bottomLeftCornerRadius = cornerRadius;
    }

    @DeclaredSceneChangeDetection({ equals: boxesEqual })
    clipBBox?: BBox = undefined;
    declare __clipBBox: BBox | undefined; // optimised field accessor

    /**
     * If `true`, the rect is aligned to the pixel grid for crisp looking lines.
     * Animated rects may not look nice with this option enabled, for example
     * when a rect is translated by a sub-pixel value on each frame.
     */
    @DeclaredSceneChangeDetection()
    crisp: boolean = false;
    declare __crisp: boolean; // optimised field accessor

    private borderClipPath?: ExtendedPath2D;

    private lastUpdatePathStrokeWidth: number = this.__strokeWidth;

    protected override isDirtyPath() {
        return (
            this.lastUpdatePathStrokeWidth !== this.__strokeWidth ||
            Boolean(this.path.isDirty() || this.borderPath.isDirty())
        );
    }

    private effectiveStrokeWidth: number = this.__strokeWidth;

    private hittester = super.isPointInPath.bind(this);
    private distanceCalculator = super.distanceSquaredTransformedPoint.bind(this);

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
            __crisp: crisp,
            __topLeftCornerRadius: topLeft,
            __topRightCornerRadius: topRight,
            __bottomRightCornerRadius: bottomRight,
            __bottomLeftCornerRadius: bottomLeft,
        } = this;
        let { __x: x, __y: y, __width: w, __height: h, __strokeWidth: strokeWidth, __clipBBox: clipBBox } = this;
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const pixelSize = 1 / pixelRatio;
        let microPixelEffectOpacity = 1;

        path.clear();
        borderPath.clear();

        if (w === 0 || h === 0) {
            this.effectiveStrokeWidth = 0;
            this.lastUpdatePathStrokeWidth = 0;
            this.microPixelEffectOpacity = 0;
            return;
        }

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
                clipBBox == null
                    ? undefined
                    : new BBox(
                          this.align(clipBBox.x),
                          this.align(clipBBox.y),
                          this.align(clipBBox.x, clipBBox.width),
                          this.align(clipBBox.y, clipBBox.height)
                      );
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

                if (
                    w > 0 &&
                    h > 0 &&
                    (adjustedClipBBox == null || (adjustedClipBBox?.width > 0 && adjustedClipBBox?.height > 0))
                ) {
                    clippedRoundRect(path, x, y, w, h, cornerRadii, adjustedClipBBox);
                    clippedRoundRect(borderPath, x, y, w, h, cornerRadii, adjustedClipBBox);
                }
            } else {
                // Skip the fill and just render the stroke.
                this.borderClipPath = this.borderClipPath ?? new ExtendedPath2D();
                this.borderClipPath.clear();
                this.borderClipPath.rect(x, y, w, h);
                borderPath.rect(x, y, w, h);
            }
        } else {
            const cornerRadii: CornerRadii = { topLeft, topRight, bottomRight, bottomLeft };
            // No borderPath needed, and thus no clipPath needed either. Fill to full extent of
            // Rect.
            this.borderClipPath = undefined;
            clippedRoundRect(path, x, y, w, h, cornerRadii, clipBBox);
        }

        // Path's isPointInPath and distanceSquared are expensive computations,
        // so just use a BBox if the corners aren't rounded.
        if ([topLeft, topRight, bottomRight, bottomLeft].every(areCornersZero)) {
            const bbox = this.getBBox();
            this.hittester = bbox.containsPoint.bind(bbox);
            const rectInstance = this;

            function distanceSquaredFromRect(hitX: number, hitY: number): number {
                return rectInstance.getBBox().distanceSquared(hitX, hitY);
            }

            this.distanceSquared = distanceSquaredFromRect;
        } else {
            this.hittester = super.isPointInPath;
            this.distanceCalculator = super.distanceSquaredTransformedPoint;
        }

        this.effectiveStrokeWidth = strokeWidth;
        this.lastUpdatePathStrokeWidth = strokeWidth;
        this.microPixelEffectOpacity = microPixelEffectOpacity;
    }

    protected override computeBBox(): BBox {
        const { __x: x, __y: y, __width: width, __height: height, __clipBBox: clipBBox } = this;
        return clipBBox?.clone() ?? new BBox(x, y, width, height);
    }

    override isPointInPath(x: number, y: number): boolean {
        return this.hittester(x, y);
    }

    get midPoint(): { x: number; y: number } {
        return { x: this.__x + this.__width / 2, y: this.__y + this.__height / 2 };
    }

    /**
     * High-performance static property setter that bypasses the decorator system entirely.
     * Writes directly to backing fields (__propertyName) to avoid:
     * - Decorator setter chains and equality checks
     * - Multiple onChangeDetection calls per property
     * - Object.keys() iteration in assignIfNotStrictlyEqual
     * - Object allocation overhead
     *
     * A single markDirty() call at the end ensures the scene graph is properly invalidated.
     * WARNING: Only use for hot paths where performance is critical and properties don't need
     * individual change detection (e.g., when updating many nodes in a loop).
     */
    setStaticProperties(
        drawingMode: AgDrawingMode,
        topLeftCornerRadius: number,
        topRightCornerRadius: number,
        bottomRightCornerRadius: number,
        bottomLeftCornerRadius: number,
        visible: boolean,
        crisp: boolean,
        fillShadow: DropShadow | undefined
    ): void {
        // Direct backing field writes bypass SceneChangeDetection decorators
        this.__drawingMode = drawingMode;
        this.__topLeftCornerRadius = topLeftCornerRadius;
        this.__topRightCornerRadius = topRightCornerRadius;
        this.__bottomRightCornerRadius = bottomRightCornerRadius;
        this.__bottomLeftCornerRadius = bottomLeftCornerRadius;
        this.__visible = visible;
        this.__crisp = crisp;
        this.__fillShadow = fillShadow;

        // Mark path as dirty since corner radii, crisp, direction, and featherRatio affect path
        this.dirtyPath = true;

        // Single dirty notification for the batch
        this.markDirty();
    }

    /**
     * High-performance animation reset that bypasses the decorator system entirely.
     * Writes directly to backing fields (__x, __y, etc.) to avoid:
     * - Decorator setter chains and equality checks
     * - Multiple onChangeDetection calls
     * - Object.keys() iteration
     *
     * A single markDirty() call at the end ensures the scene graph is properly invalidated.
     * WARNING: Only use for animation hot paths where performance is critical.
     */
    resetAnimationProperties(
        x: number,
        y: number,
        width: number,
        height: number,
        opacity: number,
        clipBBox: BBox | undefined
    ): void {
        // Direct backing field writes bypass SceneChangeDetection decorators
        this.__x = x;
        this.__y = y;
        this.__width = width;
        this.__height = height;
        this.__opacity = opacity;
        this.__clipBBox = clipBBox;
        this.dirtyPath = true;

        // Single dirty notification for the batch
        this.markDirty();
    }

    override distanceSquared(x: number, y: number): number {
        return this.distanceCalculator(x, y);
    }

    protected override applyFillAndAlpha(ctx: CanvasRenderingContext2D) {
        super.applyFillAndAlpha(ctx);
        ctx.globalAlpha *= this.microPixelEffectOpacity;
    }

    protected override applyStrokeAndAlpha(ctx: CanvasContext): void {
        super.applyStrokeAndAlpha(ctx);
        ctx.globalAlpha *= this.microPixelEffectOpacity;
    }

    protected override renderStroke(
        ctx: CanvasRenderingContext2D & { setLineDash(lineDash: readonly number[]): void }
    ) {
        const { stroke, effectiveStrokeWidth } = this;

        if (stroke && effectiveStrokeWidth) {
            const { globalAlpha } = ctx;
            const { lineDash, lineDashOffset, lineCap, lineJoin, borderPath, borderClipPath } = this;

            if (borderClipPath) {
                ctx.clip(borderClipPath.getPath2D());
            }

            this.applyStrokeAndAlpha(ctx);
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

function areCornersZero(cornerRadius: number): boolean {
    return cornerRadius === 0;
}
