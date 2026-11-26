import { describe, expect, it } from 'vitest';

import { hasStateStyle } from './seriesProperties';

describe('hasStateStyle', () => {
    it.each([
        ['an absent bucket', undefined],
        ['an empty bucket', {}],
        ['an opacity of 1', { opacity: 1 }],
        ['an opacity of 1 with the glow off', { opacity: 1, glow: { enabled: false } }],
        ['a glow that is off', { glow: { enabled: false } }],
    ])('is false for %s', (_name, bucket) => {
        expect(hasStateStyle(bucket)).toBe(false);
    });

    it.each([
        ['an opacity below 1', { opacity: 0.5 }],
        ['an opacity of 1 with another style', { opacity: 1, fill: 'red' }],
        ['an opacity of 1 with the glow on', { opacity: 1, glow: { enabled: true } }],
        ['a glow that is on', { glow: { enabled: true } }],
        ['a fill opacity of 1', { fillOpacity: 1 }],
    ])('is true for %s', (_name, bucket) => {
        expect(hasStateStyle(bucket)).toBe(true);
    });
});
