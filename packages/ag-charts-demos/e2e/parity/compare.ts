import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Pixel comparison of two screenshots taken in the same run. No golden images are stored: the
// React reference is photographed alongside the port every time, so there is no baseline to churn.

/** Pixels differing by more than this ratio of the image fail the comparison. */
export const MAX_DIFF_PIXEL_RATIO = 0.01;

/**
 * Per-pixel colour tolerance (0 exact, 1 anything), and whether anti-aliased edge pixels count.
 * Playwright's own comparator uses these defaults; the harness matches them so a tolerance that
 * passes here means the same thing as in the website's snapshot tests.
 */
const PIXEL_THRESHOLD = 0.2;
const INCLUDE_ANTI_ALIASING = false;

const GAP = 16;
const GAP_COLOUR = [0xff, 0x00, 0xff, 0xff] as const;

export interface Comparison {
    /** Image size of the reference screenshot. */
    width: number;
    height: number;
    /** Whether the port screenshot has a different size; a comparison then fails outright. */
    sizeMismatch: boolean;
    diffPixels: number;
    totalPixels: number;
    /** `diffPixels / totalPixels`, or 1 on a size mismatch. */
    diffPixelRatio: number;
    /** Highlighted differences; absent on a size mismatch. */
    diff?: Buffer;
    /** Reference on the left, port on the right. */
    sideBySide: Buffer;
}

export function compareScreenshots(reference: Buffer, port: Buffer): Comparison {
    const a = PNG.sync.read(reference);
    const b = PNG.sync.read(port);
    const sideBySide = composeSideBySide(a, b);
    const totalPixels = a.width * a.height;

    if (a.width !== b.width || a.height !== b.height) {
        return {
            width: a.width,
            height: a.height,
            sizeMismatch: true,
            diffPixels: totalPixels,
            totalPixels,
            diffPixelRatio: 1,
            sideBySide,
        };
    }

    const diff = new PNG({ width: a.width, height: a.height });
    const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
        threshold: PIXEL_THRESHOLD,
        includeAA: INCLUDE_ANTI_ALIASING,
    });
    return {
        width: a.width,
        height: a.height,
        sizeMismatch: false,
        diffPixels,
        totalPixels,
        diffPixelRatio: diffPixels / totalPixels,
        diff: PNG.sync.write(diff),
        sideBySide,
    };
}

function composeSideBySide(a: PNG, b: PNG): Buffer {
    const width = a.width + GAP + b.width;
    const height = Math.max(a.height, b.height);
    const out = new PNG({ width, height });
    for (let i = 0; i < out.data.length; i += 4) out.data.set(GAP_COLOUR, i);
    blit(out, a, 0);
    blit(out, b, a.width + GAP);
    return PNG.sync.write(out);
}

function blit(target: PNG, source: PNG, offsetX: number) {
    const rowBytes = source.width * 4;
    for (let y = 0; y < source.height; y++) {
        const from = y * rowBytes;
        target.data.set(source.data.subarray(from, from + rowBytes), (y * target.width + offsetX) * 4);
    }
}
