import type {
    DomainWithMetadata,
    Logger,
    NormalizedDomain,
    Scale,
    ScaleAlignment,
    ScaleTickParams,
    ScaleType,
} from 'ag-charts-core';

export abstract class AbstractScale<D, R, I = number> implements Scale<D, R, I> {
    logger: Logger | undefined;

    abstract readonly type: ScaleType;
    abstract readonly defaultTickCount: number;
    abstract domain: D[];
    abstract range: R[];
    abstract normalizeDomains(...domains: DomainWithMetadata<D>[]): NormalizedDomain<D>;
    abstract toDomain(value: number): D | undefined;
    abstract convert(value: D, options: { clamp?: boolean; alignment?: ScaleAlignment }): R;
    abstract invert(value: R, nearest?: boolean): D | undefined;
    invertWithPercentage(value: R): { value: D; groupPercentage: number } | D | undefined {
        return this.invert(value, true);
    }
    abstract getDomainMinMax(): [D, D] | [undefined, undefined];
    snapshotDomain(): D[] {
        return this.domain;
    }
    restoreDomain(snapshot: D[]): void {
        this.domain = snapshot;
    }
    get domainMin(): D | undefined {
        return this.getDomainMinMax()[0];
    }
    get domainMax(): D | undefined {
        return this.getDomainMinMax()[1];
    }
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
