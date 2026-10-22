import { afterEach, describe, expect, it, vi } from 'vitest';

import { OrdinalTimeScale } from '../ordinalTimeScale';
import { numericBandsOf, spyOnNumericBandsGetter } from './scaleAccessors';

describe('scaleAccessors', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const scaleOver = (count: number) => {
        const scale = new OrdinalTimeScale();
        const domain = Array.from({ length: count }, (_, i) => new Date(2020, 0, 1, 0, i));
        scale.domain = domain;
        scale.range = [0, 1000];
        return { scale, domain };
    };

    describe('numericBandsOf', () => {
        it('returns one number per domain value', () => {
            const { scale, domain } = scaleOver(4);

            expect(numericBandsOf(scale)).toEqual(domain.map((d) => d.valueOf()));
        });
    });

    describe('spyOnNumericBandsGetter', () => {
        it('counts reads of the built numeric bands', () => {
            const reads = spyOnNumericBandsGetter();
            const { scale, domain } = scaleOver(6400);
            expect(reads).not.toHaveBeenCalled();

            // Enough lookups on the unbuilt scale to make building the bands worthwhile.
            for (let i = 0; i < 200; i++) scale.convert(domain[100]);
            expect(reads).toHaveBeenCalled();
        });
    });
});
