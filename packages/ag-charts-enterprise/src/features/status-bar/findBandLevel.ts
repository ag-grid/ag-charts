interface PriceBand {
    priceLow: number;
    priceHigh: number;
    total: number;
}

// Levels are ordered highest price first, and a level without volume is never found.
export function findBandLevel<T extends PriceBand>(levels: readonly T[], price: number): T | undefined {
    let lo = 0;
    let hi = levels.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (price < levels[mid].priceLow) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    const level = levels.at(lo);
    return level != null && level.total > 0 && price >= level.priceLow && price <= level.priceHigh ? level : undefined;
}
