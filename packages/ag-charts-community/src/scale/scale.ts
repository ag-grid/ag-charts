export interface ScaleClampParams {
    mode: 'clamped' | 'raw';
}

interface ScaleTickFormatParams {
    ticks?: any[];
    specifier?: any;
}

export interface Scale<D, R, I = number> {
    domain: D[];
    range: R[];
    nice?: boolean;
    tickCount?: number;
    interval?: I;
    convert(value: D, params?: ScaleClampParams): R;
    invert?(value: R): D;
    ticks?(): D[];
    tickFormat?(params: ScaleTickFormatParams): (x: any) => string;
    getDomain?(): D[];
    bandwidth?: number;
}
