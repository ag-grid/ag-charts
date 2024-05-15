export interface IScale<D, R> {
    domain: D[];
    range: R[];
    convert(value: D, clamp?: boolean): R;
    invert(value: R, clamp?: boolean): D;
    reverse(): void;
}

// export interface IContinuousScale<D, R> extends IScale<D, R> {
//     min?: number;
//     max?: number;
//     nice?: boolean;
// }
