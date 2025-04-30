import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { extent } from '../../util/extent';
import { BaseProperties, Property } from '../../util/properties';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';

export class TimeAxisDivision extends BaseProperties {
    @Property
    enabled = false;

    @Property
    readonly label = new AxisLabel();

    @Property
    readonly tick = new AxisTick();
}

export class TimeAxis extends CartesianAxis<TimeScale, number | Date> {
    static readonly className = 'TimeAxis';
    static readonly type = 'time' as const;

    @Property
    readonly division = new TimeAxisDivision();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    // @todo(AG-14472) - Remove padding options
    @Property
    groupPaddingInner: number = 0.1;
    @Property
    paddingInner?: number;
    @Property
    paddingOuter?: number;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new TimeScale());
    }

    override get primaryLabel(): AxisLabel | undefined {
        return this.division.enabled ? this.division.label : undefined;
    }

    override get primaryTick(): AxisTick | undefined {
        return this.division.enabled ? this.division.tick : undefined;
    }

    override normaliseDataDomain(d: Date[]) {
        return normaliseTimeDataDomain(d, this.min, this.max);
    }
}

export function normaliseTimeDataDomain(d: Date[], min: Date | number | undefined, max: Date | number | undefined) {
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
