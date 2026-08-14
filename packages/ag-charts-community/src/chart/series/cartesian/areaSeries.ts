import type {
    DomainWithMetadata,
    DynamicContext,
    InternalAgColorType,
    NormalisedAreaSeriesMarkerItemStylerParams,
    NormalisedAreaSeriesStylerResult,
    NormalisedColorType,
    NormalisedSeriesMarkerStyle,
    Point,
    RequireOptional,
} from 'ag-charts-core';
import {
    AGGREGATION_INDEX_Y_MAX,
    ChartAxisDirection,
    DEFAULT_MARKERLESS_LABEL_GAP,
    DebugMetrics,
    SeriesContentZIndexMap,
    SeriesZIndexMap,
    cachedTextMeasurer,
    extent,
    isContinuous,
    isDefined,
    maxValue,
    mergeDefaults,
    minValue,
    placedLabelFit,
    resolveLabelFit,
    toArray,
    toNumber,
} from 'ag-charts-core';
import {
    type AgAreaSeriesLabelFormatterParams,
    type AgAreaSeriesOptions,
    type AgAreaSeriesStylerParams,
    type AgDrawingMode,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgNumericValue,
    type NormalisedCallbackParams,
} from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Path } from '../../../scene/shape/path';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';
import { LogAxis } from '../../axis/logAxis';
import { NumberAxis } from '../../axis/numberAxis';
import type { ChartAxis } from '../../chartAxis';
import { addAccumulated } from '../../data/aggregateFunctions';
import type { DataController } from '../../data/dataController';
import type { DataModel, DatumPropertyDefinition, ProcessedData } from '../../data/dataModel';
import { extendDomainToZero, fixNumericExtent } from '../../data/dataModel';
import type { PropertyDefinition } from '../../data/dataModelTypes';
import {
    animationValidation,
    createDatumId,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    processedDataIsAnimatable,
    valueProperty,
} from '../../data/processors';
import { expandPlacementLabelBoxExtent } from '../../label';
import { boundLabelFit, insideMarkerContainer, resolveInsidePlacement } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, isTooltipValueMissing } from '../../tooltip/tooltip';
import { AggregationManager } from '../aggregationManager';
import { type BucketLookupFeature, BucketLookupManager } from '../bucketLookupFeature';
import {
    type MarkerStyleApply,
    type MarkerStyleCompute,
    type PickFocusInputs,
    Series,
    SeriesNodePickMode,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { toHighlightString, toSelectionString } from '../seriesProperties';
import { HighlightState, SelectionState } from '../seriesTypes';
import { datumStylerProperties, visibleRangeIndices } from '../util';
import {
    type AreaSeriesDataAggregationFilter,
    aggregateAreaDataFromDataModel,
    aggregateAreaDataFromDataModelPartial,
} from './areaAggregation';
import { AreaSeriesProperties } from './areaSeriesProperties';
import {
    type AreaSeriesNodeDataContext,
    type LabelSelectionDatum,
    type MarkerSelectionDatum,
    plotAreaPathFill,
    prepareAreaPathAnimation,
} from './areaUtil';
import {
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
    RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD,
} from './cartesianSeries';
import type { CartesianAnimationDataOf, CartesianMarkerLikeContext } from './cartesianSeriesTypes';
import { type LinePathSpan, type LineSpanPointDatum, interpolatePoints, plotLinePathStroke } from './lineUtil';
import {
    cartesianMarkerDrawMode,
    computeMarkerFocusBounds,
    getMarkerStyles,
    markerFadeInAnimation,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
    resetMarkerSelectionsDirect,
} from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';
import {
    PlacedLabelCartesianSeries,
    type PlacedLabelContext,
    type PlacedLabelSeriesTypes,
} from './placedLabelCartesianSeries';
import { calculateSegments } from './util';

type AreaAnimationData = CartesianAnimationDataOf<AreaSeriesTypes>;

/** Per-pass context for the no-itemStyler marker-style pass. */
interface AreaNoStylerPassCtx {
    marker: AreaSeriesProperties['marker'];
    hideWithSize0: boolean;
    isHighlight: boolean;
}

/** Per-pass context for the itemStyler marker-style pass. */
interface AreaStylerPassCtx extends AreaNoStylerPassCtx {
    dataModel: DataModel<any, any, any>;
    processedData: ProcessedData<any>;
}

type AreaNoStylerCompute = MarkerStyleCompute<
    AreaSeries,
    AreaNoStylerPassCtx,
    MarkerSelectionDatum,
    NormalisedSeriesMarkerStyle
>;
type AreaStylerCompute = MarkerStyleCompute<
    AreaSeries,
    AreaStylerPassCtx,
    MarkerSelectionDatum,
    ReturnType<AreaSeries['getStyle']>
>;
type AreaStylerApply = MarkerStyleApply<
    AreaSeries,
    AreaStylerPassCtx,
    MarkerSelectionDatum,
    ReturnType<AreaSeries['getStyle']>
>;

interface StackRange {
    // Kept raw (possibly bigint) so a stack beyond Number.MAX_VALUE positions proportionally via yScale.convert().
    leading: AgNumericValue;
    trailing: AgNumericValue;
    dataValid: boolean;
    breakBefore: boolean;
}

interface AreaSeriesStackContext {
    stack: StackRange[];
    fillSpans: LinePathSpan[];
    strokeSpans: LinePathSpan[];
}

/** Context object caching expensive lookups for createNodeData(). */
interface AreaSeriesCreateNodeDatumContext
    extends CartesianMarkerLikeContext<MarkerSelectionDatum>, PlacedLabelContext {
    // Override yKey to be required (base interface has it optional)
    readonly yKey: string;

    // Additional data arrays specific to area series
    readonly yRawValues: AgNumericValue[];
    readonly yCumulativeValues: AgNumericValue[];
    readonly crossFilterSelectedValues: boolean[] | undefined;
    readonly invalidData: boolean[] | undefined;

    // Aggregation
    readonly indices: Uint32Array | undefined;

    // Pre-computed flags
    readonly isContinuousY: boolean;
    readonly labelsEnabled: boolean;
    readonly normalizedTo: number | undefined;

    // Property caches (in addition to base xKey, yKey, xName, yName)
    readonly legendItemName: string | undefined;
    readonly markerSize: number;
    readonly markerFill: InternalAgColorType | undefined;
    readonly markerStroke: string | undefined;
    readonly markerStrokeWidth: number;
    readonly yDomain: any[];

    // Mutable state (in addition to nodes, nodeIndex from base)
    labelData: LabelSelectionDatum[];
}

/**
 * Scratch object for marker/label datum creation.
 * Pre-allocated once and mutated in loops to avoid GC pressure.
 */
interface AreaNodeDatumScratch {
    datum: any;
    xDatum: any;
    yDatum: any;
    yCumulative: AgNumericValue;
    crossFilterSelected: boolean | undefined;
    x: number;
    y: number;
    validPoint: boolean;
}

/**
 * Consolidated type interface for AreaSeries.
 * Defines all type parameters in one place for the series.
 */
interface AreaSeriesTypes extends PlacedLabelSeriesTypes {
    readonly node: Marker<MarkerSelectionDatum>;
    readonly options: AgAreaSeriesOptions;
    readonly properties: AreaSeriesProperties;
    readonly datum: MarkerSelectionDatum;
    readonly label: LabelSelectionDatum;
    readonly labelParams: AgAreaSeriesLabelFormatterParams;
    readonly context: AreaSeriesNodeDataContext;
    readonly stackContext: AreaSeriesStackContext;
    readonly createNodeDataContext: AreaSeriesCreateNodeDatumContext;
}

export class AreaSeries extends PlacedLabelCartesianSeries<AreaSeriesTypes> {
    static override readonly className = 'AreaSeries';
    static readonly type = 'area' as const;

    override properties = new AreaSeriesProperties();

    override createNodeParams(datum: MarkerSelectionDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
        };
    }

    override connectsToYAxis = true;

    private readonly aggregationManager = new AggregationManager<AreaSeriesDataAggregationFilter>();
    private hideWithSize0 = false;

    readonly backgroundGroup = new Group({
        name: `${this.id}-background`,
        zIndex: SeriesZIndexMap.BACKGROUND,
    });

    override get pickModeAxis() {
        return 'main' as const;
    }

    constructor(moduleCtx: DynamicContext<ChartRegistry>) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: 'xValue',
            pathsPerSeries: ['fill', 'stroke'],
            pathsZIndexSubOrderOffset: [0, 1000],
            datumSelectionGarbageCollection: false,
            segmentedDataNodes: false,
            usesPlacedLabels: true,
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
        const hasMarkers = (this.contextNodeData?.nodeData?.length ?? 0) > 0;
        return (
            super.renderToOffscreenCanvas() ||
            (hasMarkers && this.getDrawingMode(false) === 'cutout') ||
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
        const { xKey, yKey, selectedKey, connectMissingData, normalizedTo } = this.properties;
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

        const allowNullKey = this.properties.allowNullKeys ?? false;
        const props: PropertyDefinition<any, any>[] = [
            keyProperty(xKey, xScaleType, { id: 'xValue', allowNullKey }),
            valueProperty(yKey, yScaleType, { id: `yValueRaw`, ...common }),
            ...(selectedKey == null ? [] : [valueProperty(selectedKey, 'category', { id: 'selectedRaw' })]),
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

        this.aggregateData(dataModel, processedData);

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

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { dataModel, processedData, axes } = this;
        if (!dataModel || !processedData) return { domain: [] };

        const yAxis = axes[ChartAxisDirection.Y];

        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return { domain: fixNumericExtent(extent(keys.domain)) };
        }

        const yExtent = this.domainForClippedRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(processedData)],
            'xValue'
        );

        if (yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
            return { domain: fixNumericExtent(extendDomainToZero(yExtent)) };
        } else {
            return { domain: fixNumericExtent(yExtent) };
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): [number, number] {
        const [y0, y1] = this.domainForVisibleRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(this.processedData!)],
            'xValue',
            visibleRange
        );
        // domainForVisibleRange may yield a bigint; minValue/maxValue avoid the Math.min/max throw, toNumber narrows once.
        return [toNumber(minValue(y0, 0)), toNumber(maxValue(y1, 0))];
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

    protected override createBucketLookupFeature(): BucketLookupFeature {
        return new BucketLookupManager({
            series: this,
            getXAxis: () => this.axes[ChartAxisDirection.X],
            getDataModel: () => this.dataModel,
            getProcessedData: () => this.processedData,
            aggregationManager: this.aggregationManager,
            dataSelectionService: this.ctx.dataSelectionService,
            domainKey: 'key',
            canonicalExtremaSlots: [AGGREGATION_INDEX_Y_MAX],
        });
    }

    private aggregateData(dataModel: DataModel<any, any>, processedData: ProcessedData<any>): void {
        this.aggregationManager.markStale(processedData.input.count);

        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateAreaDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this.yCumulativeKey(processedData),
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateAreaDataFromDataModel(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this.yCumulativeKey(processedData),
                    this,
                    existingFilters
                ),
            targetRange,
        });

        const filters = this.aggregationManager.filters;
        if (filters && filters.length > 0) {
            DebugMetrics.record(
                `${this.type}:aggregation`,
                filters.map((f) => f.maxRange)
            );
        }
    }

    private estimateTargetRange(): number {
        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis?.scale?.range) {
            const [r0, r1] = xAxis.scale.range;
            return Math.abs(r1 - r0);
        }
        return this.ctx.scene?.canvas?.width ?? 800;
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
        const connectMissingData = !this.isStacked() && this.properties.connectMissingData;
        const invalidData = processedData.invalidData?.get(this.id);

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yValues = dataModel.resolveColumnById(
            this,
            this.yCumulativeKey(processedData),
            processedData,
            'mixed-numeric'
        );

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
        let phantomIndex = 0;
        for (let metaIndex = m0; metaIndex < m1; metaIndex += 1) {
            const startIndex = metaIndices[metaIndex];
            const endIndex = metaIndices[metaIndex + 1];

            const startDatumIndex = indices[startIndex];
            const endDatumIndex = indices[endIndex];

            const spanInvalid =
                !connectMissingData &&
                this.hasInvalidDatumsInRange(invalidData, yValues, startDatumIndex, endDatumIndex);

            const phantomSpanDatum = phantomSpans[phantomIndex++];
            if (spanInvalid) {
                fillSpans.push(phantomSpanDatum);
                strokeSpans.push(phantomSpanDatum);
                continue;
            }

            const bucketPoints: LineSpanPointDatum[] = [];
            for (let i = startIndex; i <= endIndex; i++) {
                const datumIndex = indices[i];
                if (invalidData?.[datumIndex]) continue;

                const yValue = yValues[datumIndex];
                // isContinuous accepts any bigint; Number.isFinite rejects every bigint (it never coerces them).
                if (!isContinuous(yValue)) continue;

                const xDatum = xValues[datumIndex];
                bucketPoints.push({
                    point: {
                        x: xScale.convert(xDatum) + xOffset,
                        y: yScale.convert(yValue),
                    },
                    xDatum,
                    yDatum: yValue,
                });
            }

            if (bucketPoints.length < 2) {
                fillSpans.push(phantomSpanDatum);
                strokeSpans.push(phantomSpanDatum);
                continue;
            }

            const startPoint = bucketPoints[0];
            const endPoint = bucketPoints.at(-1)!;
            const midPoints: Point[] = bucketPoints.slice(1, -1).map((p) => p.point);

            const span: LinePathSpan['span'] = {
                type: 'multi-line',
                moveTo: false,
                x0: startPoint.point.x,
                y0: startPoint.point.y,
                x1: endPoint.point.x,
                y1: endPoint.point.y,
                midPoints,
            };
            const spanDatum: LinePathSpan = {
                span,
                xValue0: startPoint.xDatum,
                xValue1: endPoint.xDatum,
                yValue0: startPoint.yDatum,
                yValue1: endPoint.yDatum,
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

    private hasInvalidDatumsInRange(
        invalidData: ReadonlyArray<boolean> | undefined,
        yValues: any[],
        startIndex: number,
        endIndex: number
    ): boolean {
        const rangeStart = Math.min(startIndex, endIndex);
        const rangeEnd = Math.max(startIndex, endIndex);

        for (let datumIndex = rangeStart; datumIndex <= rangeEnd; datumIndex++) {
            if (invalidData?.[datumIndex]) {
                return true;
            }

            const yValue = yValues[datumIndex];
            // isContinuous accepts any bigint; Number.isFinite rejects every bigint (it never coerces them).
            if (!isContinuous(yValue)) {
                return true;
            }
        }

        return false;
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
        let yValues = dataModel.resolveColumnById(this, this.yValueKey(), processedData, 'mixed-numeric');

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
            // addAccumulated below promotes the numeric baseline to bigint so a stack beyond Number.MAX_VALUE
            // accumulates exactly (number + bigint would otherwise throw).
            const missingLeading = !isContinuous(leadingValue);
            const missingTrailing = !isContinuous(trailingValue);
            const dataValid = !missingLeading && !missingTrailing;

            if (dataValid) {
                leading = addAccumulated(leading, leadingValue);
                trailing = addAccumulated(trailing, trailingValue);
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

        // Ensure we have the aggregation level needed for the current range
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        const { processedData } = this;
        if (processedData) {
            this.ensureBucketLookupFeature()?.setActiveFilter(processedData, dataAggregationFilter);
        }

        if (dataAggregationFilter) {
            return this.stackAggregatedData(dataAggregationFilter);
        } else {
            return this.stackYValueData();
        }
    }

    /**
     * Creates the context object with cached lookups for createNodeData().
     * All expensive operations (data resolution, scale lookups) are performed once here.
     */
    protected override createNodeDatumContext(
        xAxis: ChartAxis,
        yAxis: ChartAxis
    ): AreaSeriesCreateNodeDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return undefined;

        const {
            xKey,
            xName,
            selectedKey,
            yKey,
            yName,
            legendItemName,
            marker,
            label,
            fill: seriesFill,
            stroke: seriesStroke,
            normalizedTo,
        } = this.properties;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { isContinuousY } = this.getScaleInformation({ xScale, yScale });

        const stacked = processedData.type === 'grouped';

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        // Ensure we have the aggregation level needed for the current range
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        this.ensureBucketLookupFeature()?.setActiveFilter(processedData, dataAggregationFilter);

        const existingNodeData = this.contextNodeData?.nodeData;
        const canIncrementallyUpdate =
            existingNodeData != null && this.canIncrementallyUpdateNodes(dataAggregationFilter != null);

        const placements = toArray(label.placement);
        const {
            insideOnly,
            offset: labelInsideOffset,
            size: labelInsideSize,
        } = resolveInsidePlacement(placements, marker.shape);
        const markerSize = marker.enabled ? marker.size : 0;
        const insideFit = insideOnly ? resolveLabelFit(label, false, true) : undefined;
        const labelFit = insideFit
            ? boundLabelFit(insideFit, insideMarkerContainer(markerSize, marker.shape, label.collision.threshold ?? 0))
            : resolveLabelFit(label, !label.collision.alwaysShow);
        // Keeps the label on a marker too small to hold even an ellipsis.
        const labelFitOverflow = label.collision.alwaysShow ? insideFit : undefined;
        const labelAnchor = Marker.anchor(marker.shape);

        return {
            // Axes (from template method parameters)
            xAxis,
            yAxis,

            // Data arrays (resolved once)
            rawData: processedData.dataSources.get(this.id)?.data ?? [],
            xValues: dataModel.resolveKeysById(this, 'xValue', processedData),
            yRawValues: dataModel.resolveColumnById(this, 'yValueRaw', processedData, 'mixed-numeric'),
            yCumulativeValues: stacked
                ? dataModel.resolveColumnById(this, 'yValueCumulative', processedData, 'mixed-numeric')
                : dataModel.resolveColumnById(this, 'yValueRaw', processedData, 'mixed-numeric'),
            crossFilterSelectedValues:
                selectedKey == null
                    ? undefined
                    : dataModel.resolveColumnById(this, 'selectedRaw', processedData, 'boolean'),
            invalidData: processedData.invalidData?.get(this.id),

            // Scales (cached)
            xScale,
            yScale,
            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: 0,

            // Aggregation
            indices: dataAggregationFilter?.indices,

            // Pre-computed flags
            isContinuousY,
            labelsEnabled: label.enabled,
            labelPadding: expandPlacementLabelBoxExtent(label),
            labelTextMeasurer: cachedTextMeasurer(label),
            labelFit,
            labelFitOverflow,
            labelStyled: label.itemStyler != null,
            labelInsideOffset,
            labelInsideSize,
            labelAnchor,
            normalizedTo,
            canIncrementallyUpdate,
            animationEnabled: !this.ctx.animationManager.isSkipped(),

            // Property caches
            xKey,
            yKey,
            xName,
            yName,
            legendItemName,
            markerSize: marker.size,
            markerFill: marker.fill ?? seriesFill,
            markerStroke: marker.stroke ?? seriesStroke,
            markerStrokeWidth: marker.strokeWidth ?? this.properties.strokeWidth,
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y).domain,

            // Mutable state (nodes instead of markerData to match base interface)
            nodes: canIncrementallyUpdate ? existingNodeData : [],
            labelData: [],
            nodeIndex: 0,
        };
    }

    /**
     * Computes the marker coordinate for a datum.
     * Uses cached context values to avoid repeated lookups.
     */
    private computeMarkerCoordinate(ctx: AreaSeriesCreateNodeDatumContext, scratch: AreaNodeDatumScratch): void {
        let currY: AgNumericValue | undefined;

        // if not normalized, the invalid data points will be processed as `undefined` in processData()
        // if normalized, the invalid data points will be processed as 0 rather than `undefined`
        // check if unprocessed datum is valid as we only want to show markers for valid points
        if (
            isDefined(ctx.normalizedTo)
                ? ctx.isContinuousY && isContinuous(scratch.yDatum)
                : !Number.isNaN(scratch.yDatum)
        ) {
            currY = scratch.yCumulative;
        }

        scratch.x = ctx.xScale.convert(scratch.xDatum) + ctx.xOffset;
        scratch.y = ctx.yScale.convert(currY);

        if (!Number.isFinite(scratch.x)) {
            scratch.validPoint = false;
        }
    }

    /**
     * Processes a single datum and updates the context's marker/label data.
     * Uses scratch object to avoid allocations in tight loops.
     */
    private handleDatum(
        ctx: AreaSeriesCreateNodeDatumContext,
        scratch: AreaNodeDatumScratch,
        datumIndex: number
    ): void {
        // Populate scratch from context arrays
        scratch.xDatum = ctx.xValues[datumIndex];
        if (scratch.xDatum === undefined && !this.properties.allowNullKeys) return;

        scratch.datum = ctx.rawData[datumIndex];
        scratch.yDatum = ctx.yRawValues[datumIndex];
        // Keep raw (possibly bigint) so yScale.convert() positions values beyond Number.MAX_VALUE proportionally.
        scratch.yCumulative = ctx.yCumulativeValues[datumIndex];
        scratch.validPoint = isContinuous(scratch.yDatum) && ctx.invalidData?.[datumIndex] !== true;

        // Compute marker coordinates
        this.computeMarkerCoordinate(ctx, scratch);

        scratch.crossFilterSelected = ctx.crossFilterSelectedValues?.[datumIndex];

        // Marker data (using ctx.nodes to match base interface)
        if (scratch.validPoint) {
            const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

            if (canReuseNode) {
                // Update existing node in place
                const existingNode = ctx.nodes[ctx.nodeIndex] as {
                    -readonly [K in keyof MarkerSelectionDatum]: MarkerSelectionDatum[K];
                };
                existingNode.datum = scratch.datum;
                existingNode.datumIndex = datumIndex;
                existingNode.midPoint = { x: scratch.x, y: scratch.y };
                // Metadata only (tooltips/error-bars); position already used the exact bigint, so narrowing here is fine.
                existingNode.cumulativeValue = Number(scratch.yCumulative);
                existingNode.cumulativeValueExact = scratch.yCumulative;
                existingNode.yValue = scratch.yDatum;
                existingNode.xValue = scratch.xDatum;
                existingNode.point = { x: scratch.x, y: scratch.y, size: ctx.markerSize };
                existingNode.crossFilterSelected = scratch.crossFilterSelected;
            } else {
                ctx.nodes.push({
                    series: this,
                    datum: scratch.datum,
                    datumIndex,
                    midPoint: { x: scratch.x, y: scratch.y },
                    cumulativeValue: Number(scratch.yCumulative),
                    cumulativeValueExact: scratch.yCumulative,
                    yValue: scratch.yDatum,
                    xValue: scratch.xDatum,
                    yKey: ctx.yKey,
                    xKey: ctx.xKey,
                    point: { x: scratch.x, y: scratch.y, size: ctx.markerSize },
                    fill: ctx.markerFill,
                    stroke: ctx.markerStroke,
                    strokeWidth: ctx.markerStrokeWidth,
                    crossFilterSelected: scratch.crossFilterSelected,
                });
            }
            ctx.nodeIndex++;
        }

        // Label data (only if enabled - skip expensive getLabelText when disabled)
        if (ctx.labelsEnabled && scratch.validPoint) {
            const labelText = this.getLabelText<AgAreaSeriesLabelFormatterParams>(
                scratch.yDatum,
                scratch.datum,
                ctx.yKey,
                'y',
                ctx.yDomain,
                this.properties.label,
                {
                    value: scratch.yDatum,
                    datum: scratch.datum,
                    xKey: ctx.xKey,
                    yKey: ctx.yKey,
                    xName: ctx.xName,
                    yName: ctx.yName,
                    legendItemName: ctx.legendItemName,
                }
            );

            ctx.labelData.push({
                series: this,
                datum: scratch.datum,
                datumIndex,
                x: scratch.x,
                y: scratch.y,
                labelText,
                point: { x: scratch.x, y: scratch.y, size: ctx.markerSize },
                label: this.measureLabel(ctx, labelText),
                fit: placedLabelFit(labelText, this.properties.label, ctx),
                anchor: ctx.labelAnchor,
                insideOffset: ctx.labelInsideOffset,
                insideSize: ctx.labelInsideSize,
                placement: 'top',
                // Markerless points still nudge their label clear of the area with a small fixed gap.
                gap: ctx.markerSize > 0 ? ctx.markerSize / 2 : DEFAULT_MARKERLESS_LABEL_GAP,
            });
        }
    }

    // ============================================================================
    // Template Method Hooks
    // ============================================================================

    /**
     * Populates the node data array by iterating over visible data.
     */
    protected override populateNodeData(ctx: AreaSeriesCreateNodeDatumContext): void {
        // Pre-allocate scratch object for mutations
        const scratch: AreaNodeDatumScratch = {
            datum: undefined,
            xDatum: undefined,
            yDatum: undefined,
            yCumulative: 0,
            crossFilterSelected: undefined,
            x: 0,
            y: 0,
            validPoint: false,
        };

        // Calculate visible range
        let [startIndex, endIndex] = this.visibleRangeIndices('xValue', ctx.xAxis.range, ctx.indices);
        startIndex = Math.max(startIndex - 2, 0);
        endIndex = Math.min(endIndex + 2, ctx.indices?.length ?? ctx.xValues.length);
        // @todo(AG-13575) Remove this if block
        if (this.processedData!.input.count < 1e3) {
            startIndex = 0;
            endIndex = this.processedData!.input.count;
        }

        // Process visible datums
        for (let i = startIndex; i < endIndex; i += 1) {
            const datumIndex = ctx.indices?.[i] ?? i;
            this.handleDatum(ctx, scratch, datumIndex);
        }
    }

    /**
     * Initializes the result context object with default values.
     * Called before populate phase to allow early return for invisible series.
     *
     * Note: We use the actual fillSpans/strokeSpans/phantomSpans because createStackContext()
     * runs BEFORE createNodeData() and populates these instance fields. They are valid
     * even in the early return case when !visible.
     */
    protected override initializeResult(ctx: AreaSeriesCreateNodeDatumContext): AreaSeriesNodeDataContext {
        const { visibleSameStackCount } = this.ctx.seriesStateManager.getVisiblePeerGroupIndex(this);

        return {
            itemId: ctx.yKey,
            // Use actual spans from createStackContext() - valid even for early return
            fillData: { spans: this.fillSpans, phantomSpans: this.phantomSpans },
            strokeData: { spans: this.strokeSpans },
            labelData: ctx.labelData,
            nodeData: ctx.nodes,
            scales: this.calculateScaling(),
            visible: this.visible,
            stackVisible: visibleSameStackCount > 0,
            crossFiltering: this.properties.selectedKey != null,
            styles: getMarkerStyles(this, this.properties, this.properties.marker),
            segments: undefined,
        };
    }

    /**
     * Assembles the final result with computed fields.
     * Note: fillData/strokeData are already set in initializeResult() from instance fields.
     */
    protected override assembleResult(
        ctx: AreaSeriesCreateNodeDatumContext,
        result: AreaSeriesNodeDataContext
    ): AreaSeriesNodeDataContext {
        const seriesRect = this.chart?.seriesRect;
        if (seriesRect == null) return result;

        // Calculate segments (only computed field needed beyond what initializeResult provides)
        result.segments = calculateSegments(
            this.properties.segmentation,
            ctx.xAxis,
            ctx.yAxis,
            seriesRect,
            this.ctx.scene,
            false
        );

        return result;
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
        const segments = this.contextNodeData?.segments;

        const highlightStyle = this.getHighlightStyle();
        const selectionStyle = this.getSelectionStyle();
        const seriesStyle = this.getStyle(undefined);
        const merged = mergeDefaults(selectionStyle, highlightStyle, seriesStyle);
        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, fill, fillOpacity, opacity } = merged;

        strokePaths.setProperties({
            segments,
            fill: undefined,
            lineCap: 'round',
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            opacity,
            visible: visible || animationEnabled,
        });
        strokePaths.datum = segments;

        fillPaths.setStyleProperties({ fill, stroke: undefined, fillOpacity }, this.getShapeFillBBox());

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
        datumSelection: Selection<MarkerSelectionDatum, Marker<MarkerSelectionDatum>>;
    }) {
        const { nodeData, datumSelection } = opts;
        const { contextNodeData, processedData, axes, properties } = this;
        const { marker, styler } = properties;

        const markerStyle = styler ? this.getStyle(undefined).marker : undefined;

        const markerDrawMode = cartesianMarkerDrawMode(
            properties,
            contextNodeData,
            processedData!,
            axes,
            marker,
            markerStyle,
            this.chart?.isMiniChart
        );
        this.hideWithSize0 = markerDrawMode.hideWithSize0;

        if (marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        const data = markerDrawMode.needsNodeData ? nodeData : [];
        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id
            return datumSelection.update(data);
        }
        return datumSelection.update(data, undefined, (datum) => createDatumId(datum.xValue));
    }

    private static readonly computeNoStylerMarkerStyle: AreaNoStylerCompute = (
        series,
        ctx,
        highlightState,
        selectionState,
        datum
    ) => {
        const stylerStyle = series.getStyle(highlightState);
        return series.getMarkerStyle(
            ctx.marker,
            datum,
            undefined,
            { isHighlight: ctx.isHighlight, highlightState, selectionState, hideWithSize0: ctx.hideWithSize0 },
            stylerStyle.marker,
            {
                stroke: stylerStyle.stroke,
                strokeWidth: stylerStyle.strokeWidth,
                strokeOpacity: stylerStyle.strokeOpacity,
            }
        );
    };

    private static readonly computeStylerStyle: AreaStylerCompute = (series, _ctx, highlightState) => {
        return series.getStyle(highlightState);
    };

    private static readonly applyStylerDatum: AreaStylerApply = (
        series,
        ctx,
        datum,
        highlightState,
        selectionState,
        stylerStyle
    ) => {
        const { stroke, strokeWidth, strokeOpacity } = stylerStyle;
        const params = series.makeItemStylerParams(
            ctx.dataModel,
            ctx.processedData,
            datum.datumIndex,
            stylerStyle.marker
        );
        datum.style = series.getMarkerStyle<NormalisedAreaSeriesMarkerItemStylerParams<unknown, unknown>>(
            ctx.marker,
            datum,
            params,
            { isHighlight: ctx.isHighlight, highlightState, selectionState, hideWithSize0: ctx.hideWithSize0 },
            stylerStyle.marker,
            { stroke, strokeWidth, strokeOpacity }
        );
    };

    protected override updateDatumStyles(opts: {
        datumSelection: Selection<MarkerSelectionDatum, Marker<MarkerSelectionDatum>>;
        isHighlight: boolean;
    }) {
        const { hideWithSize0 } = this;
        const { datumSelection, isHighlight } = opts;
        const { marker } = this.properties;
        const { itemStyler } = marker;

        if (itemStyler == null) {
            // No itemStyler: style is a pure function of (highlightState, selectionState).
            this.runMarkerStylePass<AreaNoStylerPassCtx, MarkerSelectionDatum, NormalisedSeriesMarkerStyle, AreaSeries>(
                datumSelection,
                isHighlight,
                { marker, hideWithSize0, isHighlight },
                { compute: AreaSeries.computeNoStylerMarkerStyle, apply: Series.assignCachedStyle }
            );
            return;
        }

        const ctx: AreaStylerPassCtx = {
            marker,
            hideWithSize0,
            isHighlight,
            dataModel: this.dataModel!,
            processedData: this.processedData!,
        };
        this.runMarkerStylePass<
            AreaStylerPassCtx,
            MarkerSelectionDatum,
            ReturnType<AreaSeries['getStyle']>,
            AreaSeries
        >(datumSelection, isHighlight, ctx, {
            compute: AreaSeries.computeStylerStyle,
            apply: AreaSeries.applyStylerDatum,
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<MarkerSelectionDatum, Marker<MarkerSelectionDatum>>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }) {
        const { contextNodeData, hideWithSize0 } = this;
        if (!contextNodeData) {
            return;
        }

        const { datumSelection, isHighlight } = opts;
        const fillBBox = this.getShapeFillBBox();

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const drawingMode = this.getDrawingMode(isHighlight, opts.drawingMode);
        // resolveMarkerDrawingMode only inspects `style` when the base mode is 'cutout'; for every
        // other mode it returns the input unchanged. Hoist that constant out of the per-marker loop.
        const constantDrawingMode = drawingMode === 'cutout' ? undefined : drawingMode;

        datumSelection.each((node, datum) => {
            const state = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const style = datum.style ?? contextNodeData.styles[state];
            this.applyMarkerStyle(style, node, datum.point, fillBBox, {
                crossFilterSelected: datum.crossFilterSelected,
                hideWithSize0,
            });
            const nextDrawingMode = constantDrawingMode ?? this.resolveMarkerDrawingModeForState(drawingMode, style);
            if (node.__drawingMode !== nextDrawingMode) {
                node.drawingMode = nextDrawingMode;
            }
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    protected override get labelProperty() {
        return this.properties.label;
    }

    protected override writeLabelPoint(datum: LabelSelectionDatum, x: number, y: number): LabelSelectionDatum {
        return { ...datum, x, y };
    }

    protected override readLabelPoint(datum: LabelSelectionDatum): Point {
        return datum;
    }

    makeStylerParams(
        highlightStateEnum: HighlightState | undefined,
        selectionStateEnum: SelectionState | undefined,
        candidateStateEnum: SelectionState | undefined
    ): AgAreaSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { marker, fill, fillOpacity, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth, xKey, yKey } =
            this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);
        const selectionState = toSelectionString(selectionStateEnum);
        const candidateState = toSelectionString(candidateStateEnum);

        type MarkerRules = { marker: RequireOptional<NormalisedSeriesMarkerStyle> };
        type ResultRules = NormalisedCallbackParams<
            AgAreaSeriesStylerParams<unknown, unknown> & MarkerRules,
            { fill?: NormalisedColorType }
        >;
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
            selectionState,
            candidateState,
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
        style: Required<NormalisedSeriesMarkerStyle>
    ): NormalisedAreaSeriesMarkerItemStylerParams<unknown, unknown> {
        const { xKey, yKey } = this.properties;

        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData, 'mixed-numeric')[datumIndex];
        const xDomain = dataModel.getDomain(this, `xValue`, 'key', processedData).domain;
        const yDomain = dataModel.getDomain(this, this.yCumulativeKey(processedData), 'value', processedData).domain;
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            ...datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
            xValue,
            yValue,
            ...style,
            fill,
        } satisfies NormalisedCallbackParams<
            NormalisedAreaSeriesMarkerItemStylerParams<unknown, unknown>,
            { fill: NormalisedColorType }
        >;
    }

    protected override makeLabelFormatterParams(): AgAreaSeriesLabelFormatterParams {
        const { xKey, xName, yKey, yName, legendItemName } = this.properties;
        return { xKey, xName, yKey, yName, legendItemName } satisfies RequireOptional<AgAreaSeriesLabelFormatterParams>;
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const allowNullKeys = properties.allowNullKeys ?? false;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData, 'mixed-numeric')[datumIndex];

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        if (xValue === undefined && !allowNullKeys) return;

        const stylerStyle = this.getStyle(undefined);
        const params = this.makeItemStylerParams(dataModel, processedData, datumIndex, stylerStyle.marker);

        const format = this.getMarkerStyle<NormalisedAreaSeriesMarkerItemStylerParams<unknown, unknown>>(
            this.properties.marker,
            { datumIndex, datum },
            params,
            { isHighlight: false },
            stylerStyle.marker
        ) as RequireOptional<NormalisedSeriesMarkerStyle>;

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName, allowNullKeys),
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
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, marker } = this.getStyle(undefined);
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
                enabled: visible && (legendManager?.getItemEnabled({ seriesId, itemId }) ?? true),
                label: {
                    text: legendItemName ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    protected override resetDatumAnimation(data: AreaAnimationData): void {
        // Use direct reset for datum selection to bypass resetMotion callback overhead
        resetMarkerSelectionsDirect([data.datumSelection]);
    }

    override animateEmptyUpdateReady(animationData: AreaAnimationData) {
        const { datumSelection, labelSelection, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([datumSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(
            this,
            animationManager,
            { ...this.getAnimationDrawingModes(), phase: 'initial' },
            datumSelection
        );
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

            markerFadeInAnimation(this, animationManager, 'added', this.getAnimationDrawingModes(), datumSelection);
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

        markerFadeInAnimation(this, animationManager, undefined, this.getAnimationDrawingModes(), datumSelection);

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
        return new Marker<MarkerSelectionDatum>();
    }

    public getStyle(highlightState: HighlightState | undefined): Required<NormalisedAreaSeriesStylerResult> & {
        marker: Required<NormalisedSeriesMarkerStyle> & { enabled: boolean };
    } {
        const { styler, marker, fill, fillOpacity, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } =
            this.properties;
        const { size, shape, fill: markerFill = 'transparent', fillOpacity: markerFillOpacity } = marker;
        let stylerResult: NormalisedAreaSeriesStylerResult & { marker?: { enabled?: boolean } } = {};
        if (styler) {
            const selectionState: SelectionState | undefined = this.getDataSelectionState(undefined);
            const candidateState: SelectionState | undefined = this.getDataCandidacyState(undefined);
            const stylerParams = this.makeStylerParams(highlightState, selectionState, candidateState);
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
            } satisfies RequireOptional<NormalisedSeriesMarkerStyle> & { enabled: boolean },
        } satisfies RequireOptional<NormalisedAreaSeriesStylerResult> & { marker: { enabled: boolean } };
    }

    public getFormattedMarkerStyle(datum: MarkerSelectionDatum) {
        const stylerStyle = this.getStyle(undefined);
        const params = this.makeItemStylerParams(
            this.dataModel!,
            this.processedData!,
            datum.datumIndex,
            stylerStyle.marker
        );

        return this.getMarkerStyle<NormalisedAreaSeriesMarkerItemStylerParams<unknown, unknown>>(
            this.properties.marker,
            datum,
            params,
            { isHighlight: true },
            undefined,
            stylerStyle
        );
    }

    public override isPointInArea(x: number, y: number): boolean {
        let fillPath: Path | undefined;
        for (const child of this.backgroundGroup.children()) {
            if (child instanceof Path) {
                fillPath = child;
                break;
            }
        }

        if (!fillPath?.getBBox().containsPoint(x, y)) {
            return false;
        }

        return fillPath.isPointInPath(x, y);
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.styler != null ||
            this.properties.marker.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
