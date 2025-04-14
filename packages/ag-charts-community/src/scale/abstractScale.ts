import type { NormalizedDomain, Scale, ScaleFormatParams, ScaleTickParams, ScaleType } from './scale';

export abstract class AbstractScale<D, R, I = number> implements Scale<D, R, I> {
    abstract type: ScaleType;
    abstract domain: D[];
    abstract range: R[];
    abstract normalizeDomains(...domains: D[][]): NormalizedDomain<D>;
    abstract toDomain(value: number): D | undefined;
    abstract convert(value: D, options: { clamp?: boolean; interpolate?: boolean }): R;
    abstract invert(value: R, nearest?: boolean): D | undefined;
    ticks(_ticks: ScaleTickParams<I>, _domain?: D[], _visibleRange?: [number, number]): D[] | undefined {
        return undefined;
    }
    niceDomain(_ticks: ScaleTickParams<I>, domain: D[] = this.domain): D[] {
        return domain;
    }
    tickFormatter(_params: ScaleFormatParams<D>): ((x: any) => string) | undefined {
        return undefined;
    }
    datumFormatter(_params: ScaleFormatParams<D>): ((x: any) => string) | undefined {
        return undefined;
    }
    get bandwidth(): number | undefined {
        return undefined;
    }
    get step(): number | undefined {
        return undefined;
    }
    get inset(): number | undefined {
        return undefined;
    }
}
