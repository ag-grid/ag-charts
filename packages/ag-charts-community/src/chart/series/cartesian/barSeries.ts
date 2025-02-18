import type { RequireOptional } from 'ag-charts-core';
import { createSparseArray, isFiniteNumber } from 'ag-charts-core';
import type { AgBarSeriesStyle, AgErrorBoundSeriesTooltipRendererParams } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Point } from '../../../scene/point';
import { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import { LogAxis } from '../../axis/logAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { DataModel, type ProcessedData, type PropertyDefinition, fixNumericExtent } from '../../data/dataModel';
import {
    LARGEST_KEY_INTERVAL,
    SMALLEST_KEY_INTERVAL,
    animationValidation,
    createDatumId,
    diff,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    valueProperty,
} from '../../data/processors';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { applyShapeStyle } from '../shapeUtil';
import { datumStylerProperties } from '../util';
import { AbstractBarSeries } from './abstractBarSeries';
import { BarSeriesProperties } from './barSeriesProperties';
import {
    checkCrisp,
    collapsedStartingBarPosition,
    computeBarFocusBounds,
    prepareBarAnimationFunctions,
    resetBarSelectionsFn,
} from './barUtil';
import {
    type CartesianAnimationData,
    type CartesianSeriesNodeDataContext,
    type CartesianSeriesNodeDatum,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { adjustLabelPlacement, updateLabelNode } from './labelUtil';
import { type Scaling, areScalingEqual } from './scaling';

interface BarNodeLabelDatum extends Readonly<Point> {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
}

interface BarNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum, Readonly<Point> {
    readonly xValue: string | number;
    readonly yValue: string | number;
    readonly valueIndex: number;
    readonly cumulativeValue: number;
    readonly phantom: boolean;
    readonly width: number;
    readonly height: number;
    readonly opacity: number | undefined;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly clipBBox: BBox | undefined;
    readonly crisp: boolean;
    readonly label?: BarNodeLabelDatum;
}

type BarAnimationData = CartesianAnimationData<Rect, BarNodeDatum>;

interface BarSeriesNodeDataContext extends CartesianSeriesNodeDataContext<BarNodeDatum, BarNodeDatum> {
    groupScale: Scaling | undefined;
}

// Get TS to check these values - but it's faster for the engine to use explicit constants
export interface BarSeriesAggregationIndexes {
    xMin: 0;
    xMax: 1;
    yMin: 2;
    yMax: 3;
    span: 4;
}

const X_MIN: BarSeriesAggregationIndexes['xMin'] = 0;
const X_MAX: BarSeriesAggregationIndexes['xMax'] = 1;
const Y_MIN: BarSeriesAggregationIndexes['yMin'] = 2;
const Y_MAX: BarSeriesAggregationIndexes['yMax'] = 3;
const SPAN: BarSeriesAggregationIndexes['span'] = 4;

export interface BarSeriesDataAggregationFilter {
    maxRange: number;
    indexData: Int32Array;
    indices: number[];
    indexes: BarSeriesAggregationIndexes;
}

export class BarSeries extends AbstractBarSeries<
    Rect<BarNodeDatum>,
    BarSeriesProperties,
    BarNodeDatum,
    BarNodeDatum,
    BarSeriesNodeDataContext
> {
    static readonly className = 'BarSeries';
    static readonly type = 'bar' as const;

    override properties = new BarSeriesProperties();

    override connectsToYAxis = true;

    private dataAggregationFilters: BarSeriesDataAggregationFilter[] | undefined = undefined;

    override get pickModeAxis() {
        return this.properties.sparklineMode ? 'main' : undefined;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED, // Only used in sparklineMode
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: [],
            hasHighlightedLabels: true,
            datumSelectionGarbageCollection: false,
            animationAlwaysUpdateSelections: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    private crossFilteringEnabled() {
        return (
            this.properties.yFilterKey != null && (this.seriesGrouping == null || this.seriesGrouping.stackIndex === 0)
        );
    }

    override async processData(dataController: DataController) {
        if (!this.properties.isValid() || !this.data) {
            return;
        }

        const { xKey, yKey, yFilterKey, normalizedTo, fastDataProcessing } = this.properties;
        const { seriesGrouping: { groupIndex = this.id } = {}, data } = this;
        const groupCount = this.seriesGrouping?.groupCount ?? 0;
        const stackCount = this.seriesGrouping?.stackCount ?? 0;
        const stacked = stackCount >= 1 || normalizedTo != null;
        const grouped = !fastDataProcessing || groupCount > 1 || stacked;

        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;

        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const stackGroupName = `bar-stack-${groupIndex}-yValues`;
        const stackGroupTrailingName = `${stackGroupName}-trailing`;

        const visibleProps = this.visible ? {} : { forceValue: 0 };
        const props: PropertyDefinition<any>[] = [
            keyProperty(xKey, xScaleType, { id: 'xValue' }),
            valueProperty(yKey, yScaleType, { id: `yValue-raw`, invalidValue: null, ...visibleProps }),
        ];

        if (this.crossFilteringEnabled()) {
            props.push(
                valueProperty(yFilterKey!, yScaleType, {
                    id: `yFilterValue`,
                    invalidValue: null,
                    ...visibleProps,
                })
            );
        }

        if (stacked) {
            props.push(
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    'current',
                    {
                        id: `yValue-end`,
                        rangeId: `yValue-range`,
                        invalidValue: null,
                        missingValue: 0,
                        groupId: stackGroupName,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'trailing',
                    'current',
                    {
                        id: `yValue-start`,
                        invalidValue: null,
                        missingValue: 0,
                        groupId: stackGroupTrailingName,
                        separateNegative: true,
                        ...visibleProps,
                    },
                    yScaleType
                )
            );
        }

        if (isContinuousX) {
            props.push(SMALLEST_KEY_INTERVAL, LARGEST_KEY_INTERVAL);
        }

        if (isFiniteNumber(normalizedTo)) {
            props.push(normaliseGroupTo([stackGroupName, stackGroupTrailingName], Math.abs(normalizedTo)));
        }
        if (animationEnabled && this.processedData) {
            props.push(diff(this.id, this.processedData));
        }
        if (animationEnabled || !grouped) {
            props.push(animationValidation());
        }

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props,
            groupByKeys: grouped,
            groupByData: !grouped,
        });

        this.dataAggregationFilters = this.aggregateData(dataModel, processedData);

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;

        if (dataModel == null || processedData == null) return [];

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        }

        const yKey = this.dataModel?.hasColumnById(this, `yValue-end`) ? 'yValue-end' : 'yValue-raw';
        let yExtent = this.domainForClippedRange(ChartAxisDirection.Y, [yKey], 'xValue', true);
        const yFilterExtent = this.crossFilteringEnabled()
            ? dataModel.getDomain(this, `yFilterValue`, 'value', processedData)
            : undefined;
        if (yFilterExtent != null) {
            yExtent = [Math.min(yExtent[0], yFilterExtent[0]), Math.max(yExtent[1], yFilterExtent[1])];
        }

        if (this.getValueAxis() instanceof LogAxis) {
            return fixNumericExtent(yExtent);
        } else {
            const fixedYExtent = Number.isFinite(yExtent[1] - yExtent[0])
                ? [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])]
                : [];
            return fixNumericExtent(fixedYExtent);
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): [number, number] {
        const yKey = this.dataModel?.hasColumnById(this, `yValue-end`) ? 'yValue-end' : 'yValue-raw';
        const [y0, y1] = this.domainForVisibleRange(ChartAxisDirection.Y, [yKey], 'xValue', visibleRange, true);
        return [Math.min(y0, 0), Math.max(y1, 0)];
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number],
        minVisibleItems: number
    ): number {
        const yKey = this.dataModel?.hasColumnById(this, `yValue-end`) ? 'yValue-end' : 'yValue-raw';
        return this.countVisibleItems('xValue', [yKey], xVisibleRange, yVisibleRange, minVisibleItems);
    }

    protected aggregateData(
        _dataModel: DataModel<any, any, any>,
        _processedData: ProcessedData<any>
    ): BarSeriesDataAggregationFilter[] | undefined {
        return;
    }

    createNodeData(): BarSeriesNodeDataContext | undefined {
        const { dataModel, processedData, groupScale, dataAggregationFilters } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis || !this.properties.isValid()) {
            return;
        }

        const rawData = processedData.dataSources?.get(this.id);
        if (rawData == null) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { xKey, yKey, xName, yName, legendItemName, label } = this.properties;

        const yReversed = yAxis.isReversed();

        const { barWidth, groupIndex: groupScaleIndex } = this.updateGroupScale(xAxis);
        const groupOffset = groupScale.convert(String(groupScaleIndex));
        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yRawValues = dataModel.resolveColumnById(this, `yValue-raw`, processedData);
        const yFilterValues = this.crossFilteringEnabled()
            ? dataModel.resolveColumnById(this, `yFilterValue`, processedData)
            : undefined;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xPosition = (index: number): number => xScale.convert(xValues[index]) + groupOffset + barOffset;

        const crisp =
            this.properties.crisp ??
            checkCrisp(xAxis?.scale, xAxis?.visibleRange, this.smallestDataInterval, this.largestDataInterval);

        const bboxBottom = yScale.convert(0);
        const nodeDatum = ({
            datum,
            datumIndex,
            valueIndex,
            xValue,
            yValue,
            cumulativeValue,
            phantom,
            currY,
            prevY,
            x,
            width,
            isPositive,
            yRange,
            labelText,
            opacity,
            crossScale = 1,
        }: {
            datum: any;
            datumIndex: number;
            valueIndex: number;
            xValue: string;
            yValue: number;
            cumulativeValue: number;
            phantom: boolean;
            currY: number;
            prevY: number;
            x: number;
            width: number;
            isPositive: boolean;
            yRange: number;
            labelText: string | undefined;
            opacity: number;
            crossScale: number | undefined;
        }): BarNodeDatum => {
            const isUpward = isPositive !== yReversed;

            const y = yScale.convert(currY);
            const bottomY = yScale.convert(prevY);
            const bboxHeight = yScale.convert(yRange);
            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

            const xOffset = width * 0.5 * (1 - crossScale);
            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : x + xOffset,
                y: barAlongX ? x + xOffset : Math.min(y, bottomY),
                width: barAlongX ? Math.abs(bottomY - y) : width * crossScale,
                height: barAlongX ? width * crossScale : Math.abs(bottomY - y),
            };

            const clipBBox = new BBox(rect.x, rect.y, rect.width, rect.height);

            const barRect = {
                x: barAlongX ? Math.min(bboxBottom, bboxHeight) : x + xOffset,
                y: barAlongX ? x + xOffset : Math.min(bboxBottom, bboxHeight),
                width: barAlongX ? Math.abs(bboxBottom - bboxHeight) : width * crossScale,
                height: barAlongX ? width * crossScale : Math.abs(bboxBottom - bboxHeight),
            };

            const lengthRatioMultiplier = this.shouldFlipXY() ? rect.height : rect.width;

            return {
                series: this,
                itemId: phantom ? createDatumId(yKey, phantom) : yKey,
                datum,
                datumIndex,
                valueIndex,
                cumulativeValue,
                phantom,
                xValue,
                yValue,
                yKey,
                xKey,
                capDefaults: {
                    lengthRatioMultiplier: lengthRatioMultiplier,
                    lengthMax: lengthRatioMultiplier,
                },
                x: barRect.x,
                y: barRect.y,
                width: barRect.width,
                height: barRect.height,
                midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
                opacity,
                topLeftCornerRadius: barAlongX !== isUpward,
                topRightCornerRadius: isUpward,
                bottomRightCornerRadius: barAlongX === isUpward,
                bottomLeftCornerRadius: !isUpward,
                clipBBox,
                crisp,
                label:
                    labelText != null
                        ? {
                              text: labelText,
                              ...adjustLabelPlacement({
                                  isUpward: isUpward,
                                  isVertical: !barAlongX,
                                  placement: label.placement,
                                  padding: label.padding,
                                  rect,
                              }),
                          }
                        : undefined,
                missing: yValue == null,
                focusable: !phantom,
            };
        };

        const phantomNodes = createSparseArray<BarNodeDatum>();
        const nodes = createSparseArray<BarNodeDatum>();
        const labels = createSparseArray<BarNodeDatum>();

        const handleDatum = (
            datumIndex: number,
            valueIndex: number,
            x: number,
            width: number,
            yStart: number,
            yEnd: number,
            yRange: number,
            opacity: number
        ) => {
            const xValue = xValues[datumIndex];
            if (xValue == null) return;

            const yRawValue = yRawValues[datumIndex];
            const yFilterValue = yFilterValues != null ? Number(yFilterValues[datumIndex]) : undefined;
            const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);

            if (!Number.isFinite(yEnd)) return;
            if (yFilterValue != null && !Number.isFinite(yFilterValue)) return;

            const labelText =
                yRawValue != null
                    ? this.getLabelText(this.properties.label, {
                          datum: rawData[datumIndex],
                          value: yFilterValue ?? yRawValue,
                          xKey,
                          yKey,
                          xName,
                          yName,
                          legendItemName,
                      })
                    : undefined;

            const inset = yFilterValue != null && yFilterValue > yRawValue;

            const nodeData = nodeDatum({
                datum: rawData[datumIndex],
                datumIndex,
                valueIndex,
                xValue,
                yValue: yFilterValue ?? yRawValue,
                cumulativeValue: yFilterValue ?? yEnd,
                phantom: false,
                currY: yFilterValue != null ? yStart + yFilterValue : yEnd,
                prevY: yStart,
                x,
                width,
                isPositive,
                yRange: Math.max(yStart + (yFilterValue ?? -Infinity), yRange),
                labelText,
                opacity,
                crossScale: inset ? 0.6 : undefined,
            });
            nodes.push(nodeData);
            labels.push(nodeData);

            if (yFilterValue != null) {
                const phantomNodeData = nodeDatum({
                    datum: rawData[datumIndex],
                    datumIndex,
                    valueIndex,
                    xValue,
                    yValue: yFilterValue,
                    cumulativeValue: yFilterValue,
                    phantom: true,
                    currY: yEnd,
                    prevY: yStart,
                    x,
                    width,
                    isPositive,
                    yRange,
                    labelText: undefined,
                    opacity,
                    crossScale: undefined,
                });
                phantomNodes.push(phantomNodeData);
            }
        };

        const [r0, r1] = xScale.range;
        const range = r1 - r0;
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (processedData.type === 'grouped') {
            const width = barWidth;

            const stacked = dataModel.hasColumnById(this, `yValue-start`);
            const yStartValues = stacked ? dataModel.resolveColumnById(this, `yValue-start`, processedData) : undefined;
            const yEndValues = stacked ? dataModel.resolveColumnById(this, `yValue-end`, processedData) : undefined;
            const yRangeIndex = stacked ? dataModel.resolveProcessedDataIndexById(this, `yValue-range`) : -1;

            for (const {
                datumIndex,
                valueIndex,
                group: { aggregation },
            } of dataModel.forEachGroupDatum(this, processedData)) {
                const x = xPosition(datumIndex);

                const yRawValue = yRawValues[datumIndex];
                const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);
                const yStart = stacked ? Number(yStartValues?.[datumIndex]) : 0;
                const yEnd = stacked ? Number(yEndValues?.[datumIndex]) : yRawValue;
                let yRange = yEnd;
                if (stacked) {
                    yRange = aggregation[yRangeIndex][isPositive ? 1 : 0];
                }

                handleDatum(datumIndex, valueIndex, x, width, yStart, yEnd, yRange, 1);
            }
        } else if (dataAggregationFilter == null) {
            const width = barWidth;
            let [start, end] = this.visibleRange('xValue', xAxis.range);
            // @todo(AG-13575) Remove this if block
            if (processedData.input.count < 1e3) {
                start = 0;
                end = processedData.input.count;
            }

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                const x = xPosition(datumIndex);
                const yEnd = Number(yRawValues[datumIndex]);

                handleDatum(datumIndex, 0, x, width, 0, yEnd, yEnd, 1);
            }
        } else {
            const { indexData, indices } = dataAggregationFilter;
            const [start, end] = this.visibleRange('xValue', xAxis.range, indices);

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * SPAN;
                const xMinIndex = indexData[aggIndex + X_MIN];
                const xMaxIndex = indexData[aggIndex + X_MAX];
                const yMinIndex = indexData[aggIndex + Y_MIN];
                const yMaxIndex = indexData[aggIndex + Y_MAX];

                if (xMinIndex === -1) continue;

                const x = xPosition(((xMinIndex + xMaxIndex) / 2) | 0);
                const width = Math.abs(xPosition(xMaxIndex) - xPosition(xMinIndex)) + barWidth;

                const yEndMax = xValues[yMaxIndex] != null ? Number(yRawValues[yMaxIndex]) : NaN;
                const yEndMin = xValues[yMinIndex] != null ? Number(yRawValues[yMinIndex]) : NaN;

                if (yEndMax > 0) {
                    const opacity = yEndMin >= 0 ? yEndMin / yEndMax : 1;
                    handleDatum(yMaxIndex, 0, x, width, 0, yEndMax, yEndMax, opacity);
                }

                if (yEndMin < 0) {
                    const opacity = yEndMax <= 0 ? yEndMax / yEndMin : 1;
                    handleDatum(yMinIndex, 1, x, width, 0, yEndMin, yEndMin, opacity);
                }
            }
        }

        return {
            itemId: yKey,
            nodeData: phantomNodes.length > 0 ? createSparseArray(phantomNodes, nodes) : nodes,
            labelData: labels,
            scales: this.calculateScaling(),
            visible: this.visible || animationEnabled,
            groupScale: this.getScaling(this.groupScale),
        };
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected override getHighlightData(
        nodeData: BarNodeDatum[],
        highlightedItem: BarNodeDatum
    ): BarNodeDatum[] | undefined {
        const highlightItem = nodeData.find(
            (nodeDatum) => nodeDatum.datum === highlightedItem.datum && !nodeDatum.phantom
        );
        return highlightItem != null ? [highlightItem] : undefined;
    }

    protected override updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<Rect, BarNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => this.getDatumId(datum));
    }

    private getItemBaseStyle(highlighted: boolean): Required<AgBarSeriesStyle> {
        const { properties } = this;
        const { cornerRadius } = properties;
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;

        return {
            fill: highlightStyle?.fill ?? properties.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
            stroke: highlightStyle?.stroke ?? properties.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
            strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
            lineDash: highlightStyle?.lineDash ?? properties.lineDash ?? [],
            lineDashOffset: highlightStyle?.lineDashOffset ?? properties.lineDashOffset,
            cornerRadius,
        };
    }

    private getItemStyleOverrides(
        datumId: string,
        datum: any,
        xValue: any,
        yValue: any,
        format: Required<AgBarSeriesStyle>,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;

        const { xKey, yKey, itemStyler } = properties;

        if (itemStyler == null) return;

        const { xDomain, yDomain } = this.cachedDatumCallback('domain', () => ({
            xDomain: this.getSeriesDomain(ChartAxisDirection.X),
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y),
        }));
        return this.cachedDatumCallback(createDatumId(datumId, highlighted ? 'highlight' : 'node'), () => {
            return itemStyler({
                seriesId,
                ...datumStylerProperties(datum, xKey, yKey, xDomain, yDomain),
                xValue,
                yValue,
                highlighted,
                ...format,
            });
        });
    }

    protected override updateDatumNodes(opts: { datumSelection: Selection<Rect, BarNodeDatum>; isHighlight: boolean }) {
        if (!this.properties.isValid()) {
            return;
        }

        const { shadow } = this.properties;

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const style = this.getItemBaseStyle(opts.isHighlight);

        opts.datumSelection.each((rect, datum) => {
            const overrides = this.getItemStyleOverrides(
                String(datum.datumIndex),
                datum.datum,
                datum.xValue,
                datum.yValue,
                style,
                opts.isHighlight
            );

            rect.opacity = datum.opacity ?? 0;

            applyShapeStyle(rect, style, overrides);

            const cornerRadius = overrides?.cornerRadius ?? style.cornerRadius;
            rect.topLeftCornerRadius = datum.topLeftCornerRadius ? cornerRadius : 0;
            rect.topRightCornerRadius = datum.topRightCornerRadius ? cornerRadius : 0;
            rect.bottomRightCornerRadius = datum.bottomRightCornerRadius ? cornerRadius : 0;
            rect.bottomLeftCornerRadius = datum.bottomLeftCornerRadius ? cornerRadius : 0;

            rect.visible = categoryAlongX
                ? (datum.clipBBox?.width ?? datum.width) > 0
                : (datum.clipBBox?.height ?? datum.height) > 0;

            rect.crisp = datum.crisp;
            rect.fillShadow = shadow;
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: BarNodeDatum[];
        labelSelection: Selection<Text, BarNodeDatum>;
    }) {
        const data = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(data, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, BarNodeDatum> }) {
        opts.labelSelection.each((textNode, datum) => {
            updateLabelNode(textNode, this.properties.label, datum.label);
        });
    }

    public override xValues(): any[] {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return [];
        return dataModel.resolveKeysById(this, `xValue`, processedData);
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { xKey, xName, yKey, yName, legendItemName, stackGroup, tooltip } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) {
            return;
        }

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue-raw`, processedData)[datumIndex];

        if (xValue == null) return;

        const format = this.getItemBaseStyle(false);
        Object.assign(format, this.getItemStyleOverrides(String(datumIndex), datum, xValue, yValue, format, false));

        return tooltip.formatTooltip(
            {
                heading: xAxis.formatDatum(xValue),
                symbol: this.legendItemSymbol(),
                data: [{ label: yName, fallbackLabel: yKey, value: yAxis.formatDatum(yValue) }],
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yKey,
                yName,
                legendItemName,
                stackGroup,
                ...format,
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.properties;

        return {
            marker: {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { showInLegend } = this.properties;

        if (legendType !== 'category' || !this.properties.isValid()) {
            return [];
        }

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { yKey: itemId, yName, legendItemName } = this.properties;
        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: { text: legendItemName ?? yName ?? itemId },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection, annotationSelections }: BarAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, 'normal'));

        fromToMotion(this.id, 'nodes', this.ctx.animationManager, [datumSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, ...annotationSelections);
    }

    override animateWaitingUpdateReady(data: BarAnimationData) {
        const { datumSelection, labelSelection, annotationSelections, previousContextData } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        let dataDiff = this.processedData?.reduced?.diff?.[this.id];
        // @todo(CRT-598) - this is required to get the correct status, but it was not safe enough to do this for all series
        if (dataDiff == null && this.processedData?.reduced?.diff != null) {
            dataDiff = {
                changed: true,
                added: new Set(Array.from(datumSelection, ({ datum }) => this.getDatumId(datum))),
                updated: new Set(),
                removed: new Set(),
                moved: new Set(),
            };
        }
        const mode = previousContextData == null ? 'fade' : 'normal';
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(this.isVertical(), this.axes, mode));

        fromToMotion(
            this.id,
            'nodes',
            this.ctx.animationManager,
            [datumSelection],
            fns,
            (_, datum) => this.getDatumId(datum),
            dataDiff
        );

        const scalingChanged =
            previousContextData != null &&
            (!areScalingEqual(data.contextData.scales.x, previousContextData.scales.x) ||
                !areScalingEqual(data.contextData.scales.y, previousContextData.scales.y) ||
                !areScalingEqual(
                    (data.contextData as BarSeriesNodeDataContext).groupScale,
                    (data.previousContextData as BarSeriesNodeDataContext).groupScale
                ));

        const hasMotion = (dataDiff?.changed ?? false) || scalingChanged;
        if (hasMotion) {
            seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
            seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, ...annotationSelections);
        }
    }

    private getDatumId(datum: BarNodeDatum) {
        return createDatumId(datum.xValue, datum.valueIndex, datum.phantom);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex }: PickFocusInputs): BBox | undefined {
        const datumBox = this.contextNodeData?.nodeData[datumIndex]?.clipBBox;
        return computeBarFocusBounds(this, datumBox);
    }
}
