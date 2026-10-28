import { describe, expect, it } from 'vitest';

import type { ResolvedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import { getShadowColour, getSolidColour, scaleColourAlpha, withShadowFill } from './shadowColour';

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
