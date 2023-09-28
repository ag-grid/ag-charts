import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import { AngleAxis } from '../angle/angleAxis';
import { LinearAngleScale } from './linearAngleScale';

const { AND, Default, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate } = _ModuleSupport;
const { normalisedExtentWithMetadata } = _Util;

export class AngleNumberAxis extends AngleAxis {
    static className = 'AngleNumberAxis';
    static type = 'angle-number' as const;

    shape = 'circle' as const;

    @Validate(AND(NUMBER_OR_NAN(), LESS_THAN('max')))
    @Default(NaN)
    min: number = NaN;

    @Validate(AND(NUMBER_OR_NAN(), GREATER_THAN('min')))
    @Default(NaN)
    max: number = NaN;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new LinearAngleScale());
    }

    normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        return { domain: extent, clipped };
    }
}
