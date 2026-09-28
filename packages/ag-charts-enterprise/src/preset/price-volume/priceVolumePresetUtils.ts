import { isFiniteNumber } from 'ag-charts-core';
import type { DatumDefault } from 'ag-charts-types';

export function inferVolumeProfileTickSize(data: DatumDefault[]): number | undefined {
    const prices = data
        .map((d) => d.price)
        .filter((price) => isFiniteNumber(price))
        .sort((a, b) => a - b);

    let smallest = Infinity;
    for (let i = 1; i < prices.length; i++) {
        const gap = prices[i] - prices[i - 1];
        if (gap > 0 && gap < smallest) smallest = gap;
    }
    if (!Number.isFinite(smallest)) return undefined;

    return canonical(smallest);
}

export function normaliseVolumeProfile(data: DatumDefault[], tickSize: number): VolumeProfileDatum[] {
    const byLevel = mergeVolumeProfileLevels(data, tickSize);
    if (byLevel.size === 0) return [];

    let lowest = Infinity;
    let highest = -Infinity;
    for (const index of byLevel.keys()) {
        lowest = Math.min(lowest, index);
        highest = Math.max(highest, index);
    }
    // The price axis needs two levels to align its bands with the price scale.
    if (highest === lowest) highest += 1;

    // Every level between the extremes is a category, so the bands stay evenly spaced in price; highest first, as
    // the first category is drawn at the top.
    const levels: VolumeProfileDatum[] = [];
    for (let index = highest; index >= lowest; index--) {
        const { upVolume = 0, downVolume = 0 } = byLevel.get(index) ?? {};
        levels.push({ price: canonical(index * tickSize), upVolume, downVolume, total: upVolume + downVolume });
    }
    return levels;
}

interface VolumeProfileDatum {
    price: number;
    upVolume: number;
    downVolume: number;
    total: number;
}

// Each price is snapped to its nearest multiple of `tickSize`; prices sharing a level are summed into one row, as
// duplicate categories in a stack would otherwise draw over each other.
function mergeVolumeProfileLevels(data: DatumDefault[], tickSize: number) {
    const byLevel = new Map<number, { upVolume: number; downVolume: number }>();
    for (const d of data) {
        if (!isFiniteNumber(d.price)) continue;
        const index = Math.round(canonical(d.price / tickSize));
        const level = byLevel.get(index) ?? { upVolume: 0, downVolume: 0 };
        level.upVolume += d.upVolume ?? 0;
        level.downVolume += d.downVolume ?? 0;
        byLevel.set(index, level);
    }
    return byLevel;
}

// Decimal arithmetic carries float noise (e.g. 2.4999999999999716), and categories compare by exact value.
function canonical(value: number) {
    return Number(value.toPrecision(12));
}
