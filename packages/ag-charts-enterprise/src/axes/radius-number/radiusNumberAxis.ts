import { type FormatterParams, _ModuleSupport } from 'ag-charts-community';
import type {
    AxisID,
    DomainWithMetadata,
    DynamicContext,
    NormalisedRadiusNumberAxisOptions,
    NormalisedTextOrSegments,
} from 'ag-charts-core';
import { normalisedExtentWithMetadata, toNumber } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { RadiusAxis } from '../radius/radiusAxis';

const { LinearScale } = _ModuleSupport;
interface TickDatum {
    tick: any;
    tickId: string;
    tickLabel: NormalisedTextOrSegments | undefined;
    translation: number;
}

export class RadiusNumberAxis extends RadiusAxis<
    _ModuleSupport.LinearScale,
    AgNumericValue,
    NormalisedRadiusNumberAxisOptions
> {
    static readonly className = 'RadiusNumberAxis';
    static readonly type = 'radius-number' as const;

    constructor(
        moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>,
        id: AxisID,
        options: NormalisedRadiusNumberAxisOptions
    ) {
        super(moduleCtx, id, new LinearScale(), options);
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this.options;
        return min != null && max != null && min < max;
    }

    protected override getLabelFormat() {
        return this.options.label.format;
    }

    protected prepareGridPathTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[] {
        const { scale } = this;
        // Narrow to Number so the comparator never mixes a bigint tick with a number tick (mixed subtraction throws).
        const domainTop = toNumber(scale.domain[1]);
        return data
            .filter(({ tick }) => toNumber(tick) !== domainTop) // Prevent outer tick being drawn behind polar line
            .sort((a, b) => toNumber(b.tick) - toNumber(a.tick)); // Apply grid styles starting from the largest arc
    }

    protected getTickRadius(tickDatum: TickDatum): number {
        const { scale } = this;
        const maxRadius = scale.range[0];
        const minRadius = maxRadius * this.innerRadiusRatio;
        return maxRadius - tickDatum.translation + minRadius;
    }

    override normaliseDataDomain(d: DomainWithMetadata<number>) {
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

    override tickFormatParams(
        _domain: number[],
        _ticks: number[],
        fractionDigits?: number
    ): _ModuleSupport.AxisTickFormatParams {
        return { type: 'number', visibleDomain: undefined, fractionDigits };
    }

    override datumFormatParams(
        value: any,
        params: _ModuleSupport.FormatDatumParams,
        fractionDigits?: number
    ): FormatterParams<any> {
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
            visibleDomain: undefined,
        };
    }
}
