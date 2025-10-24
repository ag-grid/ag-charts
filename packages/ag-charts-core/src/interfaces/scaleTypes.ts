import type { AgTimeInterval } from 'ag-charts-types';

export type ScaleType = 'number' | 'log' | 'time' | 'unit-time' | 'ordinal-time' | 'category' | 'mercator' | 'color';

export interface ScaleTickParams<I> {
    nice: boolean;
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
    normalizeDomains(...domains: D[][]): NormalizedDomain<D>;
    toDomain(value: number): D | undefined;
    convert(value: D, options?: { clamp?: boolean; alignment?: ScaleAlignment }): R;
    invert(value: R, exact?: boolean): D | undefined;
    ticks(ticks: ScaleTickParams<I>, domain?: D[], visibleRange?: [number, number]): ScaleTickResult<D> | undefined;
    niceDomain(ticks: ScaleTickParams<I>, domain?: D[]): D[];
    readonly bandwidth: number | undefined;
    readonly step: number | undefined;
    readonly inset: number | undefined;
}
