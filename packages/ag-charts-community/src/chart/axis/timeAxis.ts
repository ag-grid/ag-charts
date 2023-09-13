import { Validate, AND, LESS_THAN, GREATER_THAN, OPT_DATE_OR_DATETIME_MS, NUMBER_OR_NAN } from '../../util/validation';
import { TimeScale } from '../../scale/timeScale';
import { extent } from '../../util/array';
import type { ModuleContext } from '../../util/moduleContext';
import { Default } from '../../util/default';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';

class TimeAxisTick extends AxisTick<TimeScale, number | Date> {
    @Validate(AND(NUMBER_OR_NAN(1), GREATER_THAN('minSpacing')))
    @Default(NaN)
    maxSpacing: number = NaN;
}

export class TimeAxis extends CartesianAxis<TimeScale, number | Date> {
    static className = 'TimeAxis';
    static type = 'time' as const;

    private datumFormat = '%m/%d/%y, %H:%M:%S';
    private datumFormatter: (date: Date) => string;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new TimeScale());

        const { scale } = this;
        this.refreshScale();

        this.datumFormatter = scale.tickFormat({
            specifier: this.datumFormat,
        });
    }

    @Validate(AND(OPT_DATE_OR_DATETIME_MS, LESS_THAN('max')))
    min?: Date | number = undefined;

    @Validate(AND(OPT_DATE_OR_DATETIME_MS, GREATER_THAN('min')))
    max?: Date | number = undefined;

    normaliseDataDomain(d: Date[]) {
        let { min, max } = this;
        let clipped = false;

        if (typeof min === 'number') {
            min = new Date(min);
        }
        if (typeof max === 'number') {
            max = new Date(max);
        }

        if (d.length > 2) {
            d = (extent(d) ?? [0, 1000]).map((x) => new Date(x));
        }
        if (min instanceof Date) {
            clipped ||= min > d[0];
            d = [min, d[1]];
        }
        if (max instanceof Date) {
            clipped ||= max < d[1];
            d = [d[0], max];
        }
        if (d[0] > d[1]) {
            d = [];
        }

        return { domain: d, clipped };
    }

    protected createTick() {
        return new TimeAxisTick();
    }

    protected onLabelFormatChange(ticks: any[], format?: string) {
        if (format) {
            super.onLabelFormatChange(ticks, format);
        } else {
            // For time axis labels to look nice, even if date format wasn't set.
            this.labelFormatter = this.scale.tickFormat({ ticks });
        }
    }

    formatDatum(datum: Date): string {
        return this.moduleCtx.callbackCache.call(this.datumFormatter, datum) ?? String(datum);
    }

    calculatePadding(_min: number, _max: number): [number, number] {
        // numbers in domain correspond to Unix timestamps
        // automatically expand domain by 1 in forward direction
        return [0, 1];
    }
}
