export interface ScaleConvertParams {
    clampMode: 'clamped' | 'raw';
}
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
    convert(value: D, params?: ScaleConvertParams): R;
    invert?(value: R): D;
    ticks?(): D[];
    tickFormat?(params: ScaleTickFormatParams): (x: any) => string;
    getDomain?(): D[];
    bandwidth?: number;
    step?: number;
}
export {};
