import { _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

import { RadiusAxis } from '../radius/radiusAxis';

const { AND, Default, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate } = _ModuleSupport;
const { LinearScale } = _Scale;
const { normalisedExtentWithMetadata } = _Util;

type TickDatum = {
    tickLabel: string;
    tick: any;
    tickId: string;
    translationY: number;
};

export class RadiusNumberAxis extends RadiusAxis {
    static readonly className = 'RadiusNumberAxis';
    static readonly type = 'radius-number' as const;

    override shape: 'polygon' | 'circle' = 'polygon';

    @Validate(AND(NUMBER_OR_NAN, LESS_THAN('max')))
    @Default(NaN)
    min: number = NaN;

    @Validate(AND(NUMBER_OR_NAN, GREATER_THAN('min')))
    @Default(NaN)
    max: number = NaN;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new LinearScale());
    }

    protected prepareTickData(data: _ModuleSupport.TickDatum[]): _ModuleSupport.TickDatum[] {
        const { scale } = this;
        const domainTop = scale.getDomain?.()[1];
        return data
            .filter(({ tick }) => tick !== domainTop) // Prevent outer tick being drawn behind polar line
            .sort((a, b) => b.tick - a.tick); // Apply grid styles starting from the largest arc
    }

    protected getTickRadius(tickDatum: TickDatum): number {
        const { scale } = this;
        const maxRadius = scale.range[0];
        const minRadius = maxRadius * this.innerRadiusRatio;
        return maxRadius - tickDatum.translationY + minRadius;
    }

    override normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        return { domain: extent, clipped };
    }
}
