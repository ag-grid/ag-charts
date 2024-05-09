import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { extent } from '../../util/array';
import { Default } from '../../util/default';
import {
    AND,
    DATE_OR_DATETIME_MS,
    GREATER_THAN,
    LESS_THAN,
    MAX_SPACING,
    MIN_SPACING,
    Validate,
} from '../../util/validation';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';

class TimeAxisTick extends AxisTick<TimeScale, number | Date> {
    @Validate(MIN_SPACING)
    @Default(NaN)
    override minSpacing: number = NaN;

    @Validate(MAX_SPACING)
    @Default(NaN)
    override maxSpacing: number = NaN;
}

export class TimeAxis extends CartesianAxis<TimeScale, number | Date> {
    static readonly className = 'TimeAxis';
    static readonly type = 'time' as const;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new TimeScale());

        this.refreshScale();
    }

    @Validate(AND(DATE_OR_DATETIME_MS, LESS_THAN('max')), { optional: true })
    min?: Date | number = undefined;

    @Validate(AND(DATE_OR_DATETIME_MS, GREATER_THAN('min')), { optional: true })
    max?: Date | number = undefined;

    override normaliseDataDomain(d: Date[]) {
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

    protected override createTick() {
        return new TimeAxisTick();
    }

    protected override onFormatChange(ticks: any[], fractionDigits: number, domain: any[], format?: string) {
        if (format) {
            super.onFormatChange(ticks, fractionDigits, domain, format);
        } else {
            // For time axis labels to look nice, even if date format wasn't set.
            this.labelFormatter = this.scale.tickFormat({ ticks, domain });
            this.datumFormatter = this.scale.tickFormat({ ticks, domain, formatOffset: 1 });
        }
    }

    override calculatePadding(): [number, number] {
        // NOTE: Extending the domain of a time-axis can interfere with automatic date label
        // formatting - extending the domain effectively implies that the axis labels should be
        // rendered at the same time granularity as the gap we add in certain cases (e.g. a single
        // data-point).
        return [0, 0];
    }
}
