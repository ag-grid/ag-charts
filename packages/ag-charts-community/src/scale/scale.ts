export type ScaleType = 'number' | 'log' | 'time' | 'ordinal-time' | 'unit-time' | 'band' | 'mercator' | 'color';

export interface ScaleTickParams<I> {
    nice: boolean;
    interval: I | undefined;
    tickCount: number | undefined;
    minTickCount: number;
    maxTickCount: number;
}

export interface ScaleFormatParams<D> {
    domain: D[];
    ticks: D[];
    fractionDigits: number;
    specifier: string | undefined;
}

export interface NormalizedDomain<D> {
    domain: D[];
    animatable: boolean;
}

export interface Scale<D, R, I = number> {
    type: ScaleType;
    domain: D[];
    range: R[];
    normalizeDomains(...domains: D[][]): NormalizedDomain<D>;
    toDomain(value: number): D | undefined;
    convert(value: D, options?: { clamp?: boolean; interpolate?: boolean }): R;
    invert(value: R, exact?: boolean): D | undefined;
    ticks(ticks: ScaleTickParams<I>, domain?: D[], visibleRange?: [number, number]): D[] | undefined;
    niceDomain(ticks: ScaleTickParams<I>, domain?: D[]): D[];
    tickFormatter(params: ScaleFormatParams<D>): ((x: any) => string) | undefined;
    datumFormatter(params: ScaleFormatParams<D>): ((x: any) => string) | undefined;
    readonly bandwidth: number | undefined;
    readonly step: number | undefined;
    readonly inset: number | undefined;
}
