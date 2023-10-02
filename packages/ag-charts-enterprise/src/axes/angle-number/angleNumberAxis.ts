import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import { AngleAxis } from '../angle/angleAxis';
import { LinearAngleScale } from './linearAngleScale';

const { AND, Default, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate } = _ModuleSupport;
const { angleBetween, normalisedExtentWithMetadata } = _Util;

export class AngleNumberAxis extends AngleAxis<number, LinearAngleScale> {
    static className = 'AngleNumberAxis';
    static type = 'angle-number' as const;

    override shape = 'circle' as const;

    @Validate(AND(NUMBER_OR_NAN(), LESS_THAN('max')))
    @Default(NaN)
    min: number = NaN;

    @Validate(AND(NUMBER_OR_NAN(), GREATER_THAN('min')))
    @Default(NaN)
    max: number = NaN;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new LinearAngleScale());
    }

    override normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        return { domain: extent, clipped };
    }

    protected getRangeArcLength(): number {
        const { range: requestedRange } = this;

        const min = Math.min(...requestedRange);
        const max = Math.max(...requestedRange);
        const rotation = angleBetween(min, max);
        const radius = this.gridLength;
        return rotation * radius;
    }

    protected generateAngleTicks() {
        const arcLength = this.getRangeArcLength();
        const { scale, tick, range: requestedRange } = this;
        const { minSpacing, maxSpacing = NaN } = tick;
        const minTicksCount = maxSpacing ? Math.floor(arcLength / maxSpacing) : 1;
        const maxTicksCount = Math.floor(arcLength / minSpacing);
        const preferredTicksCount = Math.floor(4 / Math.PI * Math.abs(requestedRange[0] - requestedRange[1]));
        scale.tickCount = preferredTicksCount;
        scale.minTickCount = minTicksCount;
        scale.maxTickCount = maxTicksCount;
        return scale.ticks();
    }
}
