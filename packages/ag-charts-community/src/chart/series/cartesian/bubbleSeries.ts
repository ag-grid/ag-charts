import {
    type Point,
    type RequireOptional,
    cachedTextMeasurer,
    clamp,
    extent,
    isArray,
    measureTextSegments,
    toPlainText,
} from 'ag-charts-core';
import {
    type AgBubbleSeriesItemStylerParams,
    type AgBubbleSeriesLabelFormatterParams,
    type AgBubbleSeriesOptions,
    type AgBubbleSeriesOptionsKeys,
    type AgBubbleSeriesStylerParams,
    type AgBubbleSeriesStylerResult,
    type AgDrawingMode,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgScatterSeriesItemStylerParams,
    type AgScatterSeriesStylerParams,
    type AgScatterSeriesStylerResult,
    type AgSeriesMarkerStyle,
    type FillOptions,
    type FormatterPropertyType,
    type LineDashOptions,
    type StrokeOptions,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { ContinuousScale } from '../../../scale/continuousScale';
import { LinearScale } from '../../../scale/linearScale';
import type { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { SizedPoint } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { LabelPlacement, MeasuredLabel, PlacedLabel } from '../../../scene/util/labelPlacement';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { CallbackParamRules } from '../../../util/callbackCache';
import { formatValue } from '../../../util/format.util';
import { dateToNumber } from '../../../util/timeFormatDefaults';
import { rescaleVisibleRange } from '../../../util/visibleRange';
import type { ChartAxis } from '../../chartAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { DataModel, type ProcessedData, fixNumericExtent } from '../../data/dataModel';
import { createDatumId, valueProperty } from '../../data/processors';
import { expandLabelPadding } from '../../label';
import { getLabelStyles } from '../../labelUtil';
import type { CategoryLegendDatum } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, type TooltipContentDataRow } from '../../tooltip/tooltip';
import {
    type PickFocusInputs,
    type SeriesNodePickMatch,
    SeriesNodePickMode,
    type SeriesNodeStyleContext,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { HighlightState, toHighlightString } from '../seriesProperties';
import type { ErrorBoundSeriesNodeDatum, SeriesNodeEventTypes } from '../seriesTypes';
import {
    type BubbleAggregation,
    type BubbleAggregationOptions,
    aggregateBubbleData,
    computeBubbleAggregationCount,
    computeBubbleAggregationData,
    computeBubbleAggregationDilation,
} from './bubbleAggregation';
import { BubbleSeriesProperties } from './bubbleSeriesProperties';
import type {
    CartesianAnimationData,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
} from './cartesianSeries';
import {
    CartesianSeries,
    CartesianSeriesNodeEvent,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { computeMarkerFocusBounds, getMarkerStyles, markerScaleInAnimation, resetMarkerFn } from './markerUtil';
import { addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';

type BubbleScatterAnimationData = CartesianAnimationData<Marker, BubbleScatterNodeDatum>;

class BubbleScatterSeriesNodeEvent<
    TEvent extends string = SeriesNodeEventTypes,
> extends CartesianSeriesNodeEvent<TEvent> {
    readonly sizeKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: BubbleScatterNodeDatum, series: BubbleSeries) {
        super(type, nativeEvent, datum, series);
        this.sizeKey = series.properties.sizeKey;
    }
}

export interface BubbleScatterNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly itemId: string;
    readonly point: Readonly<SizedPoint>;
    readonly sizeValue: any;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly anchor: Point;
    readonly count: number;
    readonly dilation: number;
    readonly area: number;
    readonly selected: boolean | undefined;
    style?: AgSeriesMarkerStyle;
}

interface BubbleSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<BubbleScatterNodeDatum, BubbleScatterNodeDatum> {
    styles: SeriesNodeStyleContext<AgSeriesMarkerStyle>;
}

export class BubbleSeries extends CartesianSeries<
    Marker,
    AgBubbleSeriesOptions,
    BubbleSeriesProperties,
    BubbleScatterNodeDatum,
    BubbleScatterNodeDatum,
    BubbleSeriesNodeDataContext
> {
    static readonly className: string = 'BubbleSeries';
    static readonly type: string = 'bubble';

    protected override readonly NodeEvent = BubbleScatterSeriesNodeEvent;

    override properties = new BubbleSeriesProperties();

    private dataAggregation: BubbleAggregation | undefined = undefined;

    private readonly sizeScale = new LinearScale();

    private placedLabelData: PlacedLabel<BubbleScatterNodeDatum>[] = [];

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    override get type() {
        return super.type as 'bubble' | 'scatter';
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: {
                ...DEFAULT_CARTESIAN_DIRECTION_KEYS,
                label: ['labelKey'],
                size: ['sizeKey'],
            },
            propertyNames: {
                ...DEFAULT_CARTESIAN_DIRECTION_NAMES,
                label: ['labelName'],
                size: ['sizeName'],
            },
            categoryKey: undefined,
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: [],
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                label: resetLabelFn,
                datum: resetMarkerFn,
            },
            usesPlacedLabels: true,
            clipFocusBox: false,
        });
    }

    override async processData(dataController: DataController) {
        if (this.data == null || !this.visible) return;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const sizeScaleType = this.sizeScale.type;
        const { xKey, yKey, sizeKey, xFilterKey, yFilterKey, sizeFilterKey, labelKey, marker } = this.properties;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(yKey, yScaleType, { id: `yValue` }),
                ...(xFilterKey == null ? [] : [valueProperty(xFilterKey, xScaleType, { id: `xFilterValue` })]),
                ...(yFilterKey == null ? [] : [valueProperty(yFilterKey, yScaleType, { id: `yFilterValue` })]),
                ...(sizeFilterKey == null
                    ? []
                    : [valueProperty(sizeFilterKey, sizeScaleType, { id: `sizeFilterValue` })]),
                ...(sizeKey ? [valueProperty(sizeKey, sizeScaleType, { id: `sizeValue` })] : []),
                ...(labelKey ? [valueProperty(labelKey, 'category', { id: `labelValue` })] : []),
            ],
        });

        const sizeKeyIdx = sizeKey ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`) : undefined;
        const mutableMarkerDomain: [number, number] | undefined = marker.domain
            ? [marker.domain[0], marker.domain[1]]
            : undefined;
        this.sizeScale.domain =
            mutableMarkerDomain ?? (sizeKeyIdx == null ? undefined : processedData.domain.values[sizeKeyIdx]) ?? [];

        this.dataAggregation = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(xValue: any, pixelSize: number, index: number): [number, number] {
        const { properties, sizeScale } = this;
        const { size, sizeKey } = properties;
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const sizeValues =
            sizeKey == null ? undefined : this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!);
        const sizeValue = sizeValues == null ? size : sizeScale.convert(sizeValues[index]);
        const r = 0.5 * sizeValue * pixelSize;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number, index: number): [number, number] {
        const { properties, sizeScale } = this;
        const { size, sizeKey } = properties;
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const sizeValues =
            sizeKey == null ? undefined : this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!);
        const sizeValue = sizeValues == null ? size : sizeScale.convert(sizeValues[index]);
        const r = 0.5 * sizeValue * pixelSize;
        return [y - r, y + r];
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const dataValues: { [K in ChartAxisDirection]?: string } = {
            [ChartAxisDirection.X]: 'xValue',
            [ChartAxisDirection.Y]: 'yValue',
        };

        const id = dataValues[direction]!;
        const dataDef = dataModel.resolveProcessedDataDefById(this, id);
        const domain = dataModel.getDomain(this, id, 'value', processedData);
        if (dataDef?.def.type === 'value' && dataDef?.def.valueType === 'category') {
            return domain;
        }

        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;
        const crossId = dataValues[crossDirection]!;

        const ext = this.domainForClippedRange(direction, [id], crossId);
        return fixNumericExtent(extent(ext));
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yValue'], 'xValue', visibleRange);
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        const { dataAggregation, axes } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (dataAggregation == null || xAxis == null || yAxis == null) {
            return this.countVisibleItems('xValue', ['yValue'], xVisibleRange, yVisibleRange, minVisibleItems);
        }

        const aggregationOptions = this.aggregationOptions(xAxis, yAxis, xVisibleRange, yVisibleRange ?? [0, 1]);
        return computeBubbleAggregationCount(0, dataAggregation, aggregationOptions);
    }

    private aggregateData(dataModel: DataModel<any, any, true>, processedData: ProcessedData<any>) {
        if (processedData.type === 'grouped') return;
        if (processedData.input.count <= this.properties.maxRenderedItems) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (xAxis == null || yAxis == null) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        if (!ContinuousScale.is(xScale) || !ContinuousScale.is(yScale)) return;

        const { sizeScale, properties } = this;
        const { sizeKey } = properties;
        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData);
        const sizeValues = sizeKey ? dataModel.resolveColumnById<number>(this, `sizeValue`, processedData) : undefined;
        const xDomain = dataModel.getDomain(this, `xValue`, 'value', processedData);
        const yDomain = dataModel.getDomain(this, `yValue`, 'value', processedData);
        const sizeDomain = sizeKey ? sizeScale.domain : [0, 0];
        const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this, `xValue`, processedData);
        const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this, `yValue`, processedData);

        // Not used in mini chart - no memoization needed
        return aggregateBubbleData(
            xScale.type,
            yScale.type,
            xValues,
            yValues,
            sizeValues,
            xDomain,
            yDomain,
            sizeDomain,
            xNeedsValueOf,
            yNeedsValueOf
        );
    }

    private aggregationOptions(
        xAxis: ChartAxis,
        yAxis: ChartAxis,
        xVisibleRange: [number, number] = xAxis.visibleRange,
        yVisibleRange: [number, number] = yAxis.visibleRange
    ): BubbleAggregationOptions {
        const { processedData, dataModel } = this;
        const { sizeKey } = this.properties;
        const [markerSize, markerMaxSize] = this.getSizeRange();
        const xRange = Math.abs(xAxis.range[1] - xAxis.range[0]);
        const yRange = Math.abs(yAxis.range[1] - yAxis.range[0]);
        const minSize = Math.max(markerSize, 1);
        const maxSize = sizeKey ? Math.max(markerMaxSize, 1) : minSize;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        if (processedData != null && dataModel != null) {
            if (ContinuousScale.is(xScale)) {
                xVisibleRange = rescaleVisibleRange(
                    xVisibleRange,
                    xScale.domain.map(dateToNumber) as [number, number],
                    dataModel.getDomain(this, `xValue`, 'value', processedData).map(dateToNumber) as [number, number]
                );
            }
            if (ContinuousScale.is(yScale)) {
                yVisibleRange = rescaleVisibleRange(
                    yVisibleRange,
                    yScale.domain.map(dateToNumber) as [number, number],
                    dataModel.getDomain(this, `yValue`, 'value', processedData).map(dateToNumber) as [number, number]
                );
            }
        }

        return { xRange, yRange, minSize, maxSize, xVisibleRange, yVisibleRange };
    }

    override createNodeData() {
        const { axes, dataModel, processedData, sizeScale, visible } = this;
        const {
            xKey,
            yKey,
            sizeKey,
            xFilterKey,
            yFilterKey,
            sizeFilterKey,
            labelKey,
            xName,
            yName,
            sizeName,
            labelName,
            label,
            legendItemName,
            marker,
            maxRenderedItems,
        } = this.properties;
        const { enabled: labelEnabled, placement } = label;
        const anchor = Marker.anchor(marker.shape);

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(dataModel && processedData && xAxis && yAxis)) return;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const xDataValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yDataValues = dataModel.resolveColumnById(this, `yValue`, processedData);
        const sizeDataValues =
            sizeKey == null ? undefined : dataModel.resolveColumnById<number>(this, `sizeValue`, processedData);
        const labelDataValues =
            labelKey == null ? undefined : dataModel.resolveColumnById(this, `labelValue`, processedData);
        const xFilterDataValues =
            xFilterKey == null ? undefined : dataModel.resolveColumnById(this, `xFilterValue`, processedData);
        const yFilterDataValues =
            yFilterKey == null ? undefined : dataModel.resolveColumnById(this, `yFilterValue`, processedData);
        const sizeFilterDataValues =
            sizeFilterKey == null
                ? undefined
                : dataModel.resolveColumnById<number>(this, `sizeFilterValue`, processedData);

        let labelTextDomain: any[];
        if (labelKey) {
            labelTextDomain = [];
        } else if (sizeKey) {
            labelTextDomain = dataModel.getDomain(this, `sizeValue`, 'value', processedData);
        } else {
            labelTextDomain = [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: BubbleScatterNodeDatum[] = [];

        sizeScale.range = this.getSizeRange();

        const textMeasurer = cachedTextMeasurer(label);
        const rawData = processedData.dataSources.get(this.id)?.data;
        if (rawData == null) return;

        const padding = expandLabelPadding(label);
        const handleDatum = (datumIndex: number, count: number, dilation: number, area: number) => {
            const datum = rawData[datumIndex];
            const xDatum = xDataValues[datumIndex];
            const yDatum = yDataValues[datumIndex];
            const sizeValue = sizeDataValues?.[datumIndex];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            let selected: boolean | undefined;
            if (xFilterDataValues != null && yFilterDataValues != null) {
                selected = xFilterDataValues[datumIndex] === xDatum && yFilterDataValues[datumIndex] === yDatum;

                if (sizeFilterDataValues != null) {
                    selected &&= sizeFilterDataValues[datumIndex] === sizeValue;
                }
            }

            let nodeLabel: MeasuredLabel;
            if (labelEnabled) {
                let labelTextValue: any;
                let labelTextKey: string;
                let labelTextProperty: FormatterPropertyType;
                if (labelKey && labelDataValues) {
                    labelTextValue = labelDataValues[datumIndex];
                    labelTextKey = labelKey;
                    labelTextProperty = 'label';
                } else if (sizeKey) {
                    labelTextValue = sizeValue;
                    labelTextKey = sizeKey;
                    labelTextProperty = 'size';
                } else {
                    labelTextValue = yDatum;
                    labelTextKey = yKey;
                    labelTextProperty = 'y';
                }
                const labelText = this.getLabelText<AgBubbleSeriesLabelFormatterParams>(
                    labelTextValue,
                    datum,
                    labelTextKey,
                    labelTextProperty,
                    labelTextDomain,
                    label,
                    {
                        value: labelTextValue,
                        datum,
                        xKey,
                        yKey,
                        sizeKey,
                        labelKey,
                        xName,
                        yName,
                        sizeName,
                        labelName,
                        legendItemName,
                    }
                );
                let { width, height } = isArray(labelText)
                    ? measureTextSegments(labelText, label)
                    : textMeasurer.measureLines(String(labelText));

                width += padding.left + padding.right;
                height += padding.bottom + padding.top;
                nodeLabel = { text: labelText, width, height };
            } else {
                nodeLabel = { text: '', width: 0, height: 0 };
            }

            const markerSize = sizeValue == null ? sizeScale.range[0] : sizeScale.convert(sizeValue);
            const point = { x, y, size: Math.sqrt(dilation) * markerSize };

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                datumIndex,
                xValue: xDatum,
                yValue: yDatum,
                sizeValue,
                capDefaults: { lengthRatioMultiplier: marker.getDiameter(), lengthMax: Infinity },
                point,
                midPoint: { x, y },
                label: nodeLabel,
                anchor,
                placement,
                count,
                dilation,
                area,
                selected,
            });
        };

        const { dataAggregation } = this;
        if (!visible) {
            // Don't create node data
        } else if (dataAggregation == null) {
            for (let datumIndex = 0; datumIndex < rawData.length; datumIndex++) {
                handleDatum(datumIndex, 1, 1, 0);
            }
        } else {
            const aggregationOptions = this.aggregationOptions(xAxis, yAxis);
            const aggregationDilation = computeBubbleAggregationDilation(
                dataAggregation,
                aggregationOptions,
                maxRenderedItems
            );

            const { groupedAggregation, singleDatumIndices } = computeBubbleAggregationData(
                aggregationDilation,
                dataAggregation,
                aggregationOptions
            );

            for (const { datumIndex, count, dilation, area } of groupedAggregation) {
                handleDatum(datumIndex, count, dilation, area);
            }
            for (const datumIndex of singleDatumIndices) {
                handleDatum(datumIndex, 1, 1, 0);
            }
        }

        type StylerResult = AgBubbleSeriesStylerResult | AgScatterSeriesStylerResult | undefined;
        type StylerParams =
            | AgBubbleSeriesStylerParams<unknown, unknown>
            | AgScatterSeriesStylerParams<unknown, unknown>;
        type ItemStylerParams =
            | AgBubbleSeriesItemStylerParams<unknown, unknown>
            | AgScatterSeriesItemStylerParams<unknown, unknown>;
        return {
            itemId: yKey,
            nodeData,
            labelData: labelEnabled ? nodeData : [],
            scales: this.calculateScaling(),
            visible: this.visible || animationEnabled,
            styles: getMarkerStyles<StylerParams, StylerResult, ItemStylerParams>(this, this.properties, marker),
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    override getLabelData() {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    protected override updateDatumSelection(opts: {
        nodeData: BubbleScatterNodeDatum[];
        datumSelection: Selection<Marker, BubbleScatterNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const { sizeKey } = this.properties;

        if (this.properties.marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        let getId: ((datum: BubbleScatterNodeDatum) => string) | undefined;
        if (sizeKey) {
            getId = (datum) =>
                createDatumId(datum.xValue, datum.yValue, datum.sizeValue, toPlainText(datum.label.text));
        }
        return datumSelection.update(nodeData, undefined, getId);
    }

    override updateDatumStyles(opts: {
        datumSelection: Selection<Marker, BubbleScatterNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        const params = { xKey, yKey, sizeKey, labelKey };

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        datumSelection.each((node, datum) => {
            if (!datumSelection.isGarbage(node)) {
                const highlightState = this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex);
                const stylerStyle = this.getStyle(opts.isHighlight, highlightState);
                datum.style = this.getMarkerStyle(
                    marker,
                    datum,
                    params,
                    {
                        isHighlight,
                        highlightState,
                        resolveMarkerSubPath: [],
                    },
                    stylerStyle
                );
            }
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<Marker, BubbleScatterNodeDatum>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) return;
        const { datumSelection, isHighlight, drawingMode } = opts;

        this.sizeScale.range = this.getSizeRange();
        const fillBBox = this.getShapeFillBBox();

        const aggregated = this.dataAggregation != null;

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        datumSelection.each((node, datum, index) => {
            const {
                point: { size },
                count,
                area,
                dilation,
            } = datum;
            let style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];

            style = { ...style };
            style.size = size;

            if (dilation > 1) {
                const fillOpacity = style.fillOpacity ?? 0;
                // See /tools/bubble-aggregation
                const opacityScale =
                    0.269669 +
                    0.000683 * count +
                    -37.534348 * area +
                    0.004449 * count * area +
                    -0 * count ** 2 +
                    44.428603 * area ** 2;
                style.fillOpacity = clamp(fillOpacity / dilation, (fillOpacity / 0.1) * opacityScale, 1);
            }

            this.applyMarkerStyle(style, node, datum.point, fillBBox, { selected: datum.selected });
            node.drawingMode = drawingMode;
            node.zIndex = aggregated ? [-count, index] : 0;
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    public override updatePlacedLabelData(labelData: PlacedLabel<BubbleScatterNodeDatum>[]) {
        this.placedLabelData = labelData;
        this.labelSelection.update(
            labelData.map((v) => ({
                ...v.datum,
                point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                },
            })),
            (text) => {
                text.pointerEvents = PointerEvents.None;
            }
        );
        this.updateLabelNodes({ labelSelection: this.labelSelection });
        this.updateHighlightLabelSelection();
    }

    private updateHighlightLabelSelection() {
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightItem =
            this.isSeriesHighlighted(highlightedDatum) && highlightedDatum?.datum
                ? (highlightedDatum as BubbleScatterNodeDatum)
                : undefined;

        const highlightLabelData =
            highlightItem == null
                ? []
                : this.placedLabelData
                      .filter((label) => label.datum.datumIndex === highlightItem.datumIndex)
                      .map((label) => ({
                          ...label.datum,
                          point: {
                              x: label.x,
                              y: label.y,
                              size: label.datum.point.size,
                          },
                      }));

        this.highlightLabelSelection =
            this.updateLabelSelection({
                labelData: highlightLabelData,
                labelSelection: this.highlightLabelSelection,
            }) ?? this.highlightLabelSelection;

        this.highlightLabelGroup.visible = highlightLabelData.length > 0;
        this.highlightLabelGroup.batchedUpdate(() => {
            this.updateLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });
        });
    }

    protected updateLabelNodes(opts: {
        labelSelection: Selection<Text, BubbleScatterNodeDatum>;
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const params: AgBubbleSeriesLabelFormatterParams = this.makeLabelFormatterParams();

        opts.labelSelection.each((text, datum) => {
            const style = getLabelStyles(this, datum, params, this.properties.label, isHighlight, activeHighlight);
            text.text = datum.label.text;
            text.fill = style.color;
            text.x = datum.point?.x ?? 0;
            text.y = datum.point?.y ?? 0;
            text.fontStyle = style.fontStyle;
            text.fontWeight = style.fontWeight;
            text.fontSize = style.fontSize;
            text.fontFamily = style.fontFamily;
            text.textBaseline = 'top';
            text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
            text.setBoxing(style);
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: BubbleScatterNodeDatum[];
        labelSelection: Selection<Text, BubbleScatterNodeDatum>;
    }): Selection<Text, BubbleScatterNodeDatum> {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    makeStylerParams(
        highlighted: boolean,
        highlightStateEnum?: HighlightState
    ): AgBubbleSeriesStylerParams<unknown, unknown> | AgScatterSeriesStylerParams<unknown, unknown> {
        const {
            id: seriesId,
            properties: {
                size,
                maxSize,
                shape,
                fill,
                fillOpacity,
                lineDash,
                lineDashOffset,
                stroke,
                strokeOpacity,
                strokeWidth,
                xKey,
                yKey,
                sizeKey,
                labelKey,
            },
        } = this;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        if (this.type === 'bubble') {
            type ResultRules = CallbackParamRules<AgBubbleSeriesStylerParams<unknown, unknown>>;
            return {
                highlightState,
                highlighted,
                size,
                maxSize,
                shape,
                fill,
                fillOpacity,
                lineDash,
                lineDashOffset,
                seriesId,
                sizeKey,
                stroke,
                strokeOpacity,
                strokeWidth,
                xKey,
                yKey,
                labelKey,
            } satisfies ResultRules;
        } else if (this.type === 'scatter') {
            type ResultRules = CallbackParamRules<AgScatterSeriesStylerParams<unknown, unknown>>;
            return {
                highlightState,
                highlighted,
                size,
                shape,
                fill,
                fillOpacity,
                lineDash,
                lineDashOffset,
                seriesId,
                stroke,
                strokeOpacity,
                strokeWidth,
                xKey,
                yKey,
                labelKey,
            } satisfies ResultRules;
        } else {
            // verify that the else branch is unreachable.
            return this.type satisfies never;
        }
    }

    private makeLabelFormatterParams(): AgBubbleSeriesLabelFormatterParams {
        const { xKey, xName, yKey, yName, sizeKey, sizeName, labelKey, labelName, legendItemName } = this.properties;
        return {
            xKey,
            xName,
            yKey,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            legendItemName,
        } satisfies RequireOptional<AgBubbleSeriesLabelFormatterParams>;
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties, ctx } = this;
        const { formatManager } = ctx;
        const {
            xKey,
            xName,
            yKey,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            title,
            tooltip,
            marker,
            legendItemName,
        } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const data: TooltipContentDataRow[] = [];

        if (this.isLabelEnabled() && labelKey != null) {
            const value = dataModel.resolveColumnById<number>(this, `labelValue`, processedData)[datumIndex];
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'category',
                value,
                datum,
                seriesId,
                legendItemName,
                key: labelKey,
                source: 'tooltip',
                property: 'label',
                domain: [],
                boundSeries: this.getFormatterContext('label'),
            });
            data.push({ label: labelName, fallbackLabel: labelKey, value: content ?? formatValue(value) });
        }

        data.push(
            {
                label: xName,
                fallbackLabel: xKey,
                value: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
            },
            {
                label: yName,
                fallbackLabel: yKey,
                value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, legendItemName),
            }
        );

        if (sizeKey != null) {
            const value = dataModel.resolveColumnById<number>(this, `sizeValue`, processedData)[datumIndex];
            const domain = dataModel.getDomain(this, `sizeValue`, 'value', processedData);
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value,
                datum,
                seriesId,
                legendItemName,
                key: sizeKey,
                source: 'tooltip',
                property: 'size',
                boundSeries: this.getFormatterContext('size'),
                domain,
                fractionDigits: undefined,
            });
            data.push({ label: sizeName, fallbackLabel: sizeKey, value: content ?? formatValue(value) });
        }

        const activeStyle = this.getMarkerStyle(
            marker,
            { datum, datumIndex },
            { xKey, yKey, sizeKey, labelKey, highlighted: true },
            { resolveMarkerSubPath: [] }
        );

        return this.formatTooltipWithContext(
            tooltip,
            {
                title,
                symbol: this.legendItemSymbol(),
                data,
            },
            {
                seriesId,
                datum,
                title: yKey,
                xKey,
                xName,
                yKey,
                yName,
                sizeKey,
                sizeName,
                labelKey,
                labelName,
                legendItemName,
                ...(activeStyle as RequireOptional<FillOptions & StrokeOptions & LineDashOptions>),
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const style = this.getStyle(false);
        const marker = this.getMarkerStyle<AgBubbleSeriesOptionsKeys>(
            this.properties.marker,
            {},
            undefined,
            {
                isHighlight: false,
                checkForHighlight: false,
                resolveMarkerSubPath: [],
            },
            style satisfies RequireOptional<AgSeriesMarkerStyle>
        );
        return {
            marker,
        };
    }

    getLegendData(): CategoryLegendDatum[] {
        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { yKey: itemId, yName, legendItemName, title, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: legendItemName ?? title ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: BubbleScatterAnimationData) {
        markerScaleInAnimation(this, this.ctx.animationManager, datumSelection);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Marker();
    }

    public getStyle(highlighted: boolean, highlightState?: HighlightState): Required<AgBubbleSeriesStylerResult> {
        const { properties } = this;

        let stylerResult: AgBubbleSeriesStylerResult = {};
        if (properties.styler) {
            const stylerParams = this.makeStylerParams(highlighted, highlightState);
            const cbResult = this.cachedCallWithContext(properties.styler, stylerParams) ?? {};
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            stylerResult = resolved ?? {};
        }

        return {
            fill: stylerResult.fill ?? properties.fill!,
            fillOpacity: stylerResult.fillOpacity ?? properties.fillOpacity,
            lineDash: stylerResult.lineDash ?? properties.lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? properties.lineDashOffset,
            shape: stylerResult.shape ?? properties.shape,
            size: stylerResult.size ?? properties.size,
            maxSize: stylerResult.maxSize ?? properties.maxSize,
            stroke: stylerResult.stroke ?? properties.stroke!,
            strokeOpacity: stylerResult.strokeOpacity ?? properties.strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? properties.strokeWidth,
        };
    }

    public getSizeRange(): [number, number] {
        const { size, maxSize } = this.getStyle(false);
        return [size, maxSize];
    }

    public getFormattedMarkerStyle(datum: BubbleScatterNodeDatum) {
        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        return this.getMarkerStyle(marker, datum, { xKey, yKey, sizeKey, labelKey }, { resolveMarkerSubPath: [] });
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        const { styler, itemStyler, marker, label } = this.properties;
        return !!(styler ?? itemStyler ?? marker.itemStyler ?? label.itemStyler);
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<BubbleScatterNodeDatum>) {
        addHitTestersToQuadtree(quadtree, this.datumNodesIter());
    }

    protected override pickNodeDataClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }
}
