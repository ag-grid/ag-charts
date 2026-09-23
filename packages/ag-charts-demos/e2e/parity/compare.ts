import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Pixel comparison of two screenshots taken in the same run. No golden images are stored: the
// React reference is photographed alongside the port every time, so there is no baseline to churn.

/** How a pair of screenshots is compared and when the comparison passes. */
export interface ComparisonGate {
    /**
     * Per-pixel colour tolerance, as pixelmatch's `threshold`: 0 counts any change, 1 none. The
     * YIQ colour distance is compared against `35215 × threshold²`.
     */
    pixelThreshold: number;
    /** Whether pixels pixelmatch classifies as anti-aliased edges count as differing. */
    includeAntiAliasing: boolean;
    /** Differing pixels, as a ratio of the reference image, above which the comparison fails. */
    maxDiffPixelRatio: number;
}

/**
 * Self-parity: the React app compared with itself, which must be pixel-identical. Every channel of
 * every pixel counts, edges included, so this proves the demos and the harness are deterministic.
 */
export const SELF_PARITY_GATE: ComparisonGate = {
    pixelThreshold: 0,
    includeAntiAliasing: true,
    maxDiffPixelRatio: 0,
};

/**
 * A port against the React reference, calibrated on every committed port (see "What is compared"
 * in README.md). At this threshold the ports that render like the reference differ by at most 41
 * pixels, 0.002% of the screenshot; the ratio gives five times that headroom. The threshold is low
 * enough to count a recolour from #ffffff to #e6e6e6 (0.1 is not), and the ratio is far below
 * one 110×110 block in the tallest screenshot; compare.test.ts proves both.
 */
export const PORT_GATE: ComparisonGate = {
    pixelThreshold: 0.05,
    includeAntiAliasing: false,
    maxDiffPixelRatio: 0.0001,
};

const GAP = 16;
const GAP_COLOUR = [0xff, 0x00, 0xff, 0xff] as const;

export interface Comparison {
    /** Image size of the reference screenshot. */
    width: number;
    height: number;
    /** Image size of the port screenshot. */
    portWidth: number;
    portHeight: number;
    /** Whether the port screenshot has a different size; a comparison then fails outright. */
    sizeMismatch: boolean;
    diffPixels: number;
    totalPixels: number;
    /** `diffPixels / totalPixels`, or 1 on a size mismatch. */
    diffPixelRatio: number;
    /** Same size, and no more than the gate's ratio of pixels differ. */
    passed: boolean;
    /** Highlighted differences; absent on a size mismatch. */
    diff?: Buffer;
    /** Reference on the left, port on the right. */
    sideBySide: Buffer;
}

export function compareScreenshots(reference: Buffer, port: Buffer, gate: ComparisonGate): Comparison {
    const a = PNG.sync.read(reference);
    const b = PNG.sync.read(port);
    const sideBySide = composeSideBySide(a, b);
    const totalPixels = a.width * a.height;

    if (a.width !== b.width || a.height !== b.height) {
        return {
            width: a.width,
            height: a.height,
            portWidth: b.width,
            portHeight: b.height,
            sizeMismatch: true,
            diffPixels: totalPixels,
            totalPixels,
            diffPixelRatio: 1,
            passed: false,
            sideBySide,
        };
    }

    const diff = new PNG({ width: a.width, height: a.height });
    const diffPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
        threshold: gate.pixelThreshold,
        includeAA: gate.includeAntiAliasing,
    });
    const diffPixelRatio = diffPixels / totalPixels;
    return {
        width: a.width,
        height: a.height,
        portWidth: b.width,
        portHeight: b.height,
        sizeMismatch: false,
        diffPixels,
        totalPixels,
        diffPixelRatio,
        passed: diffPixelRatio <= gate.maxDiffPixelRatio,
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
