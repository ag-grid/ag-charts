import {
    type AgDrawingMode,
    type AgHlcSeriesItemType,
    type AgHlcSeriesStylerParams,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AGGREGATION_INDEX_UNSET,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    type CallbackParamRules,
    ChartAxisDirection,
    DebugMetrics,
    type DeepPartial,
    type DeepRequired,
    type DomainWithMetadata,
    type DynamicContext,
    type NormalisedColorType,
    type NormalisedHlcSeriesMarkerOptions,
    type NormalisedHlcSeriesOptions,
    type NormalisedHlcSeriesOwnOptions,
    type NormalisedSeriesMarkerStyle,
    type RequireOptional,
    clamp,
    extent,
    findMinMax,
    isContinuous,
    markerRebuildNeeded,
    mergeDefaults,
    toNumber,
} from 'ag-charts-core';
import type { AgNumericValue, CssColor } from 'ag-charts-types';

import {
    type HlcSeriesDataAggregationFilter,
    aggregateHlcDataFromDataModel,
    aggregateHlcDataFromDataModelPartial,
} from './hlcAggregation';
import { type HlcContext, type HlcMarkerDatum, type HlcSeriesParams, prepareHlcPathAnimation } from './hlcUtil';

// A bucket's close is its last datum's close, as ohlc takes it.
const CLOSE = AGGREGATION_INDEX_X_MAX;
const HIGH = AGGREGATION_INDEX_Y_MAX;
const LOW = AGGREGATION_INDEX_Y_MIN;
const SPAN = AGGREGATION_SPAN;

const ITEM_TYPES: readonly AgHlcSeriesItemType[] = ['high', 'low', 'close'];

const {
    valueProperty,
    keyProperty,
    fixNumericExtent,
    buildResetPathFn,
    resetLabelFn,
    resetMarkerFn,
    resetMarkerPositionFn,
    pathSwipeInAnimation,
    resetMotion,
    markerSwipeScaleInAnimation,
    maxMarkerStrokePickInflation,
    animationValidation,
    diff,
    updateClipPath,
    computeMarkerFocusBoundsOfNodeDatum,
    plotAreaPathFill,
    plotLinePathStroke,
    interpolatePoints,
    pathFadeInAnimation,
    markerFadeInAnimation,
    fromToMotion,
    pathMotion,
    PointerEvents,
    Marker,
    BBox,
    processedDataIsAnimatable,
    cartesianMarkerDrawMode,
    getMarkerStyles,
    toHighlightString,
    toSelectionString,
    HighlightState,
    AggregationManager,
    resetMarkerSelectionsDirect,
    createDatumId,
    visibleRangeIndices,
} = _ModuleSupport;

type HlcMarkerEnabledMixin = { marker?: { enabled?: boolean } };

/** An item's styler result after theme-merge: colour refs are resolved before reaching this point. */
type NormalisedHlcSeriesItemStyle = {
    fill?: NormalisedColorType;
    fillOpacity?: number;
    stroke?: CssColor;
    strokeWidth?: number;
    strokeOpacity?: number;
    lineDash?: number[];
    lineDashOffset?: number;
    marker?: NormalisedSeriesMarkerStyle & { enabled?: boolean };
};
type NormalisedHlcSeriesStyle = { item?: Partial<Record<AgHlcSeriesItemType, NormalisedHlcSeriesItemStyle>> };

interface HlcItemStyle {
    stroke: CssColor;
    strokeWidth: number;
    strokeOpacity: number;
    lineDash: number[];
    lineDashOffset: number;
    marker: RequireOptional<NormalisedSeriesMarkerStyle> & { size: number };
}
interface HlcBandStyle extends HlcItemStyle {
    fill: NormalisedColorType;
    fillOpacity: number;
}
interface StylerResult {
    item: { high: HlcBandStyle; low: HlcBandStyle; close: HlcItemStyle };
}
type StylerMarkerOptionsResult = { item: Record<AgHlcSeriesItemType, DeepRequired<HlcMarkerEnabledMixin>> };

/**
 * Context object for efficient node datum creation.
 * Caches expensive-to-compute values that are reused across all datum iterations.
 */
interface HlcSeriesNodeDatumContext extends _ModuleSupport.CartesianCreateNodeDataContext<HlcMarkerDatum> {
    readonly highValues: AgNumericValue[];
    readonly lowValues: AgNumericValue[];
    readonly closeValues: AgNumericValue[];
    readonly xOffset: number;
    readonly xAxisRange: [number, number];
    readonly dataAggregationFilter: HlcSeriesDataAggregationFilter | undefined;
    readonly range: number;
    readonly highKey: string;
    readonly lowKey: string;
    readonly closeKey: string;
    readonly item: NormalisedHlcSeriesOwnOptions['item'];
    readonly connectMissingData: boolean;
    readonly interpolation: NormalisedHlcSeriesOwnOptions['interpolation'];

    spanPoints: Array<HlcSpanPointDatum[] | { skip: number }>;
}

/** Scratch object for per-datum processing to avoid allocations per iteration. */
interface HlcNodeDatumScratch {
    datum: any;
    xValue: any;
    // bigint-capable so yScale.convert() keeps full precision.
    highValue: AgNumericValue;
    lowValue: AgNumericValue;
    closeValue: AgNumericValue;
    x: number;
}

/**
 * `bandEdge` is where the two bands meet: the close, clamped to the high-low range so a close outside it
 * leaves the close line unfilled rather than stretching both bands over it.
 */
type HlcSpanPointDatum = Record<AgHlcSeriesItemType | 'bandEdge', _ModuleSupport.LineSpanPointDatum>;

interface HlcSeriesTypes extends _ModuleSupport.CartesianSeriesTypes {
    readonly node: _ModuleSupport.Marker<HlcMarkerDatum>;
    readonly options: NormalisedHlcSeriesOwnOptions;
    readonly datum: HlcMarkerDatum;
    readonly label: HlcMarkerDatum;
    readonly context: HlcContext;
    readonly stackContext: never;
    readonly createNodeDataContext: HlcSeriesNodeDatumContext;
}

/** Per-pass context shared by the HLC marker-style passes. */
interface HlcPassCtx {
    hideWithSize0: boolean;
    isHighlight: boolean;
}

type HlcNoStylerCompute = _ModuleSupport.MarkerStyleCompute<HlcSeries, HlcPassCtx, HlcMarkerDatum, AgSeriesMarkerStyle>;
type HlcStylerCompute = _ModuleSupport.MarkerStyleCompute<HlcSeries, HlcPassCtx, HlcMarkerDatum, StylerResult>;
type HlcStylerApply = _ModuleSupport.MarkerStyleApply<HlcSeries, HlcPassCtx, HlcMarkerDatum, StylerResult>;

type HlcAnimationData = _ModuleSupport.CartesianAnimationData<
    HlcMarkerDatum,
    _ModuleSupport.Marker<HlcMarkerDatum>,
    HlcMarkerDatum,
    HlcContext
>;

export class HlcSeries extends _ModuleSupport.CartesianSeries<HlcSeriesTypes> {
    static override readonly className = 'HlcSeries';
    static readonly type = 'hlc' as const;

    private markerDirty = true;
    /** Item markers with the series-level `marker.itemStyler` folded in; the item level has no such key. */
    private itemMarkers!: Record<AgHlcSeriesItemType, NormalisedHlcSeriesMarkerOptions>;

    protected override syncOptionDerivedState(optionsDiff: DeepPartial<NormalisedHlcSeriesOptions> | undefined) {
        const { item, marker } = this.options;
        this.itemMarkers = {
            high: { ...item.high.marker, itemStyler: marker.itemStyler },
            low: { ...item.low.marker, itemStyler: marker.itemStyler },
            close: { ...item.close.marker, itemStyler: marker.itemStyler },
        };
        if (
            optionsDiff == null ||
            markerRebuildNeeded(optionsDiff.marker) ||
            markerRebuildNeeded(optionsDiff.item?.high?.marker) ||
            markerRebuildNeeded(optionsDiff.item?.low?.marker) ||
            markerRebuildNeeded(optionsDiff.item?.close?.marker)
        ) {
            this.markerDirty = true;
        }
    }

    override createNodeParams(datum: HlcMarkerDatum) {
        const { xKey, highKey, lowKey, closeKey } = this.options;
        return { ...super.createNodeParams(datum), xKey, highKey, lowKey, closeKey };
    }

    private readonly aggregationManager = new AggregationManager<HlcSeriesDataAggregationFilter>();
    private hideWithSize0 = false;
    private markerNodesPickable = true;

    protected override hasPickableNodeShapes(): boolean {
        return this.markerNodesPickable;
    }

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            pathsPerSeries: ['highFill', 'lowFill', 'highStroke', 'lowStroke', 'closeStroke'],
            pickModes: [_ModuleSupport.SeriesNodePickMode.AXIS_ALIGNED],
            propertyKeys: {
                [ChartAxisDirection.X]: ['xKey'],
                [ChartAxisDirection.Y]: ['highKey', 'lowKey', 'closeKey'],
            },
            propertyNames: {
                [ChartAxisDirection.X]: ['xName'],
                [ChartAxisDirection.Y]: ['highName', 'lowName', 'closeName', 'yName'],
            },
            categoryKey: 'xValue',
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
        return (hasMarkers && this.getDrawingMode(false) === 'cutout') || super.renderToOffscreenCanvas();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, highKey, lowKey, closeKey } = this.options;
        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        if (this.needsDataModelDiff() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const allowNullKey = this.options.allowNullKeys ?? false;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: `xValue`, allowNullKey }),
                valueProperty(highKey, yScaleType, { id: `highValue`, invalidValue: undefined }),
                valueProperty(lowKey, yScaleType, { id: `lowValue`, invalidValue: undefined }),
                valueProperty(closeKey, yScaleType, { id: `closeValue`, invalidValue: undefined }),
                ...extraProps,
            ],
        });

        this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    private aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.ProcessedData<any>
    ): void {
        this.aggregationManager.markStale(processedData.input.count);

        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateHlcDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateHlcDataFromDataModel(xAxis.scale.type, dataModel, processedData, this, existingFilters),
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

    // Aggregated datums sit at `midpointIndices[i]`, rarely one of the extrema, so the bucket is
    // re-derived from the midpoint's xValue rather than trusting the index.
    protected override createBucketLookupFeature(): _ModuleSupport.BucketLookupFeature {
        return new _ModuleSupport.BucketLookupManager({
            series: this,
            getXAxis: () => this.axes[ChartAxisDirection.X],
            getDataModel: () => this.dataModel,
            getProcessedData: () => this.processedData,
            aggregationManager: this.aggregationManager,
            dataSelectionService: this.ctx.dataSelectionService,
            domainKey: 'key',
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

    protected override createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): HlcSeriesNodeDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        // Ensure we have the aggregation level needed for the current range
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        this.ensureBucketLookupFeature()?.setActiveFilter(processedData, dataAggregationFilter);
        const existingNodes = this.contextNodeData?.nodeData;
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const canIncrementallyUpdate =
            existingNodes != null &&
            (processedData.changeDescription != null ||
                !processedDataIsAnimatable(processedData) ||
                dataAggregationFilter != null);

        const { xKey, highKey, lowKey, closeKey, item, connectMissingData, interpolation } = this.options;

        return {
            xAxis,
            yAxis,
            rawData,
            xValues: dataModel.resolveKeysById(this, 'xValue', processedData),
            highValues: dataModel.resolveColumnById(this, 'highValue', processedData, 'mixed-numeric'),
            lowValues: dataModel.resolveColumnById(this, 'lowValue', processedData, 'mixed-numeric'),
            closeValues: dataModel.resolveColumnById(this, 'closeValue', processedData, 'mixed-numeric'),
            xScale,
            yScale,
            xAxisRange: xAxis.range,
            xOffset: (xScale.bandwidth ?? 0) / 2,
            dataAggregationFilter,
            range,
            animationEnabled,
            canIncrementallyUpdate,
            xKey,
            highKey,
            lowKey,
            closeKey,
            item,
            connectMissingData,
            interpolation,
            nodes: canIncrementallyUpdate ? existingNodes : [],
            spanPoints: [],
            nodeIndex: 0,
        };
    }

    override xCoordinateRange(xValue: any): [number, number] {
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        return [x, x];
    }

    override yCoordinateRange(yValues: any[]): [number, number] {
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        return [y, y];
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return { domain: [] };

        const {
            domain: {
                keys: [keys],
            },
        } = processedData;

        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain: keys, sortMetadata };
            }
            return { domain: fixNumericExtent(extent(keys)) };
        } else {
            // Close normally sits between low and high, but nothing guarantees it, so it joins the domain.
            const yExtent = this.domainForClippedRange(
                ChartAxisDirection.Y,
                ['highValue', 'lowValue', 'closeValue'],
                'xValue'
            );
            return { domain: fixNumericExtent(findMinMax(yExtent)) };
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [number, number]): [number, number] {
        // domainForVisibleRange may yield a bigint; narrow once for this number-typed range contract.
        const [y0, y1] = this.domainForVisibleRange(
            ChartAxisDirection.Y,
            ['highValue', 'lowValue', 'closeValue'],
            'xValue',
            visibleRange
        );
        return [toNumber(y0), toNumber(y1)];
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }

    /**
     * Processes a single datum and updates the context's marker and span arrays.
     * Uses the scratch object to avoid per-iteration allocations.
     *
     * In aggregation mode the values come from different datums of the bucket, so they are passed in
     * as overrides while `datumIndex` is the bucket's midpoint.
     */
    private handleDatumPoint(
        ctx: HlcSeriesNodeDatumContext,
        scratch: HlcNodeDatumScratch,
        datumIndex: number,
        highValueOverride?: AgNumericValue,
        lowValueOverride?: AgNumericValue,
        closeValueOverride?: AgNumericValue
    ): void {
        scratch.xValue = ctx.xValues[datumIndex];
        if (scratch.xValue === undefined && !this.options.allowNullKeys) return;

        scratch.datum = ctx.rawData[datumIndex];
        scratch.highValue = highValueOverride ?? ctx.highValues[datumIndex];
        scratch.lowValue = lowValueOverride ?? ctx.lowValues[datumIndex];
        scratch.closeValue = closeValueOverride ?? ctx.closeValues[datumIndex];

        const currentSpanPoints = ctx.spanPoints.at(-1);

        // isContinuous accepts any bigint; Number.isFinite rejects every bigint (it never coerces them).
        if (isContinuous(scratch.highValue) && isContinuous(scratch.lowValue) && isContinuous(scratch.closeValue)) {
            scratch.x = ctx.xScale.convert(scratch.xValue) + ctx.xOffset;
            if (!Number.isFinite(scratch.x)) return;

            const highY = ctx.yScale.convert(scratch.highValue);
            const lowY = ctx.yScale.convert(scratch.lowValue);
            const closeY = ctx.yScale.convert(scratch.closeValue);

            this.upsertMarkerDatum(ctx, scratch, datumIndex, 'high', highY);
            this.upsertMarkerDatum(ctx, scratch, datumIndex, 'low', lowY);
            this.upsertMarkerDatum(ctx, scratch, datumIndex, 'close', closeY);

            const { x, xValue: xDatum } = scratch;
            const spanPoint: HlcSpanPointDatum = {
                high: { point: { x, y: highY }, xDatum, yDatum: scratch.highValue },
                low: { point: { x, y: lowY }, xDatum, yDatum: scratch.lowValue },
                close: { point: { x, y: closeY }, xDatum, yDatum: scratch.closeValue },
                bandEdge: {
                    point: { x, y: clamp(Math.min(highY, lowY), closeY, Math.max(highY, lowY)) },
                    xDatum,
                    yDatum: scratch.closeValue,
                },
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
            this.pushGapMarker(ctx);
        }
    }

    private pushGapMarker(ctx: HlcSeriesNodeDatumContext): void {
        const currentSpanPoints = ctx.spanPoints.at(-1);
        if (Array.isArray(currentSpanPoints) || currentSpanPoints == null) {
            ctx.spanPoints.push({ skip: 0 });
        } else {
            currentSpanPoints.skip += 1;
        }
    }

    private hasInvalidDatumsInRange(ctx: HlcSeriesNodeDatumContext, startIndex: number, endIndex: number): boolean {
        const { highValues, lowValues, closeValues } = ctx;
        for (let i = startIndex; i <= endIndex; i++) {
            // isContinuous accepts any bigint; Number.isFinite rejects every bigint (it never coerces them).
            if (!isContinuous(highValues[i]) || !isContinuous(lowValues[i]) || !isContinuous(closeValues[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Creates or updates the marker datum for one value of a datum.
     * Supports incremental updates by reusing existing marker data objects when possible.
     */
    private upsertMarkerDatum(
        ctx: HlcSeriesNodeDatumContext,
        scratch: HlcNodeDatumScratch,
        datumIndex: number,
        itemType: AgHlcSeriesItemType,
        y: number
    ): void {
        const { size } = ctx.item[itemType].marker;
        const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

        if (canReuseNode) {
            // Update existing marker datum in place to avoid allocation
            const existingNode = ctx.nodes[ctx.nodeIndex] as {
                -readonly [K in keyof HlcMarkerDatum]: HlcMarkerDatum[K];
            };
            existingNode.index = datumIndex;
            existingNode.itemType = itemType;
            existingNode.datum = scratch.datum;
            existingNode.datumIndex = datumIndex;
            existingNode.midPoint = { x: scratch.x, y };
            existingNode.highValue = scratch.highValue;
            existingNode.lowValue = scratch.lowValue;
            existingNode.closeValue = scratch.closeValue;
            existingNode.xValue = scratch.xValue;
            existingNode.point = { x: scratch.x, y, size };
        } else {
            ctx.nodes.push({
                index: datumIndex,
                series: this,
                itemType,
                datum: scratch.datum,
                datumIndex,
                midPoint: { x: scratch.x, y },
                highValue: scratch.highValue,
                lowValue: scratch.lowValue,
                closeValue: scratch.closeValue,
                xValue: scratch.xValue,
                xKey: ctx.xKey,
                highKey: ctx.highKey,
                lowKey: ctx.lowKey,
                closeKey: ctx.closeKey,
                point: { x: scratch.x, y, size },
                enabled: true,
            });
        }
        ctx.nodeIndex++;
    }

    protected override populateNodeData(ctx: HlcSeriesNodeDatumContext): void {
        const { processedData } = this;
        if (!processedData) return;

        // Reusable scratch object to avoid per-datum allocations
        const scratch: HlcNodeDatumScratch = {
            datum: undefined,
            xValue: undefined,
            highValue: 0,
            lowValue: 0,
            closeValue: 0,
            x: 0,
        };

        const xPosition = (index: number) => ctx.xScale.convert(ctx.xValues[index]) + ctx.xOffset;

        // @todo(AG-13575) Remove this if block
        if (processedData.input.count < 1e3 || ctx.dataAggregationFilter == null) {
            // No aggregation - iterate only visible data points
            let [start, end] = visibleRangeIndices(1, ctx.xValues.length, ctx.xAxisRange, (index) => {
                const x = xPosition(index);
                return [x, x];
            });
            // @todo(AG-13575) Remove this if block
            if (processedData.input.count < 1e3) {
                start = 0;
                end = processedData.input.count;
            }
            // Expand range by 1 on each side to ensure line continuity at edges
            start = Math.max(start - 1, 0);
            end = Math.min(end + 1, ctx.xValues.length);

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                this.handleDatumPoint(ctx, scratch, datumIndex);
            }
        } else {
            // With aggregation - iterate only visible buckets
            const { maxRange, indexData, midpointIndices } = ctx.dataAggregationFilter;

            const [start, end] = visibleRangeIndices(1, maxRange, ctx.xAxisRange, (index) => {
                const midDatumIndex = midpointIndices[index];
                if (midDatumIndex === AGGREGATION_INDEX_UNSET) return;
                return [xPosition(midDatumIndex), xPosition(midDatumIndex)];
            });

            let prevEndDatumIndex = -1;

            for (let bucketIndex = start; bucketIndex < end; bucketIndex += 1) {
                const midIndex = midpointIndices[bucketIndex];
                if (midIndex === AGGREGATION_INDEX_UNSET) continue; // Empty bucket

                const aggIndex = bucketIndex * SPAN;
                const closeDatumIndex = indexData[aggIndex + CLOSE];
                const highDatumIndex = indexData[aggIndex + HIGH];
                const lowDatumIndex = indexData[aggIndex + LOW];

                if (highDatumIndex === AGGREGATION_INDEX_UNSET || lowDatumIndex === AGGREGATION_INDEX_UNSET) {
                    // Bucket has valid x-values but all-null y-values
                    if (!ctx.connectMissingData) {
                        this.pushGapMarker(ctx);
                    }
                    prevEndDatumIndex = closeDatumIndex;
                    continue;
                }

                if (
                    !ctx.connectMissingData &&
                    this.hasInvalidDatumsInRange(ctx, prevEndDatumIndex + 1, closeDatumIndex)
                ) {
                    this.pushGapMarker(ctx);
                }

                // All three values share the midpoint's x, so the close line meets the band edges.
                this.handleDatumPoint(
                    ctx,
                    scratch,
                    midIndex,
                    ctx.highValues[highDatumIndex],
                    ctx.lowValues[lowDatumIndex],
                    ctx.closeValues[closeDatumIndex]
                );

                prevEndDatumIndex = closeDatumIndex;
            }
        }
    }

    protected override finalizeNodeData(ctx: HlcSeriesNodeDatumContext): void {
        // Cleanup incremental updates - trim nodes if fewer than before
        if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length) {
            ctx.nodes.length = ctx.nodeIndex;
        }
    }

    protected override initializeResult(ctx: HlcSeriesNodeDatumContext): HlcContext {
        return {
            itemId: ctx.closeKey,
            labelData: [],
            nodeData: ctx.nodes,
            highFillData: { spans: [], phantomSpans: [] },
            lowFillData: { spans: [], phantomSpans: [] },
            bandEdgeData: [],
            strokeData: { high: [], low: [], close: [] },
            scales: this.calculateScaling(),
            visible: this.visible,
            styles: {
                high: this.getItemMarkerStyles('high'),
                low: this.getItemMarkerStyles('low'),
                close: this.getItemMarkerStyles('close'),
            },
        };
    }

    protected override assembleResult(ctx: HlcSeriesNodeDatumContext, result: HlcContext): HlcContext {
        const spansOf = (itemType: keyof HlcSpanPointDatum) =>
            ctx.spanPoints.flatMap((p): _ModuleSupport.LinePathSpan[] => {
                if (!Array.isArray(p)) return [];
                return interpolatePoints(
                    p.map((d) => d[itemType]),
                    ctx.interpolation
                );
            });
        const high = spansOf('high');
        const low = spansOf('low');
        const close = spansOf('close');
        const bandEdge = spansOf('bandEdge');

        result.highFillData = { spans: high, phantomSpans: bandEdge };
        result.lowFillData = { spans: bandEdge, phantomSpans: low };
        result.bandEdgeData = bandEdge;
        result.strokeData = { high, low, close };

        return result;
    }

    private getItemMarkerStyles(itemType: AgHlcSeriesItemType) {
        const line = this.options.item[itemType];
        return getMarkerStyles(this, line, line.marker);
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.markerDirty;
    }

    protected override strokewidthChange() {
        const { item, highlight } = this.options;
        const unhighlightedStrokeWidth = Math.max(...ITEM_TYPES.map((itemType) => item[itemType].strokeWidth));
        const highlightedSeriesStrokeWidth = highlight?.highlightedSeries?.strokeWidth ?? unhighlightedStrokeWidth;
        const highlightedItemStrokeWidth = highlight?.highlightedItem?.strokeWidth ?? unhighlightedStrokeWidth;
        return (
            unhighlightedStrokeWidth > highlightedItemStrokeWidth ||
            highlightedSeriesStrokeWidth > highlightedItemStrokeWidth
        );
    }

    protected override updatePathNodes(opts: {
        paths: _ModuleSupport.SegmentedPath[];
        visible: boolean;
        animationEnabled: boolean;
    }) {
        const { visible } = opts;
        const [highFillPath, lowFillPath, highStrokePath, lowStrokePath, closeStrokePath] = opts.paths;

        const highlightDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightState(highlightDatum, false);
        const { item } = this.getStyle(highlightState);
        // Highlight and selection styles apply to the series as a whole, so they override every item.
        const { stroke, strokeWidth, strokeOpacity, fill, fillOpacity, opacity } = mergeDefaults(
            this.getSelectionStyle(),
            this.getHighlightStyle()
        );

        const strokes: [_ModuleSupport.SegmentedPath, AgHlcSeriesItemType][] = [
            [highStrokePath, 'high'],
            [lowStrokePath, 'low'],
            [closeStrokePath, 'close'],
        ];
        for (const [path, itemType] of strokes) {
            const style = item[itemType];
            path.setProperties({
                fill: undefined,
                lineCap: 'round',
                lineJoin: 'round',
                pointerEvents: PointerEvents.None,
                stroke: stroke ?? style.stroke,
                strokeWidth: strokeWidth ?? style.strokeWidth,
                strokeOpacity: strokeOpacity ?? style.strokeOpacity,
                lineDash: style.lineDash,
                lineDashOffset: style.lineDashOffset,
                opacity,
                visible,
            });
            updateClipPath(this, path);
        }

        const fillBBox = this.getShapeFillBBox();
        const fills: [_ModuleSupport.SegmentedPath, HlcBandStyle][] = [
            [highFillPath, item.high],
            [lowFillPath, item.low],
        ];
        for (const [path, style] of fills) {
            const bandFill = fill ?? style.fill;
            path.setFillProperties(bandFill, fillBBox);
            path.setStyleProperties(
                { stroke: undefined, fill: bandFill, fillOpacity: fillOpacity ?? style.fillOpacity, opacity },
                fillBBox
            );
            path.setProperties({ pointerEvents: PointerEvents.None, lineJoin: 'round', opacity, visible });
            updateClipPath(this, path);
        }
    }

    protected override updatePaths(opts: { contextData: HlcContext; paths: _ModuleSupport.Path[] }) {
        this.updateHlcPaths(opts.paths, opts.contextData);
    }

    private updateHlcPaths(paths: _ModuleSupport.Path[], contextData: HlcContext) {
        for (const path of paths) {
            path.visible = contextData.visible;
            path.path.clear();
        }

        if (contextData.visible) {
            const [highFill, lowFill, highStroke, lowStroke, closeStroke] = paths;
            plotAreaPathFill(highFill, contextData.highFillData);
            plotAreaPathFill(lowFill, contextData.lowFillData);
            plotLinePathStroke(highStroke, contextData.strokeData.high);
            plotLinePathStroke(lowStroke, contextData.strokeData.low);
            plotLinePathStroke(closeStroke, contextData.strokeData.close);
        }

        for (const path of paths) {
            path.markDirty('Hlc');
        }
    }

    protected override resetDatumAnimation(data: HlcAnimationData): void {
        // Use direct reset for datum selection to bypass resetMotion callback overhead
        resetMarkerSelectionsDirect([data.datumSelection]);
    }

    protected override updateDatumSelection(opts: {
        nodeData: HlcMarkerDatum[];
        datumSelection: _ModuleSupport.Selection<HlcMarkerDatum, _ModuleSupport.Marker<HlcMarkerDatum>>;
    }) {
        const { nodeData, datumSelection } = opts;
        const { processedData, axes, options } = this;

        const rules = options.styler ? this.getStylerMarkerOptions().item : options.item;
        const enabled = ITEM_TYPES.map((itemType) => rules[itemType].marker.enabled);
        const anyEnabled = enabled.some(Boolean);
        const allEnabled = enabled.every(Boolean);

        const markerDrawMode = cartesianMarkerDrawMode(
            options,
            undefined,
            processedData!,
            axes,
            { enabled: anyEnabled },
            undefined,
            this.chart?.isMiniChart
        );
        this.hideWithSize0 = markerDrawMode.hideWithSize0;
        // A disabled item's datums are filtered out of `resolvedNodeData`, so all three must be drawn.
        this.markerNodesPickable = markerDrawMode.needsNodeData && !markerDrawMode.hideWithSize0 && allEnabled;

        if (this.markerDirty) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        let resolvedNodeData: HlcMarkerDatum[];
        if (!markerDrawMode.needsNodeData) {
            resolvedNodeData = [];
        } else if (markerDrawMode.hideWithSize0 || allEnabled) {
            resolvedNodeData = nodeData;
        } else {
            // Markers on only some items: keep the node datums they need.
            resolvedNodeData = nodeData.filter((datum) => rules[datum.itemType].marker.enabled);
        }

        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id
            return datumSelection.update(resolvedNodeData);
        }
        // Use xValue + itemType as unique ID since there are three markers per data point
        return datumSelection.update(resolvedNodeData, undefined, (datum) =>
            createDatumId(datum.xValue, datum.itemType)
        );
    }

    private static readonly keyByItemType = (datum: HlcMarkerDatum): string => datum.itemType;

    private static readonly computeNoStylerMarkerStyle: HlcNoStylerCompute = (
        series,
        ctx,
        highlightState,
        selectionState,
        datum
    ) => {
        const stylerStyle = series.getStyle(highlightState);
        return series.getMarkerStyle(
            series.itemMarkers[datum.itemType],
            datum,
            undefined,
            {
                isHighlight: ctx.isHighlight,
                highlightState,
                selectionState,
                resolveMarkerSubPath: ['item', datum.itemType, 'marker'],
                hideWithSize0: ctx.hideWithSize0,
            },
            stylerStyle.item[datum.itemType].marker,
            series.inheritedMarkerStyle(stylerStyle, datum.itemType)
        );
    };

    private static readonly computeStylerStyle: HlcStylerCompute = (series, _ctx, highlightState) => {
        return series.getStyle(highlightState);
    };

    private static readonly applyStylerDatum: HlcStylerApply = (
        series,
        ctx,
        datum,
        highlightState,
        selectionState,
        stylerStyle
    ) => {
        datum.style = series.getMarkerStyle(
            series.itemMarkers[datum.itemType],
            datum,
            series.makeItemStylerParams(datum.itemType),
            {
                isHighlight: ctx.isHighlight,
                highlightState,
                selectionState,
                resolveMarkerSubPath: ['item', datum.itemType, 'marker'],
                hideWithSize0: ctx.hideWithSize0,
            },
            stylerStyle.item[datum.itemType].marker,
            series.inheritedMarkerStyle(stylerStyle, datum.itemType)
        );
    };

    private inheritedMarkerStyle(stylerStyle: StylerResult, itemType: AgHlcSeriesItemType) {
        const { stroke, strokeWidth, strokeOpacity } = stylerStyle.item[itemType];
        return { fill: stroke, stroke, strokeWidth, strokeOpacity };
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<HlcMarkerDatum, _ModuleSupport.Marker<HlcMarkerDatum>>;
        isHighlight: boolean;
    }) {
        const { hideWithSize0 } = this;
        const ctx: HlcPassCtx = { hideWithSize0, isHighlight };

        if (this.options.marker.itemStyler == null) {
            // No itemStyler: style is a pure function of (highlightState, selectionState, itemType).
            this.runMarkerStylePass<HlcPassCtx, HlcMarkerDatum, AgSeriesMarkerStyle, HlcSeries>(
                datumSelection,
                isHighlight,
                ctx,
                {
                    keyExtra: HlcSeries.keyByItemType,
                    compute: HlcSeries.computeNoStylerMarkerStyle,
                    apply: _ModuleSupport.Series.assignCachedStyle,
                }
            );
            return;
        }

        // No itemType in the cache key: getStyle() is item-type-agnostic; sub-styles are extracted per datum.
        this.runMarkerStylePass<HlcPassCtx, HlcMarkerDatum, StylerResult, HlcSeries>(datumSelection, isHighlight, ctx, {
            compute: HlcSeries.computeStylerStyle,
            apply: HlcSeries.applyStylerDatum,
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<HlcMarkerDatum, _ModuleSupport.Marker<HlcMarkerDatum>>;
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

        // AG-8173 — hoisted out of the per-datum loop; see `maxMarkerStrokePickInflation`.
        const pickInflation = Math.max(
            ...ITEM_TYPES.map((itemType) => maxMarkerStrokePickInflation(contextNodeData.styles[itemType]))
        );
        const { itemMarkers } = this;

        datumSelection.each((node, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[datum.itemType][
                    this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ];
            // Style colours are resolved at runtime before reaching the scene node.
            this.applyMarkerStyle(style as NormalisedSeriesMarkerStyle, node, datum.point, fillBBox, {
                hideWithSize0,
                pickInflation,
                shadow: itemMarkers[datum.itemType].shadow,
            });
            node.drawingMode = drawingMode;
        });

        if (!isHighlight) {
            this.markerDirty = false;
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: HlcMarkerDatum[];
        labelSelection: _ModuleSupport.Selection<HlcMarkerDatum, _ModuleSupport.Text<HlcMarkerDatum>>;
    }) {
        return opts.labelSelection.update(opts.labelData);
    }

    protected updateLabelNodes(_opts: {
        labelSelection: _ModuleSupport.Selection<HlcMarkerDatum, _ModuleSupport.Text<HlcMarkerDatum>>;
    }) {
        // Labels unsupported
    }

    protected isLabelEnabled() {
        return false;
    }

    protected override getHighlightData(
        nodeData: HlcMarkerDatum[],
        highlightedItem: HlcMarkerDatum
    ): HlcMarkerDatum[] | undefined {
        // The three values of a datum highlight together.
        const highlightItems = nodeData
            .filter((nodeDatum) => nodeDatum.datum === highlightedItem.datum)
            .map((nodeDatum) => ({ ...nodeDatum }));
        return highlightItems.length > 0 ? highlightItems : undefined;
    }

    private getStyle(highlightState: _ModuleSupport.HighlightState | undefined): StylerResult {
        return this.getStylerCouple(highlightState)[0];
    }

    private getStylerMarkerOptions(): StylerMarkerOptionsResult {
        return this.getStylerCouple(undefined)[1];
    }

    private getStylerCouple(
        highlightState: _ModuleSupport.HighlightState | undefined
    ): [StylerResult, StylerMarkerOptionsResult] {
        const { item, styler } = this.options;

        const selectionState: _ModuleSupport.SelectionState | undefined = this.getDataSelectionState(undefined);
        const candidateState: _ModuleSupport.SelectionState | undefined = this.getDataCandidacyState(undefined);
        let stylerResult: NormalisedHlcSeriesStyle = {};
        if (styler) {
            const stylerParams = this.makeStylerParams(highlightState, selectionState, candidateState);
            stylerResult =
                (this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.cachedCallWithContext(styler, stylerParams) ?? {},
                    { pick: false }
                ) as NormalisedHlcSeriesStyle) ?? {};
        }

        const markerOpts: StylerMarkerOptionsResult = {
            item: {
                high: { marker: { enabled: false } },
                low: { marker: { enabled: false } },
                close: { marker: { enabled: false } },
            },
        };

        const makeItemResult = (itemType: AgHlcSeriesItemType): HlcItemStyle => {
            const stylerItem = stylerResult.item?.[itemType];
            const { lineDash, lineDashOffset, marker, stroke, strokeOpacity, strokeWidth } = item[itemType];
            markerOpts.item[itemType].marker.enabled = stylerItem?.marker?.enabled ?? marker.enabled;
            const itemStroke = stylerItem?.stroke ?? stroke;
            return {
                marker: {
                    fill: stylerItem?.marker?.fill ?? marker.fill ?? itemStroke,
                    fillOpacity: stylerItem?.marker?.fillOpacity ?? marker.fillOpacity,
                    shape: stylerItem?.marker?.shape ?? marker.shape,
                    size: stylerItem?.marker?.size ?? marker.size,
                    lineDash: stylerItem?.marker?.lineDash ?? marker.lineDash,
                    lineDashOffset: stylerItem?.marker?.lineDashOffset ?? marker.lineDashOffset,
                    stroke: stylerItem?.marker?.stroke ?? marker.stroke ?? itemStroke,
                    strokeOpacity: stylerItem?.marker?.strokeOpacity ?? marker.strokeOpacity,
                    strokeWidth: stylerItem?.marker?.strokeWidth ?? marker.strokeWidth,
                },
                lineDash: stylerItem?.lineDash ?? lineDash,
                lineDashOffset: stylerItem?.lineDashOffset ?? lineDashOffset,
                stroke: itemStroke,
                strokeOpacity: stylerItem?.strokeOpacity ?? strokeOpacity,
                strokeWidth: stylerItem?.strokeWidth ?? strokeWidth,
            };
        };
        const makeBandResult = (itemType: 'high' | 'low'): HlcBandStyle => {
            const stylerItem = stylerResult.item?.[itemType];
            const { fill, fillOpacity } = item[itemType];
            return {
                ...makeItemResult(itemType),
                fill: stylerItem?.fill ?? fill,
                fillOpacity: stylerItem?.fillOpacity ?? fillOpacity,
            };
        };

        const style: StylerResult = {
            item: {
                high: makeBandResult('high'),
                low: makeBandResult('low'),
                close: makeItemResult('close'),
            },
        };
        return [style, markerOpts];
    }

    private makeStylerParams(
        highlightStateEnum: _ModuleSupport.HighlightState | undefined,
        selectionStateEnum: _ModuleSupport.SelectionState | undefined,
        candidateStateEnum: _ModuleSupport.SelectionState | undefined
    ): AgHlcSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { item, xKey, highKey, lowKey, closeKey } = this.options;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);
        const selectionState = toSelectionString(selectionStateEnum);
        const candidateState = toSelectionString(candidateStateEnum);

        type T = AgHlcSeriesStylerParams<unknown, unknown>;
        type OptionalKey = 'selectionState' | 'candidateState';
        type ParamsRules = DeepRequired<Omit<T, OptionalKey>, 'fill'> & Pick<RequireOptional<T>, OptionalKey>;
        type ResultRules = CallbackParamRules<ParamsRules>;

        const makeLineParam = (itemType: AgHlcSeriesItemType): ResultRules['item']['close'] => {
            const { lineDash, lineDashOffset, marker, stroke, strokeOpacity, strokeWidth } = item[itemType];
            return {
                marker: {
                    fill: marker.fill ?? stroke,
                    fillOpacity: marker.fillOpacity,
                    size: marker.size,
                    shape: marker.shape,
                    stroke: marker.stroke ?? stroke,
                    strokeOpacity: marker.strokeOpacity,
                    strokeWidth: marker.strokeWidth,
                    lineDash: marker.lineDash,
                    lineDashOffset: marker.lineDashOffset,
                },
                lineDash,
                lineDashOffset,
                stroke,
                strokeOpacity,
                strokeWidth,
            };
        };
        const makeBandParam = (itemType: 'high' | 'low'): ResultRules['item'][typeof itemType] => {
            const { fill, fillOpacity } = item[itemType];
            return { ...makeLineParam(itemType), fill, fillOpacity };
        };
        return {
            item: {
                high: makeBandParam('high'),
                low: makeBandParam('low'),
                close: makeLineParam('close'),
            },
            highlightState,
            selectionState,
            candidateState,
            seriesId,
            xKey,
            highKey,
            lowKey,
            closeKey,
        } satisfies ResultRules;
    }

    private makeItemStylerParams(itemType: AgHlcSeriesItemType): HlcSeriesParams {
        const { xKey, highKey, lowKey, closeKey } = this.options;
        return { xKey, highKey, lowKey, closeKey, itemType };
    }

    override getTooltipContent(
        datumIndex: number,
        removeThisDatum: HlcMarkerDatum | undefined
    ): _ModuleSupport.TooltipContent | undefined {
        const itemType: AgHlcSeriesItemType = removeThisDatum?.itemType ?? 'close';

        const { id: seriesId, dataModel, processedData, axes, options } = this;
        const { xKey, xName, yName, highKey, highName, lowKey, lowName, closeKey, closeName, tooltip, legendItemName } =
            options;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const highValue = dataModel.resolveColumnById(this, `highValue`, processedData, 'mixed-numeric')[datumIndex];
        const lowValue = dataModel.resolveColumnById(this, `lowValue`, processedData, 'mixed-numeric')[datumIndex];
        const closeValue = dataModel.resolveColumnById(this, `closeValue`, processedData, 'mixed-numeric')[datumIndex];

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.options.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        const stylerStyle = this.getStyle(undefined);
        const format = this.getMarkerStyle(
            this.itemMarkers[itemType],
            { datumIndex, datum },
            this.makeItemStylerParams(itemType),
            { isHighlight: false, resolveMarkerSubPath: ['item', itemType, 'marker'] },
            stylerStyle.item[itemType].marker
        ) as RequireOptional<AgSeriesMarkerStyle>;

        const row = (label: string | undefined, key: string, value: AgNumericValue) => ({
            label,
            fallbackLabel: key,
            value: this.getAxisValueText(yAxis, 'tooltip', value, datum, key, legendItemName),
            missing: _ModuleSupport.isTooltipValueMissing(value),
        });

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                title: legendItemName ?? yName,
                symbol: this.legendItemSymbol(),
                data: [
                    row(highName, highKey, highValue),
                    row(lowName, lowKey, lowValue),
                    row(closeName, closeKey, closeValue),
                ],
            },
            {
                seriesId,
                datum,
                title: yName,
                itemType,
                xKey,
                xName,
                yName,
                highKey,
                highName,
                lowKey,
                lowName,
                closeKey,
                closeName,
                legendItemName,
                ...format,
            }
        );
    }

    /** The legend symbol is the close line, the value the series is read by. */
    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { stroke, strokeWidth, strokeOpacity, lineDash, marker } = this.getStyle(undefined).item.close;

        return {
            marker: {
                shape: marker.shape,
                fill: marker.fill,
                stroke: marker.stroke,
                fillOpacity: marker.fillOpacity,
                strokeOpacity: marker.strokeOpacity,
                strokeWidth: marker.strokeWidth,
                lineDash: marker.lineDash,
                lineDashOffset: marker.lineDashOffset,
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

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const { id: seriesId, visible } = this;
        const { closeKey, closeName, yName, legendItemName, showInLegend } = this.options;
        const legendItemText = legendItemName ?? yName ?? closeName ?? closeKey;
        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId: closeKey,
                seriesId,
                enabled: visible,
                label: { text: `${legendItemText}` },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: showInLegend === false,
            },
        ];
    }

    protected nodeFactory() {
        return new Marker<HlcMarkerDatum>();
    }

    override animateEmptyUpdateReady(animationData: HlcAnimationData) {
        const { datumSelection, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateHlcPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([datumSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(
            this,
            animationManager,
            { ...this.getAnimationDrawingModes(), phase: 'initial' },
            datumSelection
        );
    }

    protected override animateReadyResize(animationData: HlcAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateHlcPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(animationData: HlcAnimationData) {
        const { animationManager } = this.ctx;
        const { datumSelection, contextData, paths, previousContextData } = animationData;
        const [highFill, lowFill, highStroke, lowStroke, closeStroke] = paths;

        // Handling initially hidden series case gracefully.
        if (paths.every((path) => path == null)) return;

        this.resetDatumAnimation(animationData);
        this.resetLabelAnimation(animationData);

        const update = () => {
            this.resetPathAnimation(animationData);
            this.updateHlcPaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', this.getAnimationDrawingModes(), datumSelection);
            pathFadeInAnimation(this, 'high_fill_path_properties', animationManager, 'add', highFill);
            pathFadeInAnimation(this, 'low_fill_path_properties', animationManager, 'add', lowFill);
            pathFadeInAnimation(this, 'high_stroke_path_properties', animationManager, 'add', highStroke);
            pathFadeInAnimation(this, 'low_stroke_path_properties', animationManager, 'add', lowStroke);
            pathFadeInAnimation(this, 'close_stroke_path_properties', animationManager, 'add', closeStroke);
            return;
        }

        const fns = prepareHlcPathAnimation(
            contextData,
            previousContextData,
            this.processedData?.reduced?.diff?.[this.id]
        );
        if (fns === undefined) {
            // Un-animatable - skip all animations.
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        const animated = [
            ['high_fill', highFill, fns.highFill],
            ['low_fill', lowFill, fns.lowFill],
            ['high_stroke', highStroke, fns.highStroke],
            ['low_stroke', lowStroke, fns.lowStroke],
            ['close_stroke', closeStroke, fns.closeStroke],
        ] as const;

        for (const [id, path, pathFns] of animated) {
            fromToMotion(this.id, `${id}_path_properties`, animationManager, [path], pathFns.pathProperties);
        }

        if (fns.status === 'added') {
            this.updateHlcPaths(paths, contextData);
        } else if (fns.status === 'removed') {
            this.updateHlcPaths(paths, previousContextData);
        } else {
            for (const [id, path, pathFns] of animated) {
                pathMotion(this.id, `${id}_path_update`, animationManager, [path], pathFns.path);
            }
        }

        if (fns.hasMotion) {
            markerFadeInAnimation(this, animationManager, undefined, this.getAnimationDrawingModes(), datumSelection);
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
            onComplete: () => this.updateHlcPaths(paths, contextData),
        });
    }

    public getFormattedMarkerStyle(datum: HlcMarkerDatum) {
        const stylerStyle = this.getStyle(undefined);

        return this.getMarkerStyle(
            this.itemMarkers[datum.itemType],
            datum,
            this.makeItemStylerParams(datum.itemType),
            { isHighlight: true, resolveMarkerSubPath: ['item', datum.itemType, 'marker'] },
            undefined,
            this.inheritedMarkerStyle(stylerStyle, datum.itemType)
        );
    }

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        const nodeData = this.contextNodeData?.nodeData;
        if (nodeData == null) return undefined;

        // A datum's three node datums are contiguous: high, low, then close.
        const highIndex = nodeData.findIndex((node) => node.datumIndex === opts.datumIndex);
        if (highIndex === -1) return undefined;

        const boxes = [];
        for (let i = highIndex; i < highIndex + ITEM_TYPES.length; i++) {
            const box = computeMarkerFocusBoundsOfNodeDatum(this, nodeData[i]);
            if (box == null) return undefined;
            boxes.push(box);
        }
        return BBox.merge(boxes);
    }

    protected override isDatumEnabled(nodeData: HlcMarkerDatum[], nodeDatumIndex: number): boolean {
        // Focus steps through datums, not values, so only the first node datum of each counts.
        return nodeDatumIndex % ITEM_TYPES.length === 0 && super.isDatumEnabled(nodeData, nodeDatumIndex);
    }

    protected override hasItemStylers(): boolean {
        return this.isSelectionEnabled() || this.options.styler != null || this.options.marker.itemStyler != null;
    }
}
