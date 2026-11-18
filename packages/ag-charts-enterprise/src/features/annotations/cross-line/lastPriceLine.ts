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

export interface LastPrice {
    value: PointType;
    /** Whether the last bar closed above its open, or above the previous close if it has no open. */
    up: boolean;
}

/**
 * The value of `closeKey` in the last datum of `series`. A datum with no close (`null` or `undefined`) is skipped in
 * favour of the one before it, so this reads a single datum unless the end of the data is empty.
 *
 * The bar is up when it closed above its `openKey` value, as the volume bars are coloured. Without an open it is up
 * when it closed above the previous close, and it is down when there is neither.
 */
export function readLastPrice(
    series: LastPriceSeries | undefined,
    closeKey: string,
    openKey: string | undefined
): LastPrice | undefined {
    const { data } = series ?? {};
    if (data == null) return;

    const suppressFieldDotNotation = data.suppressFieldDotNotation ?? false;
    const readClose = datumKeyReader(closeKey, suppressFieldDotNotation);
    const readOpen = openKey == null ? undefined : datumKeyReader(openKey, suppressFieldDotNotation);

    let last: PointType | undefined;
    for (let index = data.size() - 1; index >= 0; index--) {
        const close = readClose(data.getDatumAt(index));
        if (close == null) continue;

        if (last == null) {
            last = close as PointType;
            const open = readOpen?.(data.getDatumAt(index));
            if (open != null) return { value: last, up: (open as number) < (close as number) };
        } else {
            return { value: last, up: (close as number) < (last as number) };
        }
    }

    return last == null ? undefined : { value: last, up: false };
}
