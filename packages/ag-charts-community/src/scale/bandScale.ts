import { Logger } from 'ag-charts-core';

import { clamp } from '../util/number';
import { AbstractScale } from './abstractScale';
import { Invalidating } from './invalidating';
import type { ScaleTickParams } from './scale';

/**
 * Maps a discrete domain to a continuous numeric range.
 */
export abstract class BandScale<D, I = number> extends AbstractScale<D, number, I> {
    static is(value: unknown): value is BandScale<any, any> {
        return value instanceof BandScale;
    }

    abstract override readonly type: 'band' | 'ordinal-time';

    protected invalid = true;

    @Invalidating
    range: number[] = [0, 1];

    @Invalidating
    round = false;

    @Invalidating
    interval?: I = undefined;

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

    abstract override domain: D[];

    protected refresh() {
        if (!this.invalid) return;

        this.invalid = false;
        this.update();

        if (this.invalid) {
            Logger.warnOnce('Expected update to not invalidate scale');
        }
    }

    override ticks(_params: ScaleTickParams<I>, domain: D[] = this.domain, visibleRange?: [number, number]): D[] {
        let ticks = domain;
        if (visibleRange != null) {
            const t0 = Math.max(0, Math.floor(visibleRange[0] * ticks.length));
            const t1 = Math.min(ticks.length, Math.ceil(visibleRange[1] * ticks.length));
            ticks = ticks.slice(t0, t1);
        }
        return ticks;
    }

    convert(d: D, _clamp?: boolean): number {
        this.refresh();
        const i = this.getIndex(d);
        if (i == null || i < 0 || i >= this.domain.length) {
            return NaN;
        }
        return this.ordinalRange(i);
    }

    protected invertNearestIndex(position: number) {
        this.refresh();

        const { domain } = this;

        if (domain.length === 0) return -1;

        let low = 0;
        let high = domain.length - 1;
        let closestDistance = Infinity;
        let closestIndex = 0;

        while (low <= high) {
            const mid = ((high + low) / 2) | 0;
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
        const count = this.domain.length;

        if (count === 0) return;

        const [r0, r1] = this.range;
        let { _paddingInner: paddingInner } = this;
        const { _paddingOuter: paddingOuter, round } = this;
        const rangeDistance = r1 - r0;

        let rawStep: number;

        if (count === 1) {
            paddingInner = 0;
            rawStep = rangeDistance * (1 - paddingOuter * 2);
        } else {
            rawStep = rangeDistance / Math.max(1, count - paddingInner + paddingOuter * 2);
        }

        const step = round ? Math.floor(rawStep) : rawStep;
        let inset = r0 + (rangeDistance - step * (count - paddingInner)) / 2;
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

    protected abstract getIndex(value: D): number | undefined;
}
