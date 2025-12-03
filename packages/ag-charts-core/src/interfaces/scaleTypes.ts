import type { AgTimeInterval } from 'ag-charts-types';

export type ScaleType = 'number' | 'log' | 'time' | 'unit-time' | 'ordinal-time' | 'category' | 'mercator' | 'color';

/**
 * Metadata about a domain's sort characteristics.
 * Used to skip expensive sort order detection in scales.
 */
export interface DomainSortMetadata {
    /** Sort order: 1 = ascending, -1 = descending, undefined = unsorted/unknown */
    sortOrder: 1 | -1 | undefined;
    /** True if all values are unique (no duplicates) */
    isUnique?: boolean;
}

/**
 * A domain array with optional metadata for optimization.
 * When metadata is present, scales can skip expensive scans.
 */
export interface DomainWithMetadata<D> {
    domain: D[];
    sortMetadata?: DomainSortMetadata;
}

/** Input type for normalizeDomains - either a plain array or annotated domain. */
export type DomainInput<D> = D[] | DomainWithMetadata<D>;

/**
 * Type guard to check if a domain has metadata attached.
 */
export function isDomainWithMetadata<D>(value: DomainInput<D>): value is DomainWithMetadata<D> {
    return value != null && typeof value === 'object' && 'domain' in value && Array.isArray((value as any).domain);
}

/**
 * Extract domain array from either plain array or annotated domain.
 */
export function extractDomain<D>(value: DomainInput<D>): D[] {
    return isDomainWithMetadata(value) ? value.domain : value;
}

export interface ScaleTickParams<I> {
    nice: boolean[];
    interval: I | undefined;
    tickCount: number | undefined;
    minTickCount: number;
    maxTickCount: number;
}

export interface NormalizedDomain<D> {
    domain: D[];
    animatable: boolean;
}

export interface ScaleTickResult<D> {
    // Ticks within visible range
    ticks: D[];
    // Fractional count of all ticks (including outside visible range)
    // If you generated a tick every 2 between 0 and 5, you'd have 2.5 ticks
    // Use Math.floor to get the actual number of ticks rendered
    count: number | undefined;
    // When rendering ticks within a visible range, this gives what the index of the first tick would be
    // if all ticks were rendered.
    firstTickIndex?: number;
    // Used for continuous time scale ticks
    timeInterval?: AgTimeInterval;
}

export enum ScaleAlignment {
    Leading,
    Trailing,
    Interpolate,
}

export interface Scale<D, R, I = number> {
    readonly type: ScaleType;
    readonly defaultTickCount: number;
    domain: D[];
    range: R[];
    normalizeDomains(...domains: DomainInput<D>[]): NormalizedDomain<D>;
    toDomain(value: number): D | undefined;
    convert(value: D, options?: { clamp?: boolean; alignment?: ScaleAlignment }): R;
    invert(value: R, exact?: boolean): D | undefined;
    ticks(ticks: ScaleTickParams<I>, domain?: D[], visibleRange?: [number, number]): ScaleTickResult<D> | undefined;
    niceDomain(ticks: ScaleTickParams<I>, domain?: D[]): D[];
    readonly bandwidth: number | undefined;
    readonly step: number | undefined;
    readonly inset: number | undefined;
}
