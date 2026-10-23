import { type MockInstance, vi } from 'vitest';

import { OrdinalTimeScale } from '../ordinalTimeScale';

// `numericBands` is a protected getter on the scale; nothing public says whether it has been built.
interface NumericBandsHost {
    numericBands: number[];
}

/** The scale's built numeric bands, one number per band. */
export function numericBandsOf(scale: OrdinalTimeScale): number[] {
    return (scale as unknown as NumericBandsHost).numericBands;
}

/** Spies on the getter behind `numericBandsOf`; the call count shows how many lookups it took to build the bands. */
export function spyOnNumericBandsGetter(): MockInstance {
    return vi.spyOn(OrdinalTimeScale.prototype as unknown as NumericBandsHost, 'numericBands', 'get');
}
