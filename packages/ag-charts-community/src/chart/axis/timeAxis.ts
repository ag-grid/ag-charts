import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { extent } from '../../util/array';
import { AND, DATE_OR_DATETIME_MS, GREATER_THAN, LESS_THAN, Validate } from '../../util/validation';
import { CartesianAxis } from './cartesianAxis';

export class TimeAxis extends CartesianAxis<TimeScale, number | Date> {
    static readonly className = 'TimeAxis';
    static readonly type = 'time' as const;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new TimeScale());
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
            d = extent(d)?.map((x) => new Date(x)) ?? [];
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
}
