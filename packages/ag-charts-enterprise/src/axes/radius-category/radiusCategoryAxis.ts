import { type FormatterParams, _ModuleSupport } from 'ag-charts-community';
import { Property, ProxyPropertyOnWrite } from 'ag-charts-core';

import { RadiusAxis } from '../radius/radiusAxis';

const { CategoryScale } = _ModuleSupport;
export class RadiusCategoryAxis extends RadiusAxis {
    static readonly className = 'RadiusCategoryAxis';
    static readonly type = 'radius-category' as const;

    override shape = 'circle' as const;

    @Property
    groupPaddingInner: number = 0;

    @ProxyPropertyOnWrite('scale', 'paddingInner')
    @Property
    paddingInner: number = 0;

    @ProxyPropertyOnWrite('scale', 'paddingOuter')
    @Property
    paddingOuter: number = 0;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new CategoryScale());
    }

    override hasDefinedDomain(): boolean {
        return false;
    }

    override normaliseDataDomain(domain: Array<string | object>) {
        return { domain, clipped: false };
    }

    protected prepareGridPathTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[] {
        return data.slice().reverse();
    }

    protected getTickRadius(tickDatum: _ModuleSupport.TickDatum): number {
        const { scale, innerRadiusRatio } = this;

        const maxRadius = scale.range[0];
        const minRadius = maxRadius * innerRadiusRatio;

        if (CategoryScale.is(scale)) {
            const ticks = scale.domain;
            const index = ticks.length - 1 - ticks.indexOf(tickDatum.tick);
            return index === 0 ? minRadius : scale.inset + scale.step * (index - 0.5) + scale.bandwidth / 2;
        } else {
            const tickRange = (maxRadius - minRadius) / scale.domain.length;
            return maxRadius - tickDatum.translation + minRadius - tickRange / 2;
        }
    }

    override tickFormatParams(): _ModuleSupport.AxisTickFormatParams {
        return { type: 'category' };
    }

    override datumFormatParams(value: any, params: _ModuleSupport.FormatDatumParams): FormatterParams<any> {
        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        return { type: 'category', value, datum, seriesId, legendItemName, key, source, property, domain, boundSeries };
    }
}
