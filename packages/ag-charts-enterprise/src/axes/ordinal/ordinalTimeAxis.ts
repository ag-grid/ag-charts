import {
    type AgTimeInterval,
    type AgTimeIntervalUnit,
    type DateFormatterStyle,
    type FormatterParams,
    _ModuleSupport,
} from 'ag-charts-community';
import { Property } from 'ag-charts-core';

const {
    OrdinalTimeScale,
    TimeAxisParentLevel,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
    minimumTimeAxisDatumGranularity,
    dateTruncationForDomain,
    intervalUnit,
    intervalStep,
    intervalEpoch,
    intervalMilliseconds,
} = _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.DiscreteTimeAxis<_ModuleSupport.OrdinalTimeScale> {
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

    override processData(): void {
        super.processData();

        const { boundSeries, direction } = this;
        this.minimumTimeGranularity = minimumTimeAxisDatumGranularity(boundSeries, direction, undefined, undefined);
    }

    override tickFormatParams(
        domain: (number | Date)[],
        ticks: (number | Date)[],
        _fractionDigits?: number,
        timeInterval?: AgTimeInterval | AgTimeIntervalUnit
    ): _ModuleSupport.AxisTickFormatParams {
        timeInterval ??= lowestGranularityUnitForTicks(ticks);
        const truncateDate = dateTruncationForDomain(domain);
        const unit = intervalUnit(timeInterval);
        const step = intervalStep(timeInterval);
        const epoch = intervalEpoch(timeInterval);
        return { type: 'date', unit, step, epoch, truncateDate };
    }

    override datumFormatParams(
        value: Date | number,
        params: _ModuleSupport.FormatDatumParams,
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
