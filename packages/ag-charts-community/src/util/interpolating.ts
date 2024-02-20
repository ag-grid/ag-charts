// FIXME: Use symbol (requires TS >=4.9)
export const interpolate = '$interpolate';

export interface Interpolating<T = any> {
    $interpolate: (other: T, d: number) => T;
}
