import { SceneChangeDetection } from '../changeDetectable';
import { Rect } from './rect';

export const FEATHERED_THRESHOLD = 1e-3;

export class BarShape<D = any> extends Rect<D> {
    @SceneChangeDetection()
    direction: 'x' | 'y' = 'x';

    @SceneChangeDetection()
    featherRatio: number = 0;

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

        const { path, borderPath } = this;
        const x = (this as any).__x;
        const y = (this as any).__y;
        const width = (this as any).__width;
        const height = (this as any).__height;
        const direction = (this as any).__direction;
        const featherRatio = (this as any).__featherRatio;
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

        const stroke = (this as any).__stroke;
        const strokeWidth = (this as any).__strokeWidth;

        if (stroke && strokeWidth) {
            const { globalAlpha } = ctx;
            const lineDash = (this as any).__lineDash;
            const lineDashOffset = (this as any).__lineDashOffset;
            const lineCap = (this as any).__lineCap;
            const lineJoin = (this as any).__lineJoin;
            const path = (this as any).path;

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
