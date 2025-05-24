import type { DateFormatterStyle, FormatterParams, TimeInterval, TimeIntervalUnit } from 'ag-charts-types';

import type { ModuleContext } from '../../module/moduleContext';
import { ContinuousTimeScale } from '../../scale/continuousTimeScale';
import { Property } from '../../util/properties';
import { intervalEpoch, intervalStep, intervalUnit } from '../../util/time';
import {
    domainSpansMultipleYears,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
} from '../../util/timeFormatDefaults';
import type { FormatDatumParams } from '../chartAxis';
import type { AxisTickFormatParams } from './axis';
import { AxisLabel } from './axisLabel';
import { AxisTick } from './axisTick';
import { CartesianAxis } from './cartesianAxis';
import { TimeAxisParentLevel, normaliseTimeDataDomain } from './timeAxis';

export class ContinuousTimeAxis extends CartesianAxis<ContinuousTimeScale, number | Date> {
    static readonly className = 'ContinuousTimeAxis';
    static readonly type = 'continuous-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    @Property
    min?: Date | number = undefined;

    @Property
    max?: Date | number = undefined;

    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx, new ContinuousTimeScale());
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
    ): FormatterParams<any, any> {
        timeInterval ??= lowestGranularityUnitForValue(value);
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
