import type { CallbackParamRules, Point, RequireOptional } from 'ag-charts-core';
import { isFiniteNumber, mergeDefaults, simpleMemorize2 } from 'ag-charts-core';
import type {
    AgBarSeriesItemStylerParams,
    AgBarSeriesLabelFormatterParams,
    AgBarSeriesOptions,
    AgBarSeriesStyle,
    AgBarSeriesStylerParams,
    AgErrorBoundSeriesTooltipRendererParams,
    TextOrSegments,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { BandScale } from '../../../scale/bandScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { BarShape } from '../../../scene/shape/barShape';
import type { Segment } from '../../../scene/shape/segmentedPath';
import type { Text } from '../../../scene/shape/text';
import { LogAxis } from '../../axis/logAxis';
import { NumberAxis } from '../../axis/numberAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { DataModel, type ProcessedData, fixNumericExtent } from '../../data/dataModel';
import type { PropertyDefinition } from '../../data/dataModelTypes';
import {
    LARGEST_KEY_INTERVAL,
    SMALLEST_KEY_INTERVAL,
    animationValidation,
    createDatumId,
    diff,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    processedDataIsAnimatable,
    valueProperty,
} from '../../data/processors';
import { adjustLabelPlacement, updateLabelNode } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { type TooltipContent, isTooltipValueMissing } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode, type SeriesNodeStyleContext } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { HighlightState, toHighlightString } from '../seriesProperties';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { applyShapeStyle } from '../shapeUtil';
import { datumStylerProperties, getItemStyles, visibleRangeIndices } from '../util';
import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
} from './../aggregation';
import {
    AbstractBarSeries,
    type AbstractBarSeriesAnimationData,
    type AbstractBarSeriesNodeDataContext,
} from './abstractBarSeries';
import { type BarSeriesDataAggregationFilter, aggregateBarData } from './barAggregation';
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
    type CartesianSeriesNodeDatum,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { calculateDataDiff } from './diffUtil';
import { areScalingEqual } from './scaling';
import { calculateSegments } from './util';

interface BarNodeLabelDatum extends Readonly<Point> {
    readonly text: TextOrSegments;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
}

interface BarNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum, Readonly<Point> {
    readonly itemId: string;
    readonly xValue: string | number;
    readonly yValue: string | number;
    readonly cumulativeValue: number;
    readonly phantom: boolean;
    readonly width: number;
    readonly height: number;
    readonly opacity: number | undefined;
    readonly topLeftCornerRadius: boolean;
    readonly topRightCornerRadius: boolean;
    readonly bottomRightCornerRadius: boolean;
    readonly bottomLeftCornerRadius: boolean;
    readonly featherRatio: number;
    readonly clipBBox: BBox | undefined;
    readonly crisp: boolean;
    readonly label?: BarNodeLabelDatum;
    style?: Required<AgBarSeriesStyle>;
}

interface BarSeriesNodeDataContext extends AbstractBarSeriesNodeDataContext<BarNodeDatum> {
    phantomNodeData: BarNodeDatum[];
    styles: SeriesNodeStyleContext<AgBarSeriesStyle>;
    segments?: Segment[];
}

type BarAnimationData = AbstractBarSeriesAnimationData<BarShape<BarNodeDatum>, BarNodeDatum>;

const memoizedAggregateBarData = simpleMemorize2(aggregateBarData);

export class BarSeries extends AbstractBarSeries<
    BarShape<BarNodeDatum>,
    AgBarSeriesOptions,
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

    protected phantomGroup = this.contentGroup.appendChild(new Group({ name: 'phantom', zIndex: -1 }));
    private phantomSelection: Selection<BarShape, BarNodeDatum> = Selection.select(
        this.phantomGroup,
        () => this.nodeFactory(),
        false
    );

    readonly phantomHighlightGroup = this.highlightGroup.appendChild(
        new Group({ name: `${this.internalId}-highlight-node` })
    );
    private phantomHighlightSelection: Selection<BarShape, BarNodeDatum> = Selection.select(
        this.phantomHighlightGroup,
        () => this.nodeFactory(),
        false
    );

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: 'xValue',
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED, // Only used in sparklineMode
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: [],
            datumSelectionGarbageCollection: false,
            animationAlwaysUpdateSelections: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });

        this.phantomGroup.opacity = 0.2;
        this.phantomHighlightGroup.opacity = 0.2;
    }

    private crossFilteringEnabled() {
        return (
            this.properties.yFilterKey != null && (this.seriesGrouping == null || this.seriesGrouping.stackIndex === 0)
        );
    }

    override async processData(dataController: DataController) {
        if (!this.data) return;

        const { xKey, yKey, yFilterKey, normalizedTo } = this.properties;
        const { seriesGrouping: { groupIndex = this.id } = {}, data } = this;
        const stackCount = this.seriesGrouping?.stackCount ?? 0;
        const stacked = stackCount > 1 || normalizedTo != null;
        const grouped = stacked;

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

    private yCumulativeKey(dataModel: DataModel<any, any>) {
        return dataModel.hasColumnById(this, `yValue-end`) ? 'yValue-end' : 'yValue-raw';
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

        const yKey = this.yCumulativeKey(dataModel);
        let yExtent = this.domainForClippedRange(direction, [yKey], 'xValue');
        const yFilterExtent = this.crossFilteringEnabled()
            ? dataModel.getDomain(this, `yFilterValue`, 'value', processedData)
            : undefined;
        if (yFilterExtent != null) {
            yExtent = [Math.min(yExtent[0], yFilterExtent[0]), Math.max(yExtent[1], yFilterExtent[1])];
        }

        const yAxis = this.getValueAxis();
        if (yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
            const fixedYExtent = Number.isFinite(yExtent[1] - yExtent[0])
                ? [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])]
                : [];
            return fixNumericExtent(fixedYExtent);
        } else {
            return fixNumericExtent(yExtent);
        }
    }

    override getSeriesRange(direction: ChartAxisDirection, visibleRange: [any, any]): [number, number] | [] {
        const selfDirection = this.properties.direction === 'horizontal' ? ChartAxisDirection.X : ChartAxisDirection.Y;
        if (selfDirection !== direction) return [];
        const yKey = this.yCumulativeKey(this.dataModel!);
        const [y0, y1] = this.domainForVisibleRange(ChartAxisDirection.Y, [yKey], 'xValue', visibleRange);
        return [Math.min(y0, 0), Math.max(y1, 0)];
    }

    override getZoomRangeFittingItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined {
        const yKey = this.yCumulativeKey(this.dataModel!);
        return this.zoomFittingVisibleItems('xValue', [yKey], xVisibleRange, yVisibleRange, minVisibleItems);
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        const yKey = this.yCumulativeKey(this.dataModel!);
        return this.countVisibleItems('xValue', [yKey], xVisibleRange, yVisibleRange, minVisibleItems);
    }

    private aggregateData(dataModel: DataModel<any, any, any>, processedData: ProcessedData<any>) {
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);

        const isStacked = dataModel.hasColumnById(this, `yValue-start`);
        const yStartValues = isStacked ? dataModel.resolveColumnById(this, `yValue-start`, processedData) : undefined;
        const yEndValues = isStacked
            ? dataModel.resolveColumnById(this, `yValue-end`, processedData)
            : dataModel.resolveColumnById(this, `yValue-raw`, processedData);

        const { index } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const domain = processedData.domain.keys[index];

        const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this, `xValue`, processedData);
        const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(
            this,
            isStacked ? `yValue-end` : `yValue-raw`,
            processedData
        );

        return memoizedAggregateBarData(
            xAxis.scale.type,
            xValues,
            yStartValues,
            yEndValues,
            domain,
            processedData.reduced?.smallestKeyInterval,
            xNeedsValueOf,
            yNeedsValueOf
        );
    }

    createNodeData() {
        const { dataModel, processedData, groupScale, dataAggregationFilters } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const rawData = processedData.dataSources?.get(this.id);
        if (rawData == null) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { xKey, yKey, xName, yName, legendItemName, label } = this.properties;

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
        const yReversed = yAxis.isReversed();

        const { barWidth, groupIndex: groupScaleIndex } = this.updateGroupScale(xAxis);
        const groupOffset = groupScale.convert(String(groupScaleIndex));
        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;

        const isStacked = dataModel.hasColumnById(this, `yValue-start`);
        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yRawValues = dataModel.resolveColumnById(this, `yValue-raw`, processedData);
        const yStartValues = isStacked ? dataModel.resolveColumnById(this, `yValue-start`, processedData) : undefined;
        const yEndValues = isStacked ? dataModel.resolveColumnById(this, `yValue-end`, processedData) : undefined;
        const yFilterValues = this.crossFilteringEnabled()
            ? dataModel.resolveColumnById(this, `yFilterValue`, processedData)
            : undefined;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xPosition = (index: number): number => xScale.convert(xValues[index]) + groupOffset + barOffset;

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        const crisp =
            dataAggregationFilter == null &&
            (this.properties.crisp ??
                checkCrisp(xAxis?.scale, xAxis?.visibleRange, this.smallestDataInterval, this.largestDataInterval));

        const bboxBottom = yScale.convert(0);
        const nodeDatum = ({
            datum,
            datumIndex,
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
            featherRatio,
            crossScale = 1,
        }: {
            datum: any;
            datumIndex: number;
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
            labelText: TextOrSegments | undefined;
            opacity: number;
            featherRatio: number;
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

            const spacing: number = label.spacing + (typeof label.padding === 'number' ? label.padding : 0);
            return {
                series: this,
                itemId: phantom ? createDatumId(yKey, phantom) : yKey,
                datum,
                datumIndex,
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
                featherRatio,
                topLeftCornerRadius: barAlongX !== isUpward,
                topRightCornerRadius: isUpward,
                bottomRightCornerRadius: barAlongX === isUpward,
                bottomLeftCornerRadius: !isUpward,
                clipBBox,
                crisp,
                label:
                    labelText == null
                        ? undefined
                        : {
                              text: labelText,
                              ...adjustLabelPlacement({
                                  isUpward: isUpward,
                                  isVertical: !barAlongX,
                                  placement: label.placement,
                                  spacing,
                                  rect,
                              }),
                          },
                missing: isTooltipValueMissing(yValue),
                focusable: !phantom,
            };
        };

        const phantomNodes: BarNodeDatum[] = [];
        const nodes: BarNodeDatum[] = [];
        const labels: BarNodeDatum[] = [];

        const handleDatum = (
            datumIndex: number,
            x: number,
            width: number,
            yStart: number,
            yEnd: number,
            yRange: number,
            featherRatio = 0,
            opacity = 1
        ) => {
            const xValue = xValues[datumIndex];
            if (xValue == null) return;

            const datum = rawData.data[datumIndex];

            const yRawValue = yRawValues[datumIndex];
            const yFilterValue = yFilterValues == null ? undefined : Number(yFilterValues[datumIndex]);
            const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);

            if (!Number.isFinite(yEnd)) return;
            if (yFilterValue != null && !Number.isFinite(yFilterValue)) return;

            const labelText =
                label.enabled && yRawValue != null
                    ? this.getLabelText<AgBarSeriesLabelFormatterParams>(
                          yFilterValue ?? yRawValue,
                          datum,
                          yKey,
                          'y',
                          yDomain,
                          label,
                          { datum, value: yFilterValue ?? yRawValue, xKey, yKey, xName, yName, legendItemName }
                      )
                    : undefined;

            const inset = yFilterValue != null && yFilterValue > yRawValue;

            const nodeData = nodeDatum({
                datum,
                datumIndex,
                xValue,
                yValue: yFilterValue ?? yRawValue,
                cumulativeValue: yFilterValue ?? yEnd,
                phantom: false,
                currY: yFilterValue == null ? yEnd : yStart + yFilterValue,
                prevY: yStart,
                x,
                width,
                isPositive,
                yRange: Math.max(yStart + (yFilterValue ?? -Infinity), yRange),
                labelText,
                opacity,
                featherRatio,
                crossScale: inset ? 0.6 : undefined,
            });
            nodes.push(nodeData);
            labels.push(nodeData);

            if (yFilterValue != null) {
                const phantomNodeData = nodeDatum({
                    datum: rawData.data[datumIndex],
                    datumIndex,
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
                    featherRatio,
                    crossScale: undefined,
                });
                phantomNodes.push(phantomNodeData);
            }
        };

        if (dataAggregationFilter != null) {
            const { positiveIndices, positiveIndexData, negativeIndices, negativeIndexData } = dataAggregationFilter;
            const sign = yReversed ? -1 : 1;

            for (let p = 0; p < 2; p += 1) {
                const positive = p === 0;
                const indices = positive ? positiveIndices : negativeIndices;
                const indexData = positive ? positiveIndexData : negativeIndexData;

                const Y_MIN = positive ? AGGREGATION_INDEX_Y_MIN : AGGREGATION_INDEX_Y_MAX;
                const Y_MAX = positive ? AGGREGATION_INDEX_Y_MAX : AGGREGATION_INDEX_Y_MIN;

                const [start, end] = this.visibleRangeIndices('xValue', xAxis.range, indices);

                for (let i = start; i < end; i += 1) {
                    const aggIndex = i * AGGREGATION_SPAN;
                    const xMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
                    const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
                    const yMinIndex = indexData[aggIndex + Y_MIN];
                    const yMaxIndex = indexData[aggIndex + Y_MAX];

                    if (xMinIndex === -1) continue;
                    if (xValues[yMaxIndex] == null || xValues[yMinIndex] == null) continue;

                    const x = xPosition(Math.trunc((xMinIndex + xMaxIndex) / 2));
                    // The width of the shape is the width from the left of the first bar to the right of the second bar
                    const width = Math.abs(xPosition(xMaxIndex) - xPosition(xMinIndex)) + barWidth;

                    // start & end may be incorrect when there's a lot of missing data
                    if (x - width < 0 || x > range) continue;

                    const bandCount = Math.abs(xMaxIndex - xMinIndex) + 1;
                    // This means the density of the fill is higher than it would be if we drew the bars individually.
                    // Adjust the opacity to account for this
                    const opacity = BandScale.is(xScale)
                        ? Math.min((xScale.bandwidth * Math.max(bandCount - 1, 1)) / (xScale.step * bandCount), 1)
                        : 1;

                    let yStart: number;
                    let yEnd: number;
                    let featherRatio = 0;
                    if (isStacked) {
                        yStart = Number(yStartValues![yMinIndex]);
                        yEnd = Number(yEndValues![yMaxIndex]);
                    } else {
                        const yEndMax = Number(yRawValues[yMaxIndex]);
                        const yEndMin = Number(yRawValues[yMinIndex]);

                        yStart = 0;
                        yEnd = yEndMax;

                        featherRatio = (positive ? 1 : -1) * sign * (1 - yEndMin / yEndMax);
                    }

                    handleDatum(yMaxIndex, x, width, yStart, yEnd, yEnd, featherRatio, opacity);
                }
            }
        } else if (processedData.type === 'grouped') {
            const invalidData = processedData.invalidData?.get(this.id);
            const width = barWidth;
            const yRangeIndex = isStacked ? dataModel.resolveProcessedDataIndexById(this, `yValue-range`) : -1;
            const columnIndex = processedData.columnScopes.findIndex((s) => s.has(this.id));
            const { groups } = processedData;

            const [start, end] = visibleRangeIndices(1, groups.length, xAxis.range, (groupIndex) => {
                const group = groups[groupIndex];
                const xValue = group.keys[0];
                return this.xCoordinateRange(xValue);
            });

            for (let groupIndex = start; groupIndex < end; groupIndex += 1) {
                const group = groups[groupIndex];
                const { aggregation } = group;

                const datumIndices = group.datumIndices[columnIndex];
                if (datumIndices == null) continue;

                for (const relativeDatumIndex of datumIndices) {
                    const datumIndex = groupIndex + relativeDatumIndex;
                    const x = xPosition(datumIndex);
                    if (invalidData?.[datumIndex] === true) continue;

                    const yRawValue = yRawValues[datumIndex];
                    if (yRawValue == null) continue;
                    const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);
                    const yStart = isStacked ? Number(yStartValues?.[datumIndex]) : 0;
                    const yEnd = isStacked ? Number(yEndValues?.[datumIndex]) : yRawValue;
                    let yRange = yEnd;
                    if (isStacked) {
                        yRange = aggregation[yRangeIndex][isPositive ? 1 : 0];
                    }

                    handleDatum(datumIndex, x, width, yStart, yEnd, yRange);
                }
            }
        } else {
            const invalidData = processedData.invalidData?.get(this.id);
            const width = barWidth;
            let [start, end] = this.visibleRangeIndices('xValue', xAxis.range);
            // @todo(AG-13575) Remove this if block
            if (processedData.input.count < 1e3) {
                start = 0;
                end = processedData.input.count;
            }

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                if (invalidData?.[datumIndex] === true) continue;

                const yRawValue = yRawValues[datumIndex];
                if (yRawValue == null) continue;

                const x = xPosition(datumIndex);
                const yEnd = Number(yRawValue);

                handleDatum(datumIndex, x, width, 0, yEnd, yEnd);
            }
        }

        const segments = calculateSegments(
            this.properties.segmentation,
            xAxis,
            yAxis,
            this.chart!.seriesRect!,
            this.ctx.scene
        );

        return {
            itemId: yKey,
            nodeData: nodes,
            phantomNodeData: phantomNodes,
            labelData: labels,
            scales: this.calculateScaling(),
            visible: this.visible || animationEnabled,
            groupScale: this.getScaling(this.groupScale),
            styles: getItemStyles(this.getItemStyle.bind(this)),
            segments,
        };
    }

    protected nodeFactory() {
        return new BarShape();
    }

    protected override updateSeriesSelections() {
        super.updateSeriesSelections();

        this.phantomSelection = this.updateDatumSelection({
            nodeData: this.contextNodeData?.phantomNodeData ?? [],
            datumSelection: this.phantomSelection,
        });
    }

    protected override updateHighlightSelectionItem(opts: {
        items?: BarNodeDatum[];
        highlightSelection: Selection<BarShape<BarNodeDatum>, BarNodeDatum>;
    }) {
        const out = super.updateHighlightSelectionItem(opts);

        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const seriesHighlighted = this.isSeriesHighlighted(highlightedDatum);
        const item = seriesHighlighted && highlightedDatum?.datum ? (highlightedDatum as BarNodeDatum) : undefined;

        this.phantomHighlightSelection = this.updateDatumSelection({
            nodeData: item ? this.getHighlightData(this.contextNodeData?.phantomNodeData ?? [], item) ?? [] : [],
            datumSelection: this.phantomHighlightSelection,
        });

        return out;
    }

    protected override updateNodes(itemHighlighted: boolean, nodeRefresh: boolean) {
        super.updateNodes(itemHighlighted, nodeRefresh);

        this.updateDatumNodes({
            datumSelection: this.phantomSelection,
            isHighlight: false,
            drawingMode: 'overlay',
        });
        this.updateDatumNodes({
            datumSelection: this.phantomHighlightSelection,
            isHighlight: true,
            drawingMode: 'overlay',
        });
    }

    protected override getHighlightData(
        nodeData: BarNodeDatum[],
        highlightedItem: BarNodeDatum
    ): BarNodeDatum[] | undefined {
        const highlightItem = nodeData.find((nodeDatum) => nodeDatum.datum === highlightedItem.datum);
        return highlightItem == null ? undefined : [{ ...highlightItem }];
    }

    protected override updateDatumSelection(opts: {
        nodeData: BarNodeDatum[];
        datumSelection: Selection<BarShape, BarNodeDatum>;
    }) {
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        if (!animationEnabled) {
            // Optimised update path, no need to ensure we match up nodes by id.
            return opts.datumSelection.update(opts.nodeData);
        }
        return opts.datumSelection.update(opts.nodeData, undefined, this.getDatumId.bind(this));
    }

    private makeStylerParams(highlightStateEnum?: HighlightState): AgBarSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const {
            cornerRadius,
            fill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            stackGroup,
            stroke,
            strokeOpacity,
            strokeWidth,
            xKey,
            yKey,
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
            stackGroup,
            stroke,
            strokeOpacity,
            strokeWidth,
            xKey,
            yKey,
        } satisfies CallbackParamRules<AgBarSeriesStylerParams<unknown, unknown>>;
    }

    private makeItemStylerParams(
        dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        xValue: string,
        isHighlight: boolean,
        style: Required<AgBarSeriesStyle>
    ): AgBarSeriesItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { xKey, yKey, stackGroup } = this.properties;

        const datum = processedData.dataSources.get(seriesId)?.data?.[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue-raw`, processedData)[datumIndex];
        const xDomain = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yDomain = dataModel.getDomain(this, this.yCumulativeKey(dataModel), 'value', processedData);

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            ...datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
            datum,
            xValue,
            yValue,
            stackGroup,
            highlightState: highlightStateString,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgBarSeriesItemStylerParams<unknown, unknown>>;
    }

    private getStyle(
        ignoreStylerCallback: boolean,
        highlightState?: HighlightState
    ): Required<AgBarSeriesStyle> & { opacity: number } {
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
        let stylerResult: AgBarSeriesStyle = {};
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

    private getItemStyle(
        datumIndex: number | undefined,
        isHighlight: boolean,
        highlightState?: HighlightState
    ): Required<AgBarSeriesStyle> {
        const { properties, dataModel, processedData } = this;
        const { itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        let style = mergeDefaults(highlightStyle, this.getStyle(datumIndex === undefined, highlightState));

        if (itemStyler && dataModel != null && processedData != null && datumIndex != null) {
            const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];

            const overrides = this.cachedDatumCallback(
                createDatumId(this.getDatumId({ xValue, phantom: false }), isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(
                        dataModel,
                        processedData,
                        datumIndex,
                        xValue,
                        isHighlight,
                        style
                    );
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    protected override updateDatumStyles(opts: {
        datumSelection: Selection<BarShape, BarNodeDatum>;
        isHighlight: boolean;
    }) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        const series = this;

        function applyDatumStyle(node: BarShape, datum: BarNodeDatum): void {
            if (!opts.datumSelection.isGarbage(node)) {
                const highlightState = series.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex);
                datum.style = series.getItemStyle(datum.datumIndex, opts.isHighlight, highlightState);
            }
        }

        opts.datumSelection.each(applyDatumStyle);
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<BarShape, BarNodeDatum>;
        isHighlight: boolean;
        drawingMode: 'cutout' | 'overlay';
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const { shadow } = this.properties;
        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
        const fillBBox = this.getShapeFillBBox();

        const direction = this.getBarDirection();

        const series = this;
        const contextStyles = contextNodeData.styles;

        function updateDatumNode(rect: BarShape, datum: BarNodeDatum): void {
            const style =
                datum.style ??
                contextStyles[series.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex)];

            applyShapeStyle(rect, style, fillBBox);

            rect.drawingMode = opts.drawingMode;

            const cornerRadius = style.cornerRadius ?? 0;
            rect.topLeftCornerRadius = datum.topLeftCornerRadius ? cornerRadius : 0;
            rect.topRightCornerRadius = datum.topRightCornerRadius ? cornerRadius : 0;
            rect.bottomRightCornerRadius = datum.bottomRightCornerRadius ? cornerRadius : 0;
            rect.bottomLeftCornerRadius = datum.bottomLeftCornerRadius ? cornerRadius : 0;

            rect.visible = categoryAlongX
                ? (datum.clipBBox?.width ?? datum.width) > 0
                : (datum.clipBBox?.height ?? datum.height) > 0;

            rect.direction = direction;
            rect.featherRatio = datum.featherRatio;

            rect.crisp = datum.crisp;
            rect.fillShadow = shadow;
        }

        opts.datumSelection.each(updateDatumNode);
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

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, BarNodeDatum>; isHighlight?: boolean }) {
        const { isHighlight = false } = opts;
        const params: RequireOptional<AgBarSeriesLabelFormatterParams> = {
            xKey: this.properties.xKey,
            xName: this.properties.xName ?? this.properties.xKey,
            yKey: this.properties.yKey,
            yName: this.properties.yName ?? this.properties.yKey,
            legendItemName: this.properties.legendItemName ?? this.properties.xName ?? this.properties.xKey,
        };
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        opts.labelSelection.each((textNode, datum) => {
            textNode.fillOpacity = this.getHighlightStyle(isHighlight, datum?.datumIndex).opacity ?? 1;
            updateLabelNode(this, textNode, params, this.properties.label, datum.label, isHighlight, activeHighlight);
        });
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { xKey, xName, yKey, yName, legendItemName, stackGroup, tooltip } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue-raw`, processedData)[datumIndex];

        if (xValue == null) return;
        const format = this.getItemStyle(datumIndex, false);

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                symbol: this.legendItemSymbol(),
                data: [
                    {
                        label: yName,
                        fallbackLabel: yKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, legendItemName),
                        missing: isTooltipValueMissing(yValue),
                    },
                ],
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
        const { fill, stroke, strokeWidth, fillOpacity, strokeOpacity, lineDash, lineDashOffset } = this.getStyle(
            false,
            HighlightState.None
        );

        return {
            marker: {
                fill: fill ?? 'rgba(0, 0, 0, 0)',
                stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
            },
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { showInLegend } = this.properties;

        if (legendType !== 'category') {
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

    protected override resetDatumAnimation(
        data: CartesianAnimationData<BarShape<BarNodeDatum>, BarNodeDatum, BarNodeDatum, BarSeriesNodeDataContext>
    ) {
        super.resetDatumAnimation(data);

        resetMotion([this.phantomSelection], resetBarSelectionsFn);
    }

    override animateReadyHighlight(data: Selection<BarShape<BarNodeDatum>, BarNodeDatum>) {
        super.animateReadyHighlight(data);

        resetMotion([this.phantomHighlightSelection], resetBarSelectionsFn);
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection, annotationSelections }: BarAnimationData) {
        const { phantomSelection } = this;

        const fns = prepareBarAnimationFunctions(
            collapsedStartingBarPosition(this.isVertical(), this.axes, 'normal'),
            'unknown'
        );

        fromToMotion(this.id, 'nodes', this.ctx.animationManager, [datumSelection, phantomSelection], fns);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, ...annotationSelections);
    }

    override animateWaitingUpdateReady(data: BarAnimationData) {
        const { phantomSelection } = this;
        const { datumSelection, labelSelection, annotationSelections, contextData, previousContextData } = data;

        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        const dataDiff = calculateDataDiff(
            this.id,
            datumSelection,
            this.getDatumId.bind(this),
            data.contextData,
            previousContextData,
            this.processedData,
            this.processedDataUpdated
        );

        const mode = previousContextData == null ? 'fade' : 'normal';
        const fns = prepareBarAnimationFunctions(
            collapsedStartingBarPosition(this.isVertical(), this.axes, mode),
            'added'
        );

        fromToMotion(
            this.id,
            'nodes',
            this.ctx.animationManager,
            [datumSelection, phantomSelection],
            fns,
            (_, datum) => this.getDatumId(datum),
            dataDiff
        );

        if (
            !dataDiff ||
            dataDiff?.changed ||
            !areScalingEqual(contextData.groupScale, previousContextData?.groupScale)
        ) {
            seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
            seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, ...annotationSelections);
        }
    }

    private getDatumId(datum: Pick<BarNodeDatum, 'xValue' | 'phantom'>) {
        return createDatumId(datum.xValue, datum.phantom);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex }: PickFocusInputs): BBox | undefined {
        const datumBox = this.contextNodeData?.nodeData[datumIndex].clipBBox;
        return computeBarFocusBounds(this, datumBox);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.styler != null ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
