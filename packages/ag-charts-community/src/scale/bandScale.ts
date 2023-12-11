import { Logger } from '../util/logger';
import { Invalidating } from './invalidating';
import type { Scale } from './scale';

function clamp(x: number, min: number, max: number) {
    return Math.max(min, Math.min(max, x));
}

export type BandMode = 'band' | 'point';

/**
 * Maps a discrete domain to a continuous numeric range.
 */
export class BandScale<D> implements Scale<D, number, number> {
    readonly type = 'band';

    private invalid = true;

    @Invalidating
    bandMode: BandMode = 'band';
    @Invalidating
    interval: number = 1;

    private refresh() {
        if (!this.invalid) return;

        this.invalid = false;
        this.update();

        if (this.invalid) {
            Logger.warnOnce('Expected update to not invalidate scale');
        }
    }

    /**
     * Maps datum to its index in the {@link domain} array.
     * Used to check for duplicate datums (not allowed).
     */
    private index = new Map<D, number>();

    /**
     * The output range values for datum at each index.
     */
    private ordinalRange: number[] = [];

    /**
     * Contains unique datums only. Since `{}` is used in place of `Map`
     * for IE11 compatibility, the datums are converted `toString` before
     * the uniqueness check.
     */
    private _domain: D[] = [];
    set domain(values: D[]) {
        this.invalid = true;

        const domain: D[] = [];

        this.index = new Map<D, number>();
        const index = this.index;

        // In case one wants to have duplicate domain values, for example, two 'Italy' categories,
        // one should use objects rather than strings for domain values like so:
        // { toString: () => 'Italy' }
        // { toString: () => 'Italy' }
        values.forEach((value) => {
            if (index.get(value) === undefined) {
                index.set(value, domain.push(value) - 1);
            }
        });

        this._domain = domain;
    }
    get domain(): D[] {
        return this._domain;
    }

    @Invalidating
    range: number[] = [0, 1];

    ticks(): D[] {
        this.refresh();
        const { interval = 1 } = this;
        const step = Math.abs(Math.round(interval));
        return this._domain.filter((_, i) => i % step === 0);
    }

    convert(d: D): number {
        this.refresh();
        const i = this.index.get(d);
        if (i === undefined) {
            return NaN;
        }

        const r = this.ordinalRange[i];
        if (r === undefined) {
            return NaN;
        }

        return r;
    }

    invert(position: number) {
        this.refresh();
        const index = this.ordinalRange.findIndex((p) => p === position);
        return this.domain[index];
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
        this.paddingInner = value;
        this.paddingOuter = value;
    }
    get padding(): number {
        return this._paddingInner;
    }

    /**
     * The ratio of the range that is reserved for space between bands.
     */
    @Invalidating
    private _paddingInner = 0;
    set paddingInner(value: number) {
        this._paddingInner = clamp(value, 0, 1);
    }
    get paddingInner(): number {
        return this._paddingInner;
    }

    /**
     * The ratio of the range that is reserved for space before the first
     * and after the last band.
     */
    @Invalidating
    private _paddingOuter = 0;
    set paddingOuter(value: number) {
        this._paddingOuter = clamp(value, 0, 1);
    }
    get paddingOuter(): number {
        return this._paddingOuter;
    }

    @Invalidating
    round = false;

    update() {
        const count = this._domain.length;
        if (count === 0) {
            return;
        }

        const round = this.round;
        const bandContribution = this.bandMode === 'band' ? 1 : 0;
        let paddingInner = this._paddingInner;
        const paddingOuter = this._paddingOuter;
        const [r0, r1] = this.range;
        const width = r1 - r0;

        let totalContributions = count * bandContribution + (count - 1) * paddingInner + 2 * paddingOuter;

        if (totalContributions === 0) {
            paddingInner = 1;
            totalContributions = count * bandContribution + (count - 1) * paddingInner + 2 * paddingOuter;
        }

        const scale = width / totalContributions;

        const rawBandwidth = bandContribution * scale;
        const bandwidth = round ? Math.trunc(rawBandwidth) : rawBandwidth;
        const step = round ? Math.trunc(paddingInner * scale) : paddingInner * scale;
        const inset = round ? Math.trunc(paddingOuter * scale) : paddingOuter * scale;

        const uncounted = round ? width - (bandwidth * count + step * (count - 1) + 2 * inset) : 0;

        let currentValue = r0 + inset + Math.trunc(uncounted / 2);
        const values: number[] = [];
        for (let i = 0; i < count; i += 1) {
            const value = round ? Math.trunc(currentValue) : currentValue;
            values.push(value);
            currentValue += bandwidth + step;
        }

        this._bandwidth = bandwidth;
        this._rawBandwidth = rawBandwidth;
        this._step = step;
        this.ordinalRange = values;
    }
}
