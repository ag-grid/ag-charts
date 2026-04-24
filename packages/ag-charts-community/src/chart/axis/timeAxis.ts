import type { ChartAxisDirection, DomainWithMetadata, DynamicContext } from 'ag-charts-core';
import {
    Logger,
    dateTruncationForDomain,
    intervalEpoch,
    intervalFloor,
    intervalMilliseconds,
    intervalStep,
    intervalUnit,
    lowestGranularityForInterval,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
    normalisedTimeExtentWithMetadata,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle, FormatterParams } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import type { FormatDatumParams } from '../chartAxis';
import type { DatumIndexType, ISeries, ISeriesProperties } from '../series/seriesTypes';
import type { AxisTickFormatParams } from './axis';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';

export class TimeAxisParentLevel {
    enabled = false;

    readonly label = new AxisLabel();

    readonly tick = new AxisTick();

    applyOptions(options: { enabled?: boolean; label?: object; tick?: object } | undefined): void {
        if (options == null) return;
        if ('enabled' in options) this.enabled = options.enabled!;
        if (options.label !== undefined) this.label.applyOptions(options.label as any);
        if (options.tick !== undefined) this.tick.applyOptions(options.tick as any);
    }
}

export class TimeAxis extends CartesianAxis<TimeScale, number | Date> {
    static readonly className = 'TimeAxis';
    static readonly type = 'time' as const;

    readonly parentLevel = new TimeAxisParentLevel();

    min?: Date | number = undefined;

    max?: Date | number = undefined;

    preferredMin?: Date | number = undefined;

    preferredMax?: Date | number = undefined;

    constructor(moduleCtx: DynamicContext<ChartRegistry>) {
        super(moduleCtx, new TimeScale());
    }

    override applyOptions(options: object | undefined, skip?: ReadonlySet<string>): void {
        if (options != null && 'unit' in options) {
            Logger.warnOnce(`To use 'unit', use an axis with type 'unit-time' instead of 'time'.`);
        }
        // `unit` is not a valid option on TimeAxis — dropping it prevents the base-class default
        // branch from storing a meaningless value on the instance.
        const combined = skip?.has('unit') ? skip : new Set([...(skip ?? []), 'unit']);
        super.applyOptions(options, combined);
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

    override normaliseDataDomain(d: DomainWithMetadata<Date>) {
        const { extent, clipped } = normalisedTimeExtentWithMetadata(
            d,
            this.min,
            this.max,
            this.preferredMin,
            this.preferredMax
        );
        return { domain: extent, clipped };
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
        if (typeof value === 'number') {
            value = new Date(value);
        }

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
    boundSeries: ISeries<DatumIndexType, unknown, ISeriesProperties, unknown>[],
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
    boundSeries: ISeries<DatumIndexType, unknown, ISeriesProperties, unknown>[],
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

        const { extent: domain } = normalisedTimeExtentWithMetadata(series.getDomain(direction));
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
