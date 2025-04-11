import { findMinIndex } from 'ag-charts-core';
import type { TimeInterval } from 'ag-charts-types';

import { buildFormatter } from '../util/timeFormat';
import { defaultTimeTickFormat } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import type { ScaleFormatParams } from './scale';

export abstract class DiscreteTimeScale extends BandScale<Date, TimeInterval | number> {
    static override is(value: unknown): value is DiscreteTimeScale {
        return value instanceof DiscreteTimeScale;
    }

    override toDomain(value: number): Date {
        return new Date(value);
    }

    override convert(d: Date, options?: { clamp?: boolean; interpolate?: boolean }): number {
        const interpolate = options?.interpolate ?? false;
        if (!interpolate) return super.convert(d, options);

        const { domain, bands } = this;

        const r0 = this.ordinalRange(0);
        if (domain.length <= 1 || bands.length === 0) return r0;

        const r1 = this.ordinalRange(bands.length - 1);

        const dTime = d.getTime();
        let domainIndex = findMinIndex(0, domain.length - 1, (i) => domain[i].getTime() >= dTime) ?? 0;
        domainIndex = Math.min(Math.max(domainIndex, 0), domain.length - 2);
        const d0 = domain[domainIndex].getTime();
        const d1 = domain[domainIndex + 1].getTime();

        const clamp = options?.clamp ?? false;
        let v = d.getTime();
        if (clamp) v = Math.min(Math.max(v, d0), d1);

        return ((v - d0) / (d1 - d0)) * (r1 - r0) + r0;
    }

    override invert(position: number, nearest = false): Date | undefined {
        this.refresh();

        const { bands } = this;

        if (nearest) {
            const index = this.invertNearestIndex(position - this.bandwidth / 2);
            return index != null ? bands[index] : undefined;
        }

        const closestIndex = findMinIndex(0, bands.length - 1, (i) => {
            const p = this.ordinalRange(i);
            return p >= position;
        });
        return bands[closestIndex ?? 0];
    }

    /**
     * Returns a time format function suitable for displaying tick values.
     * @param specifier If the specifier string is provided, this method is equivalent to
     * the {@link TimeLocaleObject.format} method.
     * If no specifier is provided, this method returns the default time format function.
     */
    override tickFormatter(
        { domain, ticks, specifier }: ScaleFormatParams<Date>,
        formatOffset?: number
    ): (date: Date) => string {
        return specifier != null ? buildFormatter(specifier) : defaultTimeTickFormat(ticks, domain, formatOffset);
    }
}
