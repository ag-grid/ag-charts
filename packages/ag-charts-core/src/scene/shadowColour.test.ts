import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ResolvedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import {
    canTintShadows,
    getShadowColour,
    getSolidColour,
    overrideTintableShadows,
    scaleColourAlpha,
    withShadowFill,
} from './shadowColour';

const shadow = (fill: string, fillOpacity?: number): ResolvedDropShadowOptions => ({
    enabled: true,
    fill,
    fillOpacity,
    xOffset: 0,
    yOffset: 0,
    blur: 0,
});

describe('getShadowColour', () => {
    it('casts the fill as it is written at the default fillOpacity', () => {
        expect(getShadowColour(shadow('#112233'))).toBe('#112233');
        expect(getShadowColour(shadow('rgba(1, 2, 3, 0.5)', 1))).toBe('rgba(1, 2, 3, 0.5)');
    });

    it('applies fillOpacity to an opaque fill', () => {
        expect(getShadowColour(shadow('#ff0000', 0.5))).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('multiplies fillOpacity into any alpha that the fill already has', () => {
        expect(getShadowColour(shadow('rgba(255, 0, 0, 0.5)', 0.5))).toBe('rgba(255, 0, 0, 0.25)');
        expect(getShadowColour(shadow('#ff000080', 0.5))).toMatch(/^rgba\(255, 0, 0, 0\.25\d*\)$/);
    });

    it('casts nothing visible at a fillOpacity of 0', () => {
        expect(getShadowColour(shadow('#ff0000', 0))).toBe('rgba(255, 0, 0, 0)');
    });

    it('keeps the fill if it cannot be read', () => {
        expect(getShadowColour(shadow('not-a-colour', 0.5))).toBe('not-a-colour');
    });

    it('follows a change of fill or fillOpacity on the same shadow object', () => {
        const mutable = shadow('#ff0000', 0.5);
        expect(getShadowColour(mutable)).toBe('rgba(255, 0, 0, 0.5)');

        mutable.fillOpacity = 0.25;
        expect(getShadowColour(mutable)).toBe('rgba(255, 0, 0, 0.25)');

        mutable.fill = '#0000ff';
        expect(getShadowColour(mutable)).toBe('rgba(0, 0, 255, 0.25)');
    });
});

describe('scaleColourAlpha', () => {
    it('scales the alpha of a colour', () => {
        expect(scaleColourAlpha('rgba(0, 0, 0, 0.5)', 0.5)).toBe('rgba(0, 0, 0, 0.25)');
    });

    it('returns undefined for a colour that cannot be read', () => {
        expect(scaleColourAlpha('nonsense', 0.5)).toBeUndefined();
    });
});

describe('withShadowFill', () => {
    const base = { enabled: true, fillOpacity: 0.4, xOffset: 0, yOffset: 0, blur: 2, spread: 4 };

    it('adds the fill and keeps every other field', () => {
        expect(withShadowFill(base, 'red')).toEqual({ ...base, fill: 'red' });
    });

    it('shares one object for each fill, so that casters of one fill join one shadow key', () => {
        expect(withShadowFill(base, 'red')).toBe(withShadowFill(base, 'red'));
        expect(withShadowFill(base, 'red')).not.toBe(withShadowFill(base, 'blue'));
    });

    it('does not share objects between different shadows', () => {
        expect(withShadowFill({ ...base }, 'red')).not.toBe(withShadowFill({ ...base }, 'red'));
    });

    it('forgets the oldest fill rather than all of them when a shadow takes more than it remembers', () => {
        const first = withShadowFill(base, 'rgb(0, 0, 0)');
        const second = withShadowFill(base, 'rgb(1, 0, 0)');
        for (let i = 2; i < 256; i++) withShadowFill(base, `rgb(${i}, 0, 0)`);

        withShadowFill(base, 'rgb(0, 1, 0)');
        expect(withShadowFill(base, 'rgb(1, 0, 0)')).toBe(second);
        expect(withShadowFill(base, 'rgb(0, 0, 0)')).not.toBe(first);
    });

    it('stays correct when a shadow takes more fills than it remembers', () => {
        for (let i = 0; i < 600; i++) {
            expect(withShadowFill(base, `rgb(${i % 256}, ${Math.floor(i / 256)}, 0)`).fill).toBe(
                `rgb(${i % 256}, ${Math.floor(i / 256)}, 0)`
            );
        }
    });
});

describe('getSolidColour', () => {
    it('returns a solid colour as it is', () => {
        expect(getSolidColour('#abcdef')).toBe('#abcdef');
        expect(getSolidColour('rgba(1, 2, 3, 0.5)')).toBe('rgba(1, 2, 3, 0.5)');
    });

    it('returns nothing for no paint, a transparent colour or an unreadable one', () => {
        expect(getSolidColour(undefined)).toBeUndefined();
        expect(getSolidColour(null)).toBeUndefined();
        expect(getSolidColour('transparent')).toBeUndefined();
        expect(getSolidColour('rgba(0, 0, 0, 0)')).toBeUndefined();
        expect(getSolidColour('nonsense')).toBeUndefined();
    });

    it('returns nothing for a colour painted at no opacity, and for a NaN opacity', () => {
        expect(getSolidColour('red', 0)).toBeUndefined();
        expect(getSolidColour('red', Number.NaN)).toBeUndefined();
        expect(getSolidColour('red', 0.1)).toBe('red');
    });

    it('returns a solid colour for a gradient and a pattern, and nothing for an image', () => {
        const gradient = {
            type: 'gradient',
            colorStops: [
                { color: 'red', stop: 0 },
                { color: 'blue', stop: 1 },
            ],
        };
        expect(getSolidColour(gradient)).toBe('red');
        expect(getSolidColour({ type: 'gradient', colorStops: [] })).toBeUndefined();
        expect(getSolidColour({ type: 'pattern', fill: 'green' })).toBe('green');
        expect(getSolidColour({ type: 'image', url: 'x.png' })).toBeUndefined();
    });
});

describe('canTintShadows', () => {
    const CENTRE_ALPHA = 3 + 4 * 4;
    const LEFT_ALPHA = 3 + 4 * 3;

    /** A 3x3 canvas whose context reports `pixels` back as its image data, whatever is drawn to it. */
    function stubCanvas(options: {
        filter?: boolean;
        centre?: number;
        left?: number;
        context?: null;
        throws?: 'construct' | 'read';
    }) {
        const { filter = true, centre = 255, left = 0, context, throws } = options;
        const data = new Uint8ClampedArray(3 * 3 * 4);
        data[CENTRE_ALPHA] = centre;
        data[LEFT_ALPHA] = left;

        const ctx: Record<string, unknown> = {
            fillRect: vi.fn(),
            getImageData: vi.fn(() => {
                if (throws === 'read') throw new Error('read failed');
                return { data };
            }),
        };
        if (filter) ctx.filter = 'none';

        const constructed = vi.fn();
        class FakeOffscreenCanvas {
            constructor(width: number, height: number) {
                constructed(width, height);
                if (throws === 'construct') throw new Error('no canvas');
            }
            getContext() {
                return context === null ? null : ctx;
            }
        }
        vi.stubGlobal('OffscreenCanvas', FakeOffscreenCanvas);
        return { ctx, constructed };
    }

    afterEach(() => {
        vi.unstubAllGlobals();
        overrideTintableShadows();
    });

    it('is false for a context with no filter property', () => {
        overrideTintableShadows();
        stubCanvas({ filter: false, centre: 100, left: 100 });
        expect(canTintShadows()).toBe(false);
    });

    it('is false for a filter that is accepted but does not blur', () => {
        overrideTintableShadows();
        stubCanvas({ centre: 255, left: 0 });
        expect(canTintShadows()).toBe(false);
    });

    it('is false if the blur leaves the pixel opaque, or does not reach its neighbour', () => {
        overrideTintableShadows();
        stubCanvas({ centre: 255, left: 80 });
        expect(canTintShadows()).toBe(false);

        overrideTintableShadows();
        stubCanvas({ centre: 120, left: 0 });
        expect(canTintShadows()).toBe(false);
    });

    it('is true for a filter that blurs the pixel into its neighbour', () => {
        overrideTintableShadows();
        const { ctx, constructed } = stubCanvas({ centre: 120, left: 60 });
        expect(canTintShadows()).toBe(true);
        expect(constructed).toHaveBeenCalledWith(3, 3);
        expect(ctx.filter).toBe('blur(1px)');
        expect(ctx.fillRect).toHaveBeenCalledWith(1, 1, 1, 1);
    });

    it('is false without a 2d context, and if the canvas throws', () => {
        overrideTintableShadows();
        stubCanvas({ context: null });
        expect(canTintShadows()).toBe(false);

        overrideTintableShadows();
        stubCanvas({ throws: 'construct' });
        expect(canTintShadows()).toBe(false);

        overrideTintableShadows();
        stubCanvas({ throws: 'read', centre: 120, left: 60 });
        expect(canTintShadows()).toBe(false);
    });

    it('probes once, and probes again after the override is cleared', () => {
        overrideTintableShadows();
        const { constructed } = stubCanvas({ centre: 120, left: 60 });
        expect(canTintShadows()).toBe(true);
        expect(canTintShadows()).toBe(true);
        expect(constructed).toHaveBeenCalledTimes(1);

        overrideTintableShadows(false);
        expect(canTintShadows()).toBe(false);
        expect(constructed).toHaveBeenCalledTimes(1);

        overrideTintableShadows();
        expect(canTintShadows()).toBe(true);
        expect(constructed).toHaveBeenCalledTimes(2);
    });
});
