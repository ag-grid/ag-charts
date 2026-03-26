import {
    type AgTimeInterval,
    type AgTimeIntervalUnit,
    type DateFormatterStyle,
    type FormatterParams,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    Property,
    dateTruncationForDomain,
    intervalEpoch,
    intervalMilliseconds,
    intervalStep,
    intervalUnit,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
} from 'ag-charts-core';

const {
    OrdinalTimeScale,
    ApproximateOrdinalTimeScale,
    APPROXIMATE_THRESHOLD,
    TimeAxisParentLevel,
    minimumTimeAxisDatumGranularity,
} = _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.DiscreteTimeAxis<_ModuleSupport.OrdinalTimeScale> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    @Property
    readonly parentLevel = new TimeAxisParentLevel();

    private readonly accurateScale: _ModuleSupport.OrdinalTimeScale;
    private readonly approximateScale: _ModuleSupport.ApproximateOrdinalTimeScale;

    override get primaryLabel(): _ModuleSupport.AxisLabel | undefined {
        return this.parentLevel.enabled ? this.parentLevel.label : undefined;
    }

    override get primaryTick(): _ModuleSupport.AxisTick | undefined {
        return this.parentLevel.enabled ? this.parentLevel.tick : undefined;
    }

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        const accurateScale = new OrdinalTimeScale();
        super(moduleCtx, accurateScale);
        this.accurateScale = accurateScale;
        this.approximateScale = new ApproximateOrdinalTimeScale();

        // Set up delegation so approximate scale reads/writes go to accurate scale
        this.approximateScale.setSourceScale(accurateScale);

        // Override the readonly 'scale' property with a getter that returns the active scale.
        // This enables automatic scale switching based on visible range and data uniformity.
        Object.defineProperty(this, 'scale', {
            get: () => this.getActiveScale(),
            configurable: true,
        });
    }

    /**
     * Returns the active scale based on visible range and data uniformity.
     * Use approximate scale when data is uniform and visible datum count is large.
     */
    getActiveScale(): _ModuleSupport.OrdinalTimeScale {
        const visibleBandCount = this.accurateScale.bandCount(this.visibleRange);
        const isUniform = this.accurateScale.getUniformityCache(this.visibleRange)?.isUniform ?? false;

        if (isUniform && visibleBandCount >= APPROXIMATE_THRESHOLD) {
            return this.approximateScale;
        }
        return this.accurateScale;
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
