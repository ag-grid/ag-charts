import { findMaxIndex, findMinIndex } from 'ag-charts-core';
import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import { BandScale } from './bandScale';

export abstract class DiscreteTimeScale extends BandScale<Date, TimeInterval | TimeIntervalUnit | number> {
    static override is(value: unknown): value is DiscreteTimeScale {
        return value instanceof DiscreteTimeScale;
    }

    override toDomain(value: number): Date {
        return new Date(value);
    }

    override convert(value: Date, options?: { clamp?: boolean; interpolate?: boolean }): number {
        if (!(value instanceof Date)) value = new Date(value as any);
        const { domain, bands } = this;

        if (domain.length <= 0) return NaN;

        if (options?.clamp === true) {
            const { range } = this;
            if (value < bands[0]) return range[0];
            if (value > bands[bands.length - 1]) return range[1];
        }

        const r0 = this.ordinalRange(0);
        const r1 = this.ordinalRange(bands.length - 1);

        const interpolate = options?.interpolate ?? false;
        const reversed = domain[0].valueOf() > domain[domain.length - 1].valueOf();
        if (!interpolate) {
            const r = super.convert(value, options);
            return reversed ? r1 - (r - r0) : r;
        }

        if (bands.length === 0) return r0;

        const v = value.valueOf();
        let domainIndex: number;
        if (reversed) {
            domainIndex = (findMinIndex(0, domain.length - 1, (i) => domain[i].valueOf() <= v) ?? domain.length) - 1;
        } else {
            domainIndex = findMaxIndex(0, domain.length - 1, (i) => domain[i].valueOf() <= v) ?? 0;
        }
        domainIndex = Math.min(Math.max(domainIndex, 0), domain.length - 2);
        const v0 = domain[domainIndex].valueOf();
        const v1 = domain[domainIndex + 1].valueOf();

        const ratioWithinInterval = (v - v0) / (v1 - v0);
        const ratio = (domainIndex + ratioWithinInterval) / (domain.length - 1);

        return ratio * (r1 - r0) + r0;
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const { domain, bands } = this;
        const reversed = domain[0].valueOf() > domain[domain.length - 1].valueOf();

        let index: number | undefined;
        if (nearest) {
            index = this.invertNearestIndex(position - this.bandwidth / 2);
        } else {
            const closestIndex = findMinIndex(0, bands.length - 1, (i) => {
                const p = this.ordinalRange(i);
                return p >= position;
            });
            index = closestIndex ?? 0;
        }

        return bands[reversed ? bands.length - 1 - index : index];
    }
}
