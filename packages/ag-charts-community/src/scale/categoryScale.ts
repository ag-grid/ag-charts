import { dateToNumber } from '../util/timeFormatDefaults';
import { BandScale } from './bandScale';
import type { NormalizedDomain, ScaleTickParams, ScaleTickResult } from './scale';
import { filterVisibleTicks } from './scaleUtil';

export class CategoryScale<D, I = number> extends BandScale<D, I> {
    static override is(value: unknown): value is CategoryScale<any, any> {
        return value instanceof CategoryScale;
    }

    readonly type = 'band' as const;
    readonly defaultTickCount = 0;

    /**
     * Maps datum to its index in the {@link domain} array.
     * Used to check for duplicate data (not allowed).
     */
    protected index: Map<D, number> | undefined = undefined;

    /**
     * Contains unique data only.
     */
    protected _domain: D[] = [];
    set domain(values: D[]) {
        if (this._domain === values) return;

        this.invalid = true;
        this._domain = values;
        this.index = undefined;
    }

    get domain(): D[] {
        return this._domain;
    }

    get bands() {
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
                normalizedDomain = deduplicateCategories(domain);
            } else {
                animatable &&= domainOrderedToNormalizedDomain(domain, normalizedDomain);
                normalizedDomain = deduplicateCategories([...normalizedDomain, ...domain]);
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

        const offset = nearest ? this.bandwidth / 2 : 0;
        const index = this.invertNearestIndex(Math.max(0, position - offset));
        const matches = nearest || position === this.ordinalRange(index);

        return matches ? this.domain[index] : undefined;
    }

    override ticks(
        _params: ScaleTickParams<I>,
        domain: D[] = this.domain,
        visibleRange?: [number, number]
    ): ScaleTickResult<D> {
        return filterVisibleTicks(domain, false, visibleRange);
    }

    findIndex(value: D) {
        let { index } = this;
        if (index == null) {
            const { domain } = this;
            index = new Map<D, number>();
            for (let i = 0; i < domain.length; i++) {
                index.set(dateToNumber(domain[i]) as D, i);
            }

            this.index = index;
        }

        return index.get(dateToNumber(value));
    }
}

function deduplicateCategories<D>(d: D[]): D[] {
    let domain: D[] | undefined;
    const uniqueValues = new Set<D>();
    for (const value of d) {
        // In case one wants to have duplicate domain values, for example, two 'Italy' categories,
        // one should use objects rather than strings for domain values like so:
        // { toString: () => 'Italy' }
        // { toString: () => 'Italy' }
        const key = dateToNumber(value) as D;

        // Avoid additional set lookups
        const lastSize = uniqueValues.size;
        uniqueValues.add(key);
        const isUniqueValue = uniqueValues.size !== lastSize;

        // Only add unique values
        if (isUniqueValue) {
            domain?.push(value);
        } else {
            domain ??= d.slice(0, uniqueValues.size);
        }
    }
    // Maintain referential equality if the domain was unique
    return domain ?? d;
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
