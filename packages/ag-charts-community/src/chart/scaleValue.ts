import type { Scale } from 'ag-charts-core';
import { checkDatum } from 'ag-charts-core';

import { BandScale } from '../scale/bandScale';
import { ContinuousScale } from '../scale/continuousScale';
import { DiscreteTimeScale } from '../scale/discreteTimeScale';

/** Whether a user-supplied value can be resolved against `scale`, rejecting both wrong value types
 * and values absent from a discrete domain. */
export function isValidScaleValue(value: unknown, scale: Scale<any, number>): boolean {
    const isContinuous = ContinuousScale.is(scale) || DiscreteTimeScale.is(scale);
    return checkDatum(value, isContinuous) && !Number.isNaN(scale.convert(value, { clamp: true }));
}

/**
 * Pixel offsets needed to grow a converted range so it covers whole bands rather than stopping at
 * band leading edges. `bandwidth` extends the end onto the final band's trailing edge;
 * `rangePadding` is half the inter-band gap, applied to both ends so adjacent ranges tile.
 * Both are zero on continuous scales.
 */
export function bandRangeExpansion(scale: Scale<any, number>): { bandwidth: number; rangePadding: number } {
    const bandwidth = scale.bandwidth ?? 0;
    const step = scale.step ?? 0;
    const rangePadding = BandScale.is(scale) ? (step - bandwidth) / 2 : 0;
    return { bandwidth, rangePadding };
}
