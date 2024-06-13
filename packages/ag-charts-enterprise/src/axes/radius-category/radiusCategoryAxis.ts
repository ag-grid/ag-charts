import { _ModuleSupport, _Scale } from 'ag-charts-community';

import { RadiusAxis } from '../radius/radiusAxis';

const { RATIO, ProxyPropertyOnWrite, Validate } = _ModuleSupport;
const { BandScale } = _Scale;

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
        super(moduleCtx, new BandScale());
    }

    protected prepareTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[] {
        return data.slice().reverse();
    }

    protected getTickRadius(tickDatum: _ModuleSupport.TickDatum): number {
        const { scale } = this;
        const maxRadius = scale.range[0];
        const minRadius = maxRadius * this.innerRadiusRatio;
        const tickRange = (maxRadius - minRadius) / scale.domain.length;
        return maxRadius - tickDatum.translationY + minRadius - tickRange / 2;
    }
}
