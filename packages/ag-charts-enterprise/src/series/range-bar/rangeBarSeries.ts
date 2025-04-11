import { type AgRangeBarSeriesStyle, _ModuleSupport } from 'ag-charts-community';

import { SPAN, X_MAX, X_MIN, Y_MAX, Y_MIN } from '../../utils/aggregation';
import { type RangeBarSeriesDataAggregationFilter, aggregateRangeBarData } from './rangeBarAggregation';
import { RangeBarProperties } from './rangeBarProperties';

const {
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    checkCrisp,
    updateLabelNode,
    SMALLEST_KEY_INTERVAL,
    LARGEST_KEY_INTERVAL,
    diff,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    resetBarSelectionsFn,
    fixNumericExtent,
    seriesLabelFadeInAnimation,
    resetLabelFn,
    animationValidation,
    computeBarFocusBounds,
    visibleRangeIndices,
    createDatumId,
    ContinuousScale,
    OrdinalTimeScale,
    UnitTimeScale,
    Rect,
    PointerEvents,
    motion,
    applyShapeStyle,
    findMinMax,
    getShapeStyle,
} = _ModuleSupport;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

interface RangeBarNodeLabelDatum extends Readonly<_ModuleSupport.Point> {
    datumIndex: number;
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
}

interface RangeBarNodeDatum
    extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>,
        Readonly<_ModuleSupport.Point> {
    readonly index: number;
    readonly valueIndex: number;
    readonly itemId: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly width: number;
    readonly height: number;
    readonly labels: RangeBarNodeLabelDatum[];
    readonly crisp: boolean;

    // Required for types
    readonly clipBBox?: _ModuleSupport.BBox;
    readonly opacity?: number;
}

type RangeBarContext = _ModuleSupport.CartesianSeriesNodeDataContext<RangeBarNodeDatum, RangeBarNodeLabelDatum>;

type RangeBarAnimationData = _ModuleSupport.CartesianAnimationData<
    _ModuleSupport.Rect,
    RangeBarNodeDatum,
    RangeBarNodeLabelDatum
>;

class RangeBarSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RangeBarNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: RangeBarNodeDatum, series: RangeBarSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}

export class RangeBarSeries extends _ModuleSupport.AbstractBarSeries<
    _ModuleSupport.Rect<RangeBarNodeDatum>,
    RangeBarProperties,
    RangeBarNodeDatum,
    RangeBarNodeLabelDatum
> {
    static readonly className = 'RangeBarSeries';
    static readonly type = 'range-bar' as const;

    override properties = new RangeBarProperties();

    private dataAggregationFilters: RangeBarSeriesDataAggregationFilter[] | undefined = undefined;

    protected override readonly NodeEvent = RangeBarSeriesNodeEvent;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.AXIS_ALIGNED, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            directionKeys: {
                x: ['xKey'],
                y: ['yLowKey', 'yHighKey'],
            },
            directionNames: {
                x: ['xName'],
                y: ['yLowName', 'yHighName', 'yName'],
            },
            categoryKey: 'xValue',
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yLowKey, yHighKey, fastDataProcessing } = this.properties;
        const grouped = !fastDataProcessing;

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        if (!this.ctx.animationManager.isSkipped()) {
            if (this.processedData) {
                extraProps.push(diff(this.id, this.processedData));
            }
            extraProps.push(animationValidation());
        }

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const { dataModel, processedData } = await this.requestDataModel(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: 'xValue' }),
                valueProperty(yLowKey, yScaleType, { id: `yLowValue`, invalidValue: null, ...visibleProps }),
                valueProperty(yHighKey, yScaleType, { id: `yHighValue`, invalidValue: null, ...visibleProps }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL, LARGEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            groupByKeys: grouped,
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.dataAggregationFilters = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    private aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.ProcessedData<any>
    ) {
        if (processedData.type !== 'grouped') return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (
            xAxis == null ||
            !(ContinuousScale.is(xAxis.scale) || UnitTimeScale.is(xAxis) || OrdinalTimeScale.is(xAxis.scale))
        ) {
            return;
        }

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yHighValues = dataModel.resolveColumnById(this, `yHighValue`, processedData);
        const yLowValues = dataModel.resolveColumnById(this, `yLowValue`, processedData);

        const { index } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const domain = processedData.domain.keys[index];

        return aggregateRangeBarData(xValues, yHighValues, yLowValues, domain);
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel) return [];

        const {
            keys: [keys],
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        } else {
            const yExtent = this.domainForClippedRange(direction, ['yHighValue', 'yLowValue'], 'xValue', true);
            const fixedYExtent = findMinMax(yExtent);
            return fixNumericExtent(fixedYExtent);
        }
    }

    override getSeriesRange(_direction: _ModuleSupport.ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(
            ChartAxisDirection.Y,
            ['yHighValue', 'yLowValue'],
            'xValue',
            visibleRange,
            true
        );
    }

    override createNodeData() {
        const { data, dataModel, groupScale, processedData, visible } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && xAxis && yAxis && dataModel && processedData?.dataSources)) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { xKey, yLowKey, yHighKey, strokeWidth } = this.properties;

        const itemId = `${yLowKey}-${yHighKey}`;

        const context: RangeBarContext = {
            itemId,
            nodeData: [],
            labelData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
        };
        if (!visible) return context;

        const rawData = processedData.dataSources.get(this.id) ?? [];

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yLowValues = dataModel.resolveColumnById(this, `yLowValue`, processedData);
        const yHighValues = dataModel.resolveColumnById(this, `yHighValue`, processedData);

        const { barWidth: effectiveBarWidth, groupIndex } = this.updateGroupScale(xAxis);
        const barOffset = ContinuousScale.is(xScale) ? effectiveBarWidth * -0.5 : 0;
        const groupOffset = groupScale.convert(String(groupIndex));

        const defaultCrisp = checkCrisp(
            xAxis?.scale,
            xAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        const xPosition = (datumIndex: number) =>
            Math.round(xScale.convert(xValues[datumIndex])) + groupOffset + barOffset;

        const handleDatum = (
            datumIndex: number,
            groupedDataIndex: number,
            x: number,
            width: number,
            yLow: number,
            yHigh: number,
            crisp: boolean
        ) => {
            const datum = rawData[datumIndex];
            const xDatum = xValues[datumIndex];
            if (xDatum == null) return;

            const rawLowValue = yLowValues[datumIndex];
            const rawHighValue = yHighValues[datumIndex];

            if (!Number.isFinite(rawLowValue?.valueOf()) || !Number.isFinite(rawHighValue?.valueOf())) return;

            const [yLowValue, yHighValue] =
                rawLowValue < rawHighValue ? [rawLowValue, rawHighValue] : [rawHighValue, rawLowValue];

            const y = Math.round(yScale.convert(yHigh));
            const bottomY = Math.round(yScale.convert(yLow));
            const height = Math.max(strokeWidth, Math.abs(bottomY - y));

            const rect: Bounds = {
                x: barAlongX ? Math.min(y, bottomY) : x,
                y: barAlongX ? x : Math.min(y, bottomY),
                width: barAlongX ? height : width,
                height: barAlongX ? width : height,
            };

            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const labelData: RangeBarNodeDatum['labels'] = this.createLabelData({
                datumIndex,
                rect,
                barAlongX,
                yLowValue,
                yHighValue,
                datum: datum,
                series: this,
            });

            const nodeDatum: RangeBarNodeDatum = {
                index: groupedDataIndex,
                valueIndex: datumIndex,
                series: this,
                itemId,
                datum,
                datumIndex,
                xValue: xDatum,
                yLowValue: rawLowValue,
                yHighValue: rawHighValue,
                yLowKey,
                yHighKey,
                xKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                midPoint: nodeMidPoint,
                crisp,
                labels: labelData,
            };

            context.nodeData.push(nodeDatum);
            context.labelData.push(...labelData);
        };

        const { dataAggregationFilters } = this;
        const [r0, r1] = xScale.range;
        const range = r1 - r0;

        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (dataAggregationFilter != null) {
            const { maxRange, indexData } = dataAggregationFilter;
            const [start, end] = visibleRangeIndices(maxRange, xAxis.range, (index) => {
                const aggIndex = index * SPAN;
                const xMinIndex = indexData[aggIndex + X_MIN];
                const xMaxIndex = indexData[aggIndex + X_MAX];
                if (xMinIndex === -1) return;
                const midDatumIndex = ((xMinIndex + xMaxIndex) / 2) | 0;
                return [xPosition(midDatumIndex), xPosition(xMaxIndex) + effectiveBarWidth];
            });

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * SPAN;
                const xMinIndex = indexData[aggIndex + X_MIN];
                const xMaxIndex = indexData[aggIndex + X_MAX];
                const yMinIndex = indexData[aggIndex + Y_MIN];
                const yMaxIndex = indexData[aggIndex + Y_MAX];

                if (xMinIndex === -1) continue;

                const midDatumIndex = ((xMinIndex + xMaxIndex) / 2) | 0;

                const xValue = xValues[midDatumIndex];
                if (xValue == null) continue;

                const x = xPosition(midDatumIndex);
                const width = Math.abs(xPosition(xMinIndex) - xPosition(xMaxIndex)) + effectiveBarWidth;
                const yLow = yLowValues[yMinIndex];
                const yHigh = yHighValues[yMaxIndex];

                handleDatum(midDatumIndex, 0, x, width, yLow, yHigh, false);
            }
        } else if (processedData.type === 'ungrouped') {
            let [start, end] = visibleRangeIndices(rawData.length, xAxis.range, (index) => {
                const x = xPosition(index);
                return [x, effectiveBarWidth];
            });
            // @todo(AG-13575) Remove this if block
            if (processedData.input.count < 1e3) {
                start = 0;
                end = processedData.input.count;
            }

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                const x = xPosition(datumIndex);
                const width = effectiveBarWidth;
                const yLow = yLowValues[datumIndex];
                const yHigh = yHighValues[datumIndex];

                handleDatum(datumIndex, 0, x, width, yLow, yHigh, defaultCrisp);
            }
        } else {
            for (const { datumIndex, groupIndex: groupDataIndex } of dataModel.forEachGroupDatum(this, processedData)) {
                const x = xPosition(datumIndex);
                const width = effectiveBarWidth;
                const yLow = yLowValues[datumIndex];
                const yHigh = yHighValues[datumIndex];

                handleDatum(datumIndex, groupDataIndex, x, width, yLow, yHigh, defaultCrisp);
            }
        }

        return context;
    }

    private createLabelData({
        datumIndex,
        rect,
        barAlongX,
        yLowValue,
        yHighValue,
        datum,
        series,
    }: {
        datumIndex: number;
        rect: Bounds;
        barAlongX: boolean;
        yLowValue: number;
        yHighValue: number;
        datum: any;
        series: RangeBarSeries;
    }): RangeBarNodeLabelDatum[] {
        const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, label } = this.properties;
        const labelParams = { datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName };

        const { placement, padding } = label;
        const paddingDirection = placement === 'outside' ? 1 : -1;
        const labelPadding = padding * paddingDirection;

        const yLowLabel: RangeBarNodeLabelDatum = {
            datumIndex,
            x: rect.x + (barAlongX ? -labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : rect.height + labelPadding),
            textAlign: barAlongX ? 'left' : 'center',
            textBaseline: barAlongX ? 'middle' : 'bottom',
            text: this.getLabelText(label, { itemId: 'low', value: yLowValue, ...labelParams }),
            itemId: 'low',
            datum,
            series,
        };
        const yHighLabel: RangeBarNodeLabelDatum = {
            datumIndex,
            x: rect.x + (barAlongX ? rect.width + labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : -labelPadding),
            textAlign: barAlongX ? 'right' : 'center',
            textBaseline: barAlongX ? 'middle' : 'top',
            text: this.getLabelText(label, { itemId: 'high', value: yHighValue, ...labelParams }),
            itemId: 'high',
            datum,
            series,
        };

        if (placement === 'outside') {
            yLowLabel.textAlign = barAlongX ? 'right' : 'center';
            yLowLabel.textBaseline = barAlongX ? 'middle' : 'top';

            yHighLabel.textAlign = barAlongX ? 'left' : 'center';
            yHighLabel.textBaseline = barAlongX ? 'middle' : 'bottom';
        }
        return [yLowLabel, yHighLabel];
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override updateDatumSelection(opts: {
        nodeData: RangeBarNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, RangeBarNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
    }

    private getItemBaseStyle(highlighted: boolean): Required<AgRangeBarSeriesStyle> {
        const { properties } = this;
        const { cornerRadius, fillGradientDefaults, fillPatternDefaults } = properties;
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return getShapeStyle(
            {
                fill: highlightStyle?.fill ?? properties.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
                stroke: highlightStyle?.stroke ?? properties.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
                strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
                lineDash: highlightStyle?.lineDash ?? properties.lineDash ?? [],
                lineDashOffset: highlightStyle?.lineDashOffset ?? properties.lineDashOffset,
                cornerRadius,
            },
            fillGradientDefaults,
            fillPatternDefaults
        );
    }

    private getItemStyleOverrides(
        datumId: string,
        datum: any,
        format: Required<AgRangeBarSeriesStyle>,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;

        const { xKey, yHighKey, yLowKey, itemStyler, fillGradientDefaults, fillPatternDefaults } = properties;

        if (itemStyler == null) return;

        const overrides = this.cachedDatumCallback(createDatumId(datumId, highlighted ? 'highlight' : 'node'), () => {
            return this.callWithContext(itemStyler, {
                seriesId,
                datum,
                xKey,
                yHighKey,
                yLowKey,
                highlighted,
                ...format,
            });
        });

        return getShapeStyle(overrides, fillGradientDefaults, fillPatternDefaults);
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, RangeBarNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const style = this.getItemBaseStyle(isHighlight);

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((rect, datum) => {
            const overrides = this.getItemStyleOverrides(String(datum.datumIndex), datum.datum, style, isHighlight);

            applyShapeStyle(rect, style, overrides, fillBBox);

            rect.cornerRadius = overrides?.cornerRadius ?? style.cornerRadius;
            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            rect.crisp = datum.crisp;
        });
    }

    protected override getHighlightLabelData(
        labelData: RangeBarNodeLabelDatum[],
        highlightedItem: RangeBarNodeDatum
    ): RangeBarNodeLabelDatum[] | undefined {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }

    protected override updateLabelSelection(opts: {
        labelData: RangeBarNodeLabelDatum[];
        labelSelection: RangeBarAnimationData['labelSelection'];
    }) {
        const labelData = this.properties.label.enabled ? opts.labelData : [];
        return opts.labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: { labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.properties.label, datum);
        });
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { xKey, xName, yName, yLowKey, yHighKey, yLowName, yHighName, tooltip } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) {
            return;
        }

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yHighValue = dataModel.resolveColumnById(this, `yHighValue`, processedData)[datumIndex];
        const yLowValue = dataModel.resolveColumnById(this, `yLowValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const format = this.getItemBaseStyle(false);
        Object.assign(format, this.getItemStyleOverrides(String(datumIndex), datum, format, false));

        const value = `${yAxis.formatDatum(yLowValue)} - ${yAxis.formatDatum(yHighValue)}`;
        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: xAxis.formatDatum(xValue),
                symbol: this.legendItemSymbol(),
                data: [{ label: yName, fallbackLabel: `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`, value }],
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yName,
                yLowKey,
                yHighKey,
                yLowName,
                yHighName,
                ...format,
            }
        );
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const {
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            fillGradientDefaults,
            fillPatternDefaults,
        } = this.properties;
        return {
            marker: getShapeStyle(
                {
                    fill,
                    stroke,
                    fillOpacity,
                    strokeOpacity,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                },
                fillGradientDefaults,
                fillPatternDefaults
            ),
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const { id: seriesId, visible } = this;

        const { yName, yLowName, yHighName, yLowKey, yHighKey, showInLegend } = this.properties;
        const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
        const itemId = `${yLowKey}-${yHighKey}`;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible,
                label: { text: `${legendItemText}` },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: RangeBarAnimationData) {
        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'normal'));
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: RangeBarAnimationData) {
        const { datumSelection: datumSelections, labelSelection, previousContextData } = data;
        const { processedData } = this;
        const dataDiff = processedData?.reduced?.diff?.[this.id];

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const mode = previousContextData == null ? 'fade' : 'normal';
        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), mode));
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [datumSelections],
            fns,
            (_, datum) => this.getDatumId(datum),
            dataDiff
        );

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    private getDatumId(datum: RangeBarNodeDatum) {
        return `${datum.xValue}-${datum.valueIndex}`;
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected override onDataChange() {}

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }
}
