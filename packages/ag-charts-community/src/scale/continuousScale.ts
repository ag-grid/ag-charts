import type { DomainWithMetadata, NormalizedDomain } from 'ag-charts-core';
import { findMinMax, maxValue, minValue, toNumber } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { AbstractScale } from './abstractScale';
import { unpackDomainMinMax } from './scaleUtil';

export abstract class ContinuousScale<D extends number | bigint | Date, I = number> extends AbstractScale<
    D,
    number,
    I
> {
    static is(value: unknown): value is ContinuousScale<any, any> {
        return value instanceof ContinuousScale;
    }

    static readonly defaultTickCount = 5;

    readonly defaultTickCount = ContinuousScale.defaultTickCount;

    protected defaultClamp = false;
    protected transform?(x: number): number;
    protected transformInvert?(x: number): D;

    // Domain caching to avoid repeated valueOf() calls in hot paths
    private _domain: D[] = [];
    private domainNeedsValueOf = true; // Safe default
    private d0Cache: number = Number.NaN;
    private d1Cache: number = Number.NaN;
    // Exact bigint domain endpoints, retained for the full-precision convert() ratio (see convertBigInt).
    private d0Big: bigint | undefined = undefined;
    private d1Big: bigint | undefined = undefined;

    get domain(): D[] {
        return this._domain;
    }

    set domain(values: readonly (D | bigint)[]) {
        if (!values || values.length < 2) {
            this._domain = narrowStoredDomain(values);
            this.d0Big = this.d1Big = undefined;
            this.d0Cache = Number.NaN;
            this.d1Cache = Number.NaN;
            return;
        }

        const d0 = values[0];
        const d1 = values[1];

        if (typeof d0 === 'bigint' || typeof d1 === 'bigint') {
            // Retain the exact bigint endpoints for the full-precision convert() ratio (and for the
            // order-independent domainMin/domainMax), but expose a Number-narrowed domain array.
            this.d0Big = typeof d0 === 'bigint' ? d0 : undefined;
            this.d1Big = typeof d1 === 'bigint' ? d1 : undefined;
            this.domainNeedsValueOf = false;
            this.d0Cache = Number(d0);
            this.d1Cache = Number(d1);
            this._domain = narrowStoredDomain(values);
            return;
        }

        this.d0Big = this.d1Big = undefined;
        this._domain = narrowStoredDomain(values);

        // Auto-detect if domain values need valueOf() and cache numeric values
        this.domainNeedsValueOf = d0 != null && typeof d0 === 'object';
        if (this.domainNeedsValueOf) {
            this.d0Cache = (d0 as Date).valueOf();
            this.d1Cache = (d1 as Date).valueOf();
        } else {
            this.d0Cache = Number(d0);
            this.d1Cache = Number(d1);
        }
    }

    protected constructor(
        domain: D[] = [],
        public range: number[] = []
    ) {
        super();
        this.domain = domain;
    }

    abstract override toDomain(value: number): D;

    normalizeDomains(...domains: DomainWithMetadata<D>[]): NormalizedDomain<D> {
        return normalizeContinuousDomains(...domains);
    }

    calcBandwidth(smallestInterval: AgNumericValue = 1, minWidth: 1 | 0 = 1) {
        const { domain } = this;

        const rangeDistance = this.getPixelRange();
        if (domain.length === 0) return rangeDistance;

        // Use cached domain values to avoid valueOf() calls
        const intervals = Math.abs(this.d1Cache - this.d0Cache) / Number(smallestInterval) + 1;

        // The number of intervals/bands is used to determine the width of individual bands by dividing the available range.
        let bands = intervals;

        // Allow a maximum number of bands to ensure the step does not fall below 1 pixel.
        // This means there could be some overlap of the bands in the chart.
        if (minWidth !== 0) {
            const maxBands = Math.floor(rangeDistance); // A minimum of 1px per bar/column means the maximum number of bands will equal the available range
            bands = Math.min(bands, maxBands);
        }

        return rangeDistance / Math.max(1, bands);
    }

    convert(value: D | AgNumericValue, options?: { clamp?: boolean }) {
        const { domain } = this;
        if (!domain || domain.length < 2 || value == null) {
            return Number.NaN;
        }

        const { range } = this;
        const clamp = options?.clamp ?? this.defaultClamp;

        // A float64 narrow collapses adjacent high-magnitude bigints, and for a bigint domain the narrowed
        // endpoints may be ±Infinity — so finite Numbers must take this path too.
        if (this.d0Big != null && this.d1Big != null && this.transform == null) {
            if (typeof value === 'bigint' || (typeof value === 'number' && Number.isFinite(value))) {
                return convertBigInt(value, this.d0Big, this.d1Big, range, clamp);
            }
        }

        // Use cached domain values to avoid valueOf() calls
        let d0: number = this.d0Cache;
        let d1: number = this.d1Cache;
        // A bigint reaching here has no exact bigint domain (or is on a transform scale) and narrows to Number.
        let x: number;
        if (typeof value === 'number') {
            x = value;
        } else if (typeof value === 'bigint') {
            x = Number(value);
        } else {
            x = value.valueOf();
        }
        if (this.transform) {
            d0 = this.transform(d0);
            d1 = this.transform(d1);
            x = this.transform(x);
        }

        if (clamp) {
            const [start, stop] = findMinMax([d0, d1]);
            if (x < start) {
                return range[0];
            } else if (x > stop) {
                return range[1];
            }
        }

        if (d0 === d1) {
            return (range[0] + range[1]) / 2;
        } else if (x === d0) {
            return range[0];
        } else if (x === d1) {
            return range[1];
        }

        const r0 = range[0];
        return r0 + ((x - d0) / (d1 - d0)) * (range[1] - r0);
    }

    /**
     * Converts `value` after clamping it into the domain extent. Unlike `convert(value, { clamp: true })`,
     * which clamps the output by sorted range order, clamping the input keeps reversed domains oriented so
     * out-of-domain values map to the correct endpoint.
     */
    convertClamped(value: AgNumericValue): number {
        const { d0Big, d1Big } = this;
        // Mirror convert()'s bigint guard: clamp on the exact endpoints so the still-bigint result
        // reaches convertBigInt and keeps full precision, rather than narrowing the input first.
        if (typeof value === 'bigint' && d0Big != null && d1Big != null) {
            const lo = minValue(d0Big, d1Big);
            const hi = maxValue(d0Big, d1Big);
            return this.convert(minValue(hi, maxValue(lo, value)));
        }

        const { d0Cache, d1Cache } = this;
        const lo = Math.min(d0Cache, d1Cache);
        const hi = Math.max(d0Cache, d1Cache);
        return this.convert(Math.min(hi, Math.max(lo, toNumber(value))));
    }

    invert(x: number, _nearest?: boolean) {
        const { domain } = this;
        if (domain.length < 2) return;

        // Use cached domain values to avoid valueOf() calls
        let d0: number = this.d0Cache;
        let d1: number = this.d1Cache;
        if (this.transform) {
            d0 = this.transform(d0);
            d1 = this.transform(d1);
        }

        const { range } = this;
        const [r0, r1] = range;

        let d: any;
        if (r0 === r1) {
            d = this.toDomain((d0 + d1) / 2);
        } else {
            d = this.toDomain(d0 + ((x - r0) / (r1 - r0)) * (d1 - d0));
        }

        return this.transformInvert ? this.transformInvert(d) : d;
    }

    override getDomainMinMax() {
        return unpackDomainMinMax(this.domain);
    }

    override snapshotDomain(): D[] {
        const snapshot = this._domain.slice();
        // d0Big/d1Big are only set when the domain was supplied as bigint, so D admits bigint here.
        if (this.d0Big != null) snapshot[0] = this.d0Big as D;
        if (this.d1Big != null) snapshot[1] = this.d1Big as D;
        return snapshot;
    }

    // Returns the exact (possibly bigint) endpoint stored at the given index, preferring the retained
    // bigint over its Number-narrowed copy.
    private exactEndpoint(index: 0 | 1): D {
        return ((index === 0 ? this.d0Big : this.d1Big) ?? this._domain[index]) as D;
    }

    // True when endpoint 0 is the minimum. Compares exact values so two bigints that narrow to the same
    // Number (differ below one ULP) are still ordered correctly, whatever the stored order.
    private startIsMin(): boolean {
        return this.exactEndpoint(0) <= this.exactEndpoint(1);
    }

    override get domainMin(): D | undefined {
        if (this._domain.length < 2) return this._domain.at(0);
        return this.exactEndpoint(this.startIsMin() ? 0 : 1);
    }

    override get domainMax(): D | undefined {
        if (this._domain.length < 2) return this._domain.at(0);
        return this.exactEndpoint(this.startIsMin() ? 1 : 0);
    }

    protected getPixelRange() {
        const [a, b] = this.range;
        return Math.abs(b - a);
    }
}

// Narrows bigint endpoints to Number for storage; the exact bigints are retained separately in d0Big/d1Big.
function narrowStoredDomain<D extends number | bigint | Date>(values: readonly (D | bigint)[]): D[] {
    return values.map((v) => (typeof v === 'bigint' ? Number(v) : v)) as D[];
}

// Integer ratio scale: 10^12 gives ~12 significant digits in [0,1] — far finer than pixel positioning
// needs — while keeping the narrowed intermediate product below Number.MAX_SAFE_INTEGER.
const BIGINT_RATIO_SCALE = 10n ** 12n;

/**
 * Linear convert() for bigint values, computed end-to-end in BigInt so neither the value-to-domain
 * difference nor the domain span loses precision when narrowed. Only the final [0,1] ratio crosses
 * to Number. Mirrors the equality/clamp short-circuits of the Number path.
 */
function convertBigInt(value: number | bigint, d0: bigint, d1: bigint, range: number[], clamp: boolean): number {
    const r0 = range[0];
    const r1 = range[1];

    // Same short-circuit order as the Number path: clamp, then zero-width domain, then endpoints.
    // Mixed-type relational comparisons (number vs bigint) are exact in JavaScript.
    if (clamp) {
        const lo = d0 < d1 ? d0 : d1;
        const hi = d0 < d1 ? d1 : d0;
        if (value < lo) return r0;
        if (value > hi) return r1;
    }

    if (d0 === d1) {
        return (r0 + r1) / 2;
    }

    // Decompose a finite Number value into an exact integer part plus a sub-integer remainder, so the
    // ratio is computed in BigInt regardless of the value's type.
    let whole: bigint;
    let fraction = 0;
    if (typeof value === 'number') {
        const truncated = Math.trunc(value);
        whole = BigInt(truncated);
        fraction = value - truncated;
    } else {
        whole = value;
    }

    if (fraction === 0) {
        if (whole === d0) return r0;
        if (whole === d1) return r1;
    }

    const span = d1 - d0;
    const ratioBig = ((whole - d0) * BIGINT_RATIO_SCALE) / span;
    // The fractional remainder contributes `fraction / span`; for spans beyond Number.MAX_VALUE this
    // term underflows to zero, which is below pixel precision anyway.
    const ratio = Number(ratioBig) / Number(BIGINT_RATIO_SCALE) + fraction / Number(span);
    return r0 + ratio * (r1 - r0);
}

export function normalizeContinuousDomains<D extends number | bigint | Date>(
    ...domains: DomainWithMetadata<D>[]
): NormalizedDomain<D> {
    let min: D | undefined;
    let max: D | undefined;

    for (const input of domains) {
        for (const d of input.domain) {
            // Compare relationally, not via Number(), so a bigint beyond Number.MAX_VALUE isn't collapsed to
            // Infinity and lost. Inputs are NaN-free (producers filter non-finite extents upstream).
            if (min === undefined || d < min) {
                min = d;
            }
            if (max === undefined || d > max) {
                max = d;
            }
        }
    }

    if (min != null && max != null) {
        return { domain: [min, max], animatable: true };
    } else {
        return { domain: [], animatable: false };
    }
}
