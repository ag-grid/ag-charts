import { type ChartOrProxy, deproxy } from 'ag-charts-community-test';

export type RGB = readonly [number, number, number];

export interface Pixels {
    readonly width: number;
    readonly height: number;
    readonly data: ArrayLike<number>;
}

/** The chart's canvas as RGBA bytes, copied so that it survives the chart being destroyed. */
export function readPixels(chartOrProxy: ChartOrProxy<any>): Pixels {
    const { canvas } = deproxy(chartOrProxy).ctx.scene;
    const { data, width, height } = canvas.context.getImageData(0, 0, canvas.width, canvas.height);
    return { width, height, data: new Uint8ClampedArray(data) };
}

export function pixelAt({ width, data }: Pixels, x: number, y: number): RGB {
    const i = (Math.floor(y) * width + Math.floor(x)) * 4;
    return [data[i], data[i + 1], data[i + 2]];
}

/** The bytes of the `width` by `height` box at (`x`, `y`), for an exact comparison of two renders. */
export function pixelBox(pixels: Pixels, x: number, y: number, width: number, height: number): number[] {
    const out: number[] = [];
    for (let row = Math.floor(y); row < Math.floor(y) + height; row += 1) {
        for (let column = Math.floor(x); column < Math.floor(x) + width; column += 1) {
            out.push(...pixelAt(pixels, column, row));
        }
    }
    return out;
}

export function hexToRgb(hex: string): RGB {
    const value = Number.parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export interface StripColours {
    /** The fill on the lower-coordinate side of the strip. */
    before: RGB;
    /** The fill on the higher-coordinate side of the strip. */
    after: RGB;
    /** The outline colour. Defaults to `#222222`. */
    stroke?: RGB;
    /** The chart background. Defaults to white. */
    background?: RGB;
    /** How many pixels either side of the centre to read. Defaults to 10. */
    reach?: number;
}

export interface StripWidths {
    /** Pixels of chart background in the window, summed to sub-pixel accuracy from the antialiased edges. */
    background: number;
    /** Pixels of outline colour in the window. */
    stroke: number;
}

const STROKE = hexToRgb('#222222');
const WHITE: RGB = [255, 255, 255];

const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const minus = (a: RGB, b: RGB): RGB => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** The least-squares mix of background, outline and fill in a pixel, as an antialiased edge is a blend of at most those. */
function mixOf(pixel: RGB, fill: RGB, stroke: RGB, background: RGB): { background: number; stroke: number } {
    const a = minus(background, stroke);
    const b = minus(fill, stroke);
    const r = minus(pixel, stroke);
    const aa = dot(a, a);
    const ab = dot(a, b);
    const bb = dot(b, b);
    const det = aa * bb - ab * ab;
    let w: number;
    let f: number;
    if (Math.abs(det) < 1e-6) {
        // The fill is a grey on the stroke-background axis: the mix is not separable, so read it all as background.
        w = Math.min(1, Math.max(0, dot(a, r) / aa));
        f = 0;
    } else {
        w = (bb * dot(a, r) - ab * dot(b, r)) / det;
        f = (aa * dot(b, r) - ab * dot(a, r)) / det;
    }
    w = Math.min(1, Math.max(0, w));
    f = Math.min(1 - w, Math.max(0, f));
    return { background: w, stroke: 1 - w - f };
}

/**
 * Sums background and outline pixels along a row (`axis: 'x'`) or column through (`x`, `y`) across a border, with the
 * `before` fill ahead of the centre and `after` behind it. Use a border's middle, clear of where it meets another.
 */
export function measureStrip(
    pixels: Pixels,
    { x, y }: { x: number; y: number },
    axis: 'x' | 'y',
    { before, after, stroke = STROKE, background = WHITE, reach = 10 }: StripColours
): StripWidths {
    const centre = axis === 'x' ? x : y;
    const first = Math.floor(centre) - reach;
    const total: StripWidths = { background: 0, stroke: 0 };
    for (let at = first; at <= Math.floor(centre) + reach; at += 1) {
        const pixel = axis === 'x' ? pixelAt(pixels, at, y) : pixelAt(pixels, x, at);
        const fill = at + 0.5 < centre ? before : after;
        const mix = mixOf(pixel, fill, stroke, background);
        total.background += mix.background;
        total.stroke += mix.stroke;
    }
    return total;
}
