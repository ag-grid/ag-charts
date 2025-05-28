import {
    type DateFormatterStyle,
    type FormatterParams,
    type TimeInterval,
    type TimeIntervalUnit,
    _ModuleSupport,
} from 'ag-charts-community';

const {
    OrdinalTimeScale,
    Property,
    TimeAxisParentLevel,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
    domainSpansMultipleYears,
    intervalUnit,
    intervalStep,
    intervalEpoch,
} = _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.CategoryAxis<_ModuleSupport.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    override get primaryLabel(): _ModuleSupport.AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): _ModuleSupport.AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super(moduleCtx, new OrdinalTimeScale());
    }

    override tickFormatParams(
        domain: (number | Date)[],
        ticks: (number | Date)[],
        _fractionDigits?: number,
        timeInterval?: TimeInterval | TimeIntervalUnit
    ): _ModuleSupport.AxisTickFormatParams {
        timeInterval ??= lowestGranularityUnitForTicks(ticks);
        const includeYear = domainSpansMultipleYears(domain);
        const unit = intervalUnit(timeInterval);
        return { type: 'date', unit, includeYear };
    }

    override datumFormatParams(
        value: any,
        params: _ModuleSupport.FormatDatumParams,
        _fractionDigits: number | undefined,
        timeInterval: TimeInterval | TimeIntervalUnit | undefined,
        style: DateFormatterStyle
    ): FormatterParams<any> {
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
