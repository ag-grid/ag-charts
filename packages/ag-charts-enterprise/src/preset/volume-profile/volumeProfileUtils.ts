import { type Logger, isFiniteNumber, stripFloatNoise } from 'ag-charts-core';
import type { DatumDefault } from 'ag-charts-types';

export interface VolumeProfileKeys {
    priceKey: string;
    upKey: string;
    downKey: string;
}

/** The series read the grouped levels, so the data model cannot see a key the rows lack. */
export function warnMissingVolumeProfileKeys(data: DatumDefault[], keys: VolumeProfileKeys, logger: Logger) {
    if (data.length === 0) return;

    for (const key of new Set([keys.priceKey, keys.upKey, keys.downKey])) {
        if (data.some((d) => d?.[key] !== undefined)) continue;
        logger.warnOnce(`the key '${key}' was not found in any data element.`);
    }
}

export function inferVolumeProfileTickSize(data: DatumDefault[], priceKey: string): number | undefined {
    const prices = data
        .map((d) => d[priceKey])
        .filter((price) => isFiniteNumber(price))
        .sort((a, b) => a - b);

    let smallest = Infinity;
    for (let i = 1; i < prices.length; i++) {
        const gap = prices[i] - prices[i - 1];
        if (gap > 0 && gap < smallest) smallest = gap;
    }
    if (!Number.isFinite(smallest)) return undefined;

    return stripFloatNoise(smallest);
}

export function normaliseVolumeProfile(
    data: DatumDefault[],
    keys: VolumeProfileKeys,
    tickSize: number
): VolumeProfileDatum[] {
    const byLevel = mergeVolumeProfileLevels(data, keys, tickSize);
    if (byLevel.size === 0) return [];

    let lowest = Infinity;
    let highest = -Infinity;
    for (const index of byLevel.keys()) {
        lowest = Math.min(lowest, index);
        highest = Math.max(highest, index);
    }

    // Every level between the extremes is a category, so the bands stay evenly spaced in price; highest first, as
    // the first category is drawn at the top.
    const levels: VolumeProfileDatum[] = [];
    for (let index = highest; index >= lowest; index--) {
        const { upVolume = 0, downVolume = 0 } = byLevel.get(index) ?? {};
        levels.push({
            price: stripFloatNoise(index * tickSize),
            priceLow: stripFloatNoise((index - 0.5) * tickSize),
            priceHigh: stripFloatNoise((index + 0.5) * tickSize),
            upVolume,
            downVolume,
            total: upVolume + downVolume,
        });
    }
    return levels;
}

export interface VolumeProfileDatum {
    price: number;
    // The extent of the prices merged into this level: its centre `price` plus or minus half the tick size.
    priceLow: number;
    priceHigh: number;
    upVolume: number;
    downVolume: number;
    total: number;
}

// Each price is snapped to its nearest multiple of `tickSize`; prices sharing a level are summed into one row, as
// duplicate categories in a stack would otherwise draw over each other.
function mergeVolumeProfileLevels(
    data: DatumDefault[],
    { priceKey, upKey, downKey }: VolumeProfileKeys,
    tickSize: number
) {
    const byLevel = new Map<number, { upVolume: number; downVolume: number }>();
    for (const d of data) {
        const price = d[priceKey];
        if (!isFiniteNumber(price)) continue;
        const index = Math.round(stripFloatNoise(price / tickSize));
        const level = byLevel.get(index) ?? { upVolume: 0, downVolume: 0 };
        level.upVolume += d[upKey] ?? 0;
        level.downVolume += d[downKey] ?? 0;
        byLevel.set(index, level);
    }
    return byLevel;
}
