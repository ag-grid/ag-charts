import {
    Property,
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

import type { ModuleContext } from '../../module/moduleContext';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { DiscreteTimeAxis } from './discreteTimeAxis';
import { TimeAxisParentLevel, calculateDefaultUnit } from './timeAxis';

export class UnitTimeAxis extends DiscreteTimeAxis<UnitTimeScale> {
    static override readonly className = 'UnitTimeAxis' as const;
    static override readonly type = 'unit-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    @Property
    preferredMin?: Date | number = undefined;

    @Property
    preferredMax?: Date | number = undefined;

    @Property
    // eslint-disable-next-line sonarjs/use-type-alias
    unit: AgTimeInterval | AgTimeIntervalUnit | undefined = undefined;

    override get primaryLabel(): AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new UnitTimeScale(), false);
    }

    override hasDefinedDomain(): boolean {
        const { min, max } = this;
        return min != null && max != null && min < max;
    }

    override isCategoryLike(): boolean {
        return true;
    }

    private defaultUnit: AgTimeInterval | AgTimeIntervalUnit | undefined = undefined;

    override processData(): void {
        super.processData();

        let defaultUnit: AgTimeInterval | AgTimeIntervalUnit | undefined;

        const { domain } = this.dataDomain;
        if (domain.length === 2 && domain[0].valueOf() === domain[1].valueOf()) {
            defaultUnit = lowestGranularityUnitForValue(domain[0]);
        } else {
            const { boundSeries, direction, min, max } = this;
            defaultUnit = calculateDefaultUnit(boundSeries, direction, min, max);
        }

        if (!objectsEqual(this.defaultUnit, defaultUnit)) {
            this.defaultUnit = defaultUnit;
        }
    }

    protected override updateScale(): void {
        super.updateScale();

        this.scale.interval = this.unit ?? this.defaultUnit;
    }

    override normaliseDataDomain(domain: Date[]) {
        const { extent, clipped } = normalisedTimeExtentWithMetadata(
            domain,
            this.min,
            this.max,
            this.preferredMin,
            this.preferredMax
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
        const interval = this.unit ?? this.defaultUnit ?? 'millisecond';

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
