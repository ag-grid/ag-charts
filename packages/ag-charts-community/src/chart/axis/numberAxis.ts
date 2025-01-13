import type { ModuleContext } from '../../module/moduleContext';
import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import { Default } from '../../util/default';
import { normalisedExtentWithMetadata } from '../../util/extent';
import { AND, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';

export class NumberAxis extends CartesianAxis<LinearScale | LogScale, number> {
    static readonly className: string = 'NumberAxis';
    static readonly type: string = 'number';

    constructor(moduleCtx: ModuleContext, scale = new LinearScale() as LinearScale | LogScale) {
        super(moduleCtx, scale);
    }

    override normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        return { domain: extent, clipped };
    }

    @Validate(AND(NUMBER_OR_NAN, LESS_THAN('max')))
    @Default(NaN)
    min: number = NaN;

    @Validate(AND(NUMBER_OR_NAN, GREATER_THAN('min')))
    @Default(NaN)
    max: number = NaN;
}
