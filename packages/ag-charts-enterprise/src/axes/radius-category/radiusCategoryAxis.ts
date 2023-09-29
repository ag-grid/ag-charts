import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { RadiusAxis } from '../radius/radiusAxis';
import type { RadiusTickDatum } from '../radius/radiusAxis';

const { NUMBER, ProxyPropertyOnWrite, Validate } = _ModuleSupport;
const { BandScale } = _Scale;

export class RadiusCategoryAxis extends RadiusAxis {
    static className = 'RadiusCategoryAxis';
    static type = 'radius-category' as const;

    override shape = 'circle' as const;

    @Validate(NUMBER(0, 1))
    groupPaddingInner: number = 0;

    @ProxyPropertyOnWrite('scale', 'paddingInner')
    @Validate(NUMBER(0, 1))
    paddingInner: number = 0;

    @ProxyPropertyOnWrite('scale', 'paddingOuter')
    @Validate(NUMBER(0, 1))
    paddingOuter: number = 0;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new BandScale());
    }

    protected prepareTickData(data: RadiusTickDatum[]): RadiusTickDatum[] {
        return data.slice().reverse();
    }

    protected getTickRadius(tickDatum: RadiusTickDatum): number {
        const { scale } = this;
        const maxRadius = scale.range[0];
        const minRadius = maxRadius * this.innerRadiusRatio;
        const tickRange = (maxRadius - minRadius) / scale.domain.length;
        return maxRadius - tickDatum.translationY + minRadius - tickRange / 2;
    }
}
