import type { Scale, ScaleConvertParams } from './scale';
export declare abstract class ContinuousScale<D extends number | Date, I = number> implements Scale<D, number, I> {
    static readonly defaultTickCount = 5;
    static readonly defaultMaxTickCount = 6;
    abstract type: Scale<D, number, I>['type'];
    static is(value: any): value is ContinuousScale<any, any>;
    protected invalid: boolean;
    domain: D[];
    range: number[];
    nice: boolean;
    interval?: I;
    tickCount: number;
    minTickCount: number;
    maxTickCount: number;
    protected niceDomain: any[];
    protected constructor(domain: D[], range: number[]);
    protected transform(x: D): D;
    protected transformInvert(x: D): D;
    calcBandwidth(smallestInterval?: number): number;
    abstract toDomain(d: number): D;
    getDomain(): any[];
    defaultClampMode: ScaleConvertParams['clampMode'];
    convert(x: D, opts?: ScaleConvertParams): number;
    invert(x: number): D;
    abstract update(): void;
    protected abstract updateNiceDomain(): void;
    protected refresh(): void;
    protected getPixelRange(): number;
}
