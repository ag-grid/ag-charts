import {
    type AgRangeBarSeriesLabelFormatterParams,
    type AgRangeBarSeriesOptions,
    type AgRangeBarSeriesStyle,
    type AgRangeBarSeriesStylerParams,
    type TextOrSegments,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    type CallbackParamRules,
    ChartAxisDirection,
    type DomainInput,
    type Mutable,
    type Point,
    type RequireOptional,
    type Scale,
    areScalingEqual,
    extractDomain,
    findMinMax,
    mergeDefaults,
} from 'ag-charts-core';

import {
    type RangeBarSeriesDataAggregationFilter,
    aggregateRangeBarDataFromDataModel,
    aggregateRangeBarDataFromDataModelPartial,
} from './rangeBarAggregation';
import { RangeBarProperties } from './rangeBarProperties';

const {
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    checkCrisp,
    updateLabelNode,
    SMALLEST_KEY_INTERVAL,
    LARGEST_KEY_INTERVAL,
    diff,
    prepareBarAnimationFunctions,
    midpointStartingBarPosition,
    resetBarSelectionsFn,
    resetBarSelectionsDirect,
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
    processedDataIsAnimatable,
    getItemStyles,
    calculateSegments,
    toHighlightString,
    HighlightState,
    AggregationManager,
} = _ModuleSupport;

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

/**
 * Shared context for creating/updating RangeBarNodeDatum instances.
 * Instantiated once per createNodeData() call and reused across all datum operations
 * to minimize memory allocations. Only contains values that are expensive to compute
 * or resolve - cheap property lookups use `this` directly in methods.
 */
interface RangeBarSeriesNodeDatumContext {
    // Data arrays (resolved from dataModel - worth caching)
    readonly rawData: any[];
    readonly xValues: any[];
    readonly yLowValues: any[];
    readonly yHighValues: any[];

    // Scales (axis lookups - worth caching)
    readonly xScale: Scale<any, any>;
    readonly yScale: Scale<any, any>;

    // Axes (for range calculations and other operations)
    readonly xAxis: _ModuleSupport.ChartAxis;
    readonly yAxis: _ModuleSupport.ChartAxis;

    // Computed positioning (involves scale conversions - worth caching)
    readonly barWidth: number;
    readonly groupOffset: number;
    readonly barOffset: number;

    // Pre-computed values
    readonly barAlongX: boolean;
    readonly crisp: boolean;

    // Property keys (constant across all datums - worth caching)
    readonly xKey: string;
    readonly yLowKey: string;
    readonly yHighKey: string;

    // Label configuration (checked before expensive label text computation)
    readonly labelEnabled: boolean;
    readonly labelPlacement: 'inside' | 'outside';
    readonly labelPadding: number;

    // Incremental update support (added for Step 4)
    readonly canIncrementallyUpdate: boolean;
    nodes: RangeBarNodeDatum[];
    nodeIndex: number;
}

/**
 * Prepared state for node datum creation/update.
 * Reused as scratch object to avoid allocations in tight loops.
 */
interface PreparedRangeBarNodeDatumState {
    datum: any;
    xValue: any;
    yLowValue: number;
    yHighValue: number;
    rawLowValue: any;
    rawHighValue: any;
}

/**
 * Parameters for node datum creation/update.
 * Reused as scratch object to avoid allocations in tight loops.
 */
interface NodeDatumParams {
    nodeDatumScratch: PreparedRangeBarNodeDatumState;
    labelParamsScratch: LabelUpdateParams;
    datumIndex: number;
    groupedDataIndex: number;
    x: number;
    width: number;
    yLow: number;
    yHigh: number;
    crisp: boolean;
}

/**
 * Scratch object for label update parameters.
 * Reused to avoid allocations in tight loops.
 */
interface LabelUpdateParams {
    labels: RangeBarNodeLabelDatum[];
    datumIndex: number;
    rectX: number;
    rectY: number;
    rectWidth: number;
    rectHeight: number;
    yLowValue: number;
    yHighValue: number;
    datum: any;
}

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

    private readonly aggregationManager = new AggregationManager<RangeBarSeriesDataAggregationFilter>();

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
        if (this.needsDataModelDiff() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (!this.ctx.animationManager.isSkipped()) {
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

        this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    private aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.ProcessedData<any>
    ) {
        this.aggregationManager.markStale();

        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateRangeBarDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateRangeBarDataFromDataModel(xAxis.scale.type, dataModel, processedData, this, existingFilters),
            targetRange,
        });
    }

    private estimateTargetRange(): number {
        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis?.scale == null) return 0;

        const [r0, r1] = xAxis.scale.range;
        return Math.abs(r1 - r0);
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainInput<any> {
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel) return { domain: [] };

        const {
            keys: [keys],
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain: keys, sortMetadata };
            }
            return { domain: this.padBandExtent(keys) };
        } else {
            const yExtent = this.domainForClippedRange(direction, ['yHighValue', 'yLowValue'], 'xValue');
            const fixedYExtent = findMinMax(yExtent);
            return { domain: fixNumericExtent(fixedYExtent) };
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yHighValue', 'yLowValue'], 'xValue', visibleRange);
    }

    /**
     * Creates shared context for node datum creation/update operations.
     * This context is instantiated once and reused across all datum operations
     * to minimize memory allocations. Only caches values that are expensive to
     * compute - cheap property lookups use `this` directly.
     */
    private createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): RangeBarSeriesNodeDatumContext | undefined {
        const { dataModel, processedData, groupScale } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources?.get(this.id)?.data;
        if (rawData == null) return undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);

        const barOffset = ContinuousScale.is(xScale) ? barWidth * -0.5 : 0;
        const groupOffset = groupScale.convert(String(groupIndex));

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const crisp = checkCrisp(
            xAxis?.scale,
            xAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        const canIncrementallyUpdate =
            processedData.changeDescription != null && this.contextNodeData?.nodeData != null;

        return {
            rawData,
            xValues: dataModel.resolveKeysById(this, `xValue`, processedData),
            yLowValues: dataModel.resolveColumnById(this, `yLowValue`, processedData),
            yHighValues: dataModel.resolveColumnById(this, `yHighValue`, processedData),
            xScale,
            yScale,
            xAxis,
            yAxis,
            barWidth,
            groupOffset,
            barOffset,
            barAlongX,
            crisp,
            xKey: this.properties.xKey,
            yLowKey: this.properties.yLowKey,
            yHighKey: this.properties.yHighKey,
            labelEnabled: this.properties.label.enabled,
            labelPlacement: this.properties.label.placement,
            labelPadding:
                (this.properties.label.spacing +
                    (typeof this.properties.label.padding === 'number' ? this.properties.label.padding : 0)) *
                (this.properties.label.placement === 'outside' ? 1 : -1),
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
            nodeIndex: 0,
        };
    }

    /**
     * Validates and prepares state needed for node creation/update.
     * Returns undefined if datum should be skipped.
     */
    private prepareNodeDatumState(
        ctx: RangeBarSeriesNodeDatumContext,
        scratch: PreparedRangeBarNodeDatumState,
        datumIndex: number
    ): PreparedRangeBarNodeDatumState | undefined {
        const datum = ctx.rawData[datumIndex];
        const xValue = ctx.xValues[datumIndex];
        if (xValue == null) return undefined;

        const rawLowValue = ctx.yLowValues[datumIndex];
        const rawHighValue = ctx.yHighValues[datumIndex];

        if (!Number.isFinite(rawLowValue?.valueOf()) || !Number.isFinite(rawHighValue?.valueOf())) return undefined;

        const [yLowValue, yHighValue] =
            rawLowValue < rawHighValue ? [rawLowValue, rawHighValue] : [rawHighValue, rawLowValue];

        // Populate scratch with validated, computed values
        scratch.datum = datum;
        scratch.xValue = xValue;
        scratch.yLowValue = yLowValue;
        scratch.yHighValue = yHighValue;
        scratch.rawLowValue = rawLowValue;
        scratch.rawHighValue = rawHighValue;

        return scratch;
    }

    /**
     * Creates a minimal skeleton node - actual values set by updateNodeDatum.
     */
    private createSkeletonNodeDatum(
        ctx: RangeBarSeriesNodeDatumContext,
        params: NodeDatumParams,
        itemId: RangeBarItemId
    ): RangeBarNodeDatum {
        const scratch = params.nodeDatumScratch;
        return {
            index: params.groupedDataIndex,
            series: this,
            itemId,
            datum: scratch.datum,
            datumIndex: params.datumIndex,
            xValue: scratch.xValue,
            yLowValue: 0, // Will be updated by updateNodeDatum
            yHighValue: 0, // Will be updated by updateNodeDatum
            yLowKey: ctx.yLowKey,
            yHighKey: ctx.yHighKey,
            xKey: ctx.xKey,
            x: 0, // Will be updated by updateNodeDatum
            y: 0, // Will be updated by updateNodeDatum
            width: 0, // Will be updated by updateNodeDatum
            height: 0, // Will be updated by updateNodeDatum
            midPoint: { x: 0, y: 0 }, // Will be updated by updateNodeDatum
            crisp: params.crisp,
            labels: [], // Will be updated by updateNodeDatum
        };
    }

    /**
     * Creates a new node: skeleton + update.
     */
    private createNodeDatum(
        ctx: RangeBarSeriesNodeDatumContext,
        params: NodeDatumParams,
        itemId: RangeBarItemId,
        strokeWidth: number
    ): RangeBarNodeDatum | undefined {
        const prepared = this.prepareNodeDatumState(ctx, params.nodeDatumScratch, params.datumIndex);
        if (!prepared) return undefined;

        const nodeData = this.createSkeletonNodeDatum(ctx, params, itemId);
        this.updateNodeDatum(ctx, nodeData, params, strokeWidth, prepared);

        return nodeData;
    }

    /**
     * Updates node properties in-place.
     * Shared by both create (skeleton + update) and incremental update paths.
     */
    private updateNodeDatum(
        ctx: RangeBarSeriesNodeDatumContext,
        node: RangeBarNodeDatum,
        params: NodeDatumParams,
        strokeWidth: number,
        prepared?: PreparedRangeBarNodeDatumState
    ): void {
        prepared ??= this.prepareNodeDatumState(ctx, params.nodeDatumScratch, params.datumIndex);
        if (!prepared) return;

        const mutableNode = node as Mutable<RangeBarNodeDatum>;

        // Update main node properties
        mutableNode.index = params.groupedDataIndex;
        mutableNode.datum = prepared.datum;
        mutableNode.datumIndex = params.datumIndex;
        mutableNode.xValue = prepared.xValue;
        mutableNode.yLowValue = prepared.rawLowValue;
        mutableNode.yHighValue = prepared.rawHighValue;
        mutableNode.crisp = params.crisp;

        // Compute bounds
        const y = Math.round(ctx.yScale.convert(params.yHigh));
        const bottomY = Math.round(ctx.yScale.convert(params.yLow));
        const height = Math.max(strokeWidth, Math.abs(bottomY - y));

        const rect = {
            x: ctx.barAlongX ? Math.min(y, bottomY) : params.x,
            y: ctx.barAlongX ? params.x : Math.min(y, bottomY),
            width: ctx.barAlongX ? height : params.width,
            height: ctx.barAlongX ? params.width : height,
        };

        mutableNode.x = rect.x;
        mutableNode.y = rect.y;
        mutableNode.width = rect.width;
        mutableNode.height = rect.height;

        // Update midPoint in place
        const mutableMidPoint = mutableNode.midPoint as Mutable<Point>;
        mutableMidPoint.x = rect.x + rect.width / 2;
        mutableMidPoint.y = rect.y + rect.height / 2;

        // Update clipBBox in place (if it exists)
        const existingClipBBox = mutableNode.clipBBox;
        if (existingClipBBox) {
            existingClipBBox.x = rect.x;
            existingClipBBox.y = rect.y;
            existingClipBBox.width = rect.width;
            existingClipBBox.height = rect.height;
        }
        // Note: clipBBox is not created for RangeBarSeries as it's not used for rendering

        // Update labels in place to avoid array allocations
        // Only compute label text if labels are enabled (expensive getLabelText calls)
        const labelParams = params.labelParamsScratch;
        labelParams.labels = mutableNode.labels as RangeBarNodeLabelDatum[];
        labelParams.datumIndex = params.datumIndex;
        labelParams.rectX = rect.x;
        labelParams.rectY = rect.y;
        labelParams.rectWidth = rect.width;
        labelParams.rectHeight = rect.height;
        labelParams.yLowValue = prepared.yLowValue;
        labelParams.yHighValue = prepared.yHighValue;
        labelParams.datum = prepared.datum;
        this.updateLabelData(ctx, labelParams);
    }

    /**
     * Handles node creation/update - reuses existing nodes when possible for incremental updates.
     * This method decides whether to update existing nodes in-place or create new ones.
     */
    private upsertNodeDatum(
        ctx: RangeBarSeriesNodeDatumContext,
        params: NodeDatumParams,
        itemId: RangeBarItemId,
        strokeWidth: number
    ): void {
        // Check if we can reuse existing nodes
        const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

        if (canReuseNode) {
            // Reuse existing node by updating in place
            const existingNode = ctx.nodes[ctx.nodeIndex];
            this.updateNodeDatum(ctx, existingNode, params, strokeWidth);
        } else {
            // Create new node
            const nodeData = this.createNodeDatum(ctx, params, itemId, strokeWidth);
            if (nodeData) {
                ctx.nodes.push(nodeData);
            }
        }
        ctx.nodeIndex++;
    }

    /**
     * Creates node data using aggregation filters for large datasets.
     */
    private createNodeDataWithAggregation(
        ctx: RangeBarSeriesNodeDatumContext,
        xPosition: (index: number) => number,
        nodeDatumParamsScratch: NodeDatumParams,
        itemId: RangeBarItemId,
        strokeWidth: number,
        dataAggregationFilter: RangeBarSeriesDataAggregationFilter
    ): void {
        const { maxRange, indexData, midpointIndices } = dataAggregationFilter;
        const [start, end] = visibleRangeIndices(1, maxRange, ctx.xAxis.range, (index) => {
            const aggIndex = index * AGGREGATION_SPAN;
            const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
            const midDatumIndex = midpointIndices[index];
            if (midDatumIndex === -1) return;
            return [xPosition(midDatumIndex), xPosition(xMaxIndex) + ctx.barWidth];
        });

        for (let i = start; i < end; i += 1) {
            const aggIndex = i * AGGREGATION_SPAN;
            const xMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
            const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
            const yMinIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MIN];
            const yMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_Y_MAX];

            const midDatumIndex = midpointIndices[i];
            if (midDatumIndex === -1) continue;

            const xValue = ctx.xValues[midDatumIndex];
            if (xValue == null) continue;

            // Populate scratch object with aggregated values
            nodeDatumParamsScratch.datumIndex = midDatumIndex;
            nodeDatumParamsScratch.groupedDataIndex = 0;
            nodeDatumParamsScratch.x = xPosition(midDatumIndex);
            nodeDatumParamsScratch.width = Math.abs(xPosition(xMinIndex) - xPosition(xMaxIndex)) + ctx.barWidth;
            nodeDatumParamsScratch.yLow = ctx.yLowValues[yMinIndex];
            nodeDatumParamsScratch.yHigh = ctx.yHighValues[yMaxIndex];
            nodeDatumParamsScratch.crisp = false;

            this.upsertNodeDatum(ctx, nodeDatumParamsScratch, itemId, strokeWidth);
        }
    }

    /**
     * Creates node data for simple (ungrouped) data processing.
     */
    private createNodeDataSimple(
        ctx: RangeBarSeriesNodeDatumContext,
        xPosition: (index: number) => number,
        nodeDatumParamsScratch: NodeDatumParams,
        itemId: RangeBarItemId,
        strokeWidth: number,
        processedData: _ModuleSupport.ProcessedData<any>
    ): void {
        const invalidData = processedData.invalidData?.get(this.id);
        let [start, end] = this.visibleRangeIndices('xValue', ctx.xAxis.range);
        // @todo(AG-13575) Remove this if block
        if (processedData.input.count < 1e3) {
            start = 0;
            end = processedData.input.count;
        }

        for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
            if (invalidData?.[datumIndex] === true) continue;

            // Populate scratch object
            nodeDatumParamsScratch.datumIndex = datumIndex;
            nodeDatumParamsScratch.groupedDataIndex = 0;
            nodeDatumParamsScratch.x = xPosition(datumIndex);
            nodeDatumParamsScratch.width = ctx.barWidth;
            nodeDatumParamsScratch.yLow = ctx.yLowValues[datumIndex];
            nodeDatumParamsScratch.yHigh = ctx.yHighValues[datumIndex];
            nodeDatumParamsScratch.crisp = ctx.crisp;

            this.upsertNodeDatum(ctx, nodeDatumParamsScratch, itemId, strokeWidth);
        }
    }

    /**
     * Creates node data for grouped data processing.
     */
    private createNodeDataGrouped(
        ctx: RangeBarSeriesNodeDatumContext,
        xPosition: (index: number) => number,
        nodeDatumParamsScratch: NodeDatumParams,
        itemId: RangeBarItemId,
        strokeWidth: number
    ): void {
        const processedData = this.processedData! as _ModuleSupport.GroupedData<any>;
        for (const { datumIndex, groupIndex: groupDataIndex } of this.dataModel!.forEachGroupDatum(
            this,
            processedData
        )) {
            // Populate scratch object
            nodeDatumParamsScratch.datumIndex = datumIndex;
            nodeDatumParamsScratch.groupedDataIndex = groupDataIndex;
            nodeDatumParamsScratch.x = xPosition(datumIndex);
            nodeDatumParamsScratch.width = ctx.barWidth;
            nodeDatumParamsScratch.yLow = ctx.yLowValues[datumIndex];
            nodeDatumParamsScratch.yHigh = ctx.yHighValues[datumIndex];
            nodeDatumParamsScratch.crisp = ctx.crisp;

            this.upsertNodeDatum(ctx, nodeDatumParamsScratch, itemId, strokeWidth);
        }
    }

    override createNodeData() {
        const { data, processedData, visible } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && xAxis && yAxis && this.dataModel && processedData?.dataSources && this.chart?.seriesRect)) return;

        // 1. Create shared context for datum creation (instantiated once, reused for all datums)
        const ctx = this.createNodeDatumContext(xAxis, yAxis);
        if (!ctx) return;

        const { yLowKey, yHighKey, strokeWidth } = this.properties;
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
            nodeData: ctx.nodes,
            labelData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.groupScale),
            visible: this.visible,
            styles: getItemStyles(this.getItemStyle.bind(this)),
            segments,
        };
        if (!visible) return context;

        // 2. Helper for x position calculation (uses context)
        const xPosition = (datumIndex: number) =>
            Math.round(ctx.xScale.convert(ctx.xValues[datumIndex])) + ctx.groupOffset + ctx.barOffset;

        // 3. Scratch object for node datum parameters - avoid memory churn whilst minimizing parameter sprawl.
        const nodeDatumParamsScratch: NodeDatumParams = {
            nodeDatumScratch: {
                datum: undefined,
                xValue: undefined,
                yLowValue: 0,
                yHighValue: 0,
                rawLowValue: undefined,
                rawHighValue: undefined,
            },
            labelParamsScratch: {
                labels: [],
                datumIndex: 0,
                rectX: 0,
                rectY: 0,
                rectWidth: 0,
                rectHeight: 0,
                yLowValue: 0,
                yHighValue: 0,
                datum: undefined,
            },
            datumIndex: 0,
            groupedDataIndex: 0,
            x: 0,
            width: 0,
            yLow: 0,
            yHigh: 0,
            crisp: false,
        };

        // 4. Strategy selection - delegate to specialized methods
        const [r0, r1] = ctx.xScale.range;
        const range = Math.abs(r1 - r0);

        // Ensure we have the needed aggregation level (force deferred computation if necessary)
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);

        if (dataAggregationFilter != null) {
            this.createNodeDataWithAggregation(
                ctx,
                xPosition,
                nodeDatumParamsScratch,
                itemId,
                strokeWidth,
                dataAggregationFilter
            );
        } else if (processedData.type === 'ungrouped') {
            this.createNodeDataSimple(ctx, xPosition, nodeDatumParamsScratch, itemId, strokeWidth, processedData);
        } else {
            this.createNodeDataGrouped(ctx, xPosition, nodeDatumParamsScratch, itemId, strokeWidth);
        }

        // 5. Trim excess nodes if we did incremental updates and have leftover nodes
        if (ctx.canIncrementallyUpdate) {
            if (ctx.nodeIndex < ctx.nodes.length) {
                ctx.nodes.length = ctx.nodeIndex;
            }
        }

        // 6. Build label data from nodes
        for (const node of ctx.nodes) {
            context.labelData.push(...node.labels);
        }

        // 7. Return result
        return context;
    }

    /**
     * Updates existing label data in place or creates new labels if needed.
     * This avoids array allocations during incremental updates.
     * Uses positional params (no destructuring) for performance in hot path.
     */
    private updateLabelData(ctx: RangeBarSeriesNodeDatumContext, params: LabelUpdateParams): void {
        const labels = params.labels;

        // Skip all label computation if labels are disabled - getLabelText is expensive
        // Only clear if labels exist (avoid array operation when already empty)
        if (!ctx.labelEnabled) {
            if (labels.length > 0) {
                labels.length = 0;
            }
            return;
        }

        const { xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, legendItemName, label } = this.properties;
        const barAlongX = ctx.barAlongX;
        const placement = ctx.labelPlacement;
        const labelPadding = ctx.labelPadding;

        // Calculate label positions and alignment using scratch params
        const rectX = params.rectX;
        const rectY = params.rectY;
        const rectWidth = params.rectWidth;
        const rectHeight = params.rectHeight;

        const yLowX = rectX + (barAlongX ? -labelPadding : rectWidth / 2);
        const yLowY = rectY + (barAlongX ? rectHeight / 2 : rectHeight + labelPadding);

        let yLowTextAlign: CanvasTextAlign;
        if (placement === 'outside') {
            yLowTextAlign = barAlongX ? 'right' : 'center';
        } else {
            yLowTextAlign = barAlongX ? 'left' : 'center';
        }

        let yLowTextBaseline: CanvasTextBaseline;
        if (placement === 'outside') {
            yLowTextBaseline = barAlongX ? 'middle' : 'top';
        } else {
            yLowTextBaseline = barAlongX ? 'middle' : 'bottom';
        }

        const yHighX = rectX + (barAlongX ? rectWidth + labelPadding : rectWidth / 2);
        const yHighY = rectY + (barAlongX ? rectHeight / 2 : -labelPadding);

        let yHighTextAlign: CanvasTextAlign;
        if (placement === 'outside') {
            yHighTextAlign = barAlongX ? 'left' : 'center';
        } else {
            yHighTextAlign = barAlongX ? 'right' : 'center';
        }

        let yHighTextBaseline: CanvasTextBaseline;
        if (placement === 'outside') {
            yHighTextBaseline = barAlongX ? 'middle' : 'bottom';
        } else {
            yHighTextBaseline = barAlongX ? 'middle' : 'top';
        }

        const datum = params.datum;
        const yLowValue = params.yLowValue;
        const yHighValue = params.yHighValue;
        const datumIndex = params.datumIndex;

        const labelTextParams = { datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, legendItemName };
        const yDomain = extractDomain(this.getSeriesDomain(ChartAxisDirection.Y));

        const yLowText = this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(
            yLowValue,
            datum,
            yLowKey,
            'y',
            yDomain,
            label,
            { itemType: 'low', value: yLowValue, ...labelTextParams }
        );

        const yHighText = this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(
            yHighValue,
            datum,
            yHighKey,
            'y',
            yDomain,
            label,
            { itemType: 'high', value: yHighValue, ...labelTextParams }
        );

        // Update or create yLowLabel
        if (labels.length > 0 && labels[0].itemType === 'low') {
            // Update existing label in place
            const yLowLabel = labels[0] as Mutable<RangeBarNodeLabelDatum>;
            yLowLabel.datumIndex = datumIndex;
            yLowLabel.x = yLowX;
            yLowLabel.y = yLowY;
            yLowLabel.textAlign = yLowTextAlign;
            yLowLabel.textBaseline = yLowTextBaseline;
            yLowLabel.text = yLowText;
            yLowLabel.datum = datum;
        } else {
            // Create new label
            labels[0] = {
                datumIndex,
                x: yLowX,
                y: yLowY,
                textAlign: yLowTextAlign,
                textBaseline: yLowTextBaseline,
                text: yLowText,
                itemType: 'low',
                datum,
                series: this,
            };
        }

        // Update or create yHighLabel
        if (labels.length > 1 && labels[1].itemType === 'high') {
            // Update existing label in place
            const yHighLabel = labels[1] as Mutable<RangeBarNodeLabelDatum>;
            yHighLabel.datumIndex = datumIndex;
            yHighLabel.x = yHighX;
            yHighLabel.y = yHighY;
            yHighLabel.textAlign = yHighTextAlign;
            yHighLabel.textBaseline = yHighTextBaseline;
            yHighLabel.text = yHighText;
            yHighLabel.datum = datum;
        } else {
            // Create new label
            labels[1] = {
                datumIndex,
                x: yHighX,
                y: yHighY,
                textAlign: yHighTextAlign,
                textBaseline: yHighTextBaseline,
                text: yHighText,
                itemType: 'high',
                datum,
                series: this,
            };
        }

        // Ensure labels array has exactly 2 items
        labels.length = 2;
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
        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to ensure we match up nodes by id.
            return datumSelection.update(data);
        }
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

        const series = this;
        datumSelection.each(function updateRangeBarNode(rect, datum) {
            const style =
                datum.style ??
                contextNodeData.styles[series.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];
            rect.setStyleProperties(style, fillBBox);

            // Batched static property updates - write directly to backing fields to reduce markDirty() calls
            rect.setStaticProperties(
                'overlay',
                style.cornerRadius ?? 0,
                style.cornerRadius ?? 0,
                style.cornerRadius ?? 0,
                style.cornerRadius ?? 0,
                categoryAlongX ? datum.width > 0 : datum.height > 0,
                datum.crisp,
                undefined
            );
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

    protected override resetDatumAnimation(data: RangeBarAnimationData) {
        // Use direct reset to bypass resetMotion callback overhead
        resetBarSelectionsDirect([data.datumSelection]);
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
