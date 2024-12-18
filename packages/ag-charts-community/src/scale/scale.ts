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
    nice?: boolean;
    tickCount?: number;
    interval?: I;
    toDomain?(value: number): D;
    convert(value: D, clamp?: boolean): R;
    invert?(value: R, clamp?: boolean): D;
    invertNearest?(value: R): D;
    ticks?(ticks: ScaleTickParams<I>, domain?: D[], visibleRange?: [number, number]): D[];
    niceDomain?(ticks: ScaleTickParams<I>, domain?: D[]): D[];
    tickFormatter(params: ScaleFormatParams<D>): ((x: any) => string) | undefined;
    datumFormatter(params: ScaleFormatParams<D>): ((x: any) => string) | undefined;
    readonly bandwidth?: number;
    readonly step?: number;
    readonly inset?: number;
}
