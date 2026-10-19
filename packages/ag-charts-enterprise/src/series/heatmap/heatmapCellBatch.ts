import { BBox, Node, type RenderContext, align, shadowPass } from 'ag-charts-core';

/**
 * OPTIMIZATION: paints every plain heatmap cell in one pass from typed arrays, instead of walking one `Rect` per cell.
 * It issues the same `fillStyle` and `fillRect` calls as a crisp, unstroked, square-cornered `Rect`.
 */
export class HeatmapCellBatch extends Node {
    static override readonly className = 'HeatmapCellBatch';

    private xs = new Float64Array(0);
    private ys = new Float64Array(0);
    private widths = new Float64Array(0);
    private heights = new Float64Array(0);
    private opacities = new Float64Array(0);
    private fills: string[] = [];
    private count = 0;

    get size() {
        return this.count;
    }

    crisp = true;

    resize(count: number) {
        if (count > this.xs.length) {
            const capacity = Math.max(count, Math.ceil(this.xs.length * 1.5));
            this.xs = new Float64Array(capacity);
            this.ys = new Float64Array(capacity);
            this.widths = new Float64Array(capacity);
            this.heights = new Float64Array(capacity);
            this.opacities = new Float64Array(capacity);
        }
        this.fills.length = count;
        this.count = count;
    }

    set(index: number, x: number, y: number, width: number, height: number, fill: string, opacity: number) {
        this.xs[index] = x;
        this.ys[index] = y;
        this.widths[index] = width;
        this.heights[index] = height;
        this.fills[index] = fill;
        this.opacities[index] = opacity;
    }

    /** One dirty notification for any number of `set` calls. */
    commit() {
        this.markDirty();
    }

    override preRender(renderCtx: RenderContext) {
        return super.preRender(renderCtx, this.count);
    }

    protected override computeBBox(): BBox | undefined {
        const { xs, ys, widths, heights, count } = this;
        if (count === 0) return undefined;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < count; i++) {
            minX = Math.min(minX, xs[i]);
            minY = Math.min(minY, ys[i]);
            maxX = Math.max(maxX, xs[i] + widths[i]);
            maxY = Math.max(maxY, ys[i] + heights[i]);
        }
        return new BBox(minX, minY, maxX - minX, maxY - minY);
    }

    override render(renderCtx: RenderContext) {
        if (shadowPass.state === 'none') {
            this.paint(renderCtx);
        }
        super.render(renderCtx);
    }

    private paint({ ctx, devicePixelRatio: pixelRatio }: RenderContext) {
        const { xs, ys, widths, heights, opacities, fills, count, crisp } = this;
        const pixelSize = 1 / pixelRatio;
        const baseAlpha = ctx.globalAlpha;
        let lastFill: string | undefined;

        for (let i = 0; i < count; i++) {
            const fill = fills[i];
            const opacity = opacities[i];
            if (fill == null || fill === 'none' || !(opacity > 0)) continue;

            let x = xs[i];
            let y = ys[i];
            let w = widths[i];
            let h = heights[i];
            if (w === 0 || h === 0) continue;

            let microPixelOpacity = 1;
            if (crisp) {
                if (w <= pixelSize) microPixelOpacity *= w / pixelSize;
                if (h <= pixelSize) microPixelOpacity *= h / pixelSize;
                w = align(pixelRatio, x, w);
                x = align(pixelRatio, x);
                h = align(pixelRatio, y, h);
                y = align(pixelRatio, y);
            }

            const alphaChanged = opacity !== 1 || microPixelOpacity !== 1;
            if (opacity !== 1) ctx.globalAlpha *= opacity;
            if (microPixelOpacity !== 1) ctx.globalAlpha *= microPixelOpacity;
            if (fill !== lastFill) {
                ctx.fillStyle = fill;
                lastFill = fill;
            }
            ctx.fillRect(x, y, w, h);
            if (alphaChanged) ctx.globalAlpha = baseAlpha;
        }
    }
}
