import type {
    CallbackParamRules,
    DomainWithMetadata,
    DynamicContext,
    NormalisedLineSeriesStylerResult,
    NormalisedSeriesMarkerStyle,
    Point,
    PointLabelDatum,
    RequireOptional,
    Writeable,
} from 'ag-charts-core';
import {
    AGGREGATION_INDEX_Y_MAX,
    ChartAxisDirection,
    DEFAULT_MARKERLESS_LABEL_GAP,
    DebugMetrics,
    applyStyledMarkerSize,
    cachedTextMeasurer,
    extent,
    isDefined,
    mergeDefaults,
    placedLabelFit,
    resolveLabelFit,
    toArray,
    toNumber,
} from 'ag-charts-core';
import {
    type AgDrawingMode,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgLineSeriesLabelFormatterParams,
    type AgLineSeriesMarkerItemStylerParams,
    type AgLineSeriesOptions,
    type AgLineSeriesStylerParams,
} from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { fromToMotion, staticFromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';
import { LogAxis } from '../../axis/logAxis';
import { NumberAxis } from '../../axis/numberAxis';
import type { ChartAxis } from '../../chartAxis';
import type { DataController } from '../../data/dataController';
import type { DataModel, DataModelOptions, DatumPropertyDefinition, ProcessedData } from '../../data/dataModel';
import { extendDomainToZero, fixNumericExtent } from '../../data/dataModel';
import {
    animationValidation,
    createDatumId,
    diff,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    processedDataIsAnimatable,
    valueProperty,
} from '../../data/processors';
import { expandPlacementLabelBoxExtent } from '../../label';
import { boundLabelFit, insideMarkerContainer, resolveInsidePlacement } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import { type LegendSymbolOptions } from '../../legend/legendSymbol';
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
import { datumStylerProperties } from '../util';
import { DEFAULT_CARTESIAN_DIRECTION_KEYS, DEFAULT_CARTESIAN_DIRECTION_NAMES } from './cartesianSeries';
import type { CartesianAnimationDataOf } from './cartesianSeriesTypes';
import {
    type LineSeriesDataAggregationFilter,
    aggregateLineDataFromDataModel,
    aggregateLineDataFromDataModelPartial,
} from './lineAggregation';
import { LineSeriesProperties } from './lineSeriesProperties';
import {
    type LineNodeDatum,
    type LineNodeDatumScratch,
    type LinePathSpan,
    type LineSeriesDatumContext,
    type LineSeriesNodeDataContext,
    type LineSpanPointDatum,
    interpolatePoints,
    plotLinePathStroke,
    prepareLinePathAnimation,
} from './lineUtil';
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
import { buildResetPathFn, pathSwipeInAnimation, updateClipPath } from './pathUtil';
import { PlacedLabelCartesianSeries, type PlacedLabelSeriesTypes } from './placedLabelCartesianSeries';
import { calculateSegments } from './util';

/**
 * Consolidated type interface for LineSeries.
 * Defines all type parameters in one place for the series.
 */
interface LineSeriesTypes extends PlacedLabelSeriesTypes {
    readonly node: Marker<LineNodeDatum>;
    readonly options: AgLineSeriesOptions;
    readonly properties: LineSeriesProperties;
    readonly datum: LineNodeDatum;
    readonly label: LineNodeDatum;
    readonly labelParams: AgLineSeriesLabelFormatterParams;
    readonly context: LineSeriesNodeDataContext;
    readonly stackContext: never;
    readonly createNodeDataContext: LineSeriesDatumContext;
}

type LineAnimationData = CartesianAnimationDataOf<LineSeriesTypes>;

/** Per-pass context for the no-itemStyler marker-style pass. */
interface LineNoStylerPassCtx {
    marker: LineSeriesProperties['marker'];
    hideWithSize0: boolean;
    isHighlight: boolean;
}

/** Per-pass context for the itemStyler marker-style pass. */
interface LineStylerPassCtx extends LineNoStylerPassCtx {
    xColumn: any[];
    yColumn: any[];
    xDomain: any[];
    yDomain: any[];
    xKey: string;
    yKey: string;
}

type LineNoStylerCompute = MarkerStyleCompute<
    LineSeries,
    LineNoStylerPassCtx,
    LineNodeDatum,
    NormalisedSeriesMarkerStyle
>;
type LineStylerCompute = MarkerStyleCompute<
    LineSeries,
    LineStylerPassCtx,
    LineNodeDatum,
    ReturnType<LineSeries['getStyle']>
>;
type LineStylerApply = MarkerStyleApply<
    LineSeries,
    LineStylerPassCtx,
    LineNodeDatum,
    ReturnType<LineSeries['getStyle']>
>;

export class LineSeries extends PlacedLabelCartesianSeries<LineSeriesTypes> {
    static override readonly className = 'LineSeries';
    static readonly type = 'line' as const;

    override properties = new LineSeriesProperties();

    override createNodeParams(datum: LineNodeDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
        };
    }

    private readonly aggregationManager = new AggregationManager<LineSeriesDataAggregationFilter>();
    private hideWithSize0 = false;
    private markerNodesPickable = true;

    protected override hasPickableNodeShapes(): boolean {
        return this.markerNodesPickable;
    }

    override get pickModeAxis() {
        return this.properties.sparklineMode ? 'main' : 'main-category';
    }

    constructor(moduleCtx: DynamicContext<ChartRegistry>) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: 'xValue',
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            datumSelectionGarbageCollection: false,
            segmentedDataNodes: false,
            usesPlacedLabels: true,
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                datum: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
            clipFocusBox: false,
        });
    }

    private isNormalized() {
        return this.properties.normalizedTo != null;
    }

    override renderToOffscreenCanvas(): boolean {
        const hasMarkers = (this.contextNodeData?.nodeData?.length ?? 0) > 0;
        return (hasMarkers && this.getDrawingMode(false) === 'cutout') || super.renderToOffscreenCanvas();
    }

    override async processData(dataController: DataController) {
        if (this.data == null) return;

        const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 0 } = {} } = this;
        const { xKey, yKey, selectedKey, connectMissingData, normalizedTo } = this.properties;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const stacked = stackCount > 1 || normalizedTo != null;

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if (connectMissingData && stacked) {
            common.invalidValue = 0;
        }
        if (stacked && !visible) {
            common.forceValue = 0;
        }

        const idMap = {
            value: `area-stack-${groupIndex}-yValue`,
            marker: `area-stack-${groupIndex}-yValues-marker`,
        };

        const props: DataModelOptions<any, false, false>['props'] = [];
        const allowNullKey = this.properties.allowNullKeys ?? false;

        // If two or more datum share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datum and
        // automatically garbage collect the marker selection.
        if (!isContinuousX || stacked) {
            props.push(keyProperty(xKey, xScaleType, { id: 'xKey', allowNullKey }));
        }

        props.push(
            valueProperty(xKey, xScaleType, { id: 'xValue', allowNullKey }),
            valueProperty(yKey, yScaleType, {
                id: `yValueRaw`,
                ...common,
                invalidValue: undefined,
            })
        );

        if (selectedKey != null) {
            props.push(valueProperty(selectedKey, 'category', { id: 'selectedRaw' }));
        }

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

        if (this.needsDataModelDiff()) {
            props.push(animationValidation(isContinuousX ? ['xValue'] : undefined));
            if (this.processedData) {
                props.push(diff(this.id, this.processedData));
            }
        }

        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, data, {
            props,
            groupByKeys: stacked,
            groupByData: !stacked,
        });

        this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    private yValueKey() {
        return this.isNormalized() ? 'yValue' : 'yValueRaw';
    }

    private yCumulativeKey(processData: ProcessedData<any>) {
        return processData.type === 'grouped' ? 'yValueCumulative' : this.yValueKey();
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

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { dataModel, processedData, axes } = this;
        if (!dataModel || !processedData) return { domain: [] };

        const yAxis = axes[ChartAxisDirection.Y];

        if (direction === ChartAxisDirection.X) {
            const xDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const xDomain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
                // Attach sort metadata for discrete domains to enable scale optimization
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain: xDomain.domain, sortMetadata };
            }

            return { domain: fixNumericExtent(extent(xDomain.domain)) };
        }

        const yExtent = this.domainForClippedRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(processedData)],
            'xValue'
        );

        if (this.isNormalized() && yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
            return { domain: fixNumericExtent(extendDomainToZero(yExtent)) };
        } else {
            return { domain: fixNumericExtent(yExtent) };
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [number, number]): [number, number] {
        // domainForVisibleRange may yield a bigint; narrow once for this number-typed range contract.
        const [y0, y1] = this.domainForVisibleRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(this.processedData!)],
            'xValue',
            visibleRange
        );
        return [toNumber(y0), toNumber(y1)];
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

    private aggregateData(dataModel: DataModel<any, any>, processedData: ProcessedData<any>): void {
        this.aggregationManager.markStale(processedData.input.count);

        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateLineDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this.yCumulativeKey(processedData),
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateLineDataFromDataModel(
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

    protected override createBucketLookupFeature(): BucketLookupFeature {
        return new BucketLookupManager({
            series: this,
            getXAxis: () => this.axes[ChartAxisDirection.X],
            getDataModel: () => this.dataModel,
            getProcessedData: () => this.processedData,
            aggregationManager: this.aggregationManager,
            dataSelectionService: this.ctx.dataSelectionService,
            domainKey: 'value',
            canonicalExtremaSlots: [AGGREGATION_INDEX_Y_MAX],
        });
    }

    private estimateTargetRange(): number {
        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis?.scale?.range) {
            const [r0, r1] = xAxis.scale.range;
            return Math.abs(r1 - r0);
        }
        return this.ctx.scene?.canvas?.width ?? 800;
    }

    /**
     * Creates the context object for efficient node datum creation.
     * Caches expensive-to-compute values that are reused across all datum iterations
     * to minimize memory allocations. Only caches values that are expensive to
     * compute - cheap property lookups use `this` directly.
     */
    protected override createNodeDatumContext(xAxis: ChartAxis, yAxis: ChartAxis): LineSeriesDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        // Ensure we have the aggregation level needed for the current range
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        this.ensureBucketLookupFeature()?.setActiveFilter(processedData, dataAggregationFilter);
        const canIncrementallyUpdate = this.canIncrementallyUpdateNodes(dataAggregationFilter != null);

        const { label, marker } = this.properties;
        const { collision } = label;
        const placements = toArray(label.placement);
        const {
            insideOnly,
            offset: labelInsideOffset,
            size: labelInsideSize,
        } = resolveInsidePlacement(placements, marker.shape);
        const markerSize = marker.enabled ? marker.size : 0;
        const insideFit = insideOnly ? resolveLabelFit(label, false, true) : undefined;
        const labelFit = insideFit
            ? boundLabelFit(insideFit, insideMarkerContainer(markerSize, marker.shape, collision.threshold ?? 0))
            : resolveLabelFit(label, !collision.alwaysShow);
        // Keeps the label on a marker too small to hold even an ellipsis.
        const labelFitOverflow = collision.alwaysShow ? insideFit : undefined;
        const labelAnchor = Marker.anchor(marker.shape);

        return {
            xAxis,
            yAxis,
            rawData,
            xValues: dataModel.resolveColumnById(this, 'xValue', processedData, 'object'),
            yRawValues: dataModel.resolveColumnById(this, 'yValueRaw', processedData, 'mixed-numeric'),
            yCumulativeValues: dataModel.resolveColumnById(
                this,
                this.yCumulativeKey(processedData),
                processedData,
                'mixed-numeric'
            ),
            crossFilterSelectionValues: this.properties.selectedKey
                ? dataModel.resolveColumnById(this, 'selectedRaw', processedData, 'boolean')
                : undefined,
            xScale,
            yScale,
            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: (yScale.bandwidth ?? 0) / 2,
            size: markerSize,
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y).domain,
            labelsEnabled: this.properties.label.enabled,
            labelPadding: expandPlacementLabelBoxExtent(this.properties.label),
            labelTextMeasurer: cachedTextMeasurer(this.properties.label),
            labelFit,
            labelFitOverflow,
            labelStyled: label.itemStyler != null,
            labelInsideOffset,
            labelInsideSize,
            labelAnchor,
            animationEnabled: !this.ctx.animationManager.isSkipped(),
            canIncrementallyUpdate,
            dataAggregationFilter,
            range,
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
            xName: this.properties.xName,
            yName: this.properties.yName,
            legendItemName: this.properties.legendItemName,
            connectMissingData: this.properties.connectMissingData,
            capDefaults: {
                lengthRatioMultiplier: this.properties.marker.getDiameter(),
                lengthMax: Infinity,
            },
            nodes: canIncrementallyUpdate ? this.contextNodeData!.nodeData : [],
            spanPoints: [],
            nodeIndex: 0,
        };
    }

    /**
     * Processes a single datum and updates the context's nodes and spanPoints arrays.
     * Uses the scratch object to avoid per-iteration allocations.
     */
    private handleDatum(ctx: LineSeriesDatumContext, scratch: LineNodeDatumScratch, datumIndex: number): void {
        // Populate scratch from context arrays
        scratch.datum = ctx.rawData[datumIndex];
        scratch.xDatum = ctx.xValues[datumIndex];
        scratch.yDatum = ctx.yRawValues[datumIndex];
        scratch.yCumulative = ctx.yCumulativeValues[datumIndex];
        scratch.crossFilterSelected = ctx.crossFilterSelectionValues?.[datumIndex];

        scratch.x = ctx.xScale.convert(scratch.xDatum) + ctx.xOffset;
        scratch.y = ctx.yScale.convert(scratch.yCumulative) + ctx.yOffset;

        if (!Number.isFinite(scratch.x)) return;

        if (scratch.yDatum != null) {
            const labelText = ctx.labelsEnabled
                ? this.getLabelText<AgLineSeriesLabelFormatterParams>(
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
                  )
                : undefined;

            const label = this.measureLabel(ctx, labelText);
            const fit = placedLabelFit(labelText, this.properties.label, ctx);
            // Markerless vertices still nudge their label clear of the line with a small fixed gap.
            const gap = ctx.size > 0 ? ctx.size / 2 : DEFAULT_MARKERLESS_LABEL_GAP;

            const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

            if (canReuseNode) {
                // Update existing node datum in place
                const existingNode: Writeable<LineNodeDatum> = ctx.nodes[ctx.nodeIndex];
                existingNode.datum = scratch.datum;
                existingNode.datumIndex = datumIndex;
                existingNode.point = { x: scratch.x, y: scratch.y, size: ctx.size };
                existingNode.midPoint = { x: scratch.x, y: scratch.y };
                // Metadata only; position already used the exact bigint, so narrowing here is fine.
                existingNode.cumulativeValue = Number(scratch.yCumulative);
                existingNode.cumulativeValueExact = scratch.yCumulative;
                existingNode.yValue = scratch.yDatum;
                existingNode.xValue = scratch.xDatum;
                existingNode.labelText = labelText;
                existingNode.label = label;
                existingNode.fit = fit;
                existingNode.gap = gap;
                existingNode.crossFilterSelected = scratch.crossFilterSelected;
            } else {
                ctx.nodes.push({
                    series: this,
                    datum: scratch.datum,
                    datumIndex,
                    yKey: ctx.yKey,
                    xKey: ctx.xKey,
                    point: { x: scratch.x, y: scratch.y, size: ctx.size },
                    midPoint: { x: scratch.x, y: scratch.y },
                    cumulativeValue: Number(scratch.yCumulative),
                    cumulativeValueExact: scratch.yCumulative,
                    yValue: scratch.yDatum,
                    xValue: scratch.xDatum,
                    capDefaults: ctx.capDefaults,
                    labelText,
                    label,
                    fit,
                    anchor: ctx.labelAnchor,
                    insideOffset: ctx.labelInsideOffset,
                    insideSize: ctx.labelInsideSize,
                    placement: 'top',
                    gap,
                    crossFilterSelected: scratch.crossFilterSelected,
                });
            }
            ctx.nodeIndex++;
        }

        // Update span points for path rendering
        this.updateSpanPoints(ctx, scratch);
    }

    /**
     * Updates span points array based on current scratch values.
     */
    private updateSpanPoints(ctx: LineSeriesDatumContext, scratch: LineNodeDatumScratch): void {
        const currentSpanPoints: LineSpanPointDatum[] | { skip: number } | undefined = ctx.spanPoints.at(-1);

        if (scratch.yDatum != null) {
            const spanPoint: LineSpanPointDatum = {
                point: { x: scratch.x, y: scratch.y },
                xDatum: scratch.xDatum,
                yDatum: scratch.yCumulative,
            };

            if (Array.isArray(currentSpanPoints)) {
                currentSpanPoints.push(spanPoint);
            } else if (currentSpanPoints == null) {
                ctx.spanPoints.push([spanPoint]);
            } else {
                currentSpanPoints.skip += 1;
                ctx.spanPoints.push([spanPoint]);
            }
        } else if (!ctx.connectMissingData) {
            if (Array.isArray(currentSpanPoints) || currentSpanPoints == null) {
                ctx.spanPoints.push({ skip: 0 });
            } else {
                currentSpanPoints.skip += 1;
            }
        }
    }

    /**
     * Populates node data by iterating over the visible range.
     */
    protected override populateNodeData(ctx: LineSeriesDatumContext): void {
        // Reusable scratch object to avoid per-datum allocations
        const scratch: LineNodeDatumScratch = {
            datum: undefined,
            xDatum: undefined,
            yDatum: undefined,
            yCumulative: 0,
            crossFilterSelected: undefined,
            x: 0,
            y: 0,
        };

        // Compute visible range and iterate
        const indices = ctx.dataAggregationFilter?.indices;
        let [start, end] = this.visibleRangeIndices('xValue', ctx.xAxis.range, indices);
        start = Math.max(start - 1, 0);
        end = Math.min(end + 1, indices?.length ?? ctx.xValues.length);

        // @todo(AG-13575) Remove this if block
        if (this.processedData!.input.count < 1e3) {
            start = 0;
            end = this.processedData!.input.count;
        }

        for (let i = start; i < end; i += 1) {
            this.handleDatum(ctx, scratch, indices?.[i] ?? i);
        }
    }

    /**
     * Creates the initial result context object.
     * Note: strokeData and segments are computed in assembleResult, but we need valid defaults
     * for the early return case (when !this.visible).
     */
    protected override initializeResult(ctx: LineSeriesDatumContext): LineSeriesNodeDataContext {
        return {
            itemId: ctx.yKey,
            nodeData: ctx.nodes,
            labelData: ctx.labelsEnabled ? ctx.nodes : [],
            strokeData: { itemId: ctx.yKey, spans: [] }, // Default for early return
            scales: this.calculateScaling(),
            visible: this.visible,
            crossFiltering: false,
            styles: getMarkerStyles(this, this.properties, this.properties.marker),
            segments: undefined,
        };
    }

    /**
     * Assembles the final result by computing strokeData, crossFiltering, and segments.
     */
    protected override assembleResult(
        ctx: LineSeriesDatumContext,
        result: LineSeriesNodeDataContext
    ): LineSeriesNodeDataContext {
        // Build stroke data from span points
        const strokeSpans = ctx.spanPoints.flatMap((p): LinePathSpan[] => {
            return Array.isArray(p) ? interpolatePoints(p, this.properties.interpolation) : [];
        });
        result.strokeData = { itemId: ctx.yKey, spans: strokeSpans };

        result.crossFiltering = this.properties.selectedKey != null;

        const seriesRect = this.chart?.seriesRect;
        if (seriesRect == null) return result;

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
            paths: [lineNode],
            visible,
            animationEnabled,
        } = opts;

        const highlightStyle = this.getHighlightStyle();
        const selectionStyle = this.getSelectionStyle();
        const seriesStyle = this.getStyle(undefined);
        const merged = mergeDefaults(selectionStyle, highlightStyle, seriesStyle);
        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = merged;

        const segments = this.contextNodeData?.segments;

        lineNode.setProperties({
            segments,
            fill: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            opacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
        });

        lineNode.datum = segments;

        if (!animationEnabled) {
            lineNode.visible = visible;
        }

        updateClipPath(this, lineNode);
    }

    protected override updateDatumSelection(opts: {
        nodeData: LineNodeDatum[];
        datumSelection: Selection<LineNodeDatum, Marker<LineNodeDatum>>;
    }) {
        let { nodeData } = opts;
        const { datumSelection } = opts;
        const { contextNodeData, processedData, axes, properties } = this;
        const { marker } = properties;

        const markerDrawMode = cartesianMarkerDrawMode(
            properties,
            contextNodeData,
            processedData!,
            axes,
            marker,
            marker,
            this.chart?.isMiniChart
        );
        this.hideWithSize0 = markerDrawMode.hideWithSize0;
        this.markerNodesPickable = markerDrawMode.needsNodeData && !markerDrawMode.hideWithSize0;
        nodeData = markerDrawMode.needsNodeData ? nodeData : [];

        if (marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id
            return datumSelection.update(nodeData);
        }
        return datumSelection.update(nodeData, undefined, (datum) => createDatumId(datum.xValue));
    }

    private static readonly computeNoStylerMarkerStyle: LineNoStylerCompute = (
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

    private static readonly computeStylerStyle: LineStylerCompute = (series, _ctx, highlightState) => {
        return series.getStyle(highlightState);
    };

    private static readonly applyStylerDatum: LineStylerApply = (
        series,
        ctx,
        datum,
        highlightState,
        selectionState,
        stylerStyle
    ) => {
        const { stroke, strokeWidth, strokeOpacity } = stylerStyle;
        const markerStyle = stylerStyle.marker;
        const xValue = ctx.xColumn[datum.datumIndex];
        const yValue = ctx.yColumn[datum.datumIndex];
        const fill = series.filterItemStylerFillParams(markerStyle.fill) ?? markerStyle.fill;
        const params: AgLineSeriesMarkerItemStylerParams<unknown, unknown> = {
            ...datumStylerProperties(xValue, yValue, ctx.xKey, ctx.yKey, ctx.xDomain, ctx.yDomain),
            xValue,
            yValue,
            ...markerStyle,
            fill,
        };
        datum.style = series.getMarkerStyle(
            ctx.marker,
            datum,
            params,
            { isHighlight: ctx.isHighlight, highlightState, selectionState, hideWithSize0: ctx.hideWithSize0 },
            markerStyle,
            { stroke, strokeWidth, strokeOpacity }
        );
    };

    protected override updateDatumStyles(opts: {
        datumSelection: Selection<LineNodeDatum, Marker<LineNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { hideWithSize0 } = this;
        const { datumSelection, isHighlight } = opts;
        const { marker } = this.properties;
        const { itemStyler } = marker;

        if (itemStyler == null) {
            // No itemStyler: style is a pure function of (highlightState, selectionState).
            this.runMarkerStylePass<LineNoStylerPassCtx, LineNodeDatum, NormalisedSeriesMarkerStyle, LineSeries>(
                datumSelection,
                isHighlight,
                { marker, hideWithSize0, isHighlight },
                { compute: LineSeries.computeNoStylerMarkerStyle, apply: Series.assignCachedStyle }
            );
            return;
        }

        // Hoist resolveColumnById/getDomain out of the per-datum loop — they don't depend on datumIndex.
        const dataModel = this.dataModel!;
        const processedData = this.processedData!;
        const { xKey, yKey } = this.properties;
        const ctx: LineStylerPassCtx = {
            marker,
            hideWithSize0,
            isHighlight,
            xColumn: dataModel.resolveColumnById(this, 'xValue', processedData, 'object'),
            yColumn: dataModel.resolveColumnById(this, 'yValueRaw', processedData, 'mixed-numeric'),
            xDomain: dataModel.getDomain(this, 'xValue', 'key', processedData).domain,
            yDomain: dataModel.getDomain(this, this.yCumulativeKey(processedData), 'value', processedData).domain,
            xKey,
            yKey,
        };
        this.runMarkerStylePass<LineStylerPassCtx, LineNodeDatum, ReturnType<LineSeries['getStyle']>, LineSeries>(
            datumSelection,
            isHighlight,
            ctx,
            { compute: LineSeries.computeStylerStyle, apply: LineSeries.applyStylerDatum }
        );
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<LineNodeDatum, Marker<LineNodeDatum>>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }) {
        const { contextNodeData, hideWithSize0 } = this;
        if (!contextNodeData) {
            return;
        }

        const { datumSelection, isHighlight } = opts;

        const applyPosition = this.ctx.animationManager.isSkipped();
        const fillBBox = this.getShapeFillBBox();

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const drawingMode = this.getDrawingMode(isHighlight, opts.drawingMode);
        // resolveMarkerDrawingMode only inspects `style` when the base mode is 'cutout'; for every
        // other mode it returns the input unchanged. Hoist that constant out of the per-marker loop.
        const constantDrawingMode = drawingMode === 'cutout' ? undefined : drawingMode;

        const thisSeries = this;
        datumSelection.each(function datumSelectionUpdate(node, datum) {
            // updateDatumStyles populates datum.style for non-garbage nodes; the fallback below is rare.
            const style =
                datum.style ??
                contextNodeData.styles[thisSeries.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];
            thisSeries.applyMarkerStyle(style, node, datum.point, fillBBox, {
                applyPosition,
                crossFilterSelected: datum.crossFilterSelected,
                hideWithSize0,
            });
            const nextDrawingMode =
                constantDrawingMode ?? thisSeries.resolveMarkerDrawingModeForState(drawingMode, style);
            // Short-circuit the change-detection setter when the value already matches — avoids
            // the accessor call + dirty mark across every marker on every re-render.
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

    override getLabelData(): (LineNodeDatum & PointLabelDatum)[] {
        const labelData = super.getLabelData();
        const { marker } = this.properties;
        // A marker itemStyler resolves its size after node data was built, so the styled size is stamped
        // on here — the label's obstacles, gap and anchor all scale off the marker that gets drawn.
        if (marker.enabled && marker.itemStyler != null) {
            for (const datum of labelData) {
                applyStyledMarkerSize(datum, datum.style?.size);
            }
        }
        return labelData;
    }

    protected override writeLabelPoint(datum: LineNodeDatum, x: number, y: number): LineNodeDatum {
        return { ...datum, point: { ...datum.point, x, y } };
    }

    protected override readLabelPoint(datum: LineNodeDatum): Point {
        return datum.point;
    }

    makeStylerParams(
        highlightStateEnum: HighlightState | undefined,
        selectionStateEnum: SelectionState | undefined,
        candidateStateEnum: SelectionState | undefined
    ): AgLineSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { marker, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth, xKey, yKey } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);
        const selectionState = toSelectionString(selectionStateEnum);
        const candidateState = toSelectionString(candidateStateEnum);

        type MarkerRules = { marker: RequireOptional<NormalisedSeriesMarkerStyle> };
        type ResultRules = CallbackParamRules<AgLineSeriesStylerParams<unknown, unknown> & MarkerRules>;
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
    ): AgLineSeriesMarkerItemStylerParams<unknown, unknown> {
        const { xKey, yKey } = this.properties;

        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData, 'object')[datumIndex];
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
        } satisfies CallbackParamRules<AgLineSeriesMarkerItemStylerParams<unknown, unknown>>;
    }

    protected override makeLabelFormatterParams(): AgLineSeriesLabelFormatterParams {
        const { xKey, xName, yKey, yName, legendItemName } = this.properties;
        return { xKey, xName, yKey, yName, legendItemName } satisfies RequireOptional<AgLineSeriesLabelFormatterParams>;
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const allowNullKeys = properties.allowNullKeys ?? false;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData, 'object')[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData, 'mixed-numeric')[datumIndex];

        if (xValue === undefined && !allowNullKeys) return;

        const stylerStyle = this.getStyle(undefined);
        const params = this.makeItemStylerParams(dataModel, processedData, datumIndex, stylerStyle.marker);

        const format = this.getMarkerStyle(
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

    private legendItemSymbol(): LegendSymbolOptions {
        const { stroke, strokeOpacity, strokeWidth, lineDash, marker } = this.getStyle(undefined);

        const markerStyle = this.getMarkerStyle(
            this.properties.marker,
            {},
            undefined,
            {
                isHighlight: false,
                checkForHighlight: false,
            },
            {
                size: marker.size,
                shape: marker.shape,
                fill: marker.fill,
                fillOpacity: marker.fillOpacity,
                stroke: marker.stroke,
                strokeOpacity: marker.strokeOpacity,
                strokeWidth: marker.strokeWidth,
                lineDash: marker.lineDash,
                lineDashOffset: marker.lineDashOffset,
            } satisfies RequireOptional<NormalisedSeriesMarkerStyle>
        );

        return {
            marker: {
                ...markerStyle,
                enabled: this.properties.marker.enabled,
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

        const { yKey: itemId, yName, title, legendItemName, showInLegend } = this.properties;

        return [
            {
                legendType,
                id: seriesId,
                itemId,
                legendItemName,
                seriesId,
                enabled: visible && (legendManager?.getItemEnabled({ seriesId, itemId }) ?? true),
                label: {
                    text: legendItemName ?? title ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    protected override updatePaths(opts: { contextData: LineSeriesNodeDataContext; paths: Path[] }) {
        this.updateLinePaths(opts.paths, opts.contextData);
    }

    private updateLinePaths(paths: Path[], contextData: LineSeriesNodeDataContext) {
        const spans = contextData.strokeData.spans;
        const [lineNode] = paths;

        lineNode.path.clear();
        plotLinePathStroke(lineNode, spans);
        lineNode.markDirty('LineSeries');
    }

    protected override resetDatumAnimation(data: LineAnimationData): void {
        // Use direct reset for datum selection to bypass resetMotion callback overhead
        resetMarkerSelectionsDirect([data.datumSelection]);
    }

    protected override animateEmptyUpdateReady(animationData: LineAnimationData) {
        const { datumSelection, labelSelection, annotationSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateLinePaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([datumSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(
            this,
            animationManager,
            { ...this.getAnimationDrawingModes(), phase: 'initial' },
            datumSelection
        );
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
        seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
    }

    protected override animateReadyResize(animationData: LineAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateLinePaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    protected override animateWaitingUpdateReady(animationData: LineAnimationData) {
        const { animationManager } = this.ctx;
        const {
            datumSelection,
            labelSelection: labelSelections,
            annotationSelections,
            contextData,
            paths,
            previousContextData,
        } = animationData;
        const [path] = paths;

        if (contextData.visible === false && previousContextData?.visible === false) return;

        this.resetDatumAnimation(animationData);
        this.resetLabelAnimation(animationData);

        const update = () => {
            this.resetPathAnimation(animationData);
            this.updateLinePaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', this.getAnimationDrawingModes(), datumSelection);
            staticFromToMotion(
                this.id,
                'path_properties',
                animationManager,
                [path],
                { opacity: 0 },
                { opacity: this.getOpacity() },
                { phase: 'add' }
            );
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
            return;
        }

        if (contextData.crossFiltering !== previousContextData.crossFiltering) {
            skip();
            return;
        }

        const fns = prepareLinePathAnimation(
            contextData,
            previousContextData,
            this.processedData?.reduced?.diff?.[this.id],
            this.getOpacity()
        );

        if (fns === undefined) {
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        fromToMotion(this.id, 'path_properties', animationManager, [path], fns.stroke.pathProperties);

        if (fns.status === 'added') {
            this.updateLinePaths(paths, contextData);
        } else if (fns.status === 'removed') {
            this.updateLinePaths(paths, previousContextData);
        } else {
            pathMotion(this.id, 'path_update', animationManager, [path], fns.stroke.path);
        }

        if (fns.hasMotion) {
            markerFadeInAnimation(this, animationManager, undefined, this.getAnimationDrawingModes(), datumSelection);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
        }

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
            onComplete: () => this.updateLinePaths(paths, contextData),
        });
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }

    protected nodeFactory() {
        return new Marker<LineNodeDatum>();
    }

    public getStyle(
        highlightState: HighlightState | undefined
    ): Required<NormalisedLineSeriesStylerResult> & { marker: Required<NormalisedSeriesMarkerStyle> } {
        const { styler, marker, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = this.properties;
        const { size, shape, fill = 'transparent', fillOpacity } = marker;
        let stylerResult: NormalisedLineSeriesStylerResult = {};
        if (styler) {
            const selectionState: SelectionState | undefined = this.getDataSelectionState(undefined);
            const candidateState: SelectionState | undefined = this.getDataCandidacyState(undefined);
            const stylerParams = this.makeStylerParams(highlightState, selectionState, candidateState);
            const cbResult = this.cachedCallWithContext(styler, stylerParams) ?? {};
            // resolvePartial has already resolved any colour refs returned by the styler.
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            stylerResult = resolved ?? {};
        }
        stylerResult.marker ??= {};
        return {
            lineDash: stylerResult.lineDash ?? lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? lineDashOffset,
            stroke: stylerResult.stroke ?? stroke,
            strokeOpacity: stylerResult.strokeOpacity ?? strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? strokeWidth,
            marker: {
                fill: stylerResult.marker.fill ?? fill,
                fillOpacity: stylerResult.marker.fillOpacity ?? fillOpacity,
                shape: stylerResult.marker.shape ?? shape,
                size: stylerResult.marker.size ?? size,
                lineDash: stylerResult.marker.lineDash ?? marker.lineDash ?? lineDash,
                lineDashOffset: stylerResult.marker.lineDashOffset ?? marker.lineDashOffset ?? lineDashOffset,
                stroke: stylerResult.marker.stroke ?? marker.stroke ?? stroke,
                strokeOpacity: stylerResult.marker.strokeOpacity ?? marker.strokeOpacity ?? strokeOpacity,
                strokeWidth: stylerResult.marker.strokeWidth ?? marker.strokeWidth ?? strokeWidth,
            } satisfies RequireOptional<NormalisedSeriesMarkerStyle>,
        } satisfies RequireOptional<NormalisedLineSeriesStylerResult>;
    }

    public getFormattedMarkerStyle(datum: LineNodeDatum) {
        const stylerStyle = this.getStyle(undefined);
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
            this.properties.selection.enabled ||
            this.properties.styler != null ||
            this.properties.marker.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
