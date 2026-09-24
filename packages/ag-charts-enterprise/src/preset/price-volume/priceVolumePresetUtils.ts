import { isFiniteNumber } from 'ag-charts-core';
import type { DatumDefault } from 'ag-charts-types';

export interface VolumeProfileKeys {
    priceKey: string;
    upKey: string;
    downKey: string;
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

    // Differences of decimal prices carry float noise (e.g. 2.4999999999999716), so trim it before use.
    return Number(smallest.toPrecision(12));
}

export function normaliseVolumeProfile(
    data: DatumDefault[],
    keys: VolumeProfileKeys,
    tickSize: number
): VolumeProfileDatum[] {
    const bands = mergeVolumeProfileBands(data, keys);
    if (bands.length === 0) return [];

    const lowest = bands[0].price;
    const highest = bands.at(-1)!.price;

    // Level `i` covers `lowest + (i ± 0.5) * tickSize`; the epsilon absorbs float noise on level boundaries.
    const epsilon = 1e-9;
    const lowIndex = (edge: number) => Math.floor((edge - lowest) / tickSize + 0.5 + epsilon);
    const highIndex = (edge: number) => Math.ceil((edge - lowest) / tickSize - 0.5 - epsilon);
    const levels: VolumeProfileDatum[] = [];
    for (let i = 0; i <= lowIndex(highest); i++) {
        levels.push({ price: Number((lowest + i * tickSize).toPrecision(12)), upVolume: 0, downVolume: 0, total: 0 });
    }
    const gridFrom = lowest - tickSize / 2;
    const gridTo = lowest + (levels.length - 0.5) * tickSize;

    // Capping bands at half the input step, rather than meeting the neighbour, keeps prices with no row empty.
    const halfStep = (inferVolumeProfileTickSize(bands, 'price') ?? tickSize) / 2;
    for (let b = 0; b < bands.length; b++) {
        const { price, upVolume, downVolume } = bands[b];
        let from = price - halfStep;
        let to = price + halfStep;
        if (b > 0) from = Math.max(from, (bands[b - 1].price + price) / 2);
        if (b < bands.length - 1) to = Math.min(to, (price + bands[b + 1].price) / 2);
        from = Math.max(from, gridFrom);
        to = Math.min(to, gridTo);

        const width = to - from;
        const start = Math.max(0, lowIndex(from));
        const end = Math.min(levels.length - 1, highIndex(to));
        for (let l = start; l <= end; l++) {
            const levelFrom = lowest + (l - 0.5) * tickSize;
            const overlap = Math.min(to, levelFrom + tickSize) - Math.max(from, levelFrom);
            if (overlap <= 0) continue;
            const share = width > 0 ? overlap / width : 1;
            const level = levels[l];
            level.upVolume += upVolume * share;
            level.downVolume += downVolume * share;
            level.total += (upVolume + downVolume) * share;
        }
    }

    return levels;
}

interface VolumeProfileDatum {
    price: number;
    upVolume: number;
    downVolume: number;
    total: number;
}

// Merged before normalising, as a duplicate price would otherwise become a zero-width band and lose its volume.
function mergeVolumeProfileBands(
    data: DatumDefault[],
    { priceKey, upKey, downKey }: VolumeProfileKeys
): VolumeProfileDatum[] {
    const byPrice = new Map<number, VolumeProfileDatum>();
    for (const d of data) {
        const price = d[priceKey];
        if (!isFiniteNumber(price)) continue;
        const band = byPrice.get(price) ?? { price, upVolume: 0, downVolume: 0, total: 0 };
        band.upVolume += d[upKey] ?? 0;
        band.downVolume += d[downKey] ?? 0;
        byPrice.set(price, band);
    }
    return [...byPrice.values()].sort((a, b) => a.price - b.price);
}
