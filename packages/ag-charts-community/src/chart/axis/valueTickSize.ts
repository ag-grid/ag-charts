import {
    type ChartAxisDirection,
    datumKeyReader,
    isFiniteNumber,
    isString,
    roundTo,
    smallestPositiveGap,
} from 'ag-charts-core';

import type { DataSet } from '../data/dataSet';
import type { ISeries, ISeriesOptions, SeriesNodeDatum } from '../series/seriesTypes';

interface BoundSeries extends Pick<ISeries<SeriesNodeDatum, ISeriesOptions>, 'getKeys' | 'isEnabled'> {
    data?: Pick<DataSet<unknown>, 'data' | 'suppressFieldDotNotation'>;
}

// A double holds 15 significant digits, and the gap between two values is no more exact than the larger of them.
const SIGNIFICANT_DIGITS = 14;
const MAX_DECIMALS = 100;

/**
 * The smallest gap between the values that its series give an axis, or `undefined` when no two of them differ. Every
 * value is read and sorted, so this is for a caller that asks on demand, never for the data or render pipeline.
 */
export function inferValueTickSize(
    boundSeries: readonly BoundSeries[],
    direction: ChartAxisDirection
): number | undefined {
    const sources: { rows: unknown[]; keys: string[]; suppressFieldDotNotation: boolean }[] = [];
    let capacity = 0;
    for (const series of boundSeries) {
        const { data } = series;
        // Only a series with rows of data has a value for each key; a hierarchy or a flow does not.
        if (data == null || !Array.isArray(data.data) || !series.isEnabled()) continue;
        const rows = data.data;
        const keys = series.getKeys(direction).filter(isString);
        sources.push({ rows, keys, suppressFieldDotNotation: data.suppressFieldDotNotation });
        capacity += rows.length * keys.length;
    }

    const values = new Float64Array(capacity);
    let count = 0;
    let largest = 0;
    for (const { rows, keys, suppressFieldDotNotation } of sources) {
        for (const key of keys) {
            const read = datumKeyReader(key, suppressFieldDotNotation);
            for (const row of rows) {
                const value = read(row);
                if (!isFiniteNumber(value)) continue;
                values[count++] = value;
                largest = Math.max(largest, Math.abs(value));
            }
        }
    }
    if (largest === 0) return undefined;

    // Rounded to the decimals a double holds at this magnitude, so that the noise of decimal arithmetic neither
    // separates two equal values nor is left in the gap.
    const decimals = Math.min(SIGNIFICANT_DIGITS - Math.ceil(Math.log10(largest)), MAX_DECIMALS);
    for (let i = 0; i < count; i++) {
        values[i] = roundTo(values[i], decimals);
    }
    const gap = smallestPositiveGap(values.subarray(0, count));
    return gap == null ? undefined : roundTo(gap, decimals);
}
