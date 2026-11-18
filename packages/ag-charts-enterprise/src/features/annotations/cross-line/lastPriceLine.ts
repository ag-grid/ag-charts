import { datumKeyReader } from 'ag-charts-core';

import type { PointType } from '../utils/scale';

/** The part of a series that the last price is read from. */
export interface LastPriceSeries {
    readonly data?: {
        size(): number;
        getDatumAt(datumIndex: number): unknown;
        readonly suppressFieldDotNotation?: boolean;
    };
}

/**
 * The value of `closeKey` in the last datum of `series`. A datum with no value (`null` or `undefined`) is skipped in
 * favour of the one before it, so this reads a single datum unless the end of the data is empty.
 */
export function readLastPrice(series: LastPriceSeries | undefined, closeKey: string): PointType | undefined {
    const { data } = series ?? {};
    if (data == null) return;

    const read = datumKeyReader(closeKey, data.suppressFieldDotNotation ?? false);
    for (let index = data.size() - 1; index >= 0; index--) {
        const value = read(data.getDatumAt(index));
        if (value != null) return value as PointType;
    }
}
