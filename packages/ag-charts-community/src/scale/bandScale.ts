import type { ScaleAlignment } from 'ag-charts-core';
import { Logger, clamp } from 'ag-charts-core';

import { AbstractScale } from './abstractScale';
import { Invalidating } from './invalidating';
import { unpackDomainMinMax } from './scaleUtil';

/**
 * Maps a discrete domain to a continuous numeric range.
 */
export abstract class BandScale<D, I = number> extends AbstractScale<D, number, I> {
    static is(value: unknown): value is BandScale<any, any> {
        return value instanceof BandScale;
    }

    abstract override readonly type: 'category' | 'unit-time' | 'ordinal-time';

    protected invalid = true;

    @Invalidating
    range: number[] = [0, 1];

    @Invalidating
    round = false;

    private _bandwidth: number = 1;
    override get bandwidth(): number {
        this.refresh();
        return this._bandwidth;
    }

    private _step: number = 1;
    override get step(): number {
        this.refresh();
        return this._step;
    }

    private _inset: number = 1;
    override get inset(): number {
        this.refresh();
        return this._inset;
    }

    private _rawBandwidth: number = 1;
    get rawBandwidth(): number {
        this.refresh();
        return this._rawBandwidth;
    }

    set padding(value: number) {
        value = clamp(0, value, 1);
        this._paddingInner = value;
        this._paddingOuter = value;
    }
    get padding(): number {
        return this._paddingInner;
    }

    /**
     * The ratio of the range that is reserved for space between bands.
     */
    private _paddingInner = 0;
    set paddingInner(value: number) {
        this.invalid = true;
        this._paddingInner = clamp(0, value, 1);
    }
    get paddingInner(): number {
        return this._paddingInner;
    }

    /**
     * The ratio of the range that is reserved for space before the first
     * and after the last band.
     */
    private _paddingOuter = 0;
    set paddingOuter(value: number) {
        this.invalid = true;
        this._paddingOuter = clamp(0, value, 1);
    }
    get paddingOuter(): number {
        return this._paddingOuter;
    }

    abstract readonly bands: readonly D[];

    /** Override in subclass to provide band count without triggering full band materialization */
    protected getBandCountForUpdate(): number {
        return this.bands.length;
    }

    protected refresh() {
        if (!this.invalid) return;

        this.invalid = false;
        this.update();

        if (this.invalid) {
            Logger.warnOnce('Expected update to not invalidate scale');
        }
    }

    convert(d: D, options?: { clamp?: boolean; alignment?: ScaleAlignment }): number {
        this.refresh();
        const i = this.findIndex(d, options?.alignment);
        if (i == null || i < 0 || i >= this.getBandCountForUpdate()) {
            return Number.NaN;
        }
        return this.ordinalRange(i);
    }

    override getDomainMinMax() {
        return unpackDomainMinMax(this.domain);
    }

    protected invertNearestIndex(position: number) {
        this.refresh();

        const bandCount = this.getBandCountForUpdate();

        if (bandCount === 0) return -1;

        let low = 0;
        let high = bandCount - 1;
        let closestDistance = Infinity;
        let closestIndex = 0;

        while (low <= high) {
            const mid = Math.trunc((high + low) / 2);
            const p = this.ordinalRange(mid);
            const distance = Math.abs(p - position);

            if (distance === 0) return mid;

            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = mid;
            }

            if (p < position) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return closestIndex;
    }

    update() {
        const [r0, r1] = this.range;
        let { _paddingInner: paddingInner } = this;
        const { _paddingOuter: paddingOuter } = this;
        const bandCount = this.getBandCountForUpdate();
        if (bandCount === 0) return;

        const rangeDistance = r1 - r0;

        let rawStep: number;

        if (bandCount === 1) {
            paddingInner = 0;
            rawStep = rangeDistance * (1 - paddingOuter * 2);
        } else {
            rawStep = rangeDistance / Math.max(1, bandCount - paddingInner + paddingOuter * 2);
        }

        const round = this.round && Math.floor(rawStep) > 0;
        const step = round ? Math.floor(rawStep) : rawStep;
        let inset = r0 + (rangeDistance - step * (bandCount - paddingInner)) / 2;
        let bandwidth = step * (1 - paddingInner);

        if (round) {
            inset = Math.round(inset);
            bandwidth = Math.round(bandwidth);
        }

        this._step = step;
        this._inset = inset;
        this._bandwidth = bandwidth;
        this._rawBandwidth = rawStep * (1 - paddingInner);
    }

    protected ordinalRange(i: number) {
        const { _inset: inset, _step: step, range } = this;
        const min = Math.min(range[0], range[1]);
        const max = Math.max(range[0], range[1]);
        // Clamp to account for FP issues
        return clamp(min, inset + step * i, max);
    }

    abstract findIndex(value: D, alignment?: ScaleAlignment): number | undefined;
}
