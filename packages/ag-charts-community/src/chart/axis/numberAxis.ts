import { LinearScale } from '../../scale/linearScale';
import type { LogScale } from '../../scale/logScale';
import { normalisedExtentWithMetadata } from '../../util/array';
import { Validate, GREATER_THAN, AND, LESS_THAN, NUMBER_OR_NAN } from '../../util/validation';
import { Default } from '../../util/default';
import { calculateNiceSecondaryAxis } from '../../util/secondaryAxisTicks';
import { Logger } from '../../util/logger';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
import type { ModuleContext } from '../../util/moduleContext';

class NumberAxisTick extends AxisTick<LinearScale | LogScale, number> {
    @Validate(AND(NUMBER_OR_NAN(1), GREATER_THAN('minSpacing')))
    @Default(NaN)
    maxSpacing: number = NaN;
}

export class NumberAxis extends CartesianAxis<LinearScale | LogScale, number> {
    static className = 'NumberAxis';
    static type = 'number' as 'number' | 'log';

    constructor(moduleCtx: ModuleContext, scale = new LinearScale() as LinearScale | LogScale) {
        super(moduleCtx, scale);
    }

    normaliseDataDomain(d: number[]) {
        const { min, max } = this;
        const { extent, clipped } = normalisedExtentWithMetadata(d, min, max);

        return { domain: extent, clipped };
    }

    @Validate(AND(NUMBER_OR_NAN(), LESS_THAN('max')))
    @Default(NaN)
    min: number = NaN;

    @Validate(AND(NUMBER_OR_NAN(), GREATER_THAN('min')))
    @Default(NaN)
    max: number = NaN;

    formatDatum(datum: number): string {
        if (typeof datum === 'number') {
            return datum.toFixed(2);
        } else {
            Logger.warnOnce(
                'data contains Date objects which are being plotted against a number axis, please only use a number axis for numbers.'
            );
            return String(datum);
        }
    }

    protected createTick() {
        return new NumberAxisTick();
    }

    updateSecondaryAxisTicks(primaryTickCount: number | undefined): any[] {
        if (this.dataDomain == null) {
            throw new Error('AG Charts - dataDomain not calculated, cannot perform tick calculation.');
        }

        const [d, ticks] = calculateNiceSecondaryAxis(this.dataDomain.domain, primaryTickCount ?? 0);

        this.scale.nice = false;
        this.scale.domain = d;
        this.scale.update();

        return ticks;
    }
}
