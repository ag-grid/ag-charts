import { type ArrayView, ScaleAlignment, type ScaleTickParams, findMaxIndex, findMinIndex } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { BandScale } from './bandScale';

/** Result of uniformity check via sampling */
export interface UniformityCheck {
    isUniform: boolean;
    interval?: number; // Per-index interval in ms, only set if uniform
}

export const APPROXIMATE_THRESHOLD = 1000;
const SAMPLE_POINTS = 20;

/**
 * Detect uniformity by sampling points from a range within the domain.
 * Returns interval if data is uniformly spaced (within 1% tolerance).
 */
export function checkUniformityBySampling(
    bands: readonly Date[],
    startIdx: number = 0,
    endIdx: number = bands.length - 1
): UniformityCheck {
    const n = endIdx - startIdx + 1;
    if (n < 2) return { isUniform: false };

    // Sample SAMPLE_POINTS points evenly spaced within the range
    const indices = Array.from(
        { length: SAMPLE_POINTS },
        (_, i) => startIdx + Math.floor((i * (n - 1)) / (SAMPLE_POINTS - 1))
    );
    const samples = indices.map((i) => bands[i].valueOf());

    // Calculate expected per-index interval
    const expectedInterval = (samples.at(-1)! - samples[0]) / (n - 1);
    if (!Number.isFinite(expectedInterval) || expectedInterval === 0) {
        return { isUniform: false };
    }

    // Check if all sampled intervals match within 1% tolerance
    const tolerance = Math.abs(expectedInterval * 0.01);
    for (let i = 1; i < samples.length; i++) {
        const indexGap = indices[i] - indices[i - 1];
        const actualInterval = (samples[i] - samples[i - 1]) / indexGap;
        if (Math.abs(actualInterval - expectedInterval) > tolerance) {
            return { isUniform: false };
        }
    }

    return { isUniform: true, interval: expectedInterval };
}

export abstract class DiscreteTimeScale extends BandScale<Date, AgTimeInterval | AgTimeIntervalUnit | number> {
    static override is(value: unknown): value is DiscreteTimeScale {
        return value instanceof DiscreteTimeScale;
    }

    abstract override ticks(
        params: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
        domain?: Date[],
        visibleRange?: [number, number],
        options?: { extend?: boolean; dropInitial?: boolean }
    ): { ticks: ArrayView<Date>; count: number | undefined; firstTickIndex?: number } | undefined;

    override toDomain(value: number): Date {
        return new Date(value);
    }

    protected get reversed(): boolean {
        const { domain } = this;
        return domain.length > 0 && domain[0].valueOf() > domain.at(-1)!.valueOf();
    }

    /** Cached numeric band values for efficient binary search. Subclasses should override with a cached version. */
    protected get numericBands(): ArrayView<number> {
        return this.bands.map((d) => d.valueOf());
    }

    override convert(value: Date, options?: { clamp?: boolean; alignment?: ScaleAlignment }): number {
        this.refresh();

        if (!(value instanceof Date)) value = new Date(value as any);
        const { domain, reversed } = this;
        const numericBands = this.numericBands;
        const bandCount = numericBands.length;

        if (domain.length <= 0) return Number.NaN;

        const r0 = this.ordinalRange(0);
        const r1 = this.ordinalRange(bandCount - 1);

        if (bandCount === 0) return r0;

        if (options?.clamp === true) {
            const { range } = this;
            if (value.valueOf() < numericBands[0]) return range[0];
            if (value.valueOf() > numericBands.at(-1)!) return range[1];
        }

        const alignment = options?.alignment ?? ScaleAlignment.Leading;
        if (alignment !== ScaleAlignment.Interpolate) {
            const r = super.convert(value, options);
            return reversed ? r1 - (r - r0) : r;
        }

        const v = value.valueOf();
        let bandIndex = this.findIndex(value) ?? 0;
        let dIndex: 1 | -1;
        if (reversed) {
            bandIndex = Math.min(Math.max(bandIndex, 1), bandCount - 1);
            dIndex = -1;
        } else {
            bandIndex = Math.min(Math.max(bandIndex, 0), bandCount - 2);
            dIndex = 1;
        }

        const v0 = numericBands[bandIndex];
        const v1 = numericBands[bandIndex + dIndex];

        const vr0 = this.ordinalRange(bandIndex);
        const vr1 = this.ordinalRange(bandIndex + dIndex);

        const ratio = (v - v0) / (v1 - v0);
        const r = ratio * (vr1 - vr0) + vr0;

        return reversed ? r1 - (r - r0) : r;
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const { domain } = this;
        if (domain.length <= 0) return;

        const bands = this.bands; // Only access bands at the end for return value
        const bandCount = this.getBandCountForUpdate();
        const reversed = domain[0].valueOf() > domain.at(-1)!.valueOf();

        let index: number | undefined;
        if (nearest) {
            index = this.invertNearestIndex(position - this.bandwidth / 2);
        } else {
            const closestIndex = findMinIndex(0, bandCount - 1, (i) => {
                const p = this.ordinalRange(i);
                return p >= position;
            });
            index = closestIndex ?? bandCount - 1;
        }

        return bands[reversed ? bandCount - 1 - index : index];
    }

    /** Override in subclass to provide cached uniformity check result */
    getUniformityCache(_visibleRange?: [number, number]): UniformityCheck | undefined {
        return undefined;
    }

    override findIndex(value: Date, alignment: ScaleAlignment = ScaleAlignment.Leading): number | undefined {
        if (value == null) return undefined;

        const numericBands = this.numericBands;
        const n = numericBands.length;

        if (n === 0) return undefined;
        if (n === 1) return 0;

        const target = value.valueOf();
        if (alignment === ScaleAlignment.Trailing) {
            return findMinIndex(0, n - 1, (index) => numericBands[index] >= target);
        }
        return findMaxIndex(0, n - 1, (index) => numericBands[index] <= target);
    }
}
