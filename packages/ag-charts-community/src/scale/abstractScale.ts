import type { DomainInput, NormalizedDomain, Scale, ScaleAlignment, ScaleTickParams, ScaleType } from 'ag-charts-core';

export abstract class AbstractScale<D, R, I = number> implements Scale<D, R, I> {
    abstract readonly type: ScaleType;
    abstract readonly defaultTickCount: number;
    abstract domain: D[];
    abstract range: R[];
    abstract normalizeDomains(...domains: DomainInput<D>[]): NormalizedDomain<D>;
    abstract toDomain(value: number): D | undefined;
    abstract convert(value: D, options: { clamp?: boolean; alignment?: ScaleAlignment }): R;
    abstract invert(value: R, nearest?: boolean): D | undefined;
    ticks(
        _ticks: ScaleTickParams<I>,
        _domain?: D[],
        _visibleRange?: [number, number]
    ): { ticks: D[]; count: number | undefined } | undefined {
        return undefined;
    }
    niceDomain(_ticks: ScaleTickParams<I>, domain: D[] = this.domain): D[] {
        return domain;
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
