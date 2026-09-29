import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';

import { type ComparisonGate, PORT_GATE, SELF_PARITY_GATE, compareScreenshots } from './compare';

// Synthetic screenshots, sized like the parity viewports, proving what each gate catches.

type Rgb = readonly [number, number, number];
type Paint = (x: number, y: number) => Rgb;

const WHITE: Rgb = [0xff, 0xff, 0xff];
const LIGHT_GREY: Rgb = [0xe6, 0xe6, 0xe6];
const BLUE: Rgb = [0x50, 0x90, 0xdc];
const LIGHTER_BLUE: Rgb = [0x6a, 0xa8, 0xf0];

/** The gate the harness shipped with first, which every case below passed. */
const LOOSE_GATE: ComparisonGate = { pixelThreshold: 0.2, includeAntiAliasing: false, maxDiffPixelRatio: 0.01 };

function png(width: number, height: number, paint: Paint): Buffer {
    const image = new PNG({ width, height });
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const [r, g, b] = paint(x, y);
            image.data.set([r, g, b, 0xff], (y * width + x) * 4);
        }
    }
    return PNG.sync.write(image);
}

const fill =
    (colour: Rgb): Paint =>
    () =>
        colour;

/** A page-like image: a white background with a row of blue bars along the bottom half. */
const bars =
    (background: Rgb, bar: Rgb): Paint =>
    (x, y) =>
        y > 450 && x % 60 < 40 ? bar : background;

/** `paint`, with the `size`×`size` square at (`left`, `top`) painted white: a missing block. */
const withHole =
    (paint: Paint, left: number, top: number, size: number): Paint =>
    (x, y) =>
        x >= left && x < left + size && y >= top && y < top + size ? WHITE : paint(x, y);

describe('compareScreenshots', () => {
    const reference = png(1440, 900, bars(WHITE, BLUE));

    it('passes identical images under both gates', () => {
        for (const gate of [PORT_GATE, SELF_PARITY_GATE]) {
            const comparison = compareScreenshots(reference, png(1440, 900, bars(WHITE, BLUE)), gate);
            expect(comparison).toMatchObject({ sizeMismatch: false, diffPixels: 0, passed: true });
        }
    });

    describe.each([
        ['#5090dc to #6aa8f0', fill(BLUE), fill(LIGHTER_BLUE)],
        ['#ffffff to #e6e6e6', fill(WHITE), fill(LIGHT_GREY)],
        ['the bars from #5090dc to #6aa8f0', bars(WHITE, BLUE), bars(WHITE, LIGHTER_BLUE)],
        ['the background from #ffffff to #e6e6e6', bars(WHITE, BLUE), bars(LIGHT_GREY, BLUE)],
    ])('a recolour of %s', (_name, before, after) => {
        const a = png(1440, 900, before);
        const b = png(1440, 900, after);

        it('fails the port gate', () => {
            expect(compareScreenshots(a, b, PORT_GATE).passed).toBe(false);
        });

        it('passed the loose gate, which this replaces', () => {
            expect(compareScreenshots(a, b, LOOSE_GATE).passed).toBe(true);
        });
    });

    describe.each([
        [1440, 900],
        [1024, 768],
        // Taller than any state's content grows the viewport to, where a block is the smallest share.
        [1440, 4000],
    ])('a missing 110×110 block at %i×%i', (width, height) => {
        it('fails the port gate', () => {
            const comparison = compareScreenshots(
                png(width, height, fill(BLUE)),
                png(width, height, withHole(fill(BLUE), 200, 200, 110)),
                PORT_GATE
            );
            expect(comparison.diffPixels).toBe(110 * 110);
            expect(comparison.passed).toBe(false);
        });
    });

    it('passed a missing 110×110 block under the loose gate, which this replaces', () => {
        const comparison = compareScreenshots(
            png(1440, 900, fill(BLUE)),
            png(1440, 900, withHole(fill(BLUE), 200, 200, 110)),
            LOOSE_GATE
        );
        expect(comparison.diffPixels).toBe(110 * 110);
        expect(comparison.passed).toBe(true);
    });

    it('fails a different size under both gates, whatever the content', () => {
        for (const gate of [PORT_GATE, SELF_PARITY_GATE]) {
            const comparison = compareScreenshots(reference, png(1440, 1200, bars(WHITE, BLUE)), gate);
            expect(comparison).toMatchObject({ sizeMismatch: true, diffPixelRatio: 1, passed: false });
            expect(comparison).toMatchObject({ width: 1440, height: 900, portWidth: 1440, portHeight: 1200 });
        }
    });

    it('fails self-parity on a single pixel one level apart', () => {
        const nudged = png(1440, 900, (x, y) =>
            x === 700 && y === 100 ? [0xfe, 0xff, 0xff] : bars(WHITE, BLUE)(x, y)
        );
        expect(compareScreenshots(reference, nudged, SELF_PARITY_GATE)).toMatchObject({ diffPixels: 1, passed: false });
        expect(compareScreenshots(reference, nudged, PORT_GATE)).toMatchObject({ diffPixels: 0, passed: true });
    });
});
