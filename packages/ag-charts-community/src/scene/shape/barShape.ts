import { DeclaredSceneChangeDetection } from 'ag-charts-core';
import type { AgDrawingMode } from 'ag-charts-types';

import type { DropShadow } from '../dropShadow';
import { Rect } from './rect';

export const FEATHERED_THRESHOLD = 1e-3;

export class BarShape<D = any> extends Rect<D> {
    @DeclaredSceneChangeDetection()
    direction: 'x' | 'y' = 'x';
    declare __direction: 'x' | 'y'; // optimised field accessor

    @DeclaredSceneChangeDetection()
    featherRatio: number = 0;
    declare __featherRatio: number; // optimised field accessor

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
    override setStaticProperties(
        drawingMode: AgDrawingMode,
        topLeftCornerRadius: number,
        topRightCornerRadius: number,
        bottomRightCornerRadius: number,
        bottomLeftCornerRadius: number,
        visible: boolean,
        crisp: boolean,
        fillShadow: DropShadow | undefined,
        direction?: 'x' | 'y',
        featherRatio?: number
    ): void {
        // Direct backing field writes bypass SceneChangeDetection decorators
        this.__direction = direction ?? 'x';
        this.__featherRatio = featherRatio ?? 0;

        super.setStaticProperties(
            drawingMode,
            topLeftCornerRadius,
            topRightCornerRadius,
            bottomRightCornerRadius,
            bottomLeftCornerRadius,
            visible,
            crisp,
            fillShadow
        );
    }

    private get feathered() {
        return Math.abs(this.featherRatio) > FEATHERED_THRESHOLD;
    }

    override isPointInPath(x: number, y: number): boolean {
        if (!this.feathered) {
            return super.isPointInPath(x, y);
        }

        const bbox = this.getBBox();
        return bbox.containsPoint(x, y);
    }

    override updatePath(): void {
        if (!this.feathered) {
            super.updatePath();
            return;
        }

        const {
            path,
            borderPath,
            __direction: direction,
            __featherRatio: featherRatio,
            __x: x,
            __y: y,
            __width: width,
            __height: height,
        } = this;
        path.clear();
        borderPath.clear();

        if (direction === 'x') {
            const featherInsetX = Math.abs(featherRatio) * width;

            if (featherRatio > 0) {
                path.moveTo(x, y);
                path.lineTo(x + width - featherInsetX, y);
                path.lineTo(x + width, y + height / 2);
                path.lineTo(x + width - featherInsetX, y + height);
                path.lineTo(x, y + height);
                path.closePath();
            } else {
                path.moveTo(x + featherInsetX, y);
                path.lineTo(x + width, y);
                path.lineTo(x + width, y + height);
                path.lineTo(x + featherInsetX, y + height);
                path.lineTo(x, y + height / 2);
                path.closePath();
            }
        } else {
            const featherInsetY = Math.abs(featherRatio) * height;

            if (featherRatio > 0) {
                path.moveTo(x, y + featherInsetY);
                path.lineTo(x + width / 2, y);
                path.lineTo(x + width, y + featherInsetY);
                path.lineTo(x + width, y + height);
                path.lineTo(x, y + height);
                path.closePath();
            } else {
                path.moveTo(x, y);
                path.lineTo(x + width, y);
                path.lineTo(x + width, y + height - featherInsetY);
                path.lineTo(x + width / 2, y + height);
                path.lineTo(x, y + height - featherInsetY);
                path.closePath();
            }
        }
    }

    override renderStroke(ctx: CanvasRenderingContext2D & { setLineDash(lineDash: readonly number[]): void }) {
        if (!this.feathered) {
            super.renderStroke(ctx);
            return;
        }

        const {
            __stroke: stroke,
            __strokeWidth: strokeWidth,
            __lineDash: lineDash,
            __lineDashOffset: lineDashOffset,
            __lineCap: lineCap,
            __lineJoin: lineJoin,
            path,
        } = this;

        if (stroke && strokeWidth) {
            const { globalAlpha } = ctx;

            this.applyStrokeAndAlpha(ctx);
            ctx.lineWidth = strokeWidth;

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

            ctx.stroke(path.getPath2D());
            ctx.globalAlpha = globalAlpha;
        }
    }
}
