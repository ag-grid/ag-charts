import {
    type AgRangeBarSeriesItemStylerParams,
    type AgRangeBarSeriesLabelFormatterParams,
    type AgRangeBarSeriesOptions,
    type AgRangeBarSeriesStyle,
    type AgRangeBarSeriesStylerParams,
    type SelectionState,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    type BoxBounds,
    type CallbackParamRules,
    ChartAxisDirection,
    DebugMetrics,
    type DomainWithMetadata,
    type DynamicContext,
    type FillStrokeMorph,
    type LabelFit,
    type Mutable,
    type Normalised,
    type NormalisedTextOrSegments,
    type PlacedLabel,
    type Point,
    type PointLabelDatum,
    type RequireOptional,
    applyBarLabelOrientation,
    applyPlacedBarLabelVisibility,
    areScalingEqual,
    barLabelObstacles,
    barLabelOrientation,
    barLabelResolvesOrientation,
    barLabelResolvesPlacement,
    barLabelRotation,
    barLabelRoutesThroughEngine,
    buildBarLabelData,
    buildBarPositionedLabelDatum,
    findMinMax,
    fontWithSize,
    insideBarContainer,
    insideBarRegion,
    isContinuous,
    measureLabelText,
    mergeDefaults,
    resolveLabelFit,
    resolveLabelFitDescriptors,
    rotatedGlyphDrift,
    rotatedLabelInset,
    toArray,
    toNumber,
} from 'ag-charts-core';
import type { AgCoordinates, AgNumericValue, PaddingOptions } from 'ag-charts-types';

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
    fitLabelToContainerAutoSize,
    buildBarLabelCandidates,
    createBarCandidateStyleResolver,
    styledBarLabelBox,
    toResolvedPlacement,
    updateLabelNode,
    pickPlacementStyle,
    expandPlacementLabelBoxExtent,
    resolvePlacementLabelBoxExtent,
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
    Rect,
    PointerEvents,
    motion,
    processedDataIsAnimatable,
    getItemStyles,
    calculateSegments,
    toHighlightString,
    toSelectionString,
    HighlightState,
    AggregationManager,
    upsertNodeDatum,
} = _ModuleSupport;

interface RangeBarNodeLabelDatum extends Readonly<Point> {
    datumIndex: number;
    text: NormalisedTextOrSegments;
    /** Reduced font size the text was fitted at; `undefined` when it renders at the configured size. */
    fittedFontSize?: number;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    rotation: number;
    region?: BoxBounds;
    /** Flush offset written by the placement engine to keep a rotated label inside its region. */
    offsetX?: number;
    offsetY?: number;
    /** Granular resolved placement, coarsened via {@link toResolvedPlacement} to select placement styles. */
    placement?: _ModuleSupport.BarLabelPlacement;
    /** Pre-positioned cascade candidates, present only when the label routes through the engine. */
    candidates?: readonly _ModuleSupport.BarPositionedCandidate[];
    /** Own bar rect, so a positioned candidate avoids neighbouring bars but never its own. */
    ownBox?: BoxBounds;
    /** Engine-routed label the placement engine dropped (no candidate fit); rendered invisible. */
    hidden?: boolean;
    datum: any;
    itemType: 'high' | 'low';
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
}

type RangeBarItemId = `${string}-${string}`;

type NormalisedRangeBarSeriesStyle = Normalised<AgRangeBarSeriesStyle, never, FillStrokeMorph>;

/**
 * Shared context for creating/updating RangeBarNodeDatum instances.
 * Instantiated once per createNodeData() call and reused across all datum operations
 * to minimize memory allocations. Only contains values that are expensive to compute
 * or resolve - cheap property lookups use `this` directly in methods.
 */
interface RangeBarSeriesNodeDatumContext extends _ModuleSupport.CartesianCreateNodeDataContext<RangeBarNodeDatum> {
    // Data arrays (resolved from dataModel - worth caching)
    readonly yLowValues: AgNumericValue[];
    readonly yHighValues: AgNumericValue[];

    // Computed positioning (involves scale conversions - worth caching)
    readonly barWidth: number;
    readonly groupOffset: number;
    readonly barOffset: number;

    // Pre-computed values
    readonly barAlongX: boolean;
    // Value axis reversed: low then sits at the rect's far edge, so the low/high labels swap ends.
    readonly yReversed: boolean;
    readonly crisp: boolean;

    // Property keys (constant across all datums - worth caching)
    readonly yLowKey: string;
    readonly yHighKey: string;

    // Label configuration (checked before expensive label text computation)
    readonly labelEnabled: boolean;
    readonly labelPlacement: 'inside' | 'outside';
    // Signed anchor offsets per role: yLow and yHigh face opposite edges, so each folds in its own facing padding.
    // Valid only for unrotated labels; a rotated label's reach is per-datum (see labelBoxPadding et al.).
    readonly yLowPadding: number;
    readonly yHighPadding: number;
    // Pieces to recompute a rotated label's per-datum reach: reach folds in the box's cross-axis extent.
    readonly labelSpacing: number;
    readonly labelSign: number;
    readonly labelBoxPadding: Required<PaddingOptions>;
    readonly yLowFacing: keyof Required<PaddingOptions>;
    readonly yHighFacing: keyof Required<PaddingOptions>;
    // Orientation derived once (series-constant) to keep the per-datum label build allocation-free.
    readonly labelRotation: number;
    readonly labelResolvesOrientation: boolean;
    readonly labelRoutesThroughEngine: boolean;
    readonly labelFit: LabelFit | undefined;

    // Incremental update support
    readonly dataAggregationFilter: RangeBarSeriesDataAggregationFilter | undefined;
}

/**
 * Prepared state for node datum creation/update.
 * Reused as scratch object to avoid allocations in tight loops.
 */
interface PreparedRangeBarNodeDatumState {
    datum: any;
    xValue: any;
    yLowValue: AgNumericValue;
    yHighValue: AgNumericValue;
    rawLowValue: AgNumericValue;
    rawHighValue: AgNumericValue;
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
    // bigint-capable so yScale.convert() keeps full precision; x/width are pixel-space.
    yLow: AgNumericValue;
    yHigh: AgNumericValue;
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
    yLowValue: AgNumericValue;
    yHighValue: AgNumericValue;
    datum: any;
}

interface RangeBarNodeDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>, Readonly<Point> {
    readonly index: number;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: AgNumericValue;
    readonly yHighValue: AgNumericValue;
    readonly width: number;
    readonly height: number;
    readonly labels: RangeBarNodeLabelDatum[];
    readonly crisp: boolean;

    // Required for types
    readonly clipBBox?: _ModuleSupport.BBox;
    readonly opacity?: number;
    style?: Required<NormalisedRangeBarSeriesStyle>;
}

type RangeBarAnimationData = _ModuleSupport.AbstractBarSeriesAnimationData<RangeBarSeriesTypes>;

class RangeBarSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RangeBarNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;

    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: RangeBarNodeDatum,
        series: RangeBarSeries,
        selectionState: SelectionState | undefined,
        isCollapsed: boolean | undefined,
        coordinates: AgCoordinates | undefined
    ) {
        super(type, nativeEvent, datum, series, selectionState, isCollapsed, coordinates);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}

interface RangeBarSeriesNodeDataContext extends _ModuleSupport.AbstractBarSeriesNodeDataContext<
    RangeBarNodeDatum,
    RangeBarNodeLabelDatum
> {
    itemId: RangeBarItemId;
    styles: _ModuleSupport.SeriesNodeStyleContext<NormalisedRangeBarSeriesStyle>;
}

/**
 * Consolidated type interface for RangeBarSeries.
 * Defines all type parameters in one place for the series.
 */
interface RangeBarSeriesTypes extends _ModuleSupport.AbstractBarSeriesTypes {
    readonly node: _ModuleSupport.Rect<RangeBarNodeDatum>;
    readonly options: AgRangeBarSeriesOptions;
    readonly properties: RangeBarProperties;
    readonly datum: RangeBarNodeDatum;
    readonly label: RangeBarNodeLabelDatum;
    readonly context: RangeBarSeriesNodeDataContext;
    readonly stackContext: never;
    readonly createNodeDataContext: RangeBarSeriesNodeDatumContext;
}

/**
 * Bakes a cascade candidate list onto a label, adopting the first candidate's anchor/region/placement as
 * the backward-safe default the engine overwrites once it picks a fitting candidate. Rotation is left as
 * the baked first-orientation value.
 */
function bakeFirstCandidate(
    labelDatum: Mutable<RangeBarNodeLabelDatum>,
    candidates: _ModuleSupport.BarPositionedCandidate[]
): void {
    const [first] = candidates;
    labelDatum.x = first.anchor.x;
    labelDatum.y = first.anchor.y;
    labelDatum.textAlign = first.anchor.textAlign;
    labelDatum.textBaseline = first.anchor.textBaseline;
    labelDatum.region = first.region;
    labelDatum.offsetX = 0;
    labelDatum.offsetY = 0;
    labelDatum.placement = first.placement;
    labelDatum.candidates = candidates;
}

export class RangeBarSeries extends _ModuleSupport.AbstractBarSeries<RangeBarSeriesTypes> {
    static override readonly className = 'RangeBarSeries';
    static readonly type = 'range-bar' as const;

    override properties = new RangeBarProperties();

    private readonly aggregationManager = new AggregationManager<RangeBarSeriesDataAggregationFilter>();

    protected override readonly NodeEvent = RangeBarSeriesNodeEvent;

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
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

        const visibleProps = this.visible ? {} : { forceValue: Number.NaN };
        const allowNullKey = this.properties.allowNullKeys ?? false;
        const { dataModel, processedData } = await this.requestDataModel(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: 'xValue', allowNullKey }),
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
        this.aggregationManager.markStale(processedData.input.count);

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

        const filters = this.aggregationManager.filters;
        if (filters && filters.length > 0) {
            DebugMetrics.record(
                `${this.type}:aggregation`,
                filters.map((f) => f.maxRange)
            );
        }
    }

    // Picked datumIndex is the bucket's midpoint (not an extrema); the helper re-derives
    // the bucket from its xValue, which still falls within the bucket's x-range.
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
        if (xAxis?.scale == null) return 0;

        const [r0, r1] = xAxis.scale.range;
        return Math.abs(r1 - r0);
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
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

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [number, number]): [number, number] {
        // domainForVisibleRange may yield a bigint; narrow once for this number-typed range contract.
        const [y0, y1] = this.domainForVisibleRange(
            ChartAxisDirection.Y,
            ['yHighValue', 'yLowValue'],
            'xValue',
            visibleRange
        );
        return [toNumber(y0), toNumber(y1)];
    }

    /**
     * Creates shared context for node datum creation/update operations.
     * This context is instantiated once and reused across all datum operations
     * to minimize memory allocations. Only caches values that are expensive to
     * compute - cheap property lookups use `this` directly.
     */
    protected override createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): RangeBarSeriesNodeDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources?.get(this.id)?.data;
        if (rawData == null) return undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const crisp = checkCrisp(
            xAxis?.scale,
            xAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        // Ensure we have the needed aggregation level (force deferred computation if necessary)
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        this.ensureBucketLookupFeature()?.setActiveFilter(processedData, dataAggregationFilter);
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const canIncrementallyUpdate =
            this.contextNodeData?.nodeData != null &&
            (processedData.changeDescription != null ||
                !processedDataIsAnimatable(processedData) ||
                dataAggregationFilter != null);

        const { groupOffset, barOffset, barWidth } = this.getBarDimensions();

        // Array placement is accepted, but only its first candidate is honoured here.
        const labelPlacement = toArray(this.properties.label.placement)[0];
        const labelProps = this.properties.label;
        const placementStyle = labelPlacement === 'outside' ? labelProps.outsideStyle : labelProps.insideStyle;
        const boxPadding = resolvePlacementLabelBoxExtent(labelProps, placementStyle);
        const isOutside = labelPlacement === 'outside';
        const sign = isOutside ? 1 : -1;
        // yLow and yHigh sit on opposite edges of the same axis, so one's outer side is the other's inner side.
        const [lowOuter, lowInner] = barAlongX ? (['right', 'left'] as const) : (['top', 'bottom'] as const);
        const yLowFacing = isOutside ? lowOuter : lowInner;
        const yHighFacing = isOutside ? lowInner : lowOuter;
        const labelRotation = barLabelRotation(toArray(this.properties.label.orientation)[0]);

        return {
            xAxis,
            yAxis,
            rawData,
            xValues: dataModel.resolveKeysById(this, `xValue`, processedData),
            yLowValues: dataModel.resolveColumnById(this, `yLowValue`, processedData, 'mixed-numeric'),
            yHighValues: dataModel.resolveColumnById(this, `yHighValue`, processedData, 'mixed-numeric'),
            xScale,
            yScale,
            groupOffset,
            barOffset,
            barWidth,
            barAlongX,
            yReversed: yAxis.isReversed(),
            crisp,
            dataAggregationFilter,
            animationEnabled,
            xKey: this.properties.xKey,
            yLowKey: this.properties.yLowKey,
            yHighKey: this.properties.yHighKey,
            labelEnabled: this.properties.label.enabled,
            labelPlacement,
            labelRotation,
            labelResolvesOrientation: barLabelResolvesOrientation(this.properties.label.orientation),
            labelRoutesThroughEngine: barLabelRoutesThroughEngine(
                this.properties.label.orientation,
                this.properties.label.placement,
                this.properties.label.collision.alwaysShow
            ),
            labelFit: resolveLabelFit(this.properties.label, !this.properties.label.collision.alwaysShow),
            yLowPadding: (labelProps.spacing + boxPadding[yLowFacing]) * sign,
            yHighPadding: (labelProps.spacing + boxPadding[yHighFacing]) * sign,
            labelSpacing: labelProps.spacing,
            labelSign: sign,
            labelBoxPadding: boxPadding,
            yLowFacing,
            yHighFacing,
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
        if (xValue === undefined && !this.properties.allowNullKeys) return undefined;

        const rawLowValue = ctx.yLowValues[datumIndex];
        const rawHighValue = ctx.yHighValues[datumIndex];

        // isContinuous accepts any bigint; Number.isFinite rejects every bigint (it never coerces them).
        if (!isContinuous(rawLowValue) || !isContinuous(rawHighValue)) return undefined;

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
    private createSkeletonNodeDatum(ctx: RangeBarSeriesNodeDatumContext, params: NodeDatumParams): RangeBarNodeDatum {
        const scratch = params.nodeDatumScratch;
        return {
            index: params.groupedDataIndex,
            series: this,
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
        _itemId: RangeBarItemId,
        strokeWidth: number
    ): RangeBarNodeDatum | undefined {
        const prepared = this.prepareNodeDatumState(ctx, params.nodeDatumScratch, params.datumIndex);
        if (!prepared) return undefined;

        const nodeData = this.createSkeletonNodeDatum(ctx, params);
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
            if (xValue === undefined && !this.properties.allowNullKeys) continue;

            // Populate scratch object with aggregated values
            nodeDatumParamsScratch.datumIndex = midDatumIndex;
            nodeDatumParamsScratch.groupedDataIndex = 0;
            nodeDatumParamsScratch.x = xPosition(midDatumIndex);
            nodeDatumParamsScratch.width = Math.abs(xPosition(xMinIndex) - xPosition(xMaxIndex)) + ctx.barWidth;
            nodeDatumParamsScratch.yLow = ctx.yLowValues[yMinIndex];
            nodeDatumParamsScratch.yHigh = ctx.yHighValues[yMaxIndex];
            nodeDatumParamsScratch.crisp = ctx.crisp;

            // Use shared utility for create/update logic
            upsertNodeDatum(
                ctx,
                nodeDatumParamsScratch,
                (c, p) => this.createNodeDatum(c, p, itemId, strokeWidth),
                (c, n, p) => this.updateNodeDatum(c, n, p, strokeWidth)
            );
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

            // Use shared utility for create/update logic
            upsertNodeDatum(
                ctx,
                nodeDatumParamsScratch,
                (c, p) => this.createNodeDatum(c, p, itemId, strokeWidth),
                (c, n, p) => this.updateNodeDatum(c, n, p, strokeWidth)
            );
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

            // Use shared utility for create/update logic
            upsertNodeDatum(
                ctx,
                nodeDatumParamsScratch,
                (c, p) => this.createNodeDatum(c, p, itemId, strokeWidth),
                (c, n, p) => this.updateNodeDatum(c, n, p, strokeWidth)
            );
        }
    }

    protected override populateNodeData(ctx: RangeBarSeriesNodeDatumContext): void {
        const { processedData } = this;
        if (!processedData) return;

        const { yLowKey, yHighKey, strokeWidth } = this.properties;
        const itemId = `${yLowKey}-${yHighKey}` as const;

        // Helper for x position calculation (uses context)
        const xPosition = (datumIndex: number) => {
            const x = ctx.xScale.convert(ctx.xValues[datumIndex]);
            if (!Number.isFinite(x)) return Number.NaN;
            return x + ctx.groupOffset + ctx.barOffset;
        };

        // Scratch object for node datum parameters - avoid memory churn whilst minimizing parameter sprawl.
        const nodeDatumParamsScratch: NodeDatumParams = {
            nodeDatumScratch: {
                datum: undefined,
                xValue: undefined,
                yLowValue: 0,
                yHighValue: 0,
                rawLowValue: 0,
                rawHighValue: 0,
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

        // Strategy selection - delegate to specialized methods
        if (ctx.dataAggregationFilter != null) {
            this.createNodeDataWithAggregation(
                ctx,
                xPosition,
                nodeDatumParamsScratch,
                itemId,
                strokeWidth,
                ctx.dataAggregationFilter
            );
        } else if (processedData.type === 'ungrouped') {
            this.createNodeDataSimple(ctx, xPosition, nodeDatumParamsScratch, itemId, strokeWidth, processedData);
        } else {
            this.createNodeDataGrouped(ctx, xPosition, nodeDatumParamsScratch, itemId, strokeWidth);
        }
    }

    protected override finalizeNodeData(ctx: RangeBarSeriesNodeDatumContext): void {
        // Trim excess nodes if we did incremental updates and have leftover nodes
        if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length) {
            ctx.nodes.length = ctx.nodeIndex;
        }
    }

    protected override initializeResult(ctx: RangeBarSeriesNodeDatumContext): RangeBarSeriesNodeDataContext {
        const { yLowKey, yHighKey } = this.properties;
        const itemId = `${yLowKey}-${yHighKey}` as const;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        const segments =
            xAxis && yAxis && this.chart?.seriesRect
                ? calculateSegments(this.properties.segmentation, xAxis, yAxis, this.chart.seriesRect, this.ctx.scene)
                : undefined;

        return {
            itemId,
            nodeData: ctx.nodes,
            labelData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.ctx.seriesStateManager.getGroupScale(this)!),
            visible: this.visible,
            styles: getItemStyles(this.getItemStyle.bind(this)),
            segments,
        };
    }

    protected override assembleResult(
        ctx: RangeBarSeriesNodeDatumContext,
        result: RangeBarSeriesNodeDataContext
    ): RangeBarSeriesNodeDataContext {
        // Build label data from nodes
        for (const node of ctx.nodes) {
            result.labelData.push(...node.labels);
        }
        return result;
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
        // The first orientation is baked into `rotation`; an array resolves against the bar rect for inside placement only.
        const rotation = ctx.labelRotation;

        // Calculate label positions and alignment using scratch params
        const rectX = params.rectX;
        const rectY = params.rectY;
        const rectWidth = params.rectWidth;
        const rectHeight = params.rectHeight;

        const rect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
        // Inside labels fit within the bar rect (each end reserves the one-sided spacing and drawn box);
        // outside labels sit beside it, so leave them unbound.
        const isInside = placement === 'inside';
        // A range bar carries a label at each value end (low and high), so the region reserves the
        // `spacing` gap on both value ends.
        const barRegion =
            isInside && (ctx.labelFit != null || ctx.labelResolvesOrientation)
                ? insideBarRegion(rect, label.spacing, label.spacing, !barAlongX)
                : undefined;
        // Only bind the text to the bar (and hide it when it overflows) when `inside` is the sole
        // placement. A cascade with a non-inside fallback lets a label that cannot fit inside escape to
        // that placement, so hiding it for failing the inside fit would wrongly drop a placeable label.
        const insideOnly = toArray(label.placement).every((p) => p === 'inside');
        const container =
            barRegion && insideOnly ? insideBarContainer(barRegion, expandPlacementLabelBoxExtent(label)) : undefined;
        // Orientation resolution flushes/contains an inside label against the same region.
        const region = ctx.labelResolvesOrientation ? barRegion : undefined;

        const datum = params.datum;
        const yLowValue = params.yLowValue;
        const yHighValue = params.yHighValue;
        const datumIndex = params.datumIndex;

        const labelTextParams = { datum, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, legendItemName };
        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y).domain;

        // The engine refits a routed label to each candidate, knowing a rotated label measures against
        // the bar's other axis and that each placement offers its own room; fitting here would bind every
        // candidate to the first placement's upright budget (see barSeries).
        const fitText = (text: NormalisedTextOrSegments) =>
            ctx.labelRoutesThroughEngine
                ? { text, fontSize: undefined }
                : fitLabelToContainerAutoSize(text, ctx.labelFit, label, container);

        const { text: yLowText, fontSize: yLowFontSize } = fitText(
            this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(yLowValue, datum, yLowKey, 'y', yDomain, label, {
                itemType: 'low',
                value: yLowValue,
                ...labelTextParams,
            })
        );

        const { text: yHighText, fontSize: yHighFontSize } = fitText(
            this.getLabelText<AgRangeBarSeriesLabelFormatterParams>(yHighValue, datum, yHighKey, 'y', yDomain, label, {
                itemType: 'high',
                value: yHighValue,
                ...labelTextParams,
            })
        );

        // Signed reach from the bar edge to the anchor. Unrotated it is the series-constant facing
        // padding; a rotated label reaches by its box's cross-axis extent, so it is measured per datum.
        // A rotated box also drifts off its anchor on the cross-axis (asymmetric padding), so both labels
        // are pulled back by the same drift to stay centred on the bar.
        let yLowPadding = ctx.yLowPadding;
        let yHighPadding = ctx.yHighPadding;
        let crossDrift = 0;
        if (rotation !== 0) {
            const low = measureLabelText(yLowText, fontWithSize(label, yLowFontSize));
            const high = measureLabelText(yHighText, fontWithSize(label, yHighFontSize));
            const { labelSpacing, labelSign, labelBoxPadding, yLowFacing, yHighFacing } = ctx;
            yLowPadding =
                (labelSpacing + rotatedLabelInset(yLowFacing, rotation, low.width, low.height, labelBoxPadding)) *
                labelSign;
            yHighPadding =
                (labelSpacing + rotatedLabelInset(yHighFacing, rotation, high.width, high.height, labelBoxPadding)) *
                labelSign;
            const drift = rotatedGlyphDrift(rotation, labelBoxPadding);
            crossDrift = barAlongX ? drift.y : drift.x;
        }

        const yLowX = rectX + (barAlongX ? -yLowPadding : rectWidth / 2 - crossDrift);
        const yLowY = rectY + (barAlongX ? rectHeight / 2 - crossDrift : rectHeight + yLowPadding);

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

        const yHighX = rectX + (barAlongX ? rectWidth + yHighPadding : rectWidth / 2 - crossDrift);
        const yHighY = rectY + (barAlongX ? rectHeight / 2 - crossDrift : -yHighPadding);

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

        // Update or create yLowLabel
        if (labels.length > 0 && labels[0].itemType === 'low') {
            // Update existing label in place
            const yLowLabel = labels[0] as Mutable<RangeBarNodeLabelDatum>;
            yLowLabel.datumIndex = datumIndex;
            yLowLabel.x = yLowX;
            yLowLabel.y = yLowY;
            yLowLabel.textAlign = yLowTextAlign;
            yLowLabel.textBaseline = yLowTextBaseline;
            yLowLabel.rotation = rotation;
            yLowLabel.region = region;
            yLowLabel.offsetX = 0;
            yLowLabel.offsetY = 0;
            yLowLabel.text = yLowText;
            yLowLabel.fittedFontSize = yLowFontSize;
            yLowLabel.datum = datum;
        } else {
            // Create new label
            labels[0] = {
                datumIndex,
                x: yLowX,
                y: yLowY,
                textAlign: yLowTextAlign,
                textBaseline: yLowTextBaseline,
                rotation,
                region,
                offsetX: 0,
                offsetY: 0,
                text: yLowText,
                fittedFontSize: yLowFontSize,
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
            yHighLabel.rotation = rotation;
            yHighLabel.region = region;
            yHighLabel.offsetX = 0;
            yHighLabel.offsetY = 0;
            yHighLabel.text = yHighText;
            yHighLabel.fittedFontSize = yHighFontSize;
            yHighLabel.datum = datum;
        } else {
            // Create new label
            labels[1] = {
                datumIndex,
                x: yHighX,
                y: yHighY,
                textAlign: yHighTextAlign,
                textBaseline: yHighTextBaseline,
                rotation,
                region,
                offsetX: 0,
                offsetY: 0,
                text: yHighText,
                fittedFontSize: yHighFontSize,
                itemType: 'high',
                datum,
                series: this,
            };
        }

        // Ensure labels array has exactly 2 items
        labels.length = 2;

        const low = labels[0] as Mutable<RangeBarNodeLabelDatum>;
        const high = labels[1] as Mutable<RangeBarNodeLabelDatum>;
        // On a reversed value axis the low value sits at the rect's high edge and vice versa, so the two
        // baked anchors belong to the opposite labels; swap their positions (each keeps its own value text).
        // The cascade path below re-bakes reversed-aware candidates, so this only affects the direct path.
        if (ctx.yReversed) {
            [low.x, high.x] = [high.x, low.x];
            [low.y, high.y] = [high.y, low.y];
            [low.textAlign, high.textAlign] = [high.textAlign, low.textAlign];
            [low.textBaseline, high.textBaseline] = [high.textBaseline, low.textBaseline];
        }
        const rectBox = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
        // yLow and yHigh share the bar rect, so each ignores its own bar when avoiding series items.
        low.ownBox = rectBox;
        high.ownBox = rectBox;

        // yLow anchors at the value-axis start end, yHigh at the end end, so each maps its coarse
        // inside/outside to the granular start/end placement at its own end.
        const coarse = placement ?? 'inside';
        // A placement/orientation array cascades through the engine; a hideable label routes even for a
        // single placement so a no-fit label can be dropped and hidden.
        if (barLabelResolvesPlacement(label.placement) || !label.collision.alwaysShow) {
            const coarseList = toArray(label.placement);
            if (coarseList.length === 0) coarseList.push('inside');
            const orientations = toArray(label.orientation);
            if (orientations.length === 0) orientations.push('horizontal');
            const plotRegion = this.resolveLabelPlotRegion(label.collision);
            const resolveStyle =
                label.itemStyler == null
                    ? undefined
                    : createBarCandidateStyleResolver(this, label, this.makeLabelStylerParams());
            const buildCandidates = (
                text: NormalisedTextOrSegments,
                end: 'start' | 'end',
                styleDatum: RangeBarNodeLabelDatum
            ) => {
                const size = measureLabelText(text, label);
                return buildBarLabelCandidates({
                    // A reversed value axis flips which rect edge the start/end candidates anchor to.
                    isUpward: !ctx.yReversed,
                    isVertical: !barAlongX,
                    placements: coarseList.map((c): _ModuleSupport.BarLabelPlacement => `${c}-${end}`),
                    orientations,
                    spacing: label.spacing,
                    label,
                    textWidth: size.width,
                    textHeight: size.height,
                    rect: rectBox,
                    plotRegion,
                    fitted: ctx.labelFit != null,
                    text,
                    styleDatum,
                    resolveStyle,
                });
            };
            bakeFirstCandidate(low, buildCandidates(yLowText, 'start', labels[0]));
            bakeFirstCandidate(high, buildCandidates(yHighText, 'end', labels[1]));
        } else {
            low.candidates = undefined;
            high.candidates = undefined;
            low.placement = `${coarse}-start`;
            high.placement = `${coarse}-end`;
        }
        low.hidden = false;
        high.hidden = false;
    }

    protected override nodeFactory() {
        return new Rect<RangeBarNodeDatum>();
    }

    private getStyle(
        ignoreStylerCallback: boolean,
        highlightState: _ModuleSupport.HighlightState | undefined,
        selectionState: _ModuleSupport.SelectionState | undefined,
        candidateState: _ModuleSupport.SelectionState | undefined
    ): Required<NormalisedRangeBarSeriesStyle> & { opacity: number } {
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
        let stylerResult: NormalisedRangeBarSeriesStyle = {};
        if (!ignoreStylerCallback && styler) {
            const stylerParams = this.makeStylerParams(highlightState, selectionState, candidateState);
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
        highlightStateEnum: _ModuleSupport.HighlightState | undefined,
        selectionStateEnum: _ModuleSupport.SelectionState | undefined,
        candidateStateEnum: _ModuleSupport.SelectionState | undefined
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
        const selectionState = toSelectionString(selectionStateEnum);
        const candidateState = toSelectionString(candidateStateEnum);

        return {
            cornerRadius,
            fill,
            fillOpacity,
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
            yLowKey,
            yHighKey,
        } satisfies CallbackParamRules<AgRangeBarSeriesStylerParams<unknown, unknown>>;
    }

    protected override updateDatumSelection(opts: {
        nodeData: RangeBarNodeDatum[];
        datumSelection: _ModuleSupport.Selection<RangeBarNodeDatum, _ModuleSupport.Rect<RangeBarNodeDatum>>;
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
        highlightState: _ModuleSupport.HighlightState | undefined,
        selectionState: _ModuleSupport.SelectionState | undefined,
        candidateState: _ModuleSupport.SelectionState | undefined
    ): Required<NormalisedRangeBarSeriesStyle> {
        const { properties, dataModel, processedData } = this;
        const { itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const selectionStyle = this.getSelectionStyle(datumIndex, selectionState, candidateState);
        let style = mergeDefaults(
            selectionStyle,
            highlightStyle,
            this.getStyle(datumIndex === undefined, highlightState, selectionState, candidateState)
        );

        if (itemStyler && dataModel != null && processedData != null && datumIndex != null) {
            const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
            const overrides = this.cachedDatumCallback(
                createDatumId(this.getDatumId({ xValue }), isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(datumIndex, isHighlight, style);
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

    private makeItemStylerParams(
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedRangeBarSeriesStyle>
    ) {
        const { id: seriesId, properties, processedData } = this;
        const { xKey, yHighKey, yLowKey } = properties;

        const datum = processedData!.dataSources.get(seriesId)?.data[datumIndex];
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionStateString = this.getSelectionStateString(datumIndex);
        const candidateStateString = this.getCandidateStateString(datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            xKey,
            yHighKey,
            yLowKey,
            highlightState: highlightStateString,
            selectionState: selectionStateString,
            candidateState: candidateStateString,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgRangeBarSeriesItemStylerParams>;
    }

    protected override updateDatumStyles(opts: {
        datumSelection: _ModuleSupport.Selection<RangeBarNodeDatum, _ModuleSupport.Rect<RangeBarNodeDatum>>;
        isHighlight: boolean;
    }) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        opts.datumSelection.each((node, datum) => {
            if (!opts.datumSelection.isGarbage(node)) {
                const highlightState = this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex);
                const selectionState = this.getDataSelectionState(datum.datumIndex);
                const candidateState = this.getDataCandidacyState(datum.datumIndex);
                datum.style = this.getItemStyle(
                    datum.datumIndex,
                    opts.isHighlight,
                    highlightState,
                    selectionState,
                    candidateState
                );
            }
        });
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<RangeBarNodeDatum, _ModuleSupport.Rect<RangeBarNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
        const crispCentreDirection = this.getCategoryCrispDirection();

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
            rect.crispCentreDirection = crispCentreDirection;
        });
    }

    getLabelObstacles() {
        const { label } = this.properties;
        const box = expandPlacementLabelBoxExtent(label);
        // labelData is the flattened low+high labels, so each element is itself a baked label.
        return barLabelObstacles(
            this.contextNodeData?.nodeData,
            this.contextNodeData?.labelData,
            this.isLabelEnabled() && !this.usesPlacedLabels,
            // A shrunk label's footprint is the box its reduced glyph draws, not the configured one.
            (labelDatum) => ({ label: labelDatum, config: fontWithSize(label, labelDatum.fittedFontSize), box })
        );
    }

    override getLabelData(): PointLabelDatum[] {
        if (!this.usesPlacedLabels || !this.properties.label.enabled) return [];
        const { label } = this.properties;
        // Inflate the measured text by the label's drawn box (padding + border stroke) so orientation
        // resolution avoids the box, not just the text.
        const box = expandPlacementLabelBoxExtent(label);
        const collideWith = label.collision.resolveCollideWith();
        const threshold = label.collision.threshold ?? 0;
        const alwaysShow = label.collision.alwaysShow;
        const fitFor = resolveLabelFitDescriptors(label, box, !alwaysShow);
        const resolveStyle =
            label.itemStyler == null
                ? undefined
                : createBarCandidateStyleResolver(this, label, this.makeLabelStylerParams());
        const firstOrientation = toArray(label.orientation)[0] ?? 'horizontal';
        const data: PointLabelDatum[] = [];
        for (const labelDatum of this.contextNodeData?.labelData ?? []) {
            if (labelDatum.text === '') {
                data.push(
                    ...buildBarLabelData([labelDatum], () => ({
                        label: labelDatum,
                        config: label,
                        collideWith,
                        threshold,
                    }))
                );
                continue;
            }
            // A styler resolves the box per placement × orientation; on the orientation-only route below the
            // placement is baked, so the styled geometry is resolved at the first orientation.
            const styled = styledBarLabelBox(
                resolveStyle,
                labelDatum,
                labelDatum.placement ?? `inside-${labelDatum.itemType === 'low' ? 'start' : 'end'}`,
                firstOrientation,
                labelDatum.text
            );
            const { width, height } = measureLabelText(labelDatum.text, label);
            const size = styled?.size ?? { width: width + box.left + box.right, height: height + box.top + box.bottom };
            const configuredFit = fitFor(labelDatum.text);
            const fit =
                configuredFit == null || styled == null
                    ? configuredFit
                    : { ...configuredFit, font: styled.font, boxPadding: styled.boxPadding };
            // A cascading label carries pre-positioned candidates; an orientation-only array resolves its
            // orientation against the bar region via the baked path.
            if (labelDatum.candidates == null) {
                // A label its styler disabled reserves nothing and blocks no neighbour. Only the baked
                // route needs this; the engine skips hidden candidates on the cascading one itself.
                if (styled?.hidden === true) continue;
                data.push(
                    ...buildBarLabelData([labelDatum], () => ({
                        label: labelDatum,
                        config: label,
                        size,
                        collideWith,
                        threshold,
                        fit,
                    }))
                );
            } else {
                const ownBox = labelDatum.ownBox ?? { x: labelDatum.x, y: labelDatum.y, width: 0, height: 0 };
                data.push(
                    buildBarPositionedLabelDatum(
                        labelDatum.text,
                        size.width,
                        size.height,
                        labelDatum.candidates,
                        labelDatum,
                        ownBox,
                        alwaysShow,
                        collideWith,
                        threshold,
                        true,
                        fit
                    )
                );
            }
        }
        return data;
    }

    override updatePlacedLabelData(placed: PlacedLabel<RangeBarNodeLabelDatum>[]) {
        applyBarLabelOrientation(placed);
        // yLow and yHigh route independently, so only the colliding end is hidden.
        applyPlacedBarLabelVisibility(
            this.contextNodeData?.labelData,
            placed,
            (labelDatum) => labelDatum as Mutable<RangeBarNodeLabelDatum>
        );
        this.refreshPlacedLabelNodes();
    }

    protected override resolveUsesPlacedLabels(): boolean {
        const { label } = this.properties;
        return barLabelRoutesThroughEngine(label.orientation, label.placement, label.collision.alwaysShow);
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

    /**
     * The styler params for every label of this series. The placement pass and the render pass must
     * produce identical params for the styler result to be shared between them.
     */
    private makeLabelStylerParams(): RequireOptional<AgRangeBarSeriesLabelFormatterParams> {
        const { xKey, xName, yName, yLowKey, yLowName, yHighKey, yHighName, legendItemName } = this.properties;
        return {
            xKey,
            xName: xName ?? xKey,
            yName,
            yLowKey,
            yLowName: yLowName ?? yLowKey,
            yHighKey,
            yHighName: yHighName ?? yHighKey,
            legendItemName,
        };
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<RangeBarNodeLabelDatum, _ModuleSupport.Text<RangeBarNodeLabelDatum>>;
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const params = this.makeLabelStylerParams();
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { label } = this.properties;
        opts.labelSelection.each((textNode, datum) => {
            if (datum.hidden) {
                textNode.visible = false;
                return;
            }
            textNode.fillOpacity = this.getHighlightStyle(isHighlight, datum?.datumIndex).opacity ?? 1;
            const placementStyle = pickPlacementStyle(
                label,
                datum.placement == null ? undefined : toResolvedPlacement(datum.placement)
            );
            updateLabelNode(
                this,
                textNode,
                params,
                label,
                datum,
                { isHighlight, activeHighlight },
                undefined,
                placementStyle,
                { placement: datum.placement, orientation: barLabelOrientation(datum.rotation) }
            );
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
        const yHighValue = dataModel.resolveColumnById(this, `yHighValue`, processedData, 'mixed-numeric')[datumIndex];
        const yLowValue = dataModel.resolveColumnById(this, `yLowValue`, processedData, 'mixed-numeric')[datumIndex];

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        const format = this.getItemStyle(datumIndex, false, undefined, undefined, undefined);
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
            HighlightState.None,
            undefined,
            undefined
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
            // eslint-disable-next-line sonarjs/deprecation
            (node) => this.getDatumId(node.unsafeDatum),
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
            this.properties.selection.enabled ||
            this.properties.styler != null ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
