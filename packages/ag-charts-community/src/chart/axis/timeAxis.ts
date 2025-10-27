import { Logger, extent } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle, FormatterParams } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import { BaseProperties, Property } from '../../util/properties';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { intervalEpoch, intervalFloor, intervalMilliseconds, intervalStep, intervalUnit } from '../../util/time';
import {
    dateTruncationForDomain,
    lowestGranularityForInterval,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
} from '../../util/timeFormatDefaults';
import type { FormatDatumParams } from '../chartAxis';
import type { ChartAxisDirection } from '../chartAxisDirection';
import type { DatumIndexType, ISeries } from '../series/seriesTypes';
import type { AxisTickFormatParams } from './axis';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';

export class TimeAxisParentLevel extends BaseProperties {
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
    readonly parentLevel = new TimeAxisParentLevel();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    // eslint-disable-next-line sonarjs/use-type-alias
    get _unit(): AgTimeInterval | AgTimeIntervalUnit | undefined {
        return undefined;
    }
    set _unit(_unit: AgTimeInterval | AgTimeIntervalUnit | undefined) {
        Logger.warnOnce(`To use 'unit', use an axis with type 'unit-time' instead of 'time'.`);
    }

    @Property
    @ProxyPropertyOnWrite('_unit')
    unit: AgTimeInterval | AgTimeIntervalUnit | undefined;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new TimeScale());
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this;
        return min != null && max != null && min < max;
    }

    override isCategoryLike(): boolean {
        return false;
    }

    override get primaryLabel(): AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    override normaliseDataDomain(d: Date[]) {
        return normaliseTimeDataDomain(d, this.min, this.max);
    }

    override processData(): void {
        super.processData();

        const { boundSeries, direction, min, max } = this;
        this.minimumTimeGranularity = minimumTimeAxisDatumGranularity(boundSeries, direction, min, max);
    }

    override tickFormatParams(
        domain: (number | Date)[],
        ticks: (number | Date)[],
        _fractionDigits?: number,
        timeInterval?: AgTimeInterval | AgTimeIntervalUnit
    ): AxisTickFormatParams {
        timeInterval ??= lowestGranularityUnitForTicks(ticks);
        const truncateDate = dateTruncationForDomain(domain);
        const unit = intervalUnit(timeInterval);
        const step = intervalStep(timeInterval);
        const epoch = intervalEpoch(timeInterval);
        return { type: 'date', unit, step, epoch, truncateDate };
    }

    override datumFormatParams(
        value: number | Date,
        params: FormatDatumParams,
        _fractionDigits: number | undefined,
        timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined,
        style: DateFormatterStyle
    ): FormatterParams<any> {
        if (typeof value === 'number') value = new Date(value);

        if (timeInterval == null) {
            const { minimumTimeGranularity } = this;
            const datumGranularity = lowestGranularityUnitForValue(value);
            if (
                minimumTimeGranularity != null &&
                intervalMilliseconds(minimumTimeGranularity) < intervalMilliseconds(datumGranularity)
            ) {
                timeInterval = minimumTimeGranularity;
            } else {
                timeInterval = datumGranularity;
            }
        }

        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        const unit = intervalUnit(timeInterval);
        const step = intervalStep(timeInterval);
        const epoch = intervalEpoch(timeInterval);
        return {
            type: 'date',
            value,
            datum,
            seriesId,
            legendItemName,
            key,
            source,
            property,
            domain,
            boundSeries,
            unit,
            step,
            epoch,
            style,
        };
    }
}

export function minimumTimeAxisDatumGranularity(
    boundSeries: ISeries<DatumIndexType, unknown, unknown, unknown>[],
    direction: ChartAxisDirection,
    // eslint-disable-next-line sonarjs/use-type-alias
    min: Date | number | undefined,
    max: Date | number | undefined
) {
    const minTimeInterval = boundSeries.reduce((t, series) => {
        return Math.min(series.minTimeInterval() ?? Infinity, t);
    }, Infinity);

    if (Number.isFinite(minTimeInterval)) {
        return lowestGranularityForInterval(minTimeInterval);
    } else {
        return calculateDefaultUnit(boundSeries, direction, min, max)?.unit;
    }
}

export function calculateDefaultUnit(
    boundSeries: ISeries<DatumIndexType, unknown, unknown, unknown>[],
    direction: ChartAxisDirection,
    min: Date | number | undefined,
    max: Date | number | undefined
): AgTimeInterval | undefined {
    let start = Infinity;
    let end = -Infinity;
    let interval: number | undefined;
    let maxDataCount = 0;
    const domainValues: number[] = [];
    for (const series of boundSeries) {
        if (!series.visible) continue;

        const { domain } = normaliseTimeDataDomain(series.getDomain(direction), undefined, undefined);
        if (domain.length === 0) continue;

        const d0 = domain[0].valueOf();
        const d1 = domain.at(-1)!.valueOf();

        domainValues.push(d0, d1);

        start = Math.min(start ?? Infinity, d0, d1);
        end = Math.max(end ?? -Infinity, d0, d1);

        const domainExtent = Math.abs(d1 - d0);
        if (domainExtent === 0) continue;

        const dataCount = series.dataCount();
        maxDataCount = Math.max(maxDataCount, dataCount);
        if (dataCount <= 1) continue;

        const i = domainExtent / (dataCount - 1);
        interval = Math.min(interval ?? Infinity, i);
    }

    start = Math.min(start, min?.valueOf() ?? Infinity, max?.valueOf() ?? Infinity);
    end = Math.max(end, min?.valueOf() ?? -Infinity, max?.valueOf() ?? -Infinity);

    if (!Number.isFinite(start) || !Number.isFinite(end)) return;

    interval ??= Math.abs(end - start);

    interval = Math.min(interval, minNonZeroDifference(domainValues));

    const unit = lowestGranularityForInterval(interval);
    let step = interval / intervalMilliseconds(unit);
    if (maxDataCount <= 2) {
        step = Math.floor(step);
    } else {
        step = Math.round(step);
    }
    step = Math.max(step, 1);
    const epoch = step === 1 ? undefined : intervalFloor(unit, start);

    return { unit, step, epoch };
}

function minNonZeroDifference(values: number[]): number {
    values.sort((a, b) => a - b);

    let minDiff = Infinity;
    for (let i = 1; i < values.length; i++) {
        const d0 = values[i - 1];
        const d1 = values[i];
        const delta = d1 - d0;
        if (delta > 0) {
            minDiff = Math.min(minDiff, Math.abs(d1 - d0));
        }
    }

    return minDiff;
}

export function normaliseTimeDataDomain(d: Date[], min: Date | number | undefined, max: Date | number | undefined) {
    let clipped = false;

    if (typeof min === 'number') {
        min = new Date(min);
    }
    if (typeof max === 'number') {
        max = new Date(max);
    }

    const de = extent(d)?.map((x) => new Date(x));
    if (de == null) {
        return {
            domain: min != null && max != null && min.valueOf() <= max.valueOf() ? [min, max] : [],
            clipped: false,
        };
    }

    let [d0, d1] = de;

    if (min instanceof Date) {
        clipped ||= min > d0;
        d0 = min;
    }
    if (max instanceof Date) {
        clipped ||= max < d1;
        d1 = max;
    }
    if (d0 > d1) {
        return { domain: [], clipped: false };
    }

    return { domain: [d0, d1], clipped };
}
