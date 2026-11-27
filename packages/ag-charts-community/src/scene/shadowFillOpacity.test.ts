import { describe, expect, it } from 'vitest';

import type { Rect } from 'ag-charts-core';

import {
    FADING,
    GLOW_CENTRE,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    type ShadowRoute,
    TRANSLUCENT_BLUE,
    useGlowScenes,
} from '../chart/test/glowGapFixtures';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { resetMockConsole } from '../util/test/mockConsole';
import { box } from '../util/test/shadowPixels';

const { x: CENTRE_X, y: CENTRE_Y } = GLOW_CENTRE;

/** A glow or shadow drawn with no blur, so that the alpha of a pixel is the strength it is cast at. */
const GLOW = { enabled: true, xOffset: 0, yOffset: 0, blur: 0, spread: 8, glow: true as const };
const SHADOW = { enabled: true, fill: 'rgb(255, 0, 0)', xOffset: 70, yOffset: 0, blur: 0 };

// The item is 60 square, so (CENTRE_X + 34, CENTRE_Y) is in the spread of a glow, and (CENTRE_X + 60, CENTRE_Y) in a shadow
// that is offset by 70.
const GLOW_PROBE = [CENTRE_X + 34, CENTRE_Y] as const;
const SHADOW_PROBE = [CENTRE_X + 60, CENTRE_Y] as const;

/** Every route that casts a shadow, including the item casting its own. */
const SHADOW_ROUTES: readonly ShadowRoute[] = [...GLOW_ROUTES, 'self'];

/** The same colour and alpha as `TRANSLUCENT_BLUE`, as an object fill. */
const TRANSLUCENT_SOLID = { type: 'solid' as const, fill: 'rgb(0, 0, 255)', fillOpacity: 0.5 };

/** A tile that is too small to draw, which a shape replaces with its plain fill. */
const TINY_PATTERN = {
    type: 'pattern' as const,
    pattern: 'squares' as const,
    width: 1,
    height: 1,
    scale: 0.5,
    strokeWidth: 0,
};

/** Squares with gaps between them, which a shadow that follows the paint leaves clear. */
const SQUARES = {
    type: 'pattern' as const,
    pattern: 'squares' as const,
    width: 10,
    height: 10,
    fill: 'rgb(0, 0, 255)',
    backgroundFill: 'none',
    strokeWidth: 0,
};

describe('Glow and shadow strength under the fillOpacity of the item', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    const item = (mixin: Partial<Rect>) =>
        box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, { fill: 'rgb(0, 0, 255)', ...mixin });

    describe.each(GLOW_ROUTES)('glow cast by the %s', (route) => {
        const glowAlpha = (mixin: Partial<Rect>) => draw(route, item(mixin)).pixelAt(...GLOW_PROBE)[3];

        it('should cast a glow with a fillOpacity as set, whatever the fillOpacity of the item', () => {
            const glow = { ...GLOW, fill: 'rgb(0, 255, 0)', fillOpacity: 1 };

            expect(glowAlpha({ fillGlow: glow })).toBe(255);
            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBe(255);
            expect(glowAlpha({ fillGlow: glow, fill: TRANSLUCENT_SOLID })).toBe(255);
        });

        it('should cast a glow in the colour of its item at its own fillOpacity, whatever the alpha of the fill', () => {
            const glow = { ...GLOW, fillOpacity: 0.4 };

            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBeCloseTo(102, -1);
            expect(glowAlpha({ fillGlow: glow, fill: TRANSLUCENT_BLUE })).toBeCloseTo(102, -1);
            expect(glowAlpha({ fillGlow: glow, fill: TRANSLUCENT_SOLID })).toBeCloseTo(102, -1);
            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBe(glowAlpha({ fillGlow: glow }));
        });

        it('should cast a glow with no spread around an object fill with alpha as around the same string fill', () => {
            // With no spread the glow is cast at its own alpha only when the fill is not uniformly opaque.
            const undilated = { ...GLOW, fill: 'rgb(0, 255, 0)', blur: 8, spread: 0 };

            for (const fillOpacity of [1, 0.4]) {
                const glow = { ...undilated, fillOpacity };
                const opaque = glowAlpha({ fillGlow: glow });

                expect(opaque).toBeGreaterThan(0);
                expect(glowAlpha({ fillGlow: glow, fill: TRANSLUCENT_BLUE })).toBe(opaque);
                expect(glowAlpha({ fillGlow: glow, fill: TRANSLUCENT_SOLID })).toBe(opaque);
            }
        });

        it('should fade a glow with the opacity of the item', () => {
            const glow = { ...GLOW, fill: 'rgb(0, 255, 0)', fillOpacity: 1 };

            expect(glowAlpha({ fillGlow: glow, opacity: 0.5 })).toBeCloseTo(128, -1);
            expect(glowAlpha({ fillGlow: glow, opacity: 0.5, fillOpacity: 0.5 })).toBeCloseTo(128, -1);
        });

        it('should cast a glow around a gradient with an opaque stop as around an opaque item', () => {
            const glow = { ...GLOW, fill: 'rgb(255, 0, 0)', fillOpacity: 1, blur: 8, spread: 0 };
            const leftEdge = [CENTRE_X - 32, CENTRE_Y] as const;
            const alphaAtEdge = (mixin: Partial<Rect>) => draw(route, item(mixin)).pixelAt(...leftEdge)[3];
            const opaque = alphaAtEdge({ fillGlow: glow });

            expect(opaque).toBeGreaterThan(0);
            expect(alphaAtEdge({ fillGlow: glow, fill: FADING })).toBeCloseTo(opaque, -1);
        });
    });

    describe.each(SHADOW_ROUTES)('shadow cast by the %s', (route) => {
        const shadowAlpha = (mixin: Partial<Rect>) => draw(route, item(mixin)).pixelAt(...SHADOW_PROBE)[3];
        const setShadow = { ...SHADOW, fillOpacity: 1, _fillOpacitySet: true as const };

        it('should cast a shadow with a set fillOpacity as set, whatever the fillOpacity of the item', () => {
            expect(shadowAlpha({ fillShadow: setShadow })).toBe(255);
            expect(shadowAlpha({ fillShadow: setShadow, fillOpacity: 0.5 })).toBe(255);
            expect(shadowAlpha({ fillShadow: setShadow, fill: TRANSLUCENT_BLUE })).toBe(255);
            expect(shadowAlpha({ fillShadow: setShadow, fill: TRANSLUCENT_SOLID })).toBe(255);
            expect(shadowAlpha({ fillShadow: setShadow, fillOpacity: 0.5, opacity: 0.5 })).toBeCloseTo(128, -1);
        });

        it('should cast a shadow with no set fillOpacity at its fillOpacity times that of the item', () => {
            const shadow = { ...SHADOW, fillOpacity: 0.5 };

            expect(shadowAlpha({ fillShadow: shadow })).toBeCloseTo(128, -1);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5 })).toBeCloseTo(64, -1);
            expect(shadowAlpha({ fillShadow: shadow, fill: TRANSLUCENT_SOLID })).toBe(
                shadowAlpha({ fillShadow: shadow, fill: TRANSLUCENT_BLUE })
            );
        });

        describe('over a fill whose alpha varies across the item', () => {
            it('should cast a set shadow of a gradient with an opaque stop as set, with no spread', () => {
                expect(shadowAlpha({ fillShadow: setShadow, fill: FADING })).toBe(255);
                expect(shadowAlpha({ fillShadow: setShadow, fill: FADING, opacity: 0.5 })).toBeCloseTo(128, -1);
            });

            it('should cast a set shadow of a gradient with an opaque stop as set, with a spread', () => {
                expect(shadowAlpha({ fillShadow: { ...setShadow, spread: 4 }, fill: FADING })).toBe(255);
            });

            it('should cast a shadow with no set fillOpacity at the alpha of the gradient, as before', () => {
                const alpha = shadowAlpha({ fillShadow: { ...SHADOW, fillOpacity: 1 }, fill: FADING });

                expect(alpha).toBeGreaterThan(0);
                expect(alpha).toBeLessThan(200);
            });
        });

        // `castsOverFillAlpha` classifies each kind of paint: a plain colour and a gradient above, and a pattern and an image below.
        // A shadow cast solid has no gaps, so the weakest pixel over a stretch of it is read, which one that follows the squares fails.
        describe('over a pattern or an image', () => {
            const WINDOW = [-6, -4, -2, 0, 2, 4, 6];
            const solidAlpha = (mixin: Partial<Rect>) => {
                const { pixelAt } = draw(route, item(mixin));
                const [x, y] = SHADOW_PROBE;
                return Math.min(...WINDOW.flatMap((dx) => WINDOW.map((dy) => pixelAt(x + dx, y + dy)[3])));
            };

            const NOT_OPAQUE = [
                ['a pattern with no background', SQUARES],
                [
                    'a pattern with a translucent background',
                    { ...SQUARES, fill: 'none', backgroundFill: 'rgba(0, 0, 255, 0.5)' },
                ],
                [
                    'a pattern too small to draw, over a translucent fill',
                    { ...TINY_PATTERN, fill: 'rgba(0, 0, 255, 0.5)' },
                ],
                [
                    'a pattern too small to draw, over a translucent fill and an opaque background',
                    { ...TINY_PATTERN, fill: 'rgba(0, 0, 255, 0.5)', backgroundFill: 'rgb(0, 0, 0)' },
                ],
                ['an image with no background', { type: 'image' as const, url: 'image.png', backgroundFill: 'none' }],
            ] as const;
            const OPAQUE = [
                ['a pattern with an opaque background', { ...SQUARES, backgroundFill: 'rgb(0, 0, 255)' }],
                ['a pattern too small to draw, over an opaque fill', { ...TINY_PATTERN, fill: 'rgb(0, 0, 255)' }],
            ] as const;

            it.each([...NOT_OPAQUE, ...OPAQUE])('should cast a set shadow solid, with %s', (_name, fill) => {
                expect(solidAlpha({ fillShadow: setShadow, fill })).toBe(255);
                expect(solidAlpha({ fillShadow: setShadow, fill, fillOpacity: 0.5 })).toBe(255);
                expect(solidAlpha({ fillShadow: setShadow, fill, opacity: 0.5 })).toBeCloseTo(128, -1);
                // The tile that is too small to draw is warned about, and that is not what is under test.
                resetMockConsole();
            });

            it('should leave the gaps of a pattern with no background clear in a shadow with no set fillOpacity', () => {
                expect(solidAlpha({ fillShadow: { ...SHADOW, fillOpacity: 1 }, fill: SQUARES })).toBe(0);
            });
        });
    });
});
