import {
    BBox,
    Node,
    PointerEvents,
    type RenderContext,
    type SerializedNodeState,
    type SerializedRectBatchCell,
    align,
    createSvgElement,
    setSvgStrokeAttributes,
    shadowPass,
} from 'ag-charts-core';

/** Slack for the float error of placing an aligned cell in device pixels, against the whole pixels of a region. */
const REGION_EPSILON = 1e-6;

/**
 * OPTIMIZATION: paints every plain heatmap cell in one pass from typed arrays, instead of walking one `Rect` per cell.
 * A cell paints with the same `fillStyle` and `fillRect` calls as a square-cornered, unstroked, unshadowed `Rect`.
 */
export class HeatmapCellBatch extends Node {
    static override readonly className = 'HeatmapCellBatch';

    private xs = new Float64Array(0);
    private ys = new Float64Array(0);
    private widths = new Float64Array(0);
    private heights = new Float64Array(0);
    // OPTIMIZATION: the geometry a cell paints with only changes with its box, `crisp` or the pixel ratio, so it is
    // aligned when its box is written rather than on every repaint.
    private alignedXs = new Float64Array(0);
    private alignedYs = new Float64Array(0);
    private alignedWidths = new Float64Array(0);
    private alignedHeights = new Float64Array(0);
    private microPixelOpacities = new Float64Array(0);
    /** Fill opacity and style opacity, combined as a `Rect` does. */
    private opacities = new Float64Array(0);
    /** Only the SVG form reads this: a plain cell has no stroke to paint. */
    private strokeOpacities = new Float64Array(0);
    private fills: string[] = [];
    /** Only the SVG form reads this: a plain cell has no stroke to paint. */
    private strokes: (string | undefined)[] = [];
    private count = 0;
    private pixelRatio = 1;
    private _crisp = true;
    /** Whether the aligned arrays were written for a `crisp` or pixel ratio other than the current ones. */
    private alignmentStale = false;
    /** Bounds of the aligned cells written since the last paint, old and new; empty while `minX > maxX`. */
    private regionMinX = Infinity;
    private regionMinY = Infinity;
    private regionMaxX = -Infinity;
    private regionMaxY = -Infinity;
    private regionUnknown = false;

    /** Whether cells snap to the device pixel grid, as a crisp `Rect` does. */
    get crisp() {
        return this._crisp;
    }
    set crisp(crisp: boolean) {
        if (crisp === this._crisp) return;
        this._crisp = crisp;
        this.alignmentStale = true;
    }

    /** The datum behind each cell, which only the serialised form reads. */
    datums: ReadonlyArray<{ readonly xValue?: unknown }> = [];

    constructor() {
        super();
        // Cells are picked by the series' quadtree, so the batch is never a pick target of its own.
        this.pointerEvents = PointerEvents.None;
    }

    get size() {
        return this.count;
    }

    resize(count: number) {
        if (count > this.xs.length) {
            const capacity = Math.max(count, Math.ceil(this.xs.length * 1.5));
            this.xs = new Float64Array(capacity);
            this.ys = new Float64Array(capacity);
            this.widths = new Float64Array(capacity);
            this.heights = new Float64Array(capacity);
            this.opacities = new Float64Array(capacity);
            this.strokeOpacities = new Float64Array(capacity);
            this.alignedXs = new Float64Array(capacity);
            this.alignedYs = new Float64Array(capacity);
            this.alignedWidths = new Float64Array(capacity);
            this.alignedHeights = new Float64Array(capacity);
            this.microPixelOpacities = new Float64Array(capacity);
        }
        this.fills.length = count;
        this.strokes.length = count;
        // Cells past the old count were not realigned along the way, so what they hold can't be trusted.
        if (count > this.count) this.alignmentStale = true;
        // A resize starts a full rewrite, which no region bounds, so `set` need not track one.
        this.regionUnknown = true;
        this.count = count;
    }

    set(
        index: number,
        x: number,
        y: number,
        width: number,
        height: number,
        fill: string,
        opacity: number,
        strokeOpacity: number,
        stroke: string | undefined
    ) {
        const moved =
            x !== this.xs[index] ||
            y !== this.ys[index] ||
            width !== this.widths[index] ||
            height !== this.heights[index];
        // What the cell painted before is repainted too, so it joins the region ahead of the write.
        if (moved) this.includeInRegion(index);
        this.xs[index] = x;
        this.ys[index] = y;
        this.widths[index] = width;
        this.heights[index] = height;
        this.fills[index] = fill;
        this.opacities[index] = opacity;
        this.strokeOpacities[index] = strokeOpacity;
        this.strokes[index] = stroke;
        // A write that only restyles the cell leaves its aligned geometry as it is.
        if (moved && !this.alignmentStale) this.alignCell(index);
        this.includeInRegion(index);
    }

    /** Adds the aligned rect a cell holds to the region the next repaint covers. */
    private includeInRegion(index: number) {
        if (this.regionUnknown) return;
        // Stale geometry is of a different alignment or pixel ratio, so it bounds nothing the canvas holds.
        if (this.alignmentStale) {
            this.regionUnknown = true;
            return;
        }
        const x = this.alignedXs[index];
        const y = this.alignedYs[index];
        this.regionMinX = Math.min(this.regionMinX, x);
        this.regionMinY = Math.min(this.regionMinY, y);
        this.regionMaxX = Math.max(this.regionMaxX, x + this.alignedWidths[index]);
        this.regionMaxY = Math.max(this.regionMaxY, y + this.alignedHeights[index]);
    }

    /** The bounds of the cells written since the last paint, or `undefined` when they can't be bounded. */
    override getDirtyRegion(): BBox | undefined {
        if (this.regionUnknown || this.alignmentStale || this.regionMinX > this.regionMaxX) return;
        return new BBox(
            this.regionMinX,
            this.regionMinY,
            this.regionMaxX - this.regionMinX,
            this.regionMaxY - this.regionMinY
        );
    }

    private resetRegion() {
        this.regionMinX = Infinity;
        this.regionMinY = Infinity;
        this.regionMaxX = -Infinity;
        this.regionMaxY = -Infinity;
        this.regionUnknown = false;
    }

    private setPixelRatio(pixelRatio: number) {
        if (pixelRatio === this.pixelRatio) return;
        this.pixelRatio = pixelRatio;
        this.alignmentStale = true;
    }

    private ensureAligned() {
        if (!this.alignmentStale) return;
        this.alignmentStale = false;
        for (let index = 0; index < this.count; index++) this.alignCell(index);
    }

    /** Writes the geometry a cell paints with. A cell with no area paints nothing, as a `Rect` leaves it empty. */
    alignCell(index: number) {
        const { pixelRatio, crisp } = this;
        let x = this.xs[index];
        let y = this.ys[index];
        let width = this.widths[index];
        let height = this.heights[index];

        let microPixelOpacity = 1;
        if (crisp) {
            const pixelSize = 1 / pixelRatio;
            if (width <= pixelSize) microPixelOpacity *= width / pixelSize;
            if (height <= pixelSize) microPixelOpacity *= height / pixelSize;
            width = align(pixelRatio, x, width);
            x = align(pixelRatio, x);
            height = align(pixelRatio, y, height);
            y = align(pixelRatio, y);
        }
        this.alignedXs[index] = x;
        this.alignedYs[index] = y;
        this.alignedWidths[index] = width;
        this.alignedHeights[index] = height;
        this.microPixelOpacities[index] = microPixelOpacity;
    }

    /** One dirty notification for any number of `set` calls; the layer repaints whole. */
    commit() {
        this.markDirty();
    }

    readCell(index: number) {
        return {
            x: this.xs[index],
            y: this.ys[index],
            width: this.widths[index],
            height: this.heights[index],
            fill: this.fills[index],
            opacity: this.opacities[index],
        };
    }

    override preRender(renderCtx: RenderContext) {
        this.setPixelRatio(renderCtx.devicePixelRatio);
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
        // A shadow mask holds only what casts a shadow, and a plain cell casts none.
        if (shadowPass.state !== 'mask') {
            this.paint(renderCtx);
            // Whatever was written has now been painted, whether over the region alone or over the whole layer.
            this.resetRegion();
        }
        super.render(renderCtx);
    }

    private paint({ ctx, devicePixelRatio, dirtyRegion }: RenderContext) {
        this.setPixelRatio(devicePixelRatio);
        this.ensureAligned();
        const { fills, opacities, microPixelOpacities, alignedXs, alignedYs, alignedWidths, alignedHeights, count } =
            this;
        const baseAlpha = ctx.globalAlpha;
        let lastFill: string | undefined;

        // OPTIMIZATION: skip cells outside a partial repaint's region; those that reach it paint in order, as in a full one.
        let regionMinX = -Infinity;
        let regionMinY = -Infinity;
        let regionMaxX = Infinity;
        let regionMaxY = Infinity;
        let culling = false;
        let scaleX = 1;
        let scaleY = 1;
        let translateX = 0;
        let translateY = 0;
        if (dirtyRegion != null) {
            const { a, b, c, d, e, f } = ctx.getTransform();
            if (b === 0 && c === 0 && a > 0 && d > 0) {
                regionMinX = dirtyRegion.x - REGION_EPSILON;
                regionMinY = dirtyRegion.y - REGION_EPSILON;
                regionMaxX = dirtyRegion.x + dirtyRegion.width + REGION_EPSILON;
                regionMaxY = dirtyRegion.y + dirtyRegion.height + REGION_EPSILON;
                scaleX = a;
                scaleY = d;
                translateX = e;
                translateY = f;
                culling = true;
            }
        }

        for (let i = 0; i < count; i++) {
            const fill = fills[i];
            const opacity = opacities[i];
            // `Number.isNaN` as well, so a cell with an undefined opacity stays unpainted as a `Rect` leaves it.
            if (fill == null || fill === 'none' || opacity <= 0 || Number.isNaN(opacity)) continue;
            if (this.widths[i] === 0 || this.heights[i] === 0) continue;

            if (culling) {
                const deviceX = alignedXs[i] * scaleX + translateX;
                const deviceY = alignedYs[i] * scaleY + translateY;
                if (
                    deviceX > regionMaxX ||
                    deviceY > regionMaxY ||
                    deviceX + alignedWidths[i] * scaleX < regionMinX ||
                    deviceY + alignedHeights[i] * scaleY < regionMinY
                ) {
                    continue;
                }
            }

            const microPixelOpacity = microPixelOpacities[i];
            const alphaChanged = opacity !== 1 || microPixelOpacity !== 1;
            if (opacity !== 1) ctx.globalAlpha *= opacity;
            if (microPixelOpacity !== 1) ctx.globalAlpha *= microPixelOpacity;
            if (fill !== lastFill) {
                ctx.fillStyle = fill;
                lastFill = fill;
            }
            ctx.fillRect(alignedXs[i], alignedYs[i], alignedWidths[i], alignedHeights[i]);
            if (alphaChanged) ctx.globalAlpha = baseAlpha;
        }
    }

    private cellPathData(index: number) {
        if (this.widths[index] === 0 || this.heights[index] === 0) return '';
        this.ensureAligned();
        const x = this.alignedXs[index];
        const y = this.alignedYs[index];
        const width = this.alignedWidths[index];
        const height = this.alignedHeights[index];
        return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    }

    override serialize(): SerializedNodeState {
        const cells: SerializedRectBatchCell[] = [];
        for (let index = 0; index < this.count; index++) {
            const { x, y, width, height } = this.readCell(index);
            const xValue = this.datums[index]?.xValue;
            cells.push({
                x,
                y,
                width,
                height,
                svgPath: this.cellPathData(index),
                datumId: xValue == null ? undefined : String(xValue),
            });
        }
        return { type: 'rect-batch', props: this.serializeProps(), cells };
    }

    override toSVG(): { elements: SVGElement[]; defs?: SVGElement[] } | undefined {
        if (!this.visible) return;

        const elements: SVGElement[] = [];
        for (let index = 0; index < this.count; index++) {
            const element = createSvgElement('path');
            element.setAttribute('d', this.cellPathData(index));
            element.setAttribute('fill', this.fills[index]);
            element.setAttribute('fill-opacity', String(this.opacities[index]));
            setSvgStrokeAttributes(element, {
                stroke: this.strokes[index],
                strokeWidth: 0,
                strokeOpacity: this.strokeOpacities[index],
            });
            elements.push(element);
        }
        return { elements };
    }
}
