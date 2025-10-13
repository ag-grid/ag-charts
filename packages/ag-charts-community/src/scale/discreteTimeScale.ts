import { ScaleAlignment, type ScaleTickParams, findMaxIndex, findMinIndex } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { BandScale } from './bandScale';

export abstract class DiscreteTimeScale extends BandScale<Date, AgTimeInterval | AgTimeIntervalUnit | number> {
    static override is(value: unknown): value is DiscreteTimeScale {
        return value instanceof DiscreteTimeScale;
    }

    abstract override ticks(
        params: ScaleTickParams<AgTimeInterval | AgTimeIntervalUnit | number>,
        domain?: Date[],
        visibleRange?: [number, number],
        options?: { extend?: boolean; dropInitial?: boolean }
    ): { ticks: Date[]; count: number | undefined; firstTickIndex?: number } | undefined;

    override toDomain(value: number): Date {
        return new Date(value);
    }

    protected get reversed(): boolean {
        const { domain } = this;
        return domain.length > 0 && domain[0].valueOf() > domain.at(-1)!.valueOf();
    }

    override convert(value: Date, options?: { clamp?: boolean; alignment?: ScaleAlignment }): number {
        this.refresh();

        if (!(value instanceof Date)) value = new Date(value as any);
        const { domain, bands, reversed } = this;

        if (domain.length <= 0) return Number.NaN;

        const r0 = this.ordinalRange(0);
        const r1 = this.ordinalRange(bands.length - 1);

        if (bands.length === 0) return r0;

        if (options?.clamp === true) {
            const { range } = this;
            if (value < bands[0]) return range[0];
            if (value > bands.at(-1)!) return range[1];
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
            bandIndex = Math.min(Math.max(bandIndex, 1), bands.length - 1);
            dIndex = -1;
        } else {
            bandIndex = Math.min(Math.max(bandIndex, 0), bands.length - 2);
            dIndex = 1;
        }

        const v0 = bands[bandIndex].valueOf();
        const v1 = bands[bandIndex + dIndex].valueOf();

        const vr0 = this.ordinalRange(bandIndex);
        const vr1 = this.ordinalRange(bandIndex + dIndex);

        const ratio = (v - v0) / (v1 - v0);
        const r = ratio * (vr1 - vr0) + vr0;

        return reversed ? r1 - (r - r0) : r;
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const { domain, bands } = this;
        if (domain.length <= 0) return;

        const reversed = domain[0].valueOf() > domain.at(-1)!.valueOf();

        let index: number | undefined;
        if (nearest) {
            index = this.invertNearestIndex(position - this.bandwidth / 2);
        } else {
            const closestIndex = findMinIndex(0, bands.length - 1, (i) => {
                const p = this.ordinalRange(i);
                return p >= position;
            });
            index = closestIndex ?? bands.length - 1;
        }

        return bands[reversed ? bands.length - 1 - index : index];
    }

    override findIndex(value: Date, alignment: ScaleAlignment = ScaleAlignment.Leading): number | undefined {
        const { bands } = this;
        const target = value.valueOf();
        if (alignment === ScaleAlignment.Trailing) {
            return findMinIndex(0, bands.length - 1, (index) => bands[index].valueOf() >= target);
        }
        return findMaxIndex(0, bands.length - 1, (index) => bands[index].valueOf() <= target);
    }
}
