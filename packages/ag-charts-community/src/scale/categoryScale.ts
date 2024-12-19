import { dateToNumber } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';

export class CategoryScale<D, I = number> extends BandScale<D, I> {
    readonly type = 'band' as const;

    /**
     * Maps datum to its index in the {@link domain} array.
     * Used to check for duplicate data (not allowed).
     */
    protected index = new Map<D, number>();

    /**
     * Contains unique data only.
     */
    protected _domain: D[] = [];
    set domain(values: D[]) {
        this.index.clear();
        this.invalid = true;
        this._domain = [];

        // In case one wants to have duplicate domain values, for example, two 'Italy' categories,
        // one should use objects rather than strings for domain values like so:
        // { toString: () => 'Italy' }
        // { toString: () => 'Italy' }
        for (const value of values) {
            const key = dateToNumber(value) as D;
            if (this.getIndex(key) === undefined) {
                this.index.set(key, this._domain.push(value) - 1);
            }
        }
    }

    get domain(): D[] {
        return this._domain;
    }

    override toDomain(_value: number): D | undefined {
        return undefined;
    }

    invert(position: number, nearest = false): D | undefined {
        this.refresh();

        const index = this.invertNearestIndex(position);
        const matches = nearest || position === this.ordinalRange(index);

        return matches ? this.domain[index] : undefined!;
    }

    protected getIndex(value: D) {
        return this.index.get(dateToNumber(value));
    }
}
