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
    /** Fill opacity and style opacity, combined as a `Rect` does. */
    private opacities = new Float64Array(0);
    /** Only the SVG form reads this: a plain cell has no stroke to paint. */
    private strokeOpacities = new Float64Array(0);
    private fills: string[] = [];
    private count = 0;
    private pixelRatio = 1;

    /** Whether cells snap to the device pixel grid, as a crisp `Rect` does. */
    crisp = true;

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
        }
        this.fills.length = count;
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
        strokeOpacity: number
    ) {
        this.xs[index] = x;
        this.ys[index] = y;
        this.widths[index] = width;
        this.heights[index] = height;
        this.fills[index] = fill;
        this.opacities[index] = opacity;
        this.strokeOpacities[index] = strokeOpacity;
    }

    /** One dirty notification for any number of `set` calls. */
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
        this.pixelRatio = renderCtx.devicePixelRatio;
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
        }
        super.render(renderCtx);
    }

    private paint({ ctx, devicePixelRatio: pixelRatio }: RenderContext) {
        const { fills, opacities, count } = this;
        this.pixelRatio = pixelRatio;
        const baseAlpha = ctx.globalAlpha;
        let lastFill: string | undefined;

        for (let i = 0; i < count; i++) {
            const fill = fills[i];
            const opacity = opacities[i];
            // `Number.isNaN` as well, so a cell with an undefined opacity stays unpainted as a `Rect` leaves it.
            if (fill == null || fill === 'none' || opacity <= 0 || Number.isNaN(opacity)) continue;

            const cell = this.alignedCell(i);
            if (cell == null) continue;

            const alphaChanged = opacity !== 1 || cell.microPixelOpacity !== 1;
            if (opacity !== 1) ctx.globalAlpha *= opacity;
            if (cell.microPixelOpacity !== 1) ctx.globalAlpha *= cell.microPixelOpacity;
            if (fill !== lastFill) {
                ctx.fillStyle = fill;
                lastFill = fill;
            }
            ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
            if (alphaChanged) ctx.globalAlpha = baseAlpha;
        }
    }

    /** The geometry a cell paints with, or `undefined` for a cell with no area, which a `Rect` leaves empty. */
    private alignedCell(index: number) {
        const { pixelRatio, crisp } = this;
        let x = this.xs[index];
        let y = this.ys[index];
        let width = this.widths[index];
        let height = this.heights[index];
        if (width === 0 || height === 0) return undefined;

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
        return { x, y, width, height, microPixelOpacity };
    }

    private cellPathData(index: number) {
        const cell = this.alignedCell(index);
        if (cell == null) return '';
        const { x, y, width, height } = cell;
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
                stroke: undefined,
                strokeWidth: 0,
                strokeOpacity: this.strokeOpacities[index],
            });
            elements.push(element);
        }
        return { elements };
    }
}
