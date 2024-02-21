// FIXME: Use symbol (requires TS >=4.9)
export const interpolate = '$interpolate';

export const isInterpolating = (x: any): x is Interpolating => x[interpolate] != null;

export interface Interpolating<T = any> {
    $interpolate: (other: T, d: number) => T;
}
