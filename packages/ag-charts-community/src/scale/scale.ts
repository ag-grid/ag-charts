interface ScaleTickFormatParams {
    ticks?: any[];
    domain?: any[];
    specifier?: any;
}

export type ScaleType = 'number' | 'log' | 'time' | 'ordinal-time' | 'band' | 'mercator' | 'color';

export interface Scale<D, R, I = number> {
    type: ScaleType;
    domain: D[];
    range: R[];
    nice?: boolean;
    tickCount?: number;
    interval?: I;
    convert(value: D, clamp?: boolean): R;
    invert?(value: R, clamp?: boolean): D;
    invertNearest?(value: R): D;
    ticks?(): D[];
    tickFormat?(params: ScaleTickFormatParams): (x: any) => string;
    getDomain?(): D[];
    setVisibleRange?(visibleRange: [number, number]): void;
    readonly bandwidth?: number;
    readonly step?: number;
    readonly inset?: number;
}
