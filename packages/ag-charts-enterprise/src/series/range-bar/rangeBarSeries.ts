import type { AgTooltipRendererResult } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { SPAN, X_MAX, X_MIN, Y_MAX, Y_MIN, visibleRange } from '../../utils/aggregation';
import { type RangeBarSeriesDataAggregationFilter, aggregateRangeBarData } from './rangeBarAggregation';
import { RangeBarProperties } from './rangeBarProperties';

const {
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    getRectConfig,
    updateRect,
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
    createDatumId,
    computeBarFocusBounds,
    sanitizeHtml,
    findMinMax,
    ContinuousScale,
    OrdinalTimeScale,
    Rect,
    PointerEvents,
    motion,
} = _ModuleSupport;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type RangeBarNodeLabelDatum = Readonly<_ModuleSupport.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};

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
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
    readonly opacity: number;
    readonly clipBBox?: _ModuleSupport.BBox;

    readonly crisp: boolean;
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
    _ModuleSupport.Rect,
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
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (!this.properties.isValid()) {
            return;
        }

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
        if (processedData.type !== 'grouped' || processedData.rawData.length === 0) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null || !(ContinuousScale.is(xAxis.scale) || OrdinalTimeScale.is(xAxis.scale))) return;

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
            values,
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        } else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue');
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue');
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return fixNumericExtent(fixedYExtent);
        }
    }

    override createNodeData() {
        const {
            data,
            dataModel,
            groupScale,
            processedData,
            properties: { visible },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && xAxis && yAxis && dataModel && processedData?.rawData.length)) {
            return;
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const { xKey, yLowKey, yHighKey, fill, stroke, strokeWidth } = this.properties;

        const itemId = `${yLowKey}-${yHighKey}`;

        const context: RangeBarContext = {
            itemId,
            nodeData: [],
            labelData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
        };
        if (!visible) return context;

        const { rawData } = processedData;

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
                datum: datum,
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
                fill,
                stroke,
                strokeWidth,
                opacity: 1,
                crisp,
                labels: labelData,
            };

            context.nodeData.push(nodeDatum);
            context.labelData.push(...labelData);
        };

        const { dataAggregationFilters } = this;
        const [x0, x1] = findMinMax(xAxis.range);
        const [r0, r1] = xScale.range;
        const range = r1 - r0;

        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (dataAggregationFilter != null) {
            const { maxRange, indexData } = dataAggregationFilter;
            const [start, end] = visibleRange(maxRange, x0, x1, (index) => {
                const aggIndex = index * SPAN;
                const xMinIndex = indexData[aggIndex + X_MIN];
                const xMaxIndex = indexData[aggIndex + X_MAX];
                const midDatumIndex = ((xMinIndex + xMaxIndex) / 2) | 0;
                return xMinIndex !== -1 ? xPosition(midDatumIndex) : NaN;
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
            const [start, end] = visibleRange(rawData.length, x0, x1, xPosition);

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                const x = xPosition(datumIndex);
                const width = effectiveBarWidth;
                const yLow = yLowValues[datumIndex];
                const yHigh = yHighValues[datumIndex];

                handleDatum(datumIndex, 0, x, width, yLow, yHigh, defaultCrisp);
            }
        } else {
            processedData.groups.forEach(({ datumIndices }, groupedDataIndex) => {
                datumIndices.forEach((datumIndex) => {
                    const x = xPosition(datumIndex);
                    const width = effectiveBarWidth;
                    const yLow = yLowValues[datumIndex];
                    const yHigh = yHighValues[datumIndex];

                    handleDatum(datumIndex, groupedDataIndex, x, width, yLow, yHigh, defaultCrisp);
                });
            });
        }

        return context;
    }

    private createLabelData({
        rect,
        barAlongX,
        yLowValue,
        yHighValue,
        datum,
        series,
    }: {
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

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, RangeBarNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { id: seriesId, ctx } = this;
        const {
            yLowKey,
            yHighKey,
            highlightStyle: { item: itemHighlightStyle },
            fillOpacity,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
            itemStyler,
            shadow: fillShadow,
        } = this.properties;

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const style: _ModuleSupport.RectConfig = {
                fill: datum.fill,
                stroke: datum.stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                cornerRadius: this.properties.cornerRadius,
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig(this, this.getDatumId(datum), {
                datum,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                itemStyler,
                seriesId,
                ctx,
                yLowKey,
                yHighKey,
            });
            config.crisp = datum.crisp;
            config.visible = visible;
            updateRect(rect, config);
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

    getTooltipHtml(nodeDatum: RangeBarNodeDatum): _ModuleSupport.TooltipContent {
        const { id: seriesId } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;
        }

        const {
            xKey,
            yLowKey,
            yHighKey,
            xName,
            yLowName,
            yHighName,
            yName,
            fill,
            strokeWidth,
            itemStyler,
            tooltip,
            fillOpacity,
            stroke,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
        } = this.properties;
        const { datum, xValue, yLowValue, yHighValue } = nodeDatum;

        let format;
        if (itemStyler) {
            format = this.cachedDatumCallback(createDatumId(this.getDatumId(nodeDatum), 'tooltip'), () =>
                itemStyler({
                    highlighted: false,
                    seriesId,
                    datum,
                    xKey,
                    yLowKey,
                    yHighKey,
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                    cornerRadius,
                })
            );
        }

        const color = format?.fill ?? fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));

        const xSubheading = xName ?? xKey;
        const yLowSubheading = yLowName ?? yLowKey;
        const yHighSubheading = yHighName ?? yHighKey;

        const title = sanitizeHtml(yName);

        const content = yName
            ? `<b>${sanitizeHtml(xSubheading)}</b>: ${xString}<br>` +
              `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
              `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        return tooltip.toTooltipHtml(defaults, {
            itemId: undefined,
            datum,
            xKey,
            xName,
            yLowKey,
            yLowName,
            yHighKey,
            yHighName,
            yName,
            color,
            seriesId,
            title,
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const { id: seriesId, visible } = this;

        const {
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
            yName,
            yLowName,
            yHighName,
            yLowKey,
            yHighKey,
            showInLegend,
        } = this.properties;
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
                symbols: [{ marker: { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } }],
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
        const { datumSelection: datumSelections, labelSelection: labelSelections } = data;
        const { processedData } = this;
        const dataDiff = processedData?.reduced?.diff;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        const fns = prepareBarAnimationFunctions(midpointStartingBarPosition(this.isVertical(), 'fade'));
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [datumSelections],
            fns,
            (_, datum) => this.getDatumId(datum),
            dataDiff
        );

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    private getDatumId(datum: RangeBarNodeDatum) {
        return `${datum.xValue}-${datum.valueIndex}`;
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected override onDataChange() {}

    protected computeFocusBounds({
        datumIndex,
        seriesRect,
    }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this.contextNodeData?.nodeData[datumIndex], seriesRect);
    }
}
