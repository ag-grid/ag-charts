import { Logger } from '../util/logger';
import { clamp } from '../util/number';
import { Invalidating } from './invalidating';
import type { Scale } from './scale';

/**
 * Maps a discrete domain to a continuous numeric range.
 */
export class BandScale<D, I = number> implements Scale<D, number, I> {
    static is(value: any): value is BandScale<any, any> {
        return value instanceof BandScale;
    }

    readonly type: 'band' | 'ordinal-time' = 'band';

    protected invalid = true;

    @Invalidating
    range: number[] = [0, 1];

    @Invalidating
    round = false;

    @Invalidating
    interval?: I = undefined;

    protected refresh() {
        if (!this.invalid) return;

        this.invalid = false;
        this.update();

        if (this.invalid) {
            Logger.warnOnce('Expected update to not invalidate scale');
        }
    }

    /**
     * Maps datum to its index in the {@link domain} array.
     * Used to check for duplicate data (not allowed).
     */
    protected index = new Map<D | D[], number>();

    /**
     * The output range values for datum at each index.
     */
    protected ordinalRange: number[] = [];

    /**
     * Contains unique data only.
     */
    protected _domain: D[] = [];
    set domain(values: D[]) {
        this.index = new Map<D, number>();
        this.invalid = true;
        this._domain = [];

        // In case one wants to have duplicate domain values, for example, two 'Italy' categories,
        // one should use objects rather than strings for domain values like so:
        // { toString: () => 'Italy' }
        // { toString: () => 'Italy' }
        for (const value of values) {
            const key = value instanceof Date ? (value.getTime() as D) : value;
            if (this.getIndex(key) === undefined) {
                this.index.set(key, this._domain.push(value) - 1);
            }
        }
    }
    get domain(): D[] {
        return this._domain;
    }

    ticks(): { ticks: D[]; fractionDigits: number } {
        this.refresh();
        return { ticks: this._domain, fractionDigits: 0 };
    }

    convert(d: D): number {
        this.refresh();
        const i = this.getIndex(d);
        if (i == null) {
            return NaN;
        }
        return this.ordinalRange[i] ?? NaN;
    }

    invert(position: number) {
        this.refresh();
        const index = this.ordinalRange.findIndex((p) => p === position);
        return this.domain[index];
    }

    invertNearest(position: number) {
        this.refresh();
        let nearest = -1;
        let minDistance = Infinity;

        const index = this.ordinalRange.findIndex((p, i) => {
            if (p === position) return true;
            const distance = Math.abs(position - p);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = i;
            }
            return false;
        });

        return this.domain[index] ?? this.domain[nearest];
    }

    private _bandwidth: number = 1;
    get bandwidth(): number {
        this.refresh();
        return this._bandwidth;
    }

    private _step: number = 1;
    get step(): number {
        this.refresh();
        return this._step;
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
        this._paddingOuter = clamp(0, value, 1);
    }
    get paddingOuter(): number {
        return this._paddingOuter;
    }

    update() {
        const count = this._domain.length;

        if (count === 0) return;

        const [r0, r1] = this.range;
        let { _paddingInner: paddingInner } = this;
        const { _paddingOuter: paddingOuter, round } = this;
        const rangeDistance = r1 - r0;

        let rawStep: number, step: number, start: number;

        if (count === 1) {
            paddingInner = 0;
            rawStep = rangeDistance * (1 - paddingOuter * 2);
            step = round ? Math.round(rawStep) : rawStep;
            start = rangeDistance * paddingOuter;
        } else {
            rawStep = rangeDistance / Math.max(1, count - paddingInner + paddingOuter * 2);
            step = round ? Math.floor(rawStep) : rawStep;
            start = r0 + (rangeDistance - step * (count - paddingInner)) / 2;
        }

        let bandwidth = step * (1 - paddingInner);

        if (round) {
            start = Math.round(start);
            bandwidth = Math.round(bandwidth);
        }

        this._step = step;
        this._bandwidth = bandwidth;
        this._rawBandwidth = rawStep * (1 - paddingInner);
        this.ordinalRange = this._domain.map((_, i) => start + step * i);
    }

    private getIndex(value: D) {
        return this.index.get(value instanceof Date ? (value.getTime() as D) : value);
    }
}
