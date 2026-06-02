import type { AxisID, DomainWithMetadata, DynamicContext, NormalisedNumberAxisOptions } from 'ag-charts-core';
import { normalisedExtentWithMetadata } from 'ag-charts-core';
import type { FormatterParams } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { CartesianAxis } from './cartesianAxis';

export class NumberAxis<
    TOptions extends NormalisedNumberAxisOptions = NormalisedNumberAxisOptions,
> extends CartesianAxis<LinearScale | LogScale, number | bigint, TOptions> {
    static readonly className: string = 'NumberAxis';
    static readonly type: string = 'number';

    constructor(
        moduleCtx: DynamicContext<ChartRegistry>,
        id: AxisID,
        scale: LinearScale | LogScale = new LinearScale(),
        options: TOptions
    ) {
        super(moduleCtx, id, scale, options);
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this.options;
        return min != null && max != null && min < max;
    }

    protected override getLabelFormat() {
        return this.options.label.format;
    }

    override normaliseDataDomain(d: DomainWithMetadata<number | bigint>) {
        const { min, max, preferredMin, preferredMax } = this.options;
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
        return [this.options.min == null && this.nice, this.options.max == null && this.nice];
    }

    protected getVisibleDomain(domain: (number | bigint)[]): [number, number] {
        // Narrow to Number: a bigint domain reaches here as formatter-context metadata only — the tick
        // label itself carries the exact bigint value, so this range context can narrow safely.
        const d0 = Number(domain[0]);
        const d1 = Number(domain[1]);
        const [r0, r1] = this.visibleRange;
        const length = d1 - d0;
        return [d0 + r0 * length, d1 - (1 - r1) * length];
    }

    override tickFormatParams(
        domain: (number | bigint)[],
        _ticks: (number | bigint)[],
        fractionDigits?: number
    ): AxisTickFormatParams {
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
