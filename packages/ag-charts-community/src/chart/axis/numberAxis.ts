import type { ModuleContext } from '../../module/moduleContext';
import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import { normalisedExtentWithMetadata } from '../../util/array';
import { Default } from '../../util/default';
import { calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { AND, BOOLEAN, GREATER_THAN, LESS_THAN, NUMBER_OR_NAN, Validate } from '../../util/validation';
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

    @Validate(BOOLEAN)
    @Default(false)
    absolute: boolean = false;

    override getFormatter(
        index?: number,
        isTickLabel?: boolean | undefined
    ): (datum: any, fractionDigits?: number | undefined) => string {
        const formatter = super.getFormatter(index, isTickLabel);

        return (datum: any, fractionDigits?: number | undefined) => {
            if (typeof datum === 'number' && this.absolute) {
                return formatter(Math.abs(datum), fractionDigits);
            }
            return formatter(datum, fractionDigits);
        };
    }

    override updateSecondaryAxisTicks(primaryTickCount: number | undefined): any[] {
        if (this.dataDomain == null) {
            throw new Error('AG Charts - dataDomain not calculated, cannot perform tick calculation.');
        }

        if (this.dataDomain.domain.length === 0) {
            return [];
        }

        const { domain, ticks } = calculateNiceSecondaryAxis(
            this.dataDomain.domain,
            primaryTickCount ?? 0,
            this.reverse
        );

        this.scale.nice = false;
        this.scale.domain = domain;
        this.scale.update();

        return ticks;
    }
}
