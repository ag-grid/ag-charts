import { OrdinalTimeScale } from 'ag-charts-core';

export interface BandTimeMapping {
    toTimeRatio(zoomRatio: number): number;
    fromTimeRatio(timeRatio: number): number;
}

const mappings = new WeakMap<readonly Date[], BandTimeMapping | undefined>();

/**
 * Lazy ordinal-time bands are not evenly spaced in time, so the zoom ratio, a position in band space, differs from
 * the share of time that position represents. Returns the mapping between the two for such an axis.
 */
export function resolveBandTimeMapping(lazy: boolean, scale: unknown): BandTimeMapping | undefined {
    if (!lazy || !OrdinalTimeScale.is(scale)) return;

    const { bands, domain } = scale;
    if (domain.length > 1 && domain[0].valueOf() > domain.at(-1)!.valueOf()) return;

    if (!mappings.has(bands)) {
        mappings.set(bands, createBandTimeMapping(bands));
    }
    return mappings.get(bands);
}

export function createBandTimeMapping(bands: readonly Date[]): BandTimeMapping | undefined {
    const n = bands.length;
    if (n < 2) return;

    const starts = bands.map((band) => band.valueOf());
    const lastInterval = (starts[n - 1] - starts[0]) / (n - 1);
    const t0 = starts[0];
    const span = starts[n - 1] + lastInterval - t0;
    if (!Number.isFinite(lastInterval) || lastInterval <= 0 || !Number.isFinite(span)) return;

    const bandEnd = (index: number) => (index < n - 1 ? starts[index + 1] : starts[n - 1] + lastInterval);

    return {
        toTimeRatio(zoomRatio) {
            const position = Math.min(Math.max(zoomRatio, 0), 1) * n;
            const index = Math.min(Math.floor(position), n - 1);
            const time = starts[index] + (position - index) * (bandEnd(index) - starts[index]);
            return (time - t0) / span;
        },
        fromTimeRatio(timeRatio) {
            const time = t0 + Math.min(Math.max(timeRatio, 0), 1) * span;
            let low = 0;
            let high = n - 1;
            while (low < high) {
                const mid = Math.ceil((low + high) / 2);
                if (starts[mid] <= time) {
                    low = mid;
                } else {
                    high = mid - 1;
                }
            }
            const start = starts[low];
            return (low + (time - start) / (bandEnd(low) - start)) / n;
        },
    };
}
