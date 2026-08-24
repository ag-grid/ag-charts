import type {
    AxisID,
    ChartAxisDirection,
    DomainWithMetadata,
    DynamicContext,
    NormalisedTimeAxisOptions,
} from 'ag-charts-core';
import {
    dateTruncationForDomain,
    intervalEpoch,
    intervalFloor,
    intervalMilliseconds,
    intervalStep,
    intervalUnit,
    isISO8601,
    lowestGranularityForInterval,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
    normalisedTimeExtentWithMetadata,
    timeValueToNumber,
} from 'ag-charts-core';
import type {
    AgTimeInterval,
    AgTimeIntervalUnit,
    AgTimeValue,
    DateFormatterStyle,
    FormatterParams,
} from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { TimeScale } from '../../scale/timeScale';
import type { FormatDatumParams } from '../chartAxis';
import type { ISeries, ISeriesProperties, SeriesNodeDatum } from '../series/seriesTypes';
import type { AxisTickFormatParams } from './axis';
import { CartesianAxis } from './cartesianAxis';

type TimeBound = Date | number | undefined;

// Coerces a time-axis bound to `Date | number`; non-time inputs pass through so existing validation surfaces the error.
export function coerceTimeBound(value: AgTimeValue | undefined): TimeBound {
    if (typeof value === 'bigint') return Number(value);
    if (isISO8601(value)) return new Date(value);
    return value;
}

export class TimeAxis<TOptions extends NormalisedTimeAxisOptions = NormalisedTimeAxisOptions> extends CartesianAxis<
    TimeScale,
    number | Date,
    TOptions
> {
    static readonly className = 'TimeAxis';
    static readonly type = 'time' as const;

    constructor(moduleCtx: DynamicContext<ChartRegistry>, id: AxisID, options: TOptions) {
        super(moduleCtx, id, new TimeScale(), options);
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this.options;
        return min != null && max != null && min < max;
    }

    override isCategoryLike(): boolean {
        return false;
    }

    override get primaryLabel() {
        const parentLevel = this.options.parentLevel;
        return parentLevel?.enabled ? parentLevel.label : undefined;
    }

    protected override getLabelFormat(): string | Record<string, string> | undefined {
        const format = this.options.label.format;
        // The unit → format-string map is structurally a Record, which is how AxisLayout types it.
        return typeof format === 'object' ? (format as Record<string, string>) : format;
    }

    protected override getPrimaryLabelFormat(): string | Record<string, string> | undefined {
        const format = this.primaryLabel?.format;
        return typeof format === 'object' ? (format as Record<string, string>) : format;
    }

    override get primaryTick() {
        const parentLevel = this.options.parentLevel;
        return parentLevel?.enabled ? parentLevel.tick : undefined;
    }

    override normaliseDataDomain(d: DomainWithMetadata<Date>) {
        const { min, max, preferredMin, preferredMax } = this.options;
        const { extent, clipped } = normalisedTimeExtentWithMetadata(
            d,
            coerceTimeBound(min),
            coerceTimeBound(max),
            coerceTimeBound(preferredMin),
            coerceTimeBound(preferredMax)
        );
        return { domain: extent, clipped };
    }

    override processData(): void {
        super.processData();

        const { boundSeries, direction } = this;
        const { min, max } = this.options;
        this.minimumTimeGranularity = minimumTimeAxisDatumGranularity(
            boundSeries,
            direction,
            coerceTimeBound(min),
            coerceTimeBound(max)
        );
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
        value: AgTimeValue,
        params: FormatDatumParams,
        _fractionDigits: number | undefined,
        timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined,
        style: DateFormatterStyle
    ): FormatterParams<any> {
        if (!(value instanceof Date)) {
            value = new Date(timeValueToNumber(value));
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
    boundSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
    direction: ChartAxisDirection,
    min: TimeBound,
    max: TimeBound
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
    boundSeries: ISeries<SeriesNodeDatum, ISeriesProperties, unknown>[],
    direction: ChartAxisDirection,
    min: TimeBound,
    max: TimeBound
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
