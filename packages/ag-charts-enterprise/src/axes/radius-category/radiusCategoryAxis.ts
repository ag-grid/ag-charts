import { _ModuleSupport } from 'ag-charts-community';

import { RadiusAxis } from '../radius/radiusAxis';

const { RATIO, ProxyPropertyOnWrite, Validate, CategoryScale } = _ModuleSupport;

export class RadiusCategoryAxis extends RadiusAxis {
    static readonly className = 'RadiusCategoryAxis';
    static readonly type = 'radius-category' as const;

    override shape = 'circle' as const;

    @Validate(RATIO)
    groupPaddingInner: number = 0;

    @ProxyPropertyOnWrite('scale', 'paddingInner')
    @Validate(RATIO)
    paddingInner: number = 0;

    @ProxyPropertyOnWrite('scale', 'paddingOuter')
    @Validate(RATIO)
    paddingOuter: number = 0;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new CategoryScale());
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
            return maxRadius - tickDatum.translationY + minRadius - tickRange / 2;
        }
    }
}
