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

    override normaliseDataDomain(d: number[]) {
        const { min, max, preferredMin, preferredMax } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max, preferredMin, preferredMax);

        return { domain: extent, clipped };
    }

    override getDomainExtentsNice(): [boolean, boolean] {
        return [this.min == null && this.nice, this.max == null && this.nice];
    }

    override tickFormatParams(_domain: number[], _ticks: number[], fractionDigits?: number): AxisTickFormatParams {
        return { type: 'number', fractionDigits };
    }

    override datumFormatParams(value: any, params: FormatDatumParams, fractionDigits?: number): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
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
            boundSeries,
            fractionDigits,
        };
    }
}
