import type { CallbackParamRules, Point, RequireOptional, SizedPoint } from 'ag-charts-core';
import { extent, isContinuous, isDefined, mergeDefaults, simpleMemorize2 } from 'ag-charts-core';
import {
    type AgAreaSeriesLabelFormatterParams,
    type AgAreaSeriesMarkerItemStylerParams,
    type AgAreaSeriesOptions,
    type AgAreaSeriesStylerParams,
    type AgAreaSeriesStylerResult,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgSeriesMarkerStyle,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';
import type { Text } from '../../../scene/shape/text';
import { LogAxis } from '../../axis/logAxis';
import { NumberAxis } from '../../axis/numberAxis';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModel, DatumPropertyDefinition, ProcessedData } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import type { PropertyDefinition } from '../../data/dataModelTypes';
import {
    animationValidation,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    processedDataIsAnimatable,
    valueProperty,
} from '../../data/processors';
import { getLabelStyles } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, isTooltipValueMissing } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { HighlightState, toHighlightString } from '../seriesProperties';
import { SeriesContentZIndexMap, SeriesZIndexMap } from '../seriesZIndexMap';
import { applyShapeStyle } from '../shapeUtil';
import { datumStylerProperties, visibleRangeIndices } from '../util';
import { type AreaSeriesDataAggregationFilter, aggregateAreaData } from './areaAggregation';
import { AreaSeriesProperties } from './areaSeriesProperties';
import {
    type AreaSeriesNodeDataContext,
    type LabelSelectionDatum,
    type MarkerSelectionDatum,
    plotAreaPathFill,
    prepareAreaPathAnimation,
} from './areaUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
    RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD,
} from './cartesianSeries';
import { type LinePathSpan, type LineSpanPointDatum, interpolatePoints, plotLinePathStroke } from './lineUtil';
import {
    computeMarkerFocusBounds,
    getMarkerStyles,
    markerEnabled,
    markerFadeInAnimation,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
} from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';
import { calculateSegments } from './util';

const CROSS_FILTER_AREA_FILL_OPACITY_FACTOR = 0.125;
const CROSS_FILTER_AREA_STROKE_OPACITY_FACTOR = 0.25;

type AreaAnimationData = CartesianAnimationData<
    Marker,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext
>;

interface StackRange {
    leading: number;
    trailing: number;
    dataValid: boolean;
    breakBefore: boolean;
}

interface AreaSeriesStackContext {
    stack: StackRange[];
    fillSpans: LinePathSpan[];
    strokeSpans: LinePathSpan[];
}

const memoizedAggregateAreaData = simpleMemorize2(aggregateAreaData);

export class AreaSeries extends CartesianSeries<
    Marker,
    AgAreaSeriesOptions,
    AreaSeriesProperties,
    MarkerSelectionDatum,
    LabelSelectionDatum,
    AreaSeriesNodeDataContext,
    AreaSeriesStackContext
> {
    static readonly className = 'AreaSeries';
    static readonly type = 'area' as const;

    override properties = new AreaSeriesProperties();

    override connectsToYAxis = true;

    private dataAggregationFilters: AreaSeriesDataAggregationFilter[] | undefined = undefined;

    readonly backgroundGroup = new Group({
        name: `${this.id}-background`,
        zIndex: SeriesZIndexMap.BACKGROUND,
    });

    override get pickModeAxis() {
        return 'main' as const;
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: 'xValue',
            pathsPerSeries: ['fill', 'stroke'],
            pathsZIndexSubOrderOffset: [0, 1000],
            datumSelectionGarbageCollection: false,
            segmentedDataNodes: false,
            pickModes: [SeriesNodePickMode.AXIS_ALIGNED, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                datum: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
            clipFocusBox: false,
        });
    }

    override renderToOffscreenCanvas(): boolean {
        return (
            super.renderToOffscreenCanvas() ||
            (this.contextNodeData != null &&
                (this.contextNodeData.fillData.spans.length > RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD ||
                    this.contextNodeData.strokeData.spans.length > RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD))
        );
    }

    override attachSeries(seriesContentNode: Group, seriesNode: Group, annotationNode: Group | undefined): void {
        super.attachSeries(seriesContentNode, seriesNode, annotationNode);

        seriesContentNode.appendChild(this.backgroundGroup);
    }

    override detachSeries(
        seriesContentNode: Group | undefined,
        seriesNode: Group,
        annotationNode: Group | undefined
    ): void {
        super.detachSeries(seriesContentNode, seriesNode, annotationNode);

        this.backgroundGroup.remove();
    }

    protected override attachPaths([fill, stroke]: Path[]) {
        this.backgroundGroup.appendChild(fill);

        this.contentGroup.appendChild(stroke);
        stroke.zIndex = -1;
    }

    protected override detachPaths([fill, stroke]: Path[]) {
        fill.remove();

        stroke.remove();
    }

    private isStacked() {
        const stackCount = this.seriesGrouping?.stackCount ?? 1;
        return stackCount > 1;
    }

    private isNormalized() {
        return this.properties.normalizedTo != null;
    }

    private _isStacked: boolean | undefined = undefined;
    override setSeriesIndex(index: number) {
        const isStacked = this.isStacked();
        const isStackedChanged = isStacked === this._isStacked;
        this._isStacked = isStackedChanged;

        return super.setSeriesIndex(index, isStackedChanged);
    }

    override setZIndex(zIndex: number) {
        super.setZIndex(zIndex);

        if (this.isStacked()) {
            this.backgroundGroup.zIndex = [SeriesZIndexMap.BACKGROUND, zIndex];
            this.contentGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.FOREGROUND];
        } else {
            this.backgroundGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.FOREGROUND, 0];
            this.contentGroup.zIndex = [SeriesZIndexMap.ANY_CONTENT, zIndex, SeriesContentZIndexMap.FOREGROUND, 1];
        }
    }

    override async processData(dataController: DataController) {
        if (this.data == null) return;

        const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 1 } = {} } = this;
        const { xKey, yKey, yFilterKey, connectMissingData, normalizedTo } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const stacked = stackCount > 1 || normalizedTo != null;

        const idMap = {
            value: `area-stack-${groupIndex}-yValue`,
            marker: `area-stack-${groupIndex}-yValues-marker`,
        };

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if ((isDefined(normalizedTo) || connectMissingData) && stackCount > 1) {
            common.invalidValue = 0;
        }
        if (!visible) {
            common.forceValue = 0;
        }

        const props: PropertyDefinition<any, any>[] = [
            keyProperty(xKey, xScaleType, { id: 'xValue' }),
            valueProperty(yKey, yScaleType, { id: `yValueRaw`, ...common }),
            ...(yFilterKey == null ? [] : [valueProperty(yFilterKey, yScaleType, { id: 'yFilterRaw' })]),
        ];

        if (stacked) {
            props.push(
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    { id: `yValueCumulative`, ...common, groupId: idMap.marker },
                    yScaleType
                )
            );
        }

        if (isDefined(normalizedTo)) {
            props.push(
                valueProperty(yKey, yScaleType, { id: `yValue`, ...common, groupId: idMap.value }),
                normaliseGroupTo(Object.values(idMap), normalizedTo)
            );
        }
        if (animationEnabled) {
            props.push(animationValidation());
        }

        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, data, {
            props,
            groupByKeys: stacked,
            groupByData: !stacked,
        });

        this.dataAggregationFilters = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(xValue: any, pixelSize: number): [number, number] {
        const { marker } = this.properties;
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const r = marker.enabled ? 0.5 * marker.size * pixelSize : 0;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number): [number, number] {
        const { marker } = this.properties;
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const r = marker.enabled ? 0.5 * marker.size * pixelSize : 0;
        return [y - r, y + r];
    }

    private yValueKey() {
        return this.isNormalized() ? 'yValue' : 'yValueRaw';
    }

    private yCumulativeKey(processData: ProcessedData<any>) {
        return processData.type === 'grouped' ? 'yValueCumulative' : this.yValueKey();
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData, axes } = this;
        if (!dataModel || !processedData) return [];

        const yAxis = axes[ChartAxisDirection.Y];

        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return fixNumericExtent(extent(keys));
        }

        const yExtent = this.domainForClippedRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(processedData)],
            'xValue'
        );

        if (yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
            const fixedYExtent = Number.isFinite(yExtent[1] - yExtent[0])
                ? [Math.min(yExtent[0], 0), Math.max(yExtent[1], 0)]
                : [];
            return fixNumericExtent(fixedYExtent);
        } else {
            return fixNumericExtent(yExtent);
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): [number, number] {
        const [y0, y1] = this.domainForVisibleRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(this.processedData!)],
            'xValue',
            visibleRange
        );
        return [Math.min(y0, 0), Math.max(y1, 0)];
    }

    override getZoomRangeFittingItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined {
        return this.zoomFittingVisibleItems(
            'xValue',
            [this.yCumulativeKey(this.processedData!)],
            xVisibleRange,
            yVisibleRange,
            minVisibleItems
        );
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        return this.countVisibleItems(
            'xValue',
            [this.yCumulativeKey(this.processedData!)],
            xVisibleRange,
            yVisibleRange,
            minVisibleItems
        );
    }

    private aggregateData(dataModel: DataModel<any, any>, processedData: ProcessedData<any>) {
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const { scale } = xAxis;
        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, this.yCumulativeKey(processedData), processedData);
        const domain = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const xNeedsValueOf = dataModel.resolveColumnNeedsValueOf(this, `xValue`, processedData);
        const yNeedsValueOf = dataModel.resolveColumnNeedsValueOf(
            this,
            this.yCumulativeKey(processedData),
            processedData
        );

        return memoizedAggregateAreaData(scale.type, xValues, yValues, domain, xNeedsValueOf, yNeedsValueOf);
    }

    private fillSpans: LinePathSpan[] = [];
    private phantomSpans: LinePathSpan[] = [];
    private strokeSpans: LinePathSpan[] = [];

    private stackAggregatedData(aggregation: AreaSeriesDataAggregationFilter): AreaSeriesStackContext | undefined {
        const { indices, metaIndices } = aggregation;
        const { visible, axes, dataModel, processedData, seriesBelowStackContext } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!visible) {
            // The aggregation won't have valid indices, so we can't work out these spans
            // But setting these spans is only useful for animation - which is disabled anyway
            this.phantomSpans = [];
            this.fillSpans = [];
            this.strokeSpans = [];
            return seriesBelowStackContext;
        }

        if (xAxis == null || yAxis == null || dataModel == null || processedData == null) return;

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(this, this.yCumulativeKey(processedData), processedData);

        let [m0, m1] = visibleRangeIndices(1, metaIndices.length - 1, xAxis.range, (metaIndex) => {
            const startIndex = metaIndices[metaIndex];
            const endIndex = metaIndices[metaIndex + 1];

            const startDatumIndex = indices[startIndex];
            const endDatumIndex = indices[endIndex];

            const xValue0 = xValues[startDatumIndex];
            const xValue1 = xValues[endDatumIndex];

            const { 0: x0 } = this.xCoordinateRange(xValue0, 0);
            const { 1: x1 } = this.xCoordinateRange(xValue1, 0);

            return [x0, x1];
        });
        m0 = Math.max(m0 - 1, 0);
        m1 = Math.min(m1 + 1, metaIndices.length - 1);

        let phantomSpans: LinePathSpan[] = [];
        if (seriesBelowStackContext?.fillSpans) {
            phantomSpans = seriesBelowStackContext?.fillSpans;
        } else {
            for (let metaIndex = m0; metaIndex < m1; metaIndex += 1) {
                const startIndex = metaIndices[metaIndex];
                const endIndex = metaIndices[metaIndex + 1];

                const startDatumIndex = indices[startIndex];
                const endDatumIndex = indices[endIndex];

                const xValue0 = xValues[startDatumIndex];
                const xValue1 = xValues[endDatumIndex];

                const span: LinePathSpan['span'] = {
                    type: 'linear',
                    moveTo: false,
                    x0: xScale.convert(xValue0) + xOffset,
                    y0: yScale.convert(0),
                    x1: xScale.convert(xValue1) + xOffset,
                    y1: yScale.convert(0),
                };

                phantomSpans.push({
                    span,
                    xValue0,
                    xValue1,
                    yValue0: 0,
                    yValue1: 0,
                });
            }
        }
        this.phantomSpans = phantomSpans;

        const fillSpans: LinePathSpan[] = [];
        const strokeSpans: LinePathSpan[] = [];
        for (let metaIndex = m0; metaIndex < m1; metaIndex += 1) {
            const startIndex = metaIndices[metaIndex];
            const endIndex = metaIndices[metaIndex + 1];

            const startDatumIndex = indices[startIndex];
            const endDatumIndex = indices[endIndex];

            const xValue0 = xValues[startDatumIndex];
            const xValue1 = xValues[endDatumIndex];
            const yValue0 = yValues[startDatumIndex];
            const yValue1 = yValues[endDatumIndex];

            const midPoints: Point[] = [];
            for (let i = startIndex + 1; i < endIndex; i++) {
                const datumIndex = indices[i];
                midPoints.push({
                    x: xScale.convert(xValues[datumIndex]) + xOffset,
                    y: yScale.convert(yValues[datumIndex]),
                });
            }

            const span: LinePathSpan['span'] = {
                type: 'multi-line',
                moveTo: false,
                x0: xScale.convert(xValue0) + xOffset,
                y0: yScale.convert(yValue0),
                x1: xScale.convert(xValue1) + xOffset,
                y1: yScale.convert(yValue1),
                midPoints,
            };
            const spanDatum: LinePathSpan = {
                span,
                xValue0,
                xValue1,
                yValue0,
                yValue1,
            };

            fillSpans.push(spanDatum);
            strokeSpans.push(spanDatum);
        }

        this.fillSpans = fillSpans;
        this.strokeSpans = strokeSpans;

        return {
            stack: [],
            fillSpans,
            strokeSpans,
        };
    }

    private stackYValueData(): AreaSeriesStackContext | undefined {
        const { visible, axes, dataModel, processedData, seriesBelowStackContext, properties } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (xAxis == null || yAxis == null || dataModel == null || processedData == null) return;
        const { interpolation } = properties;
        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        let xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        let yValues = dataModel.resolveColumnById(this, this.yValueKey(), processedData);

        const connectMissingData = !this.isStacked() && this.properties.connectMissingData;

        const invalidKeys = processedData.invalidKeys?.get(this.id);
        const invalidData = connectMissingData ? processedData.invalidData?.get(this.id) : undefined;

        const indexFilter = invalidData ?? invalidKeys;
        if (indexFilter != null) {
            xValues = xValues.filter((_, datumIndex) => indexFilter[datumIndex] === false);
            yValues = yValues.filter((_, datumIndex) => indexFilter[datumIndex] === false);
        }

        let [startIndex, endIndex] = visibleRangeIndices(1, xValues.length, xAxis.range, (datumIndex) =>
            this.xCoordinateRange(xValues[datumIndex], 0)
        );
        startIndex = Math.max(startIndex - 2, 0);
        endIndex = Math.min(endIndex + 2, xValues.length);

        let phantomSpans: LinePathSpan[];
        if (seriesBelowStackContext?.fillSpans) {
            phantomSpans = seriesBelowStackContext?.fillSpans;
        } else {
            const phantomSpanPoints: LineSpanPointDatum[] = [];
            for (let datumIndex = startIndex; datumIndex < endIndex; datumIndex += 1) {
                const xDatum = xValues[datumIndex];
                phantomSpanPoints.push({
                    point: {
                        x: xScale.convert(xDatum) + xOffset,
                        y: yScale.convert(0),
                    },
                    xDatum,
                    yDatum: 0,
                });
            }

            phantomSpans = interpolatePoints(phantomSpanPoints, { type: 'linear' } as any);
        }
        this.phantomSpans = phantomSpans;

        if (!visible) {
            this.fillSpans = phantomSpans;
            this.strokeSpans = [];
            return seriesBelowStackContext;
        }

        let bottomStack = seriesBelowStackContext?.stack;
        if (bottomStack == null) {
            bottomStack = [];
            for (let datumIndex = startIndex; datumIndex < endIndex - 1; datumIndex += 1) {
                bottomStack.push({ leading: 0, trailing: 0, dataValid: true, breakBefore: false });
            }
        }

        const topStack = bottomStack.slice();
        let trackingValidData = false;
        for (let stackIndex = 0; stackIndex < topStack.length; stackIndex += 1) {
            const leadingIndex = startIndex + stackIndex;
            const trailingIndex = startIndex + stackIndex + 1;

            let { leading, trailing, breakBefore } = bottomStack[stackIndex];

            const leadingValue = yValues[leadingIndex];
            const trailingValue = yValues[trailingIndex];
            const missingLeading = !Number.isFinite(leadingValue);
            const missingTrailing = !Number.isFinite(trailingValue);
            const dataValid = !missingLeading && !missingTrailing;

            if (dataValid) {
                leading += leadingValue;
                trailing += trailingValue;
            }

            if (stackIndex !== 0 && dataValid !== trackingValidData) {
                breakBefore = true;
            }

            trackingValidData = dataValid;

            topStack[stackIndex] = { leading, trailing, dataValid, breakBefore };
        }

        const fillSpans: LinePathSpan[] = [];
        const strokeSpans: LinePathSpan[] = [];
        const topSpanPoints: LineSpanPointDatum[] = [];
        for (let stackIndex = 0; stackIndex < topStack.length; stackIndex += 1) {
            const { leading, dataValid, breakBefore } = topStack[stackIndex];
            const leadingIndex = startIndex + stackIndex;

            if (breakBefore) {
                if (topSpanPoints.length !== 0) {
                    const previousStack = topStack[stackIndex - 1];
                    const previousPoint: LineSpanPointDatum = {
                        point: {
                            x: xScale.convert(xValues[leadingIndex]) + xOffset,
                            y: yScale.convert(previousStack.trailing),
                        },
                        xDatum: xValues[leadingIndex],
                        yDatum: previousStack.trailing,
                    };
                    topSpanPoints.push(previousPoint);

                    const spans = interpolatePoints(topSpanPoints, interpolation);
                    fillSpans.push(...spans);
                    strokeSpans.push(...spans);
                }

                topSpanPoints.length = 0;
            }

            if (dataValid) {
                const leadingPoint: LineSpanPointDatum = {
                    point: {
                        x: xScale.convert(xValues[leadingIndex]) + xOffset,
                        y: yScale.convert(leading),
                    },
                    xDatum: xValues[leadingIndex],
                    yDatum: leading,
                };
                topSpanPoints.push(leadingPoint);
            } else {
                fillSpans.push(phantomSpans[stackIndex]);
            }
        }

        if (topSpanPoints.length !== 0) {
            const previousStack = topStack.at(-1)!;
            const trailingIndex = startIndex + topStack.length;
            const trailingPoint: LineSpanPointDatum = {
                point: {
                    x: xScale.convert(xValues[trailingIndex]) + xOffset,
                    y: yScale.convert(previousStack.trailing),
                },
                xDatum: xValues[trailingIndex],
                yDatum: previousStack.trailing,
            };
            topSpanPoints.push(trailingPoint);

            const spans = interpolatePoints(topSpanPoints, interpolation);
            fillSpans.push(...spans);
            strokeSpans.push(...spans);

            topSpanPoints.length = 0;
        }

        this.fillSpans = fillSpans;
        this.strokeSpans = strokeSpans;

        return {
            stack: topStack,
            fillSpans,
            strokeSpans,
        };
    }

    override createStackContext(): AreaSeriesStackContext | undefined {
        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const { scale: xScale } = xAxis;

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);
        const dataAggregationFilter = this.dataAggregationFilters?.find((f) => f.maxRange > range);

        if (dataAggregationFilter) {
            return this.stackAggregatedData(dataAggregationFilter);
        } else {
            return this.stackYValueData();
        }
    }

    override createNodeData() {
        const { axes, data, processedData, dataModel, dataAggregationFilters } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !data || !dataModel || !processedData) return;

        const {
            xKey,
            xName,
            yFilterKey,
            yKey,
            yName,
            legendItemName,
            marker,
            label,
            fill: seriesFill,
            stroke: seriesStroke,
        } = this.properties;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { isContinuousY } = this.getScaleInformation({ xScale, yScale });

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const stacked = processedData.type === 'grouped';

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yRawValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const yCumulativeValues = stacked
            ? dataModel.resolveColumnById(this, `yValueCumulative`, processedData)
            : yRawValues;
        const yFilterValues =
            yFilterKey == null ? undefined : dataModel.resolveColumnById(this, 'yFilterRaw', processedData);

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);

        const labelData: LabelSelectionDatum[] = [];
        const markerData: MarkerSelectionDatum[] = [];
        const { visibleSameStackCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);

        let crossFiltering = false;
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        const invalidData = processedData.invalidData?.get(this.id);

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        let startIndex = 0;
        let endIndex = 0;
        const indices = dataAggregationFilter?.indices;
        [startIndex, endIndex] = this.visibleRangeIndices('xValue', xAxis.range, indices);
        startIndex = Math.max(startIndex - 2, 0);
        endIndex = Math.min(endIndex + 2, indices?.length ?? xValues.length);
        // @todo(AG-13575) Remove this if block
        if (processedData.input.count < 1e3) {
            startIndex = 0;
            endIndex = processedData.input.count;
        }

        const createMarkerCoordinate = (xDatum: any, yEnd: number, rawYDatum: any): SizedPoint => {
            let currY;

            // if not normalized, the invalid data points will be processed as `undefined` in processData()
            // if normalized, the invalid data points will be processed as 0 rather than `undefined`
            // check if unprocessed datum is valid as we only want to show markers for valid points
            if (
                isDefined(this.properties.normalizedTo)
                    ? isContinuousY && isContinuous(rawYDatum)
                    : !Number.isNaN(rawYDatum)
            ) {
                currY = yEnd;
            }

            return {
                x: xScale.convert(xDatum) + xOffset,
                y: yScale.convert(currY),
                size: marker.size,
            };
        };

        const handleDatum = (datumIndex: number) => {
            const xDatum = xValues[datumIndex];
            if (xDatum == null) return;

            const seriesDatum = rawData[datumIndex];
            const yDatum = yRawValues[datumIndex];
            const yValueCumulative = yCumulativeValues[datumIndex];

            const validPoint = Number.isFinite(yDatum) && invalidData?.[datumIndex] !== true;

            // marker data
            const point = createMarkerCoordinate(xDatum, +yValueCumulative, yDatum);

            const selected = yFilterValues == null ? undefined : yFilterValues[datumIndex] === yDatum;
            if (selected === false) {
                crossFiltering = true;
            }

            if (validPoint && marker) {
                markerData.push({
                    series: this,
                    itemId: yKey,
                    datum: seriesDatum,
                    datumIndex,
                    midPoint: { x: point.x, y: point.y },
                    cumulativeValue: +yValueCumulative,
                    yValue: yDatum,
                    xValue: xDatum,
                    yKey,
                    xKey,
                    point,
                    fill: marker.fill ?? seriesFill,
                    stroke: marker.stroke ?? seriesStroke,
                    strokeWidth: marker.strokeWidth ?? this.properties.strokeWidth,
                    selected,
                });
            }

            // label data
            if (label.enabled && validPoint) {
                const labelText = this.getLabelText<AgAreaSeriesLabelFormatterParams>(
                    yDatum,
                    seriesDatum,
                    yKey,
                    'y',
                    yDomain,
                    label,
                    { value: yDatum, datum: seriesDatum, xKey, yKey, xName, yName, legendItemName }
                );

                labelData.push({
                    series: this,
                    itemId: yKey,
                    datum: seriesDatum,
                    datumIndex,
                    x: point.x,
                    y: point.y,
                    labelText,
                });
            }
        };

        for (let i = startIndex; i < endIndex; i += 1) {
            const datumIndex = indices?.[i] ?? i;
            if (xValues[datumIndex] == null) continue;
            handleDatum(datumIndex);
        }

        const segments = calculateSegments(
            this.properties.segmentation,
            xAxis,
            yAxis,
            this.chart!.seriesRect!,
            this.ctx.scene,
            false
        );

        const context: AreaSeriesNodeDataContext = {
            itemId: yKey,
            fillData: { spans: this.fillSpans, phantomSpans: this.phantomSpans },
            strokeData: { spans: this.strokeSpans },
            labelData,
            nodeData: markerData,
            scales: this.calculateScaling(),
            visible: this.visible,
            stackVisible: visibleSameStackCount > 0,
            crossFiltering,
            styles: getMarkerStyles(this, this.properties, marker),
            segments,
        };

        return context;
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    protected override updatePathNodes(opts: { paths: SegmentedPath[]; visible: boolean; animationEnabled: boolean }) {
        const {
            paths: [fillPaths, strokePaths],
            visible,
            animationEnabled,
        } = opts;
        const crossFiltering = this.contextNodeData?.crossFiltering === true;
        const segments = this.contextNodeData?.segments;

        const merged = mergeDefaults(this.getHighlightStyle(), this.getStyle(false));
        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, fill, fillOpacity, opacity } = merged;

        strokePaths.setProperties({
            segments,
            fill: undefined,
            lineCap: 'round',
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            stroke,
            strokeWidth,
            strokeOpacity: strokeOpacity * (crossFiltering ? CROSS_FILTER_AREA_STROKE_OPACITY_FACTOR : 1),
            lineDash,
            lineDashOffset,
            opacity,
            visible: visible || animationEnabled,
        });
        strokePaths.datum = segments;

        applyShapeStyle(
            fillPaths,
            {
                fill,
                stroke: undefined,
                fillOpacity: fillOpacity * (crossFiltering ? CROSS_FILTER_AREA_FILL_OPACITY_FACTOR : 1),
            },
            this.getShapeFillBBox()
        );

        fillPaths.setProperties({
            segments,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            fillShadow: this.properties.shadow,
            opacity,
            visible: visible || animationEnabled,
        });
        fillPaths.datum = segments;

        updateClipPath(this, strokePaths);
        updateClipPath(this, fillPaths);
    }

    protected override updatePaths(opts: { contextData: AreaSeriesNodeDataContext; paths: Path[] }) {
        this.updateAreaPaths(opts.paths, opts.contextData);
    }

    private updateAreaPaths(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        for (const path of paths) {
            path.visible = contextData.visible;
        }

        if (contextData.visible) {
            this.updateFillPath(paths, contextData);
            this.updateStrokePath(paths, contextData);
        } else {
            for (const path of paths) {
                path.path.clear();
                path.markDirty('AreaSeries');
            }
        }
    }

    private updateFillPath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const [fill] = paths;

        fill.path.clear();
        plotAreaPathFill(fill, contextData.fillData);
        fill.markDirty('AreaSeries');
    }

    private updateStrokePath(paths: Path[], contextData: AreaSeriesNodeDataContext) {
        const { spans } = contextData.strokeData;
        const [, stroke] = paths;

        stroke.path.clear();
        plotLinePathStroke(stroke, spans);
        stroke.markDirty('AreaSeries');
    }

    protected override updateDatumSelection(opts: {
        nodeData: MarkerSelectionDatum[];
        datumSelection: Selection<Marker, MarkerSelectionDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const { contextNodeData, processedData, axes, properties } = this;
        const { marker, styler } = properties;

        const markerStyle = styler ? this.getStyle(false).marker : undefined;

        const markersEnabled =
            contextNodeData?.crossFiltering === true ||
            markerEnabled(processedData!.input.count, axes[ChartAxisDirection.X]!.scale, marker, markerStyle);

        if (marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        return datumSelection.update(markersEnabled ? nodeData : []);
    }

    protected override updateDatumStyles(opts: {
        datumSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { marker } = this.properties;

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        datumSelection.each((node, datum) => {
            if (!datumSelection.isGarbage(node)) {
                const highlightState = this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex);
                const stylerStyle = this.getStyle(isHighlight, highlightState);
                const { stroke, strokeWidth, strokeOpacity } = stylerStyle;

                const params = this.makeItemStylerParams(
                    this.dataModel!,
                    this.processedData!,
                    datum.datumIndex,
                    stylerStyle.marker
                );
                datum.style = this.getMarkerStyle(
                    marker,
                    datum,
                    params,
                    { isHighlight, highlightState },
                    stylerStyle.marker,
                    {
                        stroke,
                        strokeWidth,
                        strokeOpacity,
                    }
                );
            }
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }

        const { datumSelection, isHighlight } = opts;
        const fillBBox = this.getShapeFillBBox();

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        datumSelection.each((node, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];
            this.applyMarkerStyle(style, node, datum.point, fillBBox, { selected: datum.selected });
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: LabelSelectionDatum[];
        labelSelection: Selection<Text, LabelSelectionDatum>;
    }) {
        return opts.labelSelection.update(this.isLabelEnabled() ? opts.labelData : []);
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, LabelSelectionDatum>; isHighlight?: boolean }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const params: AgAreaSeriesLabelFormatterParams = this.makeLabelFormatterParams();

        opts.labelSelection.each((text, datum) => {
            const style = getLabelStyles(this, datum, params, this.properties.label, isHighlight, activeHighlight);
            const { enabled, fontStyle, fontWeight, fontSize, fontFamily, color } = style;
            if (enabled && datum?.labelText) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = 'center';
                text.textBaseline = 'bottom';
                text.text = datum.labelText;
                text.x = datum.x;
                text.y = datum.y - 10;
                text.fill = color;
                text.visible = true;
                text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
                text.setBoxing(style);
            } else {
                text.visible = false;
            }
        });
    }

    makeStylerParams(
        highlighted: boolean,
        highlightStateEnum?: HighlightState
    ): AgAreaSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { marker, fill, fillOpacity, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth, xKey, yKey } =
            this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type MarkerRules = { marker: RequireOptional<AgSeriesMarkerStyle> };
        type ResultRules = CallbackParamRules<AgAreaSeriesStylerParams<unknown, unknown> & MarkerRules>;
        return {
            marker: {
                fill: marker.fill,
                fillOpacity: marker.fillOpacity,
                size: marker.size,
                shape: marker.shape,
                stroke: marker.stroke,
                strokeOpacity: marker.strokeOpacity,
                strokeWidth: marker.strokeWidth,
                lineDash: marker.lineDash,
                lineDashOffset: marker.lineDashOffset,
            },
            highlightState,
            highlighted,
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
        } satisfies ResultRules;
    }

    private makeItemStylerParams(
        dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        style: Required<AgSeriesMarkerStyle>
    ): AgAreaSeriesMarkerItemStylerParams<unknown, unknown> {
        const { xKey, yKey } = this.properties;

        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData)[datumIndex];
        const xDomain = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yDomain = dataModel.getDomain(this, this.yCumulativeKey(processedData), 'value', processedData);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            ...datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
            xValue,
            yValue,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgAreaSeriesMarkerItemStylerParams<unknown, unknown>>;
    }

    private makeLabelFormatterParams(): AgAreaSeriesLabelFormatterParams {
        const { xKey, xName, yKey, yName, legendItemName } = this.properties;
        return { xKey, xName, yKey, yName, legendItemName } satisfies RequireOptional<AgAreaSeriesLabelFormatterParams>;
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData)[datumIndex];

        if (xValue == null) return;

        const stylerStyle = this.getStyle(false);
        const params = this.makeItemStylerParams(dataModel, processedData, datumIndex, stylerStyle.marker);

        const format = this.getMarkerStyle<AgAreaSeriesMarkerItemStylerParams<unknown, unknown>>(
            this.properties.marker,
            { datumIndex, datum },
            params,
            { isHighlight: false },
            stylerStyle.marker
        ) as RequireOptional<AgSeriesMarkerStyle>;

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
                ...format,
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    legendItemSymbol(): LegendSymbolOptions {
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, marker } = this.getStyle(false);
        const useAreaFill = !marker.enabled || marker.fill == null;
        const legendMarkerFill = useAreaFill ? fill : marker.fill;

        const markerStyle = this.getMarkerStyle(
            this.properties.marker,
            {},
            undefined,
            { isHighlight: false, checkForHighlight: false },
            {
                size: marker.size,
                shape: marker.shape,
                fill: legendMarkerFill,
                fillOpacity: useAreaFill ? fillOpacity : marker.fillOpacity,
                stroke: marker.stroke,
            }
        );

        return {
            marker: {
                ...markerStyle,
                enabled: marker.enabled || strokeWidth <= 0,
            },
            line: {
                enabled: true,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
            },
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { yKey: itemId, yName, legendItemName, showInLegend } = this.properties;

        return [
            {
                legendType,
                id: seriesId,
                itemId,
                legendItemName,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: legendItemName ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady(animationData: AreaAnimationData) {
        const { datumSelection, labelSelection, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([datumSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, datumSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
    }

    protected override animateReadyResize(animationData: AreaAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(animationData: AreaAnimationData) {
        const { animationManager } = this.ctx;
        const { datumSelection, labelSelection, contextData, paths, previousContextData } = animationData;
        const [fill, stroke] = paths;

        if (contextData.visible === false && previousContextData?.visible === false) return;

        // Handling initially hidden series case gracefully.
        if (fill == null && stroke == null) return;

        this.resetDatumAnimation(animationData);
        this.resetLabelAnimation(animationData);

        const update = () => {
            this.resetPathAnimation(animationData);
            this.updateAreaPaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', datumSelection);
            pathFadeInAnimation(this, 'fill_path_properties', animationManager, 'add', fill);
            pathFadeInAnimation(this, 'stroke_path_properties', animationManager, 'add', stroke);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
            return;
        }

        if (contextData.crossFiltering !== previousContextData.crossFiltering) {
            skip();
            return;
        }

        const fns = prepareAreaPathAnimation(contextData, previousContextData);
        if (fns === undefined) {
            // Un-animatable - skip all animations.
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        markerFadeInAnimation(this, animationManager, undefined, datumSelection);

        fromToMotion(this.id, 'fill_path_properties', animationManager, [fill], fns.fill.pathProperties);
        pathMotion(this.id, 'fill_path_update', animationManager, [fill], fns.fill.path);

        fromToMotion(this.id, 'stroke_path_properties', animationManager, [stroke], fns.stroke.pathProperties);
        pathMotion(this.id, 'stroke_path_update', animationManager, [stroke], fns.stroke.path);

        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);

        // The animation may clip spans
        // When using smooth interpolation, the bezier spans are clipped using an approximation
        // This can result in artefacting, which may be present on the final frame
        // To remove this on the final frame, re-draw the series without animations
        this.ctx.animationManager.animate({
            id: this.id,
            groupId: 'reset_after_animation',
            phase: 'trailing',
            from: {},
            to: {},
            onComplete: () => this.updateAreaPaths(paths, contextData),
        });
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Marker();
    }

    public getStyle(
        highlighted: boolean,
        highlightState?: HighlightState
    ): Required<AgAreaSeriesStylerResult> & { marker: Required<AgSeriesMarkerStyle> & { enabled: boolean } } {
        const { styler, marker, fill, fillOpacity, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } =
            this.properties;
        const { size, shape, fill: markerFill = 'transparent', fillOpacity: markerFillOpacity } = marker;
        let stylerResult: AgAreaSeriesStylerResult & { marker?: { enabled?: boolean } } = {};
        if (styler) {
            const stylerParams = this.makeStylerParams(highlighted, highlightState);
            const cbResult = this.cachedCallWithContext(styler, stylerParams) ?? {};
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            stylerResult = resolved ?? {};
        }
        stylerResult.marker ??= {};
        return {
            fill: stylerResult.fill ?? fill,
            fillOpacity: stylerResult.fillOpacity ?? fillOpacity,
            lineDash: stylerResult.lineDash ?? lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? lineDashOffset,
            stroke: stylerResult.stroke ?? stroke,
            strokeOpacity: stylerResult.strokeOpacity ?? strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? strokeWidth,
            marker: {
                enabled: stylerResult.marker.enabled ?? marker.enabled,
                fill: stylerResult.marker.fill ?? markerFill,
                fillOpacity: stylerResult.marker.fillOpacity ?? markerFillOpacity,
                shape: stylerResult.marker.shape ?? shape,
                size: stylerResult.marker.size ?? size,
                lineDash: stylerResult.marker.lineDash ?? marker.lineDash ?? lineDash,
                lineDashOffset: stylerResult.marker.lineDashOffset ?? marker.lineDashOffset ?? lineDashOffset,
                stroke: stylerResult.marker.stroke ?? marker.stroke ?? stroke,
                strokeOpacity: stylerResult.marker.strokeOpacity ?? marker.strokeOpacity ?? strokeOpacity,
                strokeWidth: stylerResult.marker.strokeWidth ?? marker.strokeWidth ?? strokeWidth,
            } satisfies RequireOptional<AgSeriesMarkerStyle> & { enabled: boolean },
        } satisfies RequireOptional<AgAreaSeriesStylerResult> & { marker: { enabled: boolean } };
    }

    public getFormattedMarkerStyle(datum: MarkerSelectionDatum) {
        const stylerStyle = this.getStyle(false);
        const params = this.makeItemStylerParams(
            this.dataModel!,
            this.processedData!,
            datum.datumIndex,
            stylerStyle.marker
        );

        return this.getMarkerStyle(
            this.properties.marker,
            datum,
            params,
            { isHighlight: true },
            undefined,
            stylerStyle
        );
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.styler != null ||
            this.properties.marker.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
