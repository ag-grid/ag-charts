import {
    type AgTimeInterval,
    type AgTimeIntervalUnit,
    type DateFormatterStyle,
    type FormatterParams,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type AxisID,
    type DynamicContext,
    type NormalisedOrdinalTimeAxisOptions,
    dateTruncationForDomain,
    intervalEpoch,
    intervalMilliseconds,
    intervalStep,
    intervalUnit,
    lowestGranularityUnitForTicks,
    lowestGranularityUnitForValue,
} from 'ag-charts-core';

const { OrdinalTimeScale, ApproximateOrdinalTimeScale, APPROXIMATE_THRESHOLD, minimumTimeAxisDatumGranularity } =
    _ModuleSupport;

export class OrdinalTimeAxis extends _ModuleSupport.DiscreteTimeAxis<
    _ModuleSupport.OrdinalTimeScale,
    NormalisedOrdinalTimeAxisOptions
> {
    static override readonly className = 'OrdinalTimeAxis' as const;
    static override readonly type = 'ordinal-time' as const;

    private readonly accurateScale: _ModuleSupport.OrdinalTimeScale;
    private readonly approximateScale: _ModuleSupport.ApproximateOrdinalTimeScale;

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

    constructor(
        moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>,
        id: AxisID,
        options: NormalisedOrdinalTimeAxisOptions
    ) {
        const accurateScale = new OrdinalTimeScale();
        super(moduleCtx, id, accurateScale, options);
        this.accurateScale = accurateScale;
        this.approximateScale = new ApproximateOrdinalTimeScale();
        // `getActiveScale()` swaps to this one for large uniform datasets, so it needs the logger too.
        this.approximateScale.logger = moduleCtx.logger;

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
