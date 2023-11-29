import type { TimeInterval } from '../util/time/interval';
import type { Scale, ScaleConvertParams } from './scale';
export declare abstract class ContinuousScale<D extends number | Date, I = number> implements Scale<D, number, I> {
    domain: D[];
    range: number[];
    static readonly defaultTickCount = 5;
    static readonly defaultMaxTickCount = 6;
    static is(value: any): value is ContinuousScale<any, any>;
    nice: boolean;
    interval?: I;
    tickCount: number;
    minTickCount: number;
    maxTickCount: number;
    niceDomain: any[];
    smallestBandwidthInterval?: number;
    protected constructor(domain: D[], range: number[]);
    protected transform(x: D): D;
    protected transformInvert(x: D): D;
    calcBandwidth(smallestInterval?: number): number;
    fromDomain(d: D): number;
    abstract toDomain(d: number): D;
    getDomain(): any[];
    defaultClampMode: ScaleConvertParams['clampMode'];
    convert(x: D, opts?: ScaleConvertParams): number;
    invert(x: number): D;
    protected cache: any;
    protected cacheProps: Array<keyof this>;
    protected didChange(): boolean;
    abstract update(): void;
    protected abstract updateNiceDomain(): void;
    protected refresh(): void;
    protected getPixelRange(): number;
    protected isDenseInterval({ start, stop, interval, count, }: {
        start: number;
        stop: number;
        interval: number | TimeInterval;
        count?: number;
    }): boolean;
}
