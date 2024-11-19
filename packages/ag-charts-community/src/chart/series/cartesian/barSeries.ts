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
import { findMinMax } from '../../../util/number';
import { sanitizeHtml } from '../../../util/sanitize';
import { isFiniteNumber } from '../../../util/type-guards';
import type { RequireOptional } from '../../../util/types';
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
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { datumStylerProperties } from '../util';
import { AbstractBarSeries } from './abstractBarSeries';
import { BarSeriesProperties } from './barSeriesProperties';
import {
    type RectConfig,
    checkCrisp,
    collapsedStartingBarPosition,
    computeBarFocusBounds,
    getRectConfig,
    prepareBarAnimationFunctions,
    resetBarSelectionsFn,
    updateRect,
} from './barUtil';
import {
    type CartesianAnimationData,
    type CartesianSeriesNodeDatum,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { adjustLabelPlacement, updateLabelNode } from './labelUtil';

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
    readonly fill: string | undefined;
    readonly stroke: string | undefined;
    readonly opacity: number | undefined;
    readonly strokeWidth: number;
    readonly cornerRadius: number;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly clipBBox: BBox | undefined;
    readonly label?: BarNodeLabelDatum;
}

type BarAnimationData = CartesianAnimationData<Rect, BarNodeDatum>;

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
    indexes: BarSeriesAggregationIndexes;
}

export class BarSeries extends AbstractBarSeries<Rect, BarSeriesProperties, BarNodeDatum> {
    static readonly className = 'BarSeries';
    static readonly type = 'bar' as const;

    override properties = new BarSeriesProperties();

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

        const { seriesGrouping: { groupIndex = this.id } = {}, data } = this;
        const groupCount = this.seriesGrouping?.groupCount ?? 0;
        const stackCount = this.seriesGrouping?.stackCount ?? 0;
        const grouped = !this.properties.fastDataProcessing || groupCount > 1 || stackCount > 1;
        const { xKey, yKey, yFilterKey, normalizedTo } = this.properties;

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

        if (grouped) {
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
            props.push(normaliseGroupTo([stackGroupName, stackGroupTrailingName], Math.abs(normalizedTo), 'range'));
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

        const rawData = processedData.rawDataSources?.get(this.id) ?? processedData.rawData;
        if (rawData == null || rawData.length === 0) return [];

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);

        let yExtent =
            processedData.type === 'grouped'
                ? dataModel.getDomain(this, `yValue-end`, 'value', processedData)
                : dataModel.getDomain(this, `yValue-raw`, 'value', processedData);
        const yFilterExtent = this.crossFilteringEnabled()
            ? dataModel.getDomain(this, `yFilterValue`, 'value', processedData)
            : undefined;
        if (yFilterExtent != null) {
            yExtent = [Math.min(yExtent[0], yFilterExtent[0]), Math.max(yExtent[1], yFilterExtent[1])];
        }

        if (direction === this.getCategoryDirection()) {
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        } else if (this.getValueAxis() instanceof LogAxis) {
            return fixNumericExtent(yExtent);
        } else {
            const fixedYExtent = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])];
            return fixNumericExtent(fixedYExtent);
        }
    }

    protected aggregateData(
        _dataModel: DataModel<any, any, any>,
        _processedData: ProcessedData<any>
    ): BarSeriesDataAggregationFilter[] | undefined {
        return;
    }

    protected visibleRange(
        length: number,
        _x0: number,
        _x1: number,
        _xFor: (index: number) => number
    ): [number, number] {
        return [0, length];
    }

    createNodeData() {
        const { dataModel, processedData, groupScale, dataAggregationFilters } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis || !this.properties.isValid()) {
            return;
        }

        const rawData = processedData.rawDataSources?.get(this.id) ?? processedData.rawData;
        if (rawData == null || rawData.length === 0) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, cornerRadius, legendItemName, label } =
            this.properties;

        const yReversed = yAxis.isReversed();

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const groupOffset = groupScale.convert(String(groupIndex));
        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yRawValues = dataModel.resolveColumnById(this, `yValue-raw`, processedData);
        const yFilterValues = this.crossFilteringEnabled()
            ? dataModel.resolveColumnById(this, `yFilterValue`, processedData)
            : undefined;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const nodeDatum = ({
            datum,
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

            const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

            const bboxHeight = yScale.convert(yRange);
            const bboxBottom = yScale.convert(0);

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
                fill,
                stroke,
                opacity,
                strokeWidth,
                cornerRadius,
                topLeftCornerRadius: barAlongX !== isUpward,
                topRightCornerRadius: isUpward,
                bottomRightCornerRadius: barAlongX === isUpward,
                bottomLeftCornerRadius: !isUpward,
                clipBBox,
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

        const phantomNodes: BarNodeDatum[] = [];
        const nodes: BarNodeDatum[] = [];
        const labels: BarNodeDatum[] = [];

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

        const [x0, x1] = findMinMax(xAxis.range);
        const xFor = (index: number): number => {
            const xValue = xValues[index];
            return xScale.convert(xValue) + groupOffset + barOffset;
        };

        const [r0, r1] = xScale.range;
        const range = r1 - r0;
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (processedData.type === 'grouped') {
            const width = barWidth;

            const yStartValues = dataModel.resolveColumnById(this, `yValue-start`, processedData);
            const yEndValues = dataModel.resolveColumnById(this, `yValue-end`, processedData);
            const yRangeIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-range`);

            processedData.groups.forEach(({ datumIndices, aggregation }) => {
                const yRanges = aggregation[yRangeIndex];

                datumIndices.forEach((datumIndex, valueIndex) => {
                    const x = xFor(datumIndex);

                    const yRawValue = yRawValues[datumIndex];
                    const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);
                    const yStart = Number(yStartValues[datumIndex]);
                    const yEnd = Number(yEndValues[datumIndex]);
                    const yRange = yRanges[isPositive ? 1 : 0];

                    handleDatum(datumIndex, valueIndex, x, width, yStart, yEnd, yRange, 1);
                });
            });
        } else if (dataAggregationFilter == null) {
            const width = barWidth;
            const [start, end] = this.visibleRange(rawData.length, x0, x1, xFor);

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                const x = xFor(datumIndex);
                const yEnd = Number(yRawValues[datumIndex]);

                handleDatum(datumIndex, 0, x, width, 0, yEnd, yEnd, 1);
            }
        } else {
            const { maxRange, indexData } = dataAggregationFilter;

            const [start, end] = this.visibleRange(maxRange, x0, x1, (index) => {
                const aggIndex = index * SPAN;
                const xMinIndex = indexData[aggIndex + X_MIN];
                const xMaxIndex = indexData[aggIndex + X_MAX];
                const midDatumIndex = ((xMinIndex + xMaxIndex) / 2) | 0;
                return xMinIndex !== -1 ? xFor(midDatumIndex) : NaN;
            });

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * SPAN;
                const xMinIndex = indexData[aggIndex + X_MIN];
                const xMaxIndex = indexData[aggIndex + X_MAX];
                const yMinIndex = indexData[aggIndex + Y_MIN];
                const yMaxIndex = indexData[aggIndex + Y_MAX];

                if (xMinIndex === -1) continue;

                const x = xFor(((xMinIndex + xMaxIndex) / 2) | 0);
                const width = Math.abs(xFor(xMaxIndex) - xFor(xMinIndex)) + barWidth;

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
            nodeData: phantomNodes.length > 0 ? [...phantomNodes, ...nodes] : nodes,
            labelData: labels,
            scales: this.calculateScaling(),
            visible: this.visible || animationEnabled,
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

    protected override updateDatumNodes(opts: { datumSelection: Selection<Rect, BarNodeDatum>; isHighlight: boolean }) {
        if (!this.properties.isValid()) {
            return;
        }

        const {
            xKey,
            yKey,
            stackGroup,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            itemStyler,
            shadow,
            highlightStyle: { item: itemHighlightStyle },
        } = this.properties;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp =
            this.properties.crisp ??
            checkCrisp(xAxis?.scale, xAxis?.visibleRange, this.smallestDataInterval, this.largestDataInterval);
        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        const style: RectConfig = {
            fill,
            stroke,
            lineDash,
            lineDashOffset,
            fillShadow: shadow,
            strokeWidth: this.getStrokeWidth(strokeWidth),
            fillOpacity: 0,
            strokeOpacity: 0,
        };
        const xDomain = this.getSeriesDomain(ChartAxisDirection.X);
        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
        opts.datumSelection.each((rect, datum) => {
            const rectParams = {
                ctx: this.ctx,
                seriesId: this.id,
                isHighlighted: opts.isHighlight,
                highlightStyle: itemHighlightStyle,
                style,
                itemStyler,
                stackGroup,
                ...datumStylerProperties(datum, xKey, yKey, xDomain, yDomain),
            };

            style.fillOpacity = fillOpacity * (datum.phantom ? 0.2 : 1);
            style.strokeOpacity = strokeOpacity * (datum.phantom ? 0.2 : 1);
            style.cornerRadius = datum.cornerRadius;
            style.topLeftCornerRadius = datum.topLeftCornerRadius;
            style.topRightCornerRadius = datum.topRightCornerRadius;
            style.bottomRightCornerRadius = datum.bottomRightCornerRadius;
            style.bottomLeftCornerRadius = datum.bottomLeftCornerRadius;
            const visible = categoryAlongX
                ? (datum.clipBBox?.width ?? datum.width) > 0
                : (datum.clipBBox?.height ?? datum.height) > 0;

            const config = getRectConfig(this, this.getDatumId(datum), rectParams);
            config.crisp = crisp;
            config.visible = visible;
            updateRect(rect, config);
        });
    }

    protected updateLabelSelection(opts: { labelData: BarNodeDatum[]; labelSelection: Selection<Text, BarNodeDatum> }) {
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

    getTooltipHtml(nodeDatum: BarNodeDatum): TooltipContent {
        const { id: seriesId, processedData } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!processedData || !this.properties.isValid() || !xAxis || !yAxis) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { xKey, yKey, xName, yName, fill, stroke, strokeWidth, tooltip, itemStyler, stackGroup, legendItemName } =
            this.properties;
        const { xValue, yValue, datum, itemId } = nodeDatum;

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        let format: AgBarSeriesStyle | undefined;

        if (itemStyler) {
            const xDomain = this.getSeriesDomain(ChartAxisDirection.X);
            const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
            format = this.cachedDatumCallback(createDatumId(this.getDatumId(datum), 'tooltip'), () =>
                itemStyler({
                    seriesId,
                    ...datumStylerProperties(nodeDatum, xKey, yKey, xDomain, yDomain),
                    stackGroup,
                    fill,
                    stroke,
                    strokeWidth: this.getStrokeWidth(strokeWidth),
                    highlighted: false,
                    cornerRadius: this.properties.cornerRadius,
                    fillOpacity: this.properties.fillOpacity,
                    strokeOpacity: this.properties.strokeOpacity,
                    lineDash: this.properties.lineDash ?? [],
                    lineDashOffset: this.properties.lineDashOffset,
                })
            );
        }

        const color = format?.fill ?? fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                itemId,
                datum,
                xKey,
                yKey,
                xName,
                yName,
                stackGroup,
                title,
                color,
                legendItemName,
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
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

        const {
            yKey: itemId,
            yName,
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
            strokeOpacity,
            legendItemName,
        } = this.properties;
        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: { text: legendItemName ?? yName ?? itemId },
                symbols: [{ marker: { fill, fillOpacity, stroke, strokeWidth, strokeOpacity } }],
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

        const dataDiff = this.processedData?.reduced?.diff;
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

        const hasMotion = dataDiff?.changed ?? true;
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

    protected computeFocusBounds({ datumIndex, seriesRect }: PickFocusInputs): BBox | undefined {
        const datumBox = this.contextNodeData?.nodeData[datumIndex].clipBBox;
        return computeBarFocusBounds(datumBox, this.contentGroup, seriesRect);
    }
}
