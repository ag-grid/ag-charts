export declare const interpolate = "$interpolate";
export declare const isInterpolating: (x: any) => x is Interpolating<any>;
export interface Interpolating<T = any> {
    $interpolate: (other: T, d: number) => T;
}
