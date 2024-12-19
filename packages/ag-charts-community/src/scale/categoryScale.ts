import { dateToNumber } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import type { NormalizedDomain } from './scale';

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

    override normalizeDomains(...domains: D[][]): NormalizedDomain<D> {
        let normalizedDomain: D[] | undefined = undefined;
        const seenDomains = new Set<D[]>();

        let animatable = true;
        for (const domain of domains) {
            if (seenDomains.has(domain)) continue;
            seenDomains.add(domain);

            if (normalizedDomain == null) {
                normalizedDomain = normaliseDataDomain(domain);
            } else {
                animatable &&= domainOrderedToNormalizedDomain(domain, normalizedDomain);
                normalizedDomain = normaliseDataDomain([...normalizedDomain, ...domain]);
            }
        }

        normalizedDomain ??= [];

        return { domain: normalizedDomain, animatable };
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

function normaliseDataDomain<D>(d: D[]): D[] {
    const domain = [];
    const uniqueValues = new Set<D>();
    for (const value of d) {
        const key = dateToNumber(value) as D;

        // Avoid additional set lookups
        const lastSize = uniqueValues.size;
        uniqueValues.add(key);
        if (uniqueValues.size !== lastSize) {
            // Only add unique values
            domain.push(value);
        }
    }
    return domain;
}

function domainOrderedToNormalizedDomain<D>(domain: D[], normalizedDomain: D[]) {
    let normalizedIndex = -1;
    for (const value of domain) {
        const normalizedNextIndex = normalizedDomain.indexOf(value);

        if (normalizedNextIndex === -1) {
            // All subsequent values must be extending (i.e. appending to) the normalized domain
            normalizedIndex = Infinity;
        } else if (normalizedNextIndex <= normalizedIndex) {
            return false;
        } else {
            normalizedIndex = normalizedNextIndex;
        }
    }

    return true;
}
