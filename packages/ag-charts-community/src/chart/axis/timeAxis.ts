import type { DateFormatterStyle, FormatterParams, TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { extent } from '../../util/extent';
import { objectsEqual } from '../../util/object';
import { Property } from '../../util/properties';
import { BaseProperties } from '../../util/properties';
import { intervalEpoch, intervalFloor, intervalMilliseconds, intervalStep, intervalUnit } from '../../util/time';
import { buildDateFormatter } from '../../util/timeFormat';
import { domainSpansMultipleYears, lowestGranularityUnitForTicks } from '../../util/timeFormatDefaults';
import type { FormatDatumParams } from '../chartAxis';
import type { ChartAxisDirection } from '../chartAxisDirection';
import { labelSpecifier } from '../label';
import type { ISeries } from '../series/seriesTypes';
import type { AxisTickFormatParams } from './axis';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CategoryAxis } from './categoryAxis';
import { deriveTimeSpecifier } from './timeFormatUtil';

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

    private defaultUnit: TimeInterval | undefined = undefined;

    protected override updateScale(): void {
        super.updateScale();

        const { boundSeries, direction, min, max } = this;
        const defaultUnit = calculateDefaultUnit(boundSeries, direction, min, max);
        if (!objectsEqual(this.defaultUnit, defaultUnit)) {
            this.defaultUnit = defaultUnit;
        }

        this.scale.interval = this.unit ?? this.defaultUnit;
    }

    override normaliseDataDomain(domain: Date[]) {
        return normaliseTimeDataDomain(domain, this.min, this.max);
    }

    protected override createDatumFormatter(
        _domain: any[],
        _ticks: any[]
    ): ((value: any) => string | undefined) | undefined {
        const timeInterval = this.scale.interval;
        const { format } = this.label;
        if (format == null) return;
        const specifier = labelSpecifier(
            timeInterval != null ? deriveTimeSpecifier(format, intervalUnit(timeInterval)) : format,
            timeInterval
        );
        if (specifier == null) return;
        return buildDateFormatter(specifier);
    }

    override tickFormatParams(
        domain: (number | Date)[],
        ticks: (number | Date)[],
        _fractionDigits?: number,
        timeInterval?: TimeInterval | TimeIntervalUnit
    ): AxisTickFormatParams {
        timeInterval ??= lowestGranularityUnitForTicks(ticks);
        const includeYear = domainSpansMultipleYears(domain);
        const unit = intervalUnit(timeInterval);
        return { type: 'date', unit, includeYear };
    }

    override datumFormatParams(
        value: any,
        params: FormatDatumParams,
        _fractionDigits: number | undefined,
        timeInterval: TimeInterval | TimeIntervalUnit | undefined,
        style: DateFormatterStyle
    ): FormatterParams<any> {
        const interval = this.unit ?? this.defaultUnit ?? 'millisecond';

        value = intervalFloor(interval, value); // Align to scale
        timeInterval ??= interval;

        const { datum, key, source, property } = params;
        const unit = intervalUnit(timeInterval);
        const step = intervalStep(timeInterval);
        const epoch = intervalEpoch(timeInterval);

        return {
            type: 'date',
            value,
            datum,
            key,
            source,
            property,
            unit,
            step,
            epoch,
            style,
        };
    }
}

// eslint-disable-next-line sonarjs/use-type-alias
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

export function calculateDefaultUnit(
    boundSeries: ISeries<unknown, unknown, unknown, unknown>[],
    direction: ChartAxisDirection,
    min: Date | number | undefined,
    max: Date | number | undefined
): TimeInterval | undefined {
    let start = Infinity;
    let end = -Infinity;
    let interval: number | undefined;
    for (const series of boundSeries) {
        if (!series.visible) continue;

        const { domain } = normaliseTimeDataDomain(series.getDomain(direction), undefined, undefined);
        if (domain.length !== 2) continue;

        const d0 = domain[0].valueOf();
        const d1 = domain[1].valueOf();

        start = Math.min(start ?? Infinity, d0, d1);
        end = Math.max(end ?? -Infinity, d0, d1);

        const domainExtent = Math.abs(d1 - d0);
        if (domainExtent === 0) continue;

        const dataCount = series.dataCount();
        if (dataCount <= 1) continue;

        const i = domainExtent / (dataCount - 1);
        interval = Math.min(interval ?? Infinity, i);
    }

    start = Math.min(start, min?.valueOf() ?? Infinity, max?.valueOf() ?? Infinity);
    end = Math.max(end, min?.valueOf() ?? -Infinity, max?.valueOf() ?? -Infinity);

    if (!Number.isFinite(start) || !Number.isFinite(end)) return;

    interval ??= Math.abs(end - start);

    const unit = autoUnits.findLast((u) => intervalMilliseconds(u) <= interval) ?? 'millisecond';
    const step = Math.max(Math.round(interval / intervalMilliseconds(unit)), 1);
    const epoch = start != null && step !== 1 ? intervalFloor(unit, start) : undefined;

    return { unit, step, epoch };
}
