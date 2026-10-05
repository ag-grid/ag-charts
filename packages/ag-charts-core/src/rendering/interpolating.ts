export const interpolate = Symbol('interpolate');

export const isInterpolating = (x: any): x is Interpolating => x[interpolate] != null;

export interface Interpolating<T = any> {
    equals(other: T): boolean;
    [interpolate]: (other: T, d: number) => T;
}
