import type { AxisID, DomainWithMetadata, DynamicContext, NormalisedUnitTimeAxisOptions } from 'ag-charts-core';
import {
    dateTruncationForDomain,
    intervalEpoch,
    intervalFloor,
    intervalStep,
    intervalUnit,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
    normalisedTimeExtentWithMetadata,
    objectsEqual,
} from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit, DateFormatterStyle, FormatterParams } from 'ag-charts-types';

import type { ChartRegistry } from '../../module/moduleContext';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { DiscreteTimeAxis } from './discreteTimeAxis';
import { calculateDefaultUnit, coerceTimeBound } from './timeAxis';

type UnitInterval = AgTimeInterval | AgTimeIntervalUnit | undefined;

export class UnitTimeAxis extends DiscreteTimeAxis<UnitTimeScale, NormalisedUnitTimeAxisOptions> {
    static override readonly className = 'UnitTimeAxis' as const;
    static override readonly type = 'unit-time' as const;

    override defaultTickMinSpacing = 20;

    override get primaryLabel() {
        const parentLevel = this.options.parentLevel;
        return parentLevel?.enabled ? parentLevel.label : undefined;
    }

    override get primaryTick() {
        const parentLevel = this.options.parentLevel;
        return parentLevel?.enabled ? parentLevel.tick : undefined;
    }

    protected override getLabelFormat(): string | Record<string, string> | undefined {
        const format = this.options.label.format;
        return typeof format === 'object' ? (format as Record<string, string>) : format;
    }

    protected override getPrimaryLabelFormat(): string | Record<string, string> | undefined {
        const format = this.primaryLabel?.format;
        return typeof format === 'object' ? (format as Record<string, string>) : format;
    }

    constructor(moduleCtx: DynamicContext<ChartRegistry>, id: AxisID, options: NormalisedUnitTimeAxisOptions) {
        super(moduleCtx, id, new UnitTimeScale(), options, false);
        this.scale.logger = moduleCtx.logger;
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this.options;
        return min != null && max != null && min < max;
    }

    override isCategoryLike(): boolean {
        return true;
    }

    private defaultUnit: UnitInterval = undefined;

    override processData(): void {
        super.processData();

        let defaultUnit: UnitInterval;

        const { domain } = this.dataDomain;
        if (domain.length === 2 && domain[0].valueOf() === domain[1].valueOf()) {
            defaultUnit = lowestGranularityUnitForValue(domain[0]);
        } else {
            const { boundSeries, direction } = this;
            const { min, max } = this.options;
            defaultUnit = calculateDefaultUnit(boundSeries, direction, coerceTimeBound(min), coerceTimeBound(max));
        }

        if (!objectsEqual(this.defaultUnit, defaultUnit)) {
            this.defaultUnit = defaultUnit;
        }
    }

    protected override updateScale(): void {
        super.updateScale();

        this.scale.interval = this.options.unit ?? this.defaultUnit;
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
        value: Date | number,
        params: FormatDatumParams,
        _fractionDigits: number | undefined,
        timeInterval: AgTimeInterval | AgTimeIntervalUnit | undefined,
        style: DateFormatterStyle
    ): FormatterParams<any> {
        const interval = this.options.unit ?? this.defaultUnit ?? 'millisecond';

        timeInterval ??= interval;

        const { datum, seriesId, legendItemName, key, source, property, domain, boundSeries } = params;
        const unit = intervalUnit(timeInterval);
        const step = intervalStep(timeInterval);
        const epoch = intervalEpoch(timeInterval);

        return {
            type: 'date',
            value: intervalFloor(interval, value),
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
