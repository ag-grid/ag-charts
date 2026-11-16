import { describe, expect, it } from 'vitest';

import { hasOppositeStack } from './barGap';

describe('hasOppositeStack', () => {
    it.each([
        ['a positive datum, with a negative total on the other side', -10, true, true],
        ['a positive datum, with no total on the other side', 0, true, false],
        ['a positive datum, with a total on the same side', 10, true, false],
        ['a positive datum, with no group', undefined, true, false],
        ['a negative datum, with a positive total on the other side', 10, false, true],
        ['a negative datum, with no total on the other side', 0, false, false],
        ['a negative datum, with a total on the same side', -10, false, false],
        ['a negative datum, with no group', undefined, false, false],
        ['a bigint total on the other side', -10n, true, true],
    ])('%s', (_name, opposite, isPositive, expected) => {
        expect(hasOppositeStack(opposite, isPositive)).toBe(expected);
    });
});
