import type { ModuleContext } from '../../module/moduleContext';
import { LogScale } from '../../scale/logScale';
import { normalisedExtentWithMetadata } from '../../util/array';
import { Default } from '../../util/default';
import { Logger } from '../../util/logger';
import { AND, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate, predicateWithMessage } from '../../util/validation';
import { NumberAxis } from './numberAxis';

function NON_ZERO_NUMBER() {
    // Cannot be 0
    const message = `expecting a non-zero Number`;

    return predicateWithMessage((v: any) => typeof v === 'number' && v !== 0, message);
}

export class LogAxis extends NumberAxis {
    static override className = 'LogAxis';
    static override type = 'log' as const;

    override normaliseDataDomain(d: number[]) {
        const { min, max } = this;

        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        const isInverted = extent[0] > extent[1];
        const crossesZero = extent[0] < 0 && extent[1] > 0;
        const hasZeroExtent = extent[0] === 0 && extent[1] === 0;
        const invalidDomain = isInverted || crossesZero || hasZeroExtent;

        if (invalidDomain) {
            d = [];
            if (crossesZero) {
                Logger.warn(
                    `the data domain crosses zero, the chart data cannot be rendered. See log axis documentation for more information.`
                );
            } else if (hasZeroExtent) {
                Logger.warn(`the data domain has 0 extent, no data is rendered.`);
            }
        }
        if (extent[0] === 0) {
            extent[0] = 1;
        }
        if (extent[1] === 0) {
            extent[1] = -1;
        }

        return { domain: extent, clipped };
    }

    @Validate(AND(NUMBER_OR_NAN(), LESS_THAN('max'), NON_ZERO_NUMBER()))
    @Default(NaN)
    override min: number = NaN;

    @Validate(AND(NUMBER_OR_NAN(), GREATER_THAN('min'), NON_ZERO_NUMBER()))
    @Default(NaN)
    override max: number = NaN;

    set base(value: number) {
        (this.scale as LogScale).base = value;
    }
    get base(): number {
        return (this.scale as LogScale).base;
    }

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new LogScale());
    }
}
