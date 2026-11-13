export type PixelDirection = 'vertical' | 'horizontal';

/** A run of one colour along a line through a chart, in canvas pixels: `[start, end)`. */
export interface PixelRun {
    start: number;
    end: number;
    rgb: string;
}

/** Whether the pixel at byte offset `i` is transparent or white, which is what a chart with no furniture leaves behind. */
export function isBackgroundPixel(data: ArrayLike<number>, i: number) {
    return data[i + 3] === 0 || (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250);
}

/** Canvas position of the centre of the `index`th category (of four, unless `categories` says otherwise). */
export function categoryCentre(img: ImageData, direction: PixelDirection, index: number, categories = 4) {
    return ((direction === 'vertical' ? img.width : img.height) / categories) * (index + 0.5);
}

/** The runs of colour through the centre of one column (or row), ordered by pixel. */
export function pixelRunsThrough(img: ImageData, direction: PixelDirection, category: number): PixelRun[] {
    const { data, width, height } = img;
    const vertical = direction === 'vertical';
    const fixed = Math.round(categoryCentre(img, direction, category));
    const length = vertical ? height : width;
    const out: PixelRun[] = [];
    for (let p = 0; p < length; p++) {
        const i = ((vertical ? p : fixed) * width + (vertical ? fixed : p)) * 4;
        if (isBackgroundPixel(data, i)) continue;
        const rgb = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        const last = out.at(-1);
        if (last?.rgb === rgb && last.end === p) {
            last.end = p + 1;
        } else {
            out.push({ start: p, end: p + 1, rgb });
        }
    }
    return out;
}
