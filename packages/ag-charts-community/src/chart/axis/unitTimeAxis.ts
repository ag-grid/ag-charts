import type { DateFormatterStyle, FormatterParams, TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { UnitTimeScale } from '../../scale/unitTimeScale';
import { objectsEqual } from '../../util/object';
import { Property } from '../../util/properties';
import { intervalEpoch, intervalFloor, intervalStep, intervalUnit } from '../../util/time';
import { buildDateFormatter } from '../../util/timeFormat';
import {
    domainSpansMultipleYears,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
} from '../../util/timeFormatDefaults';
import type { FormatDatumParams } from '../chartAxis';
import { labelSpecifier } from '../label';
import type { AxisTickFormatParams } from './axis';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CategoryAxis } from './categoryAxis';
import { TimeAxisParentLevel, calculateDefaultUnit, normaliseTimeDataDomain } from './timeAxis';
import { deriveTimeSpecifier } from './timeFormatUtil';

export class UnitTimeAxis extends CategoryAxis<UnitTimeScale> {
    static override readonly className = 'UnitTimeAxis' as const;
    static override readonly type = 'unit-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    @Property
    // eslint-disable-next-line sonarjs/use-type-alias
    unit: TimeInterval | TimeIntervalUnit | undefined = undefined;

    override get primaryLabel(): AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new UnitTimeScale());
    }

    private defaultUnit: TimeInterval | TimeIntervalUnit | undefined = undefined;

    override processData(): void {
        super.processData();

        let defaultUnit: TimeInterval | TimeIntervalUnit | undefined;

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
        const step = intervalStep(timeInterval);
        const epoch = intervalEpoch(timeInterval);
        return { type: 'date', unit, step, epoch, includeYear };
    }

    override datumFormatParams(
        value: Date | number,
        params: FormatDatumParams,
        _fractionDigits: number | undefined,
        timeInterval: TimeInterval | TimeIntervalUnit | undefined,
        style: DateFormatterStyle
    ): FormatterParams<any> {
        const interval = this.unit ?? this.defaultUnit ?? 'millisecond';

        value = intervalFloor(interval, value); // Align to scale
        if (typeof value === 'number') value = new Date(value);
        timeInterval ??= interval;

        const { datum, seriesId, key, source, property, domain, boundSeries } = params;
        const unit = intervalUnit(timeInterval);
        const step = intervalStep(timeInterval);
        const epoch = intervalEpoch(timeInterval);

        return {
            type: 'date',
            value,
            datum,
            seriesId,
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
