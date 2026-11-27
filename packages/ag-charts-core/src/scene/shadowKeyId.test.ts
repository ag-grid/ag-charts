import { describe, expect, it } from 'vitest';

import type { NormalisedDropShadowOptions } from '../options/normalised/normalisedCommonOptions';
import { sameShadow, shadowKeyId } from './shadowEngine';

const BASE: NormalisedDropShadowOptions = { enabled: true, fill: 'red', xOffset: 2, yOffset: 3, blur: 4 };

/** Each compared option, set to a value that is not the default, and to values that are, or spell the default another way. */
const VARIANTS: NormalisedDropShadowOptions[] = [
    BASE,
    { ...BASE, fillOpacity: 1 },
    { ...BASE, fillOpacity: undefined },
    { ...BASE, fillOpacity: 0.5 },
    { ...BASE, spread: 0 },
    { ...BASE, spread: undefined },
    { ...BASE, spread: 3 },
    { ...BASE, gap: undefined },
    { ...BASE, gap: 0 },
    { ...BASE, gap: 2 },
    { ...BASE, overlay: true },
    { ...BASE, selfCut: true },
    { ...BASE, overlay: true, selfCut: true },
    { ...BASE, fill: 'blue' },
    { ...BASE, xOffset: 0 },
    { ...BASE, yOffset: 0 },
    { ...BASE, blur: 0 },
    // Options that do not change how a shadow casts.
    { ...BASE, enabled: false },
    { ...BASE, glow: true },
    { ...BASE, fillOpacitySet: true },
    { ...BASE, cutOnly: true },
    { ...BASE, ownCut: true },
];

describe('shadowKeyId', () => {
    it('should give shadows that cast alike one id, and the others another, as sameShadow decides', () => {
        for (const a of VARIANTS) {
            for (const b of VARIANTS) {
                // Two shadows that are alike must share a key, and an id that told them apart would split it.
                if (sameShadow(a, b)) expect(shadowKeyId(a)).toBe(shadowKeyId(b));
            }
        }
    });

    it('should separate every option that sameShadow compares', () => {
        const compared: Partial<NormalisedDropShadowOptions>[] = [
            { fill: 'blue' },
            { fillOpacity: 0.5 },
            { xOffset: 0 },
            { yOffset: 0 },
            { blur: 0 },
            { spread: 3 },
            { gap: 0 },
            { overlay: true },
            { selfCut: true },
        ];
        for (const change of compared) {
            const changed = { ...BASE, ...change };
            expect(sameShadow(BASE, changed)).toBe(false);
            expect(shadowKeyId(changed)).not.toBe(shadowKeyId(BASE));
        }
    });

    it('should tell a gap that is unset from a gap of 0, as sameShadow does', () => {
        const unset = { ...BASE, gap: undefined };
        const cut = { ...BASE, gap: 0 };
        expect(sameShadow(unset, cut)).toBe(false);
        expect(shadowKeyId(unset)).not.toBe(shadowKeyId(cut));
    });
});
