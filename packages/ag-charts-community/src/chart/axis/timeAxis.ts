import type { TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { extent } from '../../util/extent';
import { objectsEqual } from '../../util/object';
import { Property } from '../../util/properties';
import { BaseProperties } from '../../util/properties';
import { intervalFloor, intervalMilliseconds } from '../../util/time';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CategoryAxis } from './categoryAxis';

const autoUnits: TimeIntervalUnit[] = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];

export class TimeAxisParentLevel extends BaseProperties {
    @Property
    enabled = false;

    @Property
    readonly label = new AxisLabel();

    @Property
    readonly tick = new AxisTick();
}

export class TimeAxis extends CategoryAxis<TimeScale> {
    static override readonly className = 'TimeAxis' as const;
    static override readonly type = 'time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    @Property
    unit: TimeInterval | TimeIntervalUnit | undefined = undefined;

    override get primaryLabel(): AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new TimeScale());
    }

    private defaultUnit(): TimeInterval {
        const { direction } = this;

        let interval = Infinity;
        let start = Infinity;
        for (const series of this.boundSeries) {
            const { domain } = normaliseTimeDataDomain(series.getDomain(direction), undefined, undefined);
            const d0 = domain[0].valueOf();
            const d1 = domain[1].valueOf();
            const domainExtent = Math.abs(d1 - d0);
            const dataCount = series.dataCount();
            const i = dataCount > 1 ? domainExtent / (dataCount - 1) : Infinity;
            interval = Math.min(interval, i);
            start = Math.min(start, d0, d1);
        }

        const unit = autoUnits.findLast((u) => intervalMilliseconds(u) <= interval) ?? 'millisecond';
        const step = Math.round(interval / intervalMilliseconds(unit));
        const epoch = step == 1 ? undefined : intervalFloor(unit, start);

        return { unit, step, epoch };
    }

    private _defaultUnit: TimeInterval | undefined = undefined;
    protected override updateScale(): void {
        super.updateScale();

        let { unit } = this;
        if (unit == null) {
            const defaultUnit = this.defaultUnit();
            unit = objectsEqual(this._defaultUnit, defaultUnit) ? this._defaultUnit : defaultUnit;
            this._defaultUnit = defaultUnit;
        } else {
            this._defaultUnit = undefined;
        }

        this.defaultUnit();

        this.scale.interval = unit;
    }

    override normaliseDataDomain(domain: Date[]) {
        return normaliseTimeDataDomain(domain, this.min, this.max);
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
