import { type MockInstance, vi } from 'vitest';

import { OrdinalTimeScale } from '../ordinalTimeScale';

// `numericBands` is a protected getter on the scale; nothing public says whether it has been built.
interface NumericBandsHost {
    numericBands: number[];
}

/**
 * Spies on the getter that builds `OrdinalTimeScale.numericBands` (one number per band). Each call is a read of the
 * built bands, and the scale builds them lazily, so the call count shows how many lookups it took to build them.
 * The caller restores the spy (`vi.restoreAllMocks()`).
 */
export function spyOnNumericBandsGetter(): MockInstance {
    return vi.spyOn(OrdinalTimeScale.prototype as unknown as NumericBandsHost, 'numericBands', 'get');
}
