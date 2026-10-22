import { describe, expect, it, vi } from 'vitest';

import { OrdinalTimeScale } from '../ordinalTimeScale';
import { spyOnNumericBandsGetter } from './scaleAccessors';

describe('scaleAccessors', () => {
    describe('spyOnNumericBandsGetter', () => {
        it('counts reads of the built numeric bands', () => {
            const reads = spyOnNumericBandsGetter();
            const scale = new OrdinalTimeScale();
            const domain = Array.from({ length: 6400 }, (_, i) => new Date(2020, 0, 1, 0, i));
            scale.domain = domain;
            scale.range = [0, 1000];
            expect(reads).not.toHaveBeenCalled();

            // Enough lookups on the unbuilt scale to make building the bands worthwhile.
            for (let i = 0; i < 200; i++) scale.convert(domain[100]);
            expect(reads).toHaveBeenCalled();

            vi.restoreAllMocks();
        });
    });
});
