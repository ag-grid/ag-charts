export interface Scale<D, R> {
    domain: D[];
    range: R[];
    convert(value: D, clamper?: (values: D[]) => (x: D) => D): R;
    invert?(value: R): D;
    ticks?(count: any): D[];
    tickFormat?(count: any, specifier?: any): (x: any) => string;
    nice?(count?: number): void;
    bandwidth?: number;
}

export type Reinterpolator<T> = (t: number) => T;
export type Deinterpolator<T> = (v: T) => number;
