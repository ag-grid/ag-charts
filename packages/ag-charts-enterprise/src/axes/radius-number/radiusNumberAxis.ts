import { type FormatterParams, type TextOrSegments, _ModuleSupport } from 'ag-charts-community';
import { Property, normalisedExtentWithMetadata } from 'ag-charts-core';

import { RadiusAxis } from '../radius/radiusAxis';

const { LinearScale } = _ModuleSupport;
interface TickDatum {
    tick: any;
    tickId: string;
    tickLabel: TextOrSegments | undefined;
    translation: number;
}

export class RadiusNumberAxis extends RadiusAxis {
    static readonly className = 'RadiusNumberAxis';
    static readonly type = 'radius-number' as const;

    override shape: 'polygon' | 'circle' = 'polygon';

    @Property
    min?: number;

    @Property
    max?: number;

    @Property
    preferredMin?: number;

    @Property
    preferredMax?: number;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new LinearScale());
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this;
        return min != null && max != null && min < max;
    }

    protected prepareGridPathTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[] {
        const { scale } = this;
        const domainTop = scale.domain[1];
        return data
            .filter(({ tick }) => tick !== domainTop) // Prevent outer tick being drawn behind polar line
            .sort((a, b) => b.tick - a.tick); // Apply grid styles starting from the largest arc
    }

    protected getTickRadius(tickDatum: TickDatum): number {
        const { scale } = this;
        const maxRadius = scale.range[0];
        const minRadius = maxRadius * this.innerRadiusRatio;
        return maxRadius - tickDatum.translation + minRadius;
    }

    override normaliseDataDomain(d: number[]) {
        const { min, max, preferredMin, preferredMax } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max, preferredMin, preferredMax);

        return { domain: extent, clipped };
    }

    override getDomainExtentsNice(): [boolean, boolean] {
        return [this.min == null && this.nice, this.max == null && this.nice];
    }

    override tickFormatParams(
        _domain: number[],
        _ticks: number[],
        fractionDigits?: number
    ): _ModuleSupport.AxisTickFormatParams {
        return { type: 'number', fractionDigits };
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
        };
    }
}
