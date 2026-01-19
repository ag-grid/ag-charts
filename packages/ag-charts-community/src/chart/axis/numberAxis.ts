import type { DomainWithMetadata } from 'ag-charts-core';
import { Property, normalisedExtentWithMetadata } from 'ag-charts-core';
import type { FormatterParams } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { CartesianAxis } from './cartesianAxis';

export class NumberAxis extends CartesianAxis<LinearScale | LogScale, number> {
    static readonly className: string = 'NumberAxis';
    static readonly type: string = 'number';

    @Property
    min?: number;

    @Property
    max?: number;

    @Property
    preferredMin?: number;

    @Property
    preferredMax?: number;

    constructor(moduleCtx: ModuleContext, scale = new LinearScale() as LinearScale | LogScale) {
        super(moduleCtx, scale);
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this;
        return min != null && max != null && min < max;
    }

    override normaliseDataDomain(d: DomainWithMetadata<number>) {
        const { min, max, preferredMin, preferredMax } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(
            d.domain,
            min,
            max,
            preferredMin,
            preferredMax,
            undefined,
            d.sortMetadata?.sortOrder
        );

        return { domain: extent, clipped };
    }

    override getDomainExtentsNice(): [boolean, boolean] {
        return [this.min == null && this.nice, this.max == null && this.nice];
    }

    protected getVisibleDomain(domain: number[]): [number, number] {
        const [d0, d1] = domain;
        const [r0, r1] = this.visibleRange;
        const length = d1 - d0;
        return [d0 + r0 * length, d1 - (1 - r1) * length];
    }

    override tickFormatParams(domain: number[], _ticks: number[], fractionDigits?: number): AxisTickFormatParams {
        return { type: 'number', visibleDomain: this.getVisibleDomain(domain), fractionDigits };
    }

    override datumFormatParams(value: any, params: FormatDatumParams, fractionDigits?: number): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        const visibleDomain = this.getVisibleDomain(domain);
        return {
            type: 'number',
            value,
            datum,
            seriesId,
            legendItemName,
            key,
            source,
            property,
            domain,
            visibleDomain,
            boundSeries,
            fractionDigits,
        };
    }
}
