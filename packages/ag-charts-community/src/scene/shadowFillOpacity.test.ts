import { describe, expect, it } from 'vitest';

import type { Rect } from 'ag-charts-core';

import {
    GLOW_CENTRE,
    GLOW_ROUTES,
    GLOW_SCENE_SIZE,
    TRANSLUCENT_BLUE,
    useGlowScenes,
} from '../chart/test/glowGapFixtures';
import { setupMockCanvas } from '../util/test/mockCanvas';
import { box } from '../util/test/shadowPixels';

const { x: CENTRE_X, y: CENTRE_Y } = GLOW_CENTRE;

/** A glow or shadow drawn with no blur, so that the alpha of a pixel is the strength it is cast at. */
const GLOW = { enabled: true, xOffset: 0, yOffset: 0, blur: 0, spread: 8, glow: true as const };
const SHADOW = { enabled: true, fill: 'rgb(255, 0, 0)', xOffset: 70, yOffset: 0, blur: 0 };

// The item is 60 square, so (CENTRE_X + 34, CENTRE_Y) is in the spread of a glow, and (CENTRE_X + 60, CENTRE_Y) in a shadow
// that is offset by 70.
const GLOW_PROBE = [CENTRE_X + 34, CENTRE_Y] as const;
const SHADOW_PROBE = [CENTRE_X + 60, CENTRE_Y] as const;

/** Opaque on the right of the item and clear on the left. */
const FADING = {
    type: 'gradient' as const,
    gradient: 'linear' as const,
    rotation: 90,
    colorStops: [
        { color: 'rgba(0, 0, 255, 0)', stop: 0 },
        { color: 'rgba(0, 0, 255, 1)', stop: 1 },
    ],
};

describe('Glow and shadow strength under the fillOpacity of the item', () => {
    setupMockCanvas(GLOW_SCENE_SIZE);
    const draw = useGlowScenes();

    const item = (mixin: Partial<Rect>) =>
        box(CENTRE_X - 30, CENTRE_Y - 30, 60, 60, { fill: 'rgb(0, 0, 255)', ...mixin });

    describe.each(GLOW_ROUTES)('cast by the %s', (route) => {
        const alphaAt = (probe: readonly [number, number], mixin: Partial<Rect>) =>
            draw(route, item(mixin)).pixelAt(...probe)[3];
        const glowAlpha = (mixin: Partial<Rect>) => alphaAt(GLOW_PROBE, mixin);
        const shadowAlpha = (mixin: Partial<Rect>) => alphaAt(SHADOW_PROBE, mixin);

        it('should cast a glow with a fillOpacity as set, whatever the fillOpacity of the item', () => {
            const glow = { ...GLOW, fill: 'rgb(0, 255, 0)', fillOpacity: 1 };

            expect(glowAlpha({ fillGlow: glow })).toBe(255);
            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBe(255);
        });

        it('should cast a glow in the colour of its item at its own fillOpacity, whatever the alpha of the fill', () => {
            const glow = { ...GLOW, fillOpacity: 0.4 };

            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBeCloseTo(102, -1);
            expect(glowAlpha({ fillGlow: glow, fill: TRANSLUCENT_BLUE })).toBeCloseTo(102, -1);
            expect(glowAlpha({ fillGlow: glow, fillOpacity: 0.5 })).toBe(glowAlpha({ fillGlow: glow }));
        });

        it('should fade a glow with the opacity of the item', () => {
            const glow = { ...GLOW, fill: 'rgb(0, 255, 0)', fillOpacity: 1 };

            expect(glowAlpha({ fillGlow: glow, opacity: 0.5 })).toBeCloseTo(128, -1);
            expect(glowAlpha({ fillGlow: glow, opacity: 0.5, fillOpacity: 0.5 })).toBeCloseTo(128, -1);
        });

        it('should cast a shadow with a set fillOpacity as set, whatever the fillOpacity of the item', () => {
            const shadow = { ...SHADOW, fillOpacity: 1, fillOpacitySet: true as const };

            expect(shadowAlpha({ fillShadow: shadow })).toBe(255);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5 })).toBe(255);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5, opacity: 0.5 })).toBeCloseTo(128, -1);
        });

        it('should cast a shadow with no set fillOpacity at its fillOpacity times that of the item', () => {
            const shadow = { ...SHADOW, fillOpacity: 0.5 };

            expect(shadowAlpha({ fillShadow: shadow })).toBeCloseTo(128, -1);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5 })).toBeCloseTo(64, -1);
        });

        describe('over a fill whose alpha varies across the item', () => {
            const setShadow = { ...SHADOW, fillOpacity: 1, fillOpacitySet: true as const };

            it('should cast a set shadow of a gradient with an opaque stop as set, with no spread', () => {
                expect(shadowAlpha({ fillShadow: setShadow, fill: FADING })).toBe(255);
                expect(shadowAlpha({ fillShadow: setShadow, fill: FADING, opacity: 0.5 })).toBeCloseTo(128, -1);
            });

            it('should cast a set shadow of a gradient with an opaque stop as set, with a spread', () => {
                const spread = { ...setShadow, spread: 4 };

                expect(shadowAlpha({ fillShadow: spread, fill: FADING })).toBe(255);
            });

            it('should cast a shadow with no set fillOpacity at the alpha of the gradient, as before', () => {
                const alpha = shadowAlpha({ fillShadow: { ...SHADOW, fillOpacity: 1 }, fill: FADING });

                expect(alpha).toBeGreaterThan(0);
                expect(alpha).toBeLessThan(200);
            });

            it('should cast a glow around a gradient with an opaque stop as around an opaque item', () => {
                const glow = { ...GLOW, fill: 'rgb(255, 0, 0)', fillOpacity: 1, blur: 8, spread: 0 };
                const leftEdge = [CENTRE_X - 32, CENTRE_Y] as const;
                const opaque = alphaAt(leftEdge, { fillGlow: glow });

                expect(opaque).toBeGreaterThan(0);
                expect(alphaAt(leftEdge, { fillGlow: glow, fill: FADING })).toBeCloseTo(opaque, -1);
            });
        });
    });

    describe('cast by the item itself, with no root or group to batch it', () => {
        const setShadow = { ...SHADOW, fillOpacity: 1, fillOpacitySet: true as const };
        const shadowAlpha = (mixin: Partial<Rect>) => draw('self', item(mixin)).pixelAt(...SHADOW_PROBE)[3];

        it('should cast a set shadow with no spread as set, whatever the fillOpacity of the item', () => {
            expect(shadowAlpha({ fillShadow: setShadow })).toBe(255);
            expect(shadowAlpha({ fillShadow: setShadow, fillOpacity: 0.5 })).toBe(255);
            expect(shadowAlpha({ fillShadow: setShadow, fill: TRANSLUCENT_BLUE })).toBe(255);
        });

        it('should fade a set shadow with the opacity of the item', () => {
            expect(shadowAlpha({ fillShadow: setShadow, fillOpacity: 0.5, opacity: 0.5 })).toBeCloseTo(128, -1);
        });

        it('should cast a set shadow of a gradient with an opaque stop as set', () => {
            expect(shadowAlpha({ fillShadow: setShadow, fill: FADING })).toBe(255);
        });

        it('should cast a shadow with no set fillOpacity at its fillOpacity times that of the item', () => {
            const shadow = { ...SHADOW, fillOpacity: 0.5 };

            expect(shadowAlpha({ fillShadow: shadow })).toBeCloseTo(128, -1);
            expect(shadowAlpha({ fillShadow: shadow, fillOpacity: 0.5 })).toBeCloseTo(64, -1);
        });
    });
});
