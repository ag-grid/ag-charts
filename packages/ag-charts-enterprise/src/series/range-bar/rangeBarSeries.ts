import {
    type AgRangeBarSeriesLabelFormatterParams,
    type AgRangeBarSeriesOptions,
    type AgRangeBarSeriesStyle,
    type AgRangeBarSeriesStylerParams,
    type TextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import type { CallbackParamRules, Point, RequireOptional } from 'ag-charts-core';
import { findMinMax, mergeDefaults } from 'ag-charts-core';

import { type RangeBarSeriesDataAggregationFilter, aggregateRangeBarDataFromDataModel } from './rangeBarAggregation';
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
    Rect,
    PointerEvents,
    motion,
    applyShapeStyle,
    areScalingEqual,
    processedDataIsAnimatable,
    AGGREGATION_SPAN,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    getItemStyles,
    calculateSegments,
    toHighlightString,
    HighlightState,
} = _ModuleSupport;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

interface RangeBarNodeLabelDatum extends Readonly<Point> {
    datumIndex: number;
    text: TextOrSegments;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemType: 'high' | 'low';
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
}

type RangeBarItemId = `${string}-${string}`;

interface RangeBarNodeDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>, Readonly<Point> {
    readonly index: number;
    readonly itemId: RangeBarItemId;
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
    style?: Required<AgRangeBarSeriesStyle>;
}

type RangeBarAnimationData = _ModuleSupport.AbstractBarSeriesAnimationData<
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

interface RangeBarSeriesNodeDataContext
    extends _ModuleSupport.AbstractBarSeriesNodeDataContext<RangeBarNodeDatum, RangeBarNodeLabelDatum> {
    itemId: RangeBarItemId;
    styles: _ModuleSupport.SeriesNodeStyleContext<AgRangeBarSeriesStyle>;
}

export class RangeBarSeries extends _ModuleSupport.AbstractBarSeries<
    _ModuleSupport.Rect<RangeBarNodeDatum>,
    AgRangeBarSeriesOptions,
    RangeBarProperties,
    RangeBarNodeDatum,
    RangeBarNodeLabelDatum,
    RangeBarSeriesNodeDataContext
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
            propertyKeys: {
                x: ['xKey'],
                y: ['yLowKey', 'yHighKey'],
            },
            propertyNames: {
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
        const { xKey, yLowKey, yHighKey } = this.properties;

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
            groupByKeys: false,
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
        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        return aggregateRangeBarDataFromDataModel(xAxis.scale.type, dataModel, processedData, this);
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
            const yExtent = this.domainForClippedRange(direction, ['yHighValue', 'yLowValue'], 'xValue');
            const fixedYExtent = findMinMax(yExtent);
            return fixNumericExtent(fixedYExtent);
        }
    }

    override getSeriesRange(_direction: _ModuleSupport.ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yHighValue', 'yLowValue'], 'xValue', visibleRange);
    }

    override createNodeData() {
        const { data, dataModel, groupScale, processedData, visible } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && xAxis && yAxis && dataModel && processedData?.dataSources && this.chart?.seriesRect)) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { xKey, yLowKey, yHighKey, strokeWidth } = this.properties;

        const itemId = `${yLowKey}-${yHighKey}` as const;

        const segments = calculateSegments(
            this.properties.segmentation,
            xAxis,
            yAxis,
            this.chart.seriesRect,
            this.ctx.scene
        );

        const context: RangeBarSeriesNodeDataContext = {
            itemId,
            nodeData: [],
            labelData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.groupScale),
            visible: this.visible,
            styles: getItemStyles(this.getItemStyle.bind(this)),
            segments,
        };
        if (!visible) return context;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

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

            const labelData: RangeBarNodeLabelDatum[] = this.createLabelData({
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
        const range = Math.abs(r1 - r0);

        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (dataAggregationFilter != null) {
            const { maxRange, indexData } = dataAggregationFilter;
            const [start, end] = visibleRangeIndices(1, maxRange, xAxis.range, (index) => {
                const aggIndex = index * AGGREGATION_SPAN;
                const xMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
                const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
                if (xMinIndex === -1) return;
                const midDatumIndex = Math.trunc((xMinIndex + xMaxIndex) / 2);
                return [xPosition(midDatumIndex), xPosition(xMaxIndex) + effectiveBarWidth];
            });

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * AGGREGATION_SPAN;
                const xMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
                const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
                const yMinIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MIN];
                const yMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MAX];

                if (xMinIndex === -1) continue;

                const midDatumIndex = Math.trunc((xMinIndex + xMaxIndex) / 2);

                const xValue = xValues[midDatumIndex];
                if (xValue == null) continue;

                const x = xPosition(midDatumIndex);
                const width = Math.abs(xPosition(xMinIndex) - xPosition(xMaxIndex)) + effectiveBarWidth;
                const yLow = yLowValues[yMinIndex];
                const yHigh = yHighValues[yMaxIndex];

                handleDatum(midDatumIndex, 0, x, width, yLow, yHigh, false);
            }
        } else if (processedData.type === 'ungrouped') {
            const invalidData = processedData.invalidData?.get(this.id);
            let [start, end] = this.visibleRangeIndices('xValue', xAxis.range);
            // @todo(AG-13575) Remove this if block
            if (processedData.input.count < 1e3) {
                start = 0;
                end = processedData.input.count;
            }

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                if (invalidData?.[datumIndex] === true) continue;

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
        const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, legendItemName, label } = this.properties;
        const labelParams = { datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, legendItemName };

        const { placement } = label;
        const spacing = label.spacing + (typeof label.padding === 'number' ? label.padding : 0);
        const paddingDirection = placement === 'outside' ? 1 : -1;
        const labelPadding = spacing * paddingDirection;

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);

        const yLowLabel: RangeBarNodeLabelDatum = {
            datumIndex,
            x: rect.x + (barAlongX ? -labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : rect.height + labelPadding),
            textAlign: barAlongX ? 'left' : 'center',
            textBaseline: barAlongX ? 'middle' : 'bottom',
            text: this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(
                yLowValue,
                datum,
                yLowKey,
                'y',
                yDomain,
                label,
                { itemType: 'low', value: yLowValue, ...labelParams }
            ),
            itemType: 'low',
            datum,
            series,
        };
        const yHighLabel: RangeBarNodeLabelDatum = {
            datumIndex,
            x: rect.x + (barAlongX ? rect.width + labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : -labelPadding),
            textAlign: barAlongX ? 'right' : 'center',
            textBaseline: barAlongX ? 'middle' : 'top',
            text: this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(
                yHighValue,
                datum,
                yHighKey,
                'y',
                yDomain,
                label,
                { itemType: 'high', value: yHighValue, ...labelParams }
            ),
            itemType: 'high',
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

    private getStyle(
        ignoreStylerCallback: boolean,
        highlightState?: _ModuleSupport.HighlightState
    ): Required<AgRangeBarSeriesStyle> & { opacity: number } {
        const {
            cornerRadius,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
            styler,
        } = this.properties;
        let stylerResult: AgRangeBarSeriesStyle = {};
        if (!ignoreStylerCallback && styler) {
            const stylerParams = this.makeStylerParams(highlightState);
            stylerResult =
                this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.cachedCallWithContext(styler, stylerParams) ?? {},
                    { pick: false }
                ) ?? {};
        }
        return {
            cornerRadius: stylerResult.cornerRadius ?? cornerRadius,
            fill: stylerResult.fill ?? fill,
            fillOpacity: stylerResult.fillOpacity ?? fillOpacity,
            lineDash: stylerResult.lineDash ?? lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? lineDashOffset,
            opacity: 1,
            stroke: stylerResult.stroke ?? stroke,
            strokeOpacity: stylerResult.strokeOpacity ?? strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? strokeWidth,
        };
    }

    private makeStylerParams(
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgRangeBarSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const {
            cornerRadius,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            stroke,
            strokeOpacity,
            strokeWidth,
            xKey,
            yLowKey,
            yHighKey,
        } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        return {
            cornerRadius,
            fill,
            fillOpacity,
            highlightState,
            lineDash,
            lineDashOffset,
            seriesId,
            stroke,
            strokeOpacity,
            strokeWidth,
            xKey,
            yLowKey,
            yHighKey,
        } satisfies CallbackParamRules<AgRangeBarSeriesStylerParams<unknown, unknown>>;
    }

    protected override updateDatumSelection(opts: {
        nodeData: RangeBarNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, RangeBarNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
    }

    private getItemStyle(
        datumIndex: number | undefined,
        isHighlight: boolean,
        highlightState?: _ModuleSupport.HighlightState
    ): Required<AgRangeBarSeriesStyle> {
        const { properties, dataModel, processedData } = this;
        const { itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        let style = mergeDefaults(highlightStyle, this.getStyle(datumIndex === undefined, highlightState));

        if (itemStyler && dataModel != null && processedData != null && datumIndex != null) {
            const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
            const overrides = this.cachedDatumCallback(
                createDatumId(this.getDatumId({ xValue }), isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(datumIndex, isHighlight, style);
                    return this.callWithContext(itemStyler, params);
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private makeItemStylerParams(datumIndex: number, isHighlight: boolean, style: Required<AgRangeBarSeriesStyle>) {
        const { id: seriesId, properties, processedData } = this;
        const { xKey, yHighKey, yLowKey } = properties;

        const datum = processedData!.dataSources.get(seriesId)?.data[datumIndex];
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            xKey,
            yHighKey,
            yLowKey,
            highlightState: highlightStateString,
            ...style,
            fill,
        };
    }

    protected override updateDatumStyles(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, RangeBarNodeDatum>;
        isHighlight: boolean;
    }) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        opts.datumSelection.each((node, datum) => {
            if (!opts.datumSelection.isGarbage(node)) {
                const highlightState = this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex);
                datum.style = this.getItemStyle(datum.datumIndex, opts.isHighlight, highlightState);
            }
        });
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, RangeBarNodeDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((rect, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];
            applyShapeStyle(rect, style, fillBBox);

            rect.cornerRadius = style.cornerRadius ?? 0;
            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            rect.crisp = datum.crisp;
        });
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

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RangeBarNodeLabelDatum>;
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const params: RequireOptional<AgRangeBarSeriesLabelFormatterParams> = {
            xKey: this.properties.xKey,
            xName: this.properties.xName ?? this.properties.xKey,
            yName: this.properties.yName,
            yLowKey: this.properties.yLowKey,
            yLowName: this.properties.yLowName ?? this.properties.yLowKey,
            yHighKey: this.properties.yHighKey,
            yHighName: this.properties.yHighName ?? this.properties.yHighKey,
            legendItemName: this.properties.legendItemName,
        };
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        opts.labelSelection.each((textNode, datum) => {
            textNode.fillOpacity = this.getHighlightStyle(isHighlight, datum?.datumIndex).opacity ?? 1;
            updateLabelNode(this, textNode, params, this.properties.label, datum, isHighlight, activeHighlight);
        });
    }

    protected override getHighlightLabelData(labelData: RangeBarNodeLabelDatum[], highlightedItem: RangeBarNodeDatum) {
        if (highlightedItem.labels?.length) {
            return highlightedItem.labels;
        }

        return super.getHighlightLabelData(labelData, highlightedItem);
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { xKey, xName, yName, yLowKey, yHighKey, yLowName, yHighName, tooltip, legendItemName } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yHighValue = dataModel.resolveColumnById(this, `yHighValue`, processedData)[datumIndex];
        const yLowValue = dataModel.resolveColumnById(this, `yLowValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const format = this.getItemStyle(datumIndex, false);
        const value = `${this.getAxisValueText(yAxis, 'tooltip', yLowValue, datum, yLowKey, legendItemName)} - ${this.getAxisValueText(yAxis, 'tooltip', yHighValue, datum, yHighKey, legendItemName)}`;
        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                symbol: this.legendItemSymbol(),
                data: [
                    {
                        label: yName,
                        fallbackLabel: `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`,
                        value,
                        missing:
                            _ModuleSupport.isTooltipValueMissing(yHighValue) &&
                            _ModuleSupport.isTooltipValueMissing(yLowValue),
                    },
                ],
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
                legendItemName,
                ...format,
            }
        );
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.getStyle(
            false,
            HighlightState.None
        );
        return {
            marker: {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const { id: seriesId, visible } = this;

        const { yName, yLowName, yHighName, yLowKey, yHighKey, legendItemName, showInLegend } = this.properties;
        const legendItemText = legendItemName ?? yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
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
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: RangeBarAnimationData) {
        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'normal'), 'unknown');
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);
        seriesLabelFadeInAnimation(
            this,
            'labels',
            this.ctx.animationManager,
            labelSelection,
            this.highlightLabelSelection
        );
    }

    override animateWaitingUpdateReady(data: RangeBarAnimationData) {
        const { datumSelection: datumSelections, labelSelection, contextData, previousContextData } = data;
        const dataDiff = _ModuleSupport.calculateDataDiff(
            this.id,
            datumSelections,
            this.getDatumId.bind(this),
            contextData,
            previousContextData,
            this.processedData,
            this.processedDataUpdated
        );

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const mode = previousContextData == null ? 'fade' : 'normal';
        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), mode), 'added');
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [datumSelections],
            fns,
            (_, datum) => this.getDatumId(datum),
            dataDiff
        );

        if (dataDiff?.changed || !areScalingEqual(contextData.groupScale, previousContextData?.groupScale)) {
            seriesLabelFadeInAnimation(
                this,
                'labels',
                this.ctx.animationManager,
                labelSelection,
                this.highlightLabelSelection
            );
        }
    }

    private getDatumId(datum: Pick<RangeBarNodeDatum, 'xValue'>) {
        return `${datum.xValue}`;
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected override onDataChange() {}

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.styler != null ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
