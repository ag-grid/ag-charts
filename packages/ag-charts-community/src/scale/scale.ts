export type ScaleType = 'number' | 'log' | 'time' | 'ordinal-time' | 'band' | 'mercator' | 'color';

export interface ScaleTickParams<I> {
    nice: boolean;
    interval: I | undefined;
    tickCount: number | undefined;
    minTickCount: number;
    maxTickCount: number;
}

export interface ScaleFormatParams<D> {
    visibleTicks: D[];
    ticks: D[];
    fractionDigits: number;
    specifier: string | undefined;
}

export interface Scale<D, R, I = number> {
    type: ScaleType;
    domain: D[];
    range: R[];
    toDomain(value: number): D | undefined;
    convert(value: D, clamp?: boolean): R;
    invert(value: R, exact?: boolean): D | undefined;
    ticks(ticks: ScaleTickParams<I>, domain?: D[], visibleRange?: [number, number]): D[] | undefined;
    niceDomain(ticks: ScaleTickParams<I>, domain?: D[]): D[];
    tickFormatter(params: ScaleFormatParams<D>): ((x: any) => string) | undefined;
    datumFormatter(params: ScaleFormatParams<D>): ((x: any) => string) | undefined;
    readonly bandwidth: number | undefined;
    readonly step: number | undefined;
    readonly inset: number | undefined;
}
