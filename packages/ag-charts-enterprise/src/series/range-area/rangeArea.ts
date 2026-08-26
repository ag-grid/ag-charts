import {
    type AgDrawingMode,
    type AgRangeAreaSeriesItemType,
    type AgRangeAreaSeriesLabelFormatterParams,
    type AgRangeAreaSeriesLabelPlacement,
    type AgRangeAreaSeriesLineStyle,
    type AgRangeAreaSeriesOptions,
    type AgRangeAreaSeriesStyle,
    type AgRangeAreaSeriesStylerParams,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AGGREGATION_INDEX_UNSET,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    type AreExact,
    type CallbackParamRules,
    type CandidateStyleResolver,
    ChartAxisDirection,
    DEFAULT_MARKERLESS_LABEL_GAP,
    DebugMetrics,
    type DeepRequired,
    type DomainWithMetadata,
    type DynamicContext,
    type LabelMeasureContext,
    type LabelPlacement,
    type Normalised,
    type NormalisedColorType,
    type NormalisedSeriesMarkerStyle,
    type PlacedLabel,
    type Point,
    type RequireOptional,
    type SeriesLabelDefaults,
    cachedTextMeasurer,
    extent,
    findMinMax,
    isContinuous,
    measurePlacedLabel,
    mergeDefaults,
    placedLabelFit,
    resolveLabelFit,
    resolveSeriesLabelDefaults,
    toArray,
    toNumber,
} from 'ag-charts-core';
import type { AgNumericValue, CssColor } from 'ag-charts-types';

import {
    type RangeAreaSeriesDataAggregationFilter,
    aggregateRangeAreaDataFromDataModel,
    aggregateRangeAreaDataFromDataModelPartial,
} from './rangeAreaAggregation';
import { calculateIntersectionSegments, findRangeAreaIntersections } from './rangeAreaIntersection';
import { type RangeAreaMarkerDatum, RangeAreaProperties, type RangeAreaSeriesParams } from './rangeAreaProperties';
import {
    type RangeAreaContext,
    type RangeAreaItemId,
    type RangeAreaLabelDatum,
    prepareRangeAreaPathAnimation,
} from './rangeAreaUtil';

// Semantic constants for Range Area data access
const X_MAX = AGGREGATION_INDEX_X_MAX;
const HIGH = AGGREGATION_INDEX_Y_MAX;
const LOW = AGGREGATION_INDEX_Y_MIN;
const SPAN = AGGREGATION_SPAN;

const {
    valueProperty,
    keyProperty,
    updateLabelNode,
    createCandidateStyleResolver,
    expandPlacementLabelBoxExtent,
    placedLabelTextOffset,
    pickPlacementStyle,
    fixNumericExtent,
    buildResetPathFn,
    resetLabelFn,
    resetMarkerFn,
    resetMarkerPositionFn,
    pathSwipeInAnimation,
    resetMotion,
    markerSwipeScaleInAnimation,
    maxMarkerStrokePickInflation,
    seriesLabelFadeInAnimation,
    animationValidation,
    diff,
    updateClipPath,
    computeMarkerFocusBounds,
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
    calculateSegments,
    toHighlightString,
    toSelectionString,
    HighlightState,
    AggregationManager,
    resetMarkerSelectionsDirect,
    createDatumId,
    visibleRangeIndices,
} = _ModuleSupport;

type ResolvedLineStyleMixin = {
    marker?: {
        enabled?: boolean;
    };
};
type ResolvedStyleMixin = {
    item?: {
        low?: ResolvedLineStyleMixin;
        high?: ResolvedLineStyleMixin;
    };
};
/** Range-area line style after theme-merge: colour refs are resolved before reaching this point. */
type NormalisedRangeAreaSeriesLineStyle = Normalised<
    AgRangeAreaSeriesLineStyle,
    never,
    { stroke?: CssColor; marker?: NormalisedSeriesMarkerStyle }
>;
/** Range-area style after theme-merge: fill (and nested item styles) are resolved colours. */
type NormalisedRangeAreaSeriesStyle = Normalised<
    AgRangeAreaSeriesStyle,
    never,
    {
        fill?: NormalisedColorType;
        item?: { low?: NormalisedRangeAreaSeriesLineStyle; high?: NormalisedRangeAreaSeriesLineStyle };
    }
>;
type PartialStylerResult = NormalisedRangeAreaSeriesStyle & { opacity?: number };
type StylerResult = DeepRequired<PartialStylerResult, 'fill'> & {
    topLevel: Required<NormalisedRangeAreaSeriesLineStyle>;
};
type StylerMarkerOptionsResult = DeepRequired<ResolvedStyleMixin>;

/**
 * Context object for efficient node datum creation.
 * Caches expensive-to-compute values that are reused across all datum iterations.
 */
interface RangeAreaSeriesNodeDatumContext
    extends _ModuleSupport.CartesianCreateNodeDataContext<RangeAreaMarkerDatum>, LabelMeasureContext {
    // Data arrays (from dataModel - cache once)
    readonly yHighValues: AgNumericValue[];
    readonly yLowValues: AgNumericValue[];

    // Pre-computed offsets
    readonly xOffset: number;

    // Axis range for visible range filtering
    readonly xAxisRange: [number, number];

    // Aggregation (using shared ExtremesAggregationFilter)
    readonly dataAggregationFilter: RangeAreaSeriesDataAggregationFilter | undefined;
    readonly range: number;

    // Pre-computed flags
    readonly labelsEnabled: boolean;

    // Keyed by band side: low and high carry independent markers and face opposite directions.
    readonly labelPlacements: Record<AgRangeAreaSeriesItemType, readonly LabelPlacement[]>;
    readonly labelMarkerSize: Record<AgRangeAreaSeriesItemType, number>;
    readonly labelAnchor: Record<AgRangeAreaSeriesItemType, Point | undefined>;

    // Property caches
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly item: RangeAreaProperties['item'];
    readonly yDomain: any[];
    readonly connectMissingData: boolean;
    readonly interpolation: RangeAreaProperties['interpolation'];

    // Mutable state for building node data
    labelData: RangeAreaLabelDatum[];
    spanPoints: Array<RangeAreaSpanPointDatum[] | { skip: number }>;
}

/** `high` faces up when placed outside the band and down when inside; `low` mirrors it. */
function enginePlacement(coarse: AgRangeAreaSeriesLabelPlacement, side: AgRangeAreaSeriesItemType): LabelPlacement {
    return (coarse === 'outside') === (side === 'high') ? 'top' : 'bottom';
}

/** Inverse of {@link enginePlacement}; range-area only ever offers the two vertical candidates. */
function coarsePlacement(
    placement: LabelPlacement | undefined,
    side: AgRangeAreaSeriesItemType
): AgRangeAreaSeriesLabelPlacement {
    return (placement === 'top') === (side === 'high') ? 'outside' : 'inside';
}

/**
 * A band label's placement reads as the inside/outside side of the band it sits on, which depends on
 * whether it labels the low or the high edge — so both the style and the reported placement are coarsened.
 */
const bandCandidatePlacement: _ModuleSupport.CandidatePlacementMapper = (placement, datum) => {
    const coarse = coarsePlacement(placement, (datum as RangeAreaLabelDatum).valueSide);
    return { style: coarse, reported: coarse };
};

/**
 * Scratch object for per-datum processing to avoid allocations per iteration.
 */
interface RangeAreaNodeDatumScratch {
    datum: any;
    xValue: any;
    // bigint-capable so yScale.convert() keeps full precision; the *Coordinate fields are pixel positions.
    yHighValue: AgNumericValue;
    yLowValue: AgNumericValue;
    x: number;
    yHighCoordinate: number;
    yLowCoordinate: number;
    inverted: boolean;
}

interface RangeAreaSpanPointDatum {
    high: _ModuleSupport.LineSpanPointDatum;
    low: _ModuleSupport.LineSpanPointDatum;
}

/**
 * Consolidated type interface for RangeAreaSeries.
 */
interface RangeAreaSeriesTypes extends _ModuleSupport.CartesianSeriesTypes {
    readonly node: _ModuleSupport.Marker<RangeAreaMarkerDatum>;
    readonly options: AgRangeAreaSeriesOptions;
    readonly properties: RangeAreaProperties;
    readonly datum: RangeAreaMarkerDatum;
    readonly label: RangeAreaLabelDatum;
    readonly context: RangeAreaContext;
    readonly stackContext: never;
    readonly createNodeDataContext: RangeAreaSeriesNodeDatumContext;
}

type GetMarkerStyleArg<I extends number> = Parameters<
    _ModuleSupport.CartesianSeries<RangeAreaSeriesTypes>['getMarkerStyle']
>[I];

/** Per-pass context shared by the range-area marker-style passes. */
interface RangeAreaPassCtx {
    hideWithSize0: boolean;
    isHighlight: boolean;
}

type RangeAreaNoStylerCompute = _ModuleSupport.MarkerStyleCompute<
    RangeAreaSeries,
    RangeAreaPassCtx,
    RangeAreaMarkerDatum,
    AgSeriesMarkerStyle
>;
type RangeAreaStylerCompute = _ModuleSupport.MarkerStyleCompute<
    RangeAreaSeries,
    RangeAreaPassCtx,
    RangeAreaMarkerDatum,
    StylerResult
>;
type RangeAreaStylerApply = _ModuleSupport.MarkerStyleApply<
    RangeAreaSeries,
    RangeAreaPassCtx,
    RangeAreaMarkerDatum,
    StylerResult
>;

export class RangeAreaSeries extends _ModuleSupport.CartesianSeries<RangeAreaSeriesTypes> {
    static override readonly className = 'RangeAreaSeries';
    static readonly type = 'range-area' as const;

    override properties = new RangeAreaProperties();

    override createNodeParams(datum: RangeAreaMarkerDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.properties.xKey,
            yLowKey: this.properties.yLowKey,
            yHighKey: this.properties.yHighKey,
        };
    }

    private readonly aggregationManager = new AggregationManager<RangeAreaSeriesDataAggregationFilter>();
    private hideWithSize0 = false;
    private placedLabelData: PlacedLabel<RangeAreaLabelDatum>[] = [];

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            pathsPerSeries: ['fill', 'lowStroke', 'highStroke'],
            pickModes: [_ModuleSupport.SeriesNodePickMode.AXIS_ALIGNED],
            propertyKeys: {
                [ChartAxisDirection.X]: ['xKey'],
                [ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
            },
            propertyNames: {
                [ChartAxisDirection.X]: ['xName'],
                [ChartAxisDirection.Y]: ['yLowName', 'yHighName', 'yName'],
            },
            categoryKey: 'xValue',
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                datum: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
            clipFocusBox: false,
            usesPlacedLabels: true,
        });
    }

    override renderToOffscreenCanvas(): boolean {
        const hasMarkers = (this.contextNodeData?.nodeData?.length ?? 0) > 0;
        return (hasMarkers && this.getDrawingMode(false) === 'cutout') || super.renderToOffscreenCanvas();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yLowKey, yHighKey } = this.properties;
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

        const allowNullKey = this.properties.allowNullKeys ?? false;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: `xValue`, allowNullKey }),
                valueProperty(yLowKey, yScaleType, { id: `yLowValue`, invalidValue: undefined }),
                valueProperty(yHighKey, yScaleType, { id: `yHighValue`, invalidValue: undefined }),
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
                aggregateRangeAreaDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateRangeAreaDataFromDataModel(xAxis.scale.type, dataModel, processedData, this, existingFilters),
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

    protected override createBucketLookupFeature(): _ModuleSupport.BucketLookupFeature {
        return new _ModuleSupport.BucketLookupManager({
            series: this,
            getXAxis: () => this.axes[ChartAxisDirection.X],
            getDataModel: () => this.dataModel,
            getProcessedData: () => this.processedData,
            aggregationManager: this.aggregationManager,
            dataSelectionService: this.ctx.dataSelectionService,
            domainKey: 'key',
            canonicalExtremaSlots: [AGGREGATION_INDEX_Y_MAX, AGGREGATION_INDEX_Y_MIN],
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
     * Caches expensive-to-compute values that are reused across all datum iterations.
     */
    protected override createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): RangeAreaSeriesNodeDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xAxisRange = xAxis.range;

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

        const { item, label } = this.properties;
        const configuredPlacements = toArray(label.placement);
        // An explicitly empty list would yield zero candidates and drop every label.
        const coarsePlacements = configuredPlacements.length > 0 ? configuredPlacements : (['outside'] as const);
        const markerSizeOf = (side: AgRangeAreaSeriesItemType) => {
            const { marker } = item[side];
            return marker.enabled ? marker.size : 0;
        };

        return {
            xAxis,
            yAxis,
            rawData,
            xValues: dataModel.resolveKeysById(this, 'xValue', processedData),
            yHighValues: dataModel.resolveColumnById(this, 'yHighValue', processedData, 'mixed-numeric'),
            yLowValues: dataModel.resolveColumnById(this, 'yLowValue', processedData, 'mixed-numeric'),
            xScale,
            yScale,
            xAxisRange,
            xOffset: (xScale.bandwidth ?? 0) / 2,
            dataAggregationFilter,
            range,
            labelsEnabled: label.enabled,
            labelFit: resolveLabelFit(label, !label.collision.alwaysShow),
            labelStyled: label.itemStyler != null,
            labelPadding: expandPlacementLabelBoxExtent(label),
            labelTextMeasurer: cachedTextMeasurer(label),
            labelPlacements: {
                low: coarsePlacements.map((coarse) => enginePlacement(coarse, 'low')),
                high: coarsePlacements.map((coarse) => enginePlacement(coarse, 'high')),
            },
            labelMarkerSize: { low: markerSizeOf('low'), high: markerSizeOf('high') },
            labelAnchor: { low: Marker.anchor(item.low.marker.shape), high: Marker.anchor(item.high.marker.shape) },
            animationEnabled,
            canIncrementallyUpdate,
            xKey: this.properties.xKey,
            yLowKey: this.properties.yLowKey,
            yHighKey: this.properties.yHighKey,
            item: this.properties.item,
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y).domain,
            connectMissingData: this.properties.connectMissingData,
            interpolation: this.properties.interpolation,
            nodes: canIncrementallyUpdate ? existingNodes : [],
            labelData: [],
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
            const yExtent = this.domainForClippedRange(ChartAxisDirection.Y, ['yHighValue', 'yLowValue'], 'xValue');
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
     * Processes a single datum and updates the context's marker, label, and span arrays.
     * Uses the scratch object to avoid per-iteration allocations.
     *
     * @param yHighValueOverride - Optional override for yHighValue, used in aggregation mode
     *                             when the extreme values come from different data points
     * @param yLowValueOverride - Optional override for yLowValue, used in aggregation mode
     */
    private handleDatumPoint(
        ctx: RangeAreaSeriesNodeDatumContext,
        scratch: RangeAreaNodeDatumScratch,
        datumIndex: number,
        yHighValueOverride?: AgNumericValue,
        yLowValueOverride?: AgNumericValue
    ): void {
        scratch.xValue = ctx.xValues[datumIndex];
        if (scratch.xValue === undefined && !this.properties.allowNullKeys) return;

        scratch.datum = ctx.rawData[datumIndex];
        scratch.yHighValue = yHighValueOverride ?? ctx.yHighValues[datumIndex];
        scratch.yLowValue = yLowValueOverride ?? ctx.yLowValues[datumIndex];

        const currentSpanPoints = ctx.spanPoints.at(-1);

        // isContinuous accepts any bigint; Number.isFinite rejects every bigint (it never coerces them).
        if (isContinuous(scratch.yHighValue) && isContinuous(scratch.yLowValue)) {
            scratch.inverted = scratch.yLowValue > scratch.yHighValue;
            scratch.x = ctx.xScale.convert(scratch.xValue) + ctx.xOffset;
            if (!Number.isFinite(scratch.x)) return;

            scratch.yHighCoordinate = ctx.yScale.convert(scratch.yHighValue);
            scratch.yLowCoordinate = ctx.yScale.convert(scratch.yLowValue);

            // Create/update marker and label data for high boundary
            this.upsertMarkerDatum(ctx, scratch, datumIndex, 'high', scratch.yHighValue, scratch.yHighCoordinate);
            // Create/update marker and label data for low boundary
            this.upsertMarkerDatum(ctx, scratch, datumIndex, 'low', scratch.yLowValue, scratch.yLowCoordinate);

            // Update span points for path rendering
            const spanPoint: RangeAreaSpanPointDatum = {
                high: {
                    point: { x: scratch.x, y: scratch.yHighCoordinate },
                    xDatum: scratch.xValue,
                    yDatum: scratch.yHighValue,
                },
                low: {
                    point: { x: scratch.x, y: scratch.yLowCoordinate },
                    xDatum: scratch.xValue,
                    yDatum: scratch.yLowValue,
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
            if (Array.isArray(currentSpanPoints) || currentSpanPoints == null) {
                ctx.spanPoints.push({ skip: 0 });
            } else {
                currentSpanPoints.skip += 1;
            }
        }
    }

    private pushGapMarker(ctx: RangeAreaSeriesNodeDatumContext): void {
        const currentSpanPoints = ctx.spanPoints.at(-1);
        if (Array.isArray(currentSpanPoints) || currentSpanPoints == null) {
            ctx.spanPoints.push({ skip: 0 });
        } else {
            currentSpanPoints.skip += 1;
        }
    }

    private hasInvalidDatumsInRange(
        yHighValues: AgNumericValue[],
        yLowValues: AgNumericValue[],
        startIndex: number,
        endIndex: number
    ): boolean {
        for (let i = startIndex; i <= endIndex; i++) {
            // isContinuous accepts any bigint; Number.isFinite rejects every bigint (it never coerces them).
            if (!isContinuous(yHighValues[i]) || !isContinuous(yLowValues[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Creates or updates marker datum for a single boundary (high or low).
     * Supports incremental updates by reusing existing marker data objects when possible.
     */
    private upsertMarkerDatum(
        ctx: RangeAreaSeriesNodeDatumContext,
        scratch: RangeAreaNodeDatumScratch,
        datumIndex: number,
        itemType: 'high' | 'low',
        yValue: AgNumericValue,
        y: number
    ): void {
        const { size } = ctx.item[itemType].marker;
        const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

        if (canReuseNode) {
            // Update existing marker datum in place to avoid allocation
            const existingNode = ctx.nodes[ctx.nodeIndex] as {
                -readonly [K in keyof RangeAreaMarkerDatum]: RangeAreaMarkerDatum[K];
            };
            existingNode.index = datumIndex;
            existingNode.itemType = itemType;
            existingNode.datum = scratch.datum;
            existingNode.datumIndex = datumIndex;
            existingNode.midPoint = { x: scratch.x, y };
            existingNode.yHighValue = scratch.yHighValue;
            existingNode.yLowValue = scratch.yLowValue;
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
                yHighValue: scratch.yHighValue,
                yLowValue: scratch.yLowValue,
                xValue: scratch.xValue,
                xKey: ctx.xKey,
                yLowKey: ctx.yLowKey,
                yHighKey: ctx.yHighKey,
                point: { x: scratch.x, y, size },
                enabled: true,
            });
        }
        ctx.nodeIndex++;

        // Skip label creation if labels are disabled
        if (ctx.labelsEnabled) {
            ctx.labelData.push(
                this.createLabelData(ctx, {
                    datumIndex,
                    point: { x: scratch.x, y },
                    value: yValue,
                    itemType,
                    inverted: scratch.inverted,
                    datum: scratch.datum,
                })
            );
        }
    }

    protected override populateNodeData(ctx: RangeAreaSeriesNodeDatumContext): void {
        const { processedData } = this;
        if (!processedData) return;

        // Reusable scratch object to avoid per-datum allocations
        const scratch: RangeAreaNodeDatumScratch = {
            datum: undefined,
            xValue: undefined,
            yHighValue: 0,
            yLowValue: 0,
            x: 0,
            yHighCoordinate: 0,
            yLowCoordinate: 0,
            inverted: false,
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
                const xMaxDatumIndex = indexData[aggIndex + X_MAX];
                const yHighDatumIndex = indexData[aggIndex + HIGH];
                const yLowDatumIndex = indexData[aggIndex + LOW];

                if (yHighDatumIndex === AGGREGATION_INDEX_UNSET || yLowDatumIndex === AGGREGATION_INDEX_UNSET) {
                    // Bucket has valid x-values but all-null y-values
                    if (!ctx.connectMissingData) {
                        this.pushGapMarker(ctx);
                    }
                    prevEndDatumIndex = xMaxDatumIndex;
                    continue;
                }

                if (
                    !ctx.connectMissingData &&
                    this.hasInvalidDatumsInRange(ctx.yHighValues, ctx.yLowValues, prevEndDatumIndex + 1, xMaxDatumIndex)
                ) {
                    this.pushGapMarker(ctx);
                }

                this.handleDatumPoint(
                    ctx,
                    scratch,
                    yHighDatumIndex,
                    ctx.yHighValues[yHighDatumIndex],
                    ctx.yLowValues[yLowDatumIndex]
                );

                prevEndDatumIndex = xMaxDatumIndex;
            }
        }
    }

    protected override finalizeNodeData(ctx: RangeAreaSeriesNodeDatumContext): void {
        // Cleanup incremental updates - trim nodes if fewer than before
        if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length) {
            ctx.nodes.length = ctx.nodeIndex;
        }
    }

    protected override initializeResult(ctx: RangeAreaSeriesNodeDatumContext): RangeAreaContext {
        return {
            itemId: `${ctx.yLowKey}-${ctx.yHighKey}`,
            labelData: ctx.labelData,
            nodeData: ctx.nodes,
            fillData: { itemType: 'high', spans: [], phantomSpans: [] },
            highStrokeData: { itemType: 'high', spans: [] },
            lowStrokeData: { itemType: 'low', spans: [] },
            scales: this.calculateScaling(),
            visible: this.visible,
            styles: {
                low: this.getLowOrHighMarkerStyles('low'),
                high: this.getLowOrHighMarkerStyles('high'),
            },
            segments: undefined,
            intersectionSegments: undefined,
        };
    }

    protected override assembleResult(
        ctx: RangeAreaSeriesNodeDatumContext,
        result: RangeAreaContext
    ): RangeAreaContext {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (!xAxis || !yAxis || !this.chart?.seriesRect) return result;

        // Build path spans from span points
        const highSpans = ctx.spanPoints.flatMap((p): _ModuleSupport.LinePathSpan[] => {
            if (!Array.isArray(p)) return [];
            const highPoints = p.map((d) => d.high);
            return interpolatePoints(highPoints, ctx.interpolation);
        });
        const lowSpans = ctx.spanPoints.flatMap((p): _ModuleSupport.LinePathSpan[] => {
            if (!Array.isArray(p)) return [];
            const lowPoints = p.map((d) => d.low);
            return interpolatePoints(lowPoints, ctx.interpolation);
        });

        const segments = calculateSegments(
            this.properties.segmentation,
            xAxis,
            yAxis,
            this.chart.seriesRect,
            this.ctx.scene,
            false
        );

        let intersectionSegments: _ModuleSupport.Segment[] | undefined = undefined;
        if (this.properties.invertedStyle.enabled) {
            const startsInverted = ctx.yHighValues[0] < ctx.yLowValues[0];
            const intersectionXValues = findRangeAreaIntersections(
                highSpans,
                lowSpans,
                ctx.xScale.range[0],
                ctx.xScale.range[1],
                startsInverted
            );
            intersectionSegments = calculateIntersectionSegments(
                intersectionXValues,
                this.chart.seriesRect,
                this.ctx.scene,
                startsInverted,
                this.properties.invertedStyle
            );
        }

        // Update the result with computed spans and segments
        result.fillData = { itemType: 'high', spans: highSpans, phantomSpans: lowSpans };
        result.highStrokeData = { itemType: 'high', spans: highSpans };
        result.lowStrokeData = { itemType: 'low', spans: lowSpans };
        result.segments = segments;
        result.intersectionSegments = intersectionSegments;

        return result;
    }

    private getLowOrHighMarkerStyles(lowOrHigh: 'low' | 'high') {
        const { fill, fillOpacity, item } = this.properties;
        const line = item[lowOrHigh];
        const { stroke, strokeWidth, strokeOpacity } = line;
        const inheritedStyles = { fill, fillOpacity, stroke, strokeWidth, strokeOpacity };
        return getMarkerStyles(this, line, line.marker, inheritedStyles);
    }

    private createLabelData(
        ctx: RangeAreaSeriesNodeDatumContext,
        {
            datumIndex,
            point,
            value,
            itemType,
            inverted,
            datum,
        }: {
            datumIndex: number;
            point: Point;
            value: any;
            itemType: AgRangeAreaSeriesItemType;
            inverted: boolean;
            datum: any;
        }
    ): RangeAreaLabelDatum {
        const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, legendItemName, label } = this.properties;
        // An inverted datum draws the low value above the high value, flipping which side each label faces.
        let valueSide = itemType;
        if (inverted) {
            valueSide = itemType === 'low' ? 'high' : 'low';
        }
        const markerSize = ctx.labelMarkerSize[itemType];

        const labelText = this.getLabelText<AgRangeAreaSeriesLabelFormatterParams>(
            value,
            datum,
            itemType === 'high' ? yHighKey : yLowKey,
            'y',
            ctx.yDomain,
            label,
            {
                value,
                datum,
                itemType,
                xKey,
                yLowKey,
                yHighKey,
                xName,
                yLowName,
                yHighName,
                yName,
                legendItemName,
            }
        );
        const measuredLabel = measurePlacedLabel(labelText, label, ctx);

        return {
            // Provisional anchor; {@link placedLabelDatum} replaces it with the engine's resolved box.
            x: point.x,
            y: point.y,
            point: { x: point.x, y: point.y, size: markerSize },
            label: measuredLabel,
            fit: placedLabelFit(labelText, label, ctx),
            text: measuredLabel.text,
            anchor: ctx.labelAnchor[itemType],
            placements: ctx.labelPlacements[valueSide],
            placement: undefined,
            // Markerless vertices still nudge their label clear of the stroke with a small fixed gap.
            gap: markerSize > 0 ? markerSize / 2 : DEFAULT_MARKERLESS_LABEL_GAP,
            valueSide,
            series: this,
            itemType,
            datum,
            datumIndex,
            // `textAlign` also justifies a wrapped label's lines against each other, so it stays centred.
            textAlign: 'center',
            textBaseline: 'top',
            rotation: 0,
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        const { low, high } = this.properties.item;
        return low.marker.isDirty() || high.marker.isDirty();
    }

    protected override strokewidthChange() {
        const itemStrokeWidthChange = (lowOrHigh: AgRangeAreaSeriesItemType): boolean => {
            const unhighlightedStrokeWidth = this.properties.item[lowOrHigh].strokeWidth ?? 0;
            const highlightedSeriesStrokeWidth =
                this.properties.highlight.highlightedSeries.item?.[lowOrHigh]?.strokeWidth ?? unhighlightedStrokeWidth;
            const highlightedItemStrokeWidth =
                this.properties.highlight.highlightedItem.item?.[lowOrHigh]?.strokeWidth ?? unhighlightedStrokeWidth;
            return (
                unhighlightedStrokeWidth > highlightedItemStrokeWidth ||
                highlightedSeriesStrokeWidth > highlightedItemStrokeWidth
            );
        };

        return itemStrokeWidthChange('low') || itemStrokeWidthChange('high');
    }

    protected override updatePathNodes(opts: {
        paths: _ModuleSupport.SegmentedPath[];
        visible: boolean;
        animationEnabled: boolean;
    }) {
        const { visible } = opts;
        const [fillPath, lowStrokePath, highStrokePath] = opts.paths;

        const segments = this.contextNodeData?.segments;

        const highlightDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightState(highlightDatum, false);
        const highlightStyle = this.getHighlightStyle();
        const selectionStyle = this.getSelectionStyle();
        const seriesStyle = this.getStyle(highlightState);

        const { item, stroke, strokeWidth, strokeOpacity, fill, fillOpacity, opacity } = mergeDefaults(
            selectionStyle,
            highlightStyle,
            seriesStyle
        );

        lowStrokePath.setProperties({
            datum: segments,
            segments,
            fill: undefined,
            lineCap: 'round',
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            stroke: stroke ?? item.low.stroke,
            strokeWidth: strokeWidth ?? item.low.strokeWidth,
            strokeOpacity: strokeOpacity ?? item.low.strokeOpacity,
            lineDash: item.low.lineDash,
            lineDashOffset: item.low.lineDashOffset,
            opacity,
            visible,
        });
        highStrokePath.setProperties({
            segments,
            fill: undefined,
            lineCap: 'round',
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            stroke: stroke ?? item.high.stroke,
            strokeWidth: strokeWidth ?? item.high.strokeWidth,
            strokeOpacity: strokeOpacity ?? item.high.strokeOpacity,
            lineDash: item.high.lineDash,
            lineDashOffset: item.high.lineDashOffset,
            opacity,
            visible,
        });

        const fillBBox = this.getShapeFillBBox();
        fillPath.setFillProperties(fill, fillBBox);
        fillPath.setStyleProperties({ stroke: undefined, fill, fillOpacity, opacity }, fillBBox);

        const fillSegments = this.contextNodeData?.intersectionSegments ?? segments;
        fillPath.setProperties({
            segments: fillSegments,
            pointerEvents: PointerEvents.None,
            lineJoin: 'round',
            fillShadow: this.properties.shadow,
            opacity,
            visible,
        });

        fillPath.datum = fillSegments;

        updateClipPath(this, fillPath);
        updateClipPath(this, lowStrokePath);
        updateClipPath(this, highStrokePath);
    }

    protected override updatePaths(opts: { contextData: RangeAreaContext; paths: _ModuleSupport.Path[] }) {
        this.updateAreaPaths(opts.paths, opts.contextData);
    }

    private updateAreaPaths(paths: _ModuleSupport.Path[], contextData: RangeAreaContext) {
        for (const path of paths) {
            path.visible = contextData.visible;
        }

        if (contextData.visible) {
            this.updateFillPath(paths, contextData);
            this.updateStrokePath(paths, contextData);
        } else {
            for (const path of paths) {
                path.path.clear();
                path.markDirty('RangeArea');
            }
        }
    }

    private updateFillPath(paths: _ModuleSupport.Path[], contextData: RangeAreaContext) {
        const [fill] = paths;
        fill.path.clear();
        plotAreaPathFill(fill, contextData.fillData);
        fill.markDirty('RangeArea');
    }

    private updateStrokePath(paths: _ModuleSupport.Path[], contextData: RangeAreaContext) {
        const [, lowStroke, highStroke] = paths;
        lowStroke.path.clear();
        highStroke.path.clear();
        plotLinePathStroke(lowStroke, contextData.lowStrokeData.spans);
        plotLinePathStroke(highStroke, contextData.highStrokeData.spans);
        lowStroke.markDirty('RangeArea');
        highStroke.markDirty('RangeArea');
    }

    protected override resetDatumAnimation(
        data: _ModuleSupport.CartesianAnimationData<
            RangeAreaMarkerDatum,
            _ModuleSupport.Marker<RangeAreaMarkerDatum>,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ): void {
        // Use direct reset for datum selection to bypass resetMotion callback overhead
        resetMarkerSelectionsDirect([data.datumSelection]);
    }

    protected override updateDatumSelection(opts: {
        nodeData: RangeAreaMarkerDatum[];
        datumSelection: _ModuleSupport.Selection<RangeAreaMarkerDatum, _ModuleSupport.Marker<RangeAreaMarkerDatum>>;
    }) {
        const { nodeData, datumSelection } = opts;
        const { processedData, axes, properties } = this;

        type LowHighRules = { [K in 'low' | 'high']: { marker: { enabled: boolean } } };
        const rules: LowHighRules = properties.styler ? this.getStylerMarkerOptions().item : properties.item;
        const { low, high } = rules;

        const markerDrawMode = cartesianMarkerDrawMode(
            properties,
            undefined,
            processedData!,
            axes,
            { enabled: low.marker.enabled || high.marker.enabled },
            undefined,
            this.chart?.isMiniChart
        );
        this.hideWithSize0 = markerDrawMode.hideWithSize0;

        if (properties.item.low.marker.isDirty() || properties.item.high.marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        let resolvedNodeData: typeof nodeData;
        if (markerDrawMode.needsNodeData) {
            if (markerDrawMode.hideWithSize0 || (low.marker.enabled && high.marker.enabled)) {
                // All marker enables
                resolvedNodeData = nodeData;
            } else {
                // Markers only on 1 line (filter out the nodeDatums that we need).
                resolvedNodeData = [];
                for (const datum of nodeData) {
                    if (rules[datum.itemType].marker.enabled) {
                        resolvedNodeData.push(datum);
                    }
                }
            }
        } else {
            // No marker whatsoever.
            resolvedNodeData = [];
        }

        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id
            return datumSelection.update(resolvedNodeData);
        }
        // Use xValue + itemType as unique ID since there are two markers per data point
        return datumSelection.update(resolvedNodeData, undefined, (datum) =>
            createDatumId(datum.xValue, datum.itemType)
        );
    }

    private static readonly keyByItemType = (datum: RangeAreaMarkerDatum): string => datum.itemType;

    private static readonly computeNoStylerMarkerStyle: RangeAreaNoStylerCompute = (
        series,
        ctx,
        highlightState,
        selectionState,
        datum
    ) => {
        const stylerStyle = series.getStyle(highlightState);
        const { fill, fillOpacity, item } = stylerStyle;
        const { stroke, strokeWidth, strokeOpacity } = item[datum.itemType];
        const marker = series.properties.item[datum.itemType].marker;
        return series.getMarkerStyle(
            marker,
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
            { fill, fillOpacity, stroke, strokeWidth, strokeOpacity }
        );
    };

    private static readonly computeStylerStyle: RangeAreaStylerCompute = (series, _ctx, highlightState) => {
        return series.getStyle(highlightState);
    };

    private static readonly applyStylerDatum: RangeAreaStylerApply = (
        series,
        ctx,
        datum,
        highlightState,
        selectionState,
        stylerStyle
    ) => {
        const { fill, fillOpacity, item } = stylerStyle;
        const { stroke, strokeWidth, strokeOpacity } = item[datum.itemType];
        const marker = series.properties.item[datum.itemType].marker;
        const params = series.makeItemStylerParams(datum.itemType);
        datum.style = series.getMarkerStyle(
            marker,
            datum,
            params,
            {
                isHighlight: ctx.isHighlight,
                highlightState,
                selectionState,
                resolveMarkerSubPath: ['item', datum.itemType, 'marker'],
                hideWithSize0: ctx.hideWithSize0,
            },
            stylerStyle.item[datum.itemType].marker,
            { fill, fillOpacity, stroke, strokeWidth, strokeOpacity }
        );
    };

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<RangeAreaMarkerDatum, _ModuleSupport.Marker<RangeAreaMarkerDatum>>;
        isHighlight: boolean;
    }) {
        const { hideWithSize0 } = this;
        const ctx: RangeAreaPassCtx = { hideWithSize0, isHighlight };

        if (this.properties.marker.itemStyler == null) {
            // No itemStyler: style is a pure function of (highlightState, selectionState, itemType).
            this.runMarkerStylePass<RangeAreaPassCtx, RangeAreaMarkerDatum, AgSeriesMarkerStyle, RangeAreaSeries>(
                datumSelection,
                isHighlight,
                ctx,
                {
                    keyExtra: RangeAreaSeries.keyByItemType,
                    compute: RangeAreaSeries.computeNoStylerMarkerStyle,
                    apply: _ModuleSupport.Series.assignCachedStyle,
                }
            );
            return;
        }

        // No itemType in the cache key: getStyle() is item-type-agnostic; sub-styles are extracted per datum.
        this.runMarkerStylePass<RangeAreaPassCtx, RangeAreaMarkerDatum, StylerResult, RangeAreaSeries>(
            datumSelection,
            isHighlight,
            ctx,
            { compute: RangeAreaSeries.computeStylerStyle, apply: RangeAreaSeries.applyStylerDatum }
        );
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<RangeAreaMarkerDatum, _ModuleSupport.Marker<RangeAreaMarkerDatum>>;
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
            maxMarkerStrokePickInflation(contextNodeData.styles.low),
            maxMarkerStrokePickInflation(contextNodeData.styles.high)
        );

        datumSelection.each((node, datum) => {
            const { itemType } = datum;
            const style =
                datum.style ??
                contextNodeData.styles[itemType][
                    this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ];
            // Style colours are resolved at runtime before reaching the scene node.
            this.applyMarkerStyle(style as NormalisedSeriesMarkerStyle, node, datum.point, fillBBox, {
                hideWithSize0,
                pickInflation,
            });
            node.drawingMode = drawingMode;
        });

        if (!isHighlight) {
            this.properties.item.low.marker.markClean();
            this.properties.item.high.marker.markClean();
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: RangeAreaLabelDatum[];
        labelSelection: _ModuleSupport.Selection<RangeAreaLabelDatum, _ModuleSupport.Text<RangeAreaLabelDatum>>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    /**
     * The styler params for every label of this series. The placement pass and the render pass must
     * produce identical params for the styler result to be shared between them.
     */
    private makeLabelStylerParams(): RequireOptional<AgRangeAreaSeriesLabelFormatterParams> {
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

    override getLabelCandidateStyler(): CandidateStyleResolver | undefined {
        return createCandidateStyleResolver(
            this,
            this.properties.label,
            this.makeLabelStylerParams(),
            bandCandidatePlacement
        );
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<RangeAreaLabelDatum, _ModuleSupport.Text<RangeAreaLabelDatum>>;
        isHighlight?: boolean;
    }) {
        const params = this.makeLabelStylerParams();
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { isHighlight = false, labelSelection } = opts;
        const { label } = this.properties;
        labelSelection.each((textNode, datum) => {
            textNode.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
            const placement = coarsePlacement(datum.placement, datum.valueSide);
            updateLabelNode(
                this,
                textNode,
                params,
                label,
                datum,
                { isHighlight, activeHighlight },
                undefined,
                pickPlacementStyle(label, placement),
                { placement }
            );
        });
    }

    override getLabelData(): RangeAreaLabelDatum[] {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    override getLabelDefaults(): SeriesLabelDefaults {
        const { label } = this.properties;
        // Placements are supplied per datum, so a series-level list would never be consulted.
        return resolveSeriesLabelDefaults(label.collision, undefined, label.spacing);
    }

    override updatePlacedLabelData(labelData: PlacedLabel<RangeAreaLabelDatum>[]) {
        this.placedLabelData = labelData;
        this.labelSelection = this.updateLabelSelection({
            labelData: labelData.map(this.placedLabelMapper()),
            labelSelection: this.labelSelection,
        });
        this.updateLabelNodes({ labelSelection: this.labelSelection });
        this.updateHighlightLabelSelection();
    }

    /**
     * Maps the engine's label box onto the render anchor: horizontal centre for the centred text, top
     * edge inset for the `top` baseline so the drawn box sits centred within the reserved box. Both
     * placement offsets are invariant across the labels, so they are resolved once per pass.
     */
    private placedLabelMapper(): (placed: PlacedLabel<RangeAreaLabelDatum>) => RangeAreaLabelDatum {
        const { label } = this.properties;
        const insideOffset = placedLabelTextOffset(label, pickPlacementStyle(label, 'inside'));
        const outsideOffset = placedLabelTextOffset(label, pickPlacementStyle(label, 'outside'));
        // A styled label's reservation was sized from the style resolved at its winning candidate, so the
        // drawn box fills it exactly; the same resolver (a cache hit) yields that box's extent here.
        const resolveStyle = this.getLabelCandidateStyler();
        return function placedLabelDatum(placed) {
            const { datum } = placed;
            const placement = placed.placement ?? datum.placement;
            const isInside = coarsePlacement(placement, datum.valueSide) === 'inside';
            const styled = resolveStyle?.(datum, placement, undefined);
            const offsetY = styled?.boxPadding.top ?? (isInside ? insideOffset : outsideOffset).y;
            return { ...datum, x: placed.x + placed.width / 2, y: placed.y + offsetY, placement, text: placed.text };
        };
    }

    protected override getHighlightLabelData(
        _labelData: RangeAreaLabelDatum[],
        highlightedItem: RangeAreaMarkerDatum
    ): RangeAreaLabelDatum[] | undefined {
        // Source from the placed positions so hover cannot resurface a label the collision pass dropped.
        // Both band labels share one datumIndex, so this still returns the low/high pair.
        const items = this.placedLabelData
            .filter((placed) => placed.datum.datumIndex === highlightedItem.datumIndex)
            .map(this.placedLabelMapper());
        return items.length === 0 ? undefined : items;
    }

    protected override getHighlightData(
        nodeData: RangeAreaMarkerDatum[],
        highlightedItem: RangeAreaMarkerDatum
    ): RangeAreaMarkerDatum[] | undefined {
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
        const { fill, fillOpacity, item, styler } = this.properties;

        const selectionState: _ModuleSupport.SelectionState | undefined = this.getDataSelectionState(undefined);
        const candidateState: _ModuleSupport.SelectionState | undefined = this.getDataCandidacyState(undefined);
        let stylerResult: NormalisedRangeAreaSeriesStyle & ResolvedStyleMixin = {};
        if (styler) {
            const stylerParams = this.makeStylerParams(highlightState, selectionState, candidateState);
            stylerResult =
                (this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.cachedCallWithContext(styler, stylerParams) ?? {},
                    { pick: false }
                ) as NormalisedRangeAreaSeriesStyle & ResolvedStyleMixin) ?? {};
        }

        const markerOpts: StylerMarkerOptionsResult = {
            item: { low: { marker: { enabled: false } }, high: { marker: { enabled: false } } },
        };

        const makeItemResult = (lowOrHigh: 'low' | 'high'): StylerResult['item'][typeof lowOrHigh] => {
            const stylerItem = stylerResult.item?.[lowOrHigh];
            const { lineDash, lineDashOffset, marker, stroke, strokeOpacity, strokeWidth } = item[lowOrHigh];
            markerOpts.item[lowOrHigh].marker.enabled = stylerItem?.marker?.enabled ?? marker.enabled;
            return {
                marker: {
                    fill: stylerItem?.marker?.fill ?? marker.fill ?? fill,
                    fillOpacity: stylerItem?.marker?.fillOpacity ?? marker.fillOpacity,
                    shape: stylerItem?.marker?.shape ?? marker.shape,
                    size: stylerItem?.marker?.size ?? marker.size,
                    lineDash: stylerItem?.marker?.lineDash ?? marker.lineDash,
                    lineDashOffset: stylerItem?.marker?.lineDashOffset ?? marker.lineDashOffset,
                    stroke: stylerItem?.marker?.stroke ?? marker.stroke ?? stroke,
                    strokeOpacity: stylerItem?.marker?.strokeOpacity ?? marker.strokeOpacity,
                    strokeWidth: stylerItem?.marker?.strokeWidth ?? marker.strokeWidth,
                },
                lineDash: stylerItem?.lineDash ?? lineDash,
                lineDashOffset: stylerItem?.lineDashOffset ?? lineDashOffset,
                stroke: stylerItem?.stroke ?? stroke,
                strokeOpacity: stylerItem?.strokeOpacity ?? strokeOpacity,
                strokeWidth: stylerItem?.strokeWidth ?? strokeWidth,
            };
        };
        const style: StylerResult = {
            fill: stylerResult.fill ?? fill,
            fillOpacity: stylerResult.fillOpacity ?? fillOpacity,
            opacity: 1,
            topLevel: {
                lineDash: this.properties.lineDash,
                lineDashOffset: this.properties.lineDashOffset,
                marker: this.properties.marker,
                stroke: this.properties.stroke,
                strokeOpacity: this.properties.strokeOpacity,
                strokeWidth: this.properties.strokeWidth,
            },
            item: {
                low: makeItemResult('low'),
                high: makeItemResult('high'),
            },
        };
        return [style, markerOpts];
    }

    private makeStylerParams(
        highlightStateEnum: _ModuleSupport.HighlightState | undefined,
        selectionStateEnum: _ModuleSupport.SelectionState | undefined,
        candidateStateEnum: _ModuleSupport.SelectionState | undefined
    ): AgRangeAreaSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { fill, fillOpacity, item, xKey, yHighKey, yLowKey } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);
        const selectionState = toSelectionString(selectionStateEnum);
        const candidateState = toSelectionString(candidateStateEnum);

        type T = AgRangeAreaSeriesStylerParams<unknown, unknown>;
        type OptionalKey = 'selectionState' | 'candidateState';
        type ParamsRules = DeepRequired<Omit<T, OptionalKey>, 'fill'> & Pick<RequireOptional<T>, OptionalKey>;
        type ResultRules = CallbackParamRules<ParamsRules>;

        const makeItemParam = (lowOrHigh: 'low' | 'high'): ResultRules['item'][typeof lowOrHigh] => {
            const { lineDash, lineDashOffset, marker, stroke, strokeOpacity, strokeWidth } = item[lowOrHigh];
            return {
                marker: {
                    fill: marker.fill ?? fill,
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
        return {
            item: {
                low: makeItemParam('low'),
                high: makeItemParam('high'),
            },
            fill,
            fillOpacity,
            highlightState,
            selectionState,
            candidateState,
            seriesId,
            xKey,
            yLowKey,
            yHighKey,
        } satisfies ResultRules;
    }

    private makeItemStylerParams(itemType: AgRangeAreaSeriesItemType): RangeAreaSeriesParams {
        const { xKey, yLowKey, yHighKey } = this.properties;
        return { xKey, yLowKey, yHighKey, itemType };
    }

    override getTooltipContent(
        datumIndex: number,
        removeThisDatum: RangeAreaMarkerDatum | undefined
    ): _ModuleSupport.TooltipContent | undefined {
        const itemType: AgRangeAreaSeriesItemType = removeThisDatum?.itemType ?? 'high';

        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xName, yName, yLowKey, yLowName, xKey, yHighKey, yHighName, tooltip, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yHighValue = dataModel.resolveColumnById(this, `yHighValue`, processedData, 'mixed-numeric')[datumIndex];
        const yLowValue = dataModel.resolveColumnById(this, `yLowValue`, processedData, 'mixed-numeric')[datumIndex];

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        const stylerStyle = this.getStyle(undefined);
        const params = this.makeItemStylerParams(itemType);
        const format = this.getMarkerStyle(
            this.properties.item[itemType].marker,
            { datumIndex, datum },
            params,
            { isHighlight: false, resolveMarkerSubPath: ['item', itemType, 'marker'] },
            stylerStyle.item[itemType].marker
        ) as RequireOptional<AgSeriesMarkerStyle>;

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
                itemType,
                xName,
                yName,
                yLowKey,
                yLowName,
                xKey,
                yHighKey,
                yHighName,
                legendItemName,
                ...format,
            }
        );
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { fill, topLevel } = this.getStyle(undefined);
        const { stroke, strokeWidth, strokeOpacity, lineDash, marker } = topLevel;

        const markerStyle = {
            shape: marker.shape,
            fill: marker.fill ?? fill,
            stroke: marker.stroke ?? stroke,
            fillOpacity: marker.fillOpacity,
            strokeOpacity: marker.strokeOpacity,
            strokeWidth: marker.strokeWidth,
            lineDash: marker.lineDash,
            lineDashOffset: marker.lineDashOffset,
        };

        return {
            marker: markerStyle,
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

        const { yLowKey, yHighKey, yName, yLowName, yHighName, legendItemName, showInLegend } = this.properties;
        const legendItemText = legendItemName ?? yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
        const itemId: RangeAreaItemId = `${yLowKey}-${yHighKey}`;
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

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Marker<RangeAreaMarkerDatum>();
    }

    override animateEmptyUpdateReady(
        animationData: _ModuleSupport.CartesianAnimationData<
            RangeAreaMarkerDatum,
            _ModuleSupport.Marker<RangeAreaMarkerDatum>,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ) {
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
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection, this.highlightLabelSelection);
    }

    protected override animateReadyResize(
        animationData: _ModuleSupport.CartesianAnimationData<
            RangeAreaMarkerDatum,
            _ModuleSupport.Marker<RangeAreaMarkerDatum>,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ): void {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(
        animationData: _ModuleSupport.CartesianAnimationData<
            RangeAreaMarkerDatum,
            _ModuleSupport.Marker<RangeAreaMarkerDatum>,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ) {
        const { animationManager } = this.ctx;
        const { datumSelection, labelSelection, contextData, paths, previousContextData } = animationData;
        const [fill, lowStroke, highStroke] = paths;

        // Handling initially hidden series case gracefully.
        if (fill == null && lowStroke == null && highStroke == null) return;

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
            pathFadeInAnimation(this, 'low_stroke_path_properties', animationManager, 'add', lowStroke);
            pathFadeInAnimation(this, 'high_stroke_path_properties', animationManager, 'add', highStroke);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection, this.highlightLabelSelection);
            return;
        }

        const fns = prepareRangeAreaPathAnimation(
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

        fromToMotion(this.id, 'fill_path_properties', animationManager, [fill], fns.fill.pathProperties);
        fromToMotion(this.id, 'low_stroke_path_properties', animationManager, [lowStroke], fns.stroke.pathProperties);
        fromToMotion(this.id, 'high_stroke_path_properties', animationManager, [highStroke], fns.stroke.pathProperties);

        if (fns.status === 'added') {
            this.updateAreaPaths(paths, contextData);
        } else if (fns.status === 'removed') {
            this.updateAreaPaths(paths, previousContextData);
        } else {
            pathMotion(this.id, 'fill_path_update', animationManager, [fill], fns.fill.path);
            pathMotion(this.id, 'low_stroke_path_update', animationManager, [lowStroke], fns.stroke.path);
            pathMotion(this.id, 'high_stroke_path_update', animationManager, [highStroke], fns.stroke.path);
        }

        if (fns.hasMotion) {
            markerFadeInAnimation(this, animationManager, undefined, this.getAnimationDrawingModes(), datumSelection);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection, this.highlightLabelSelection);
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
            onComplete: () => this.updateAreaPaths(paths, contextData),
        });
    }

    public getFormattedMarkerStyle(datum: RangeAreaMarkerDatum) {
        const stylerStyle = this.getStyle(undefined);
        const params = this.makeItemStylerParams(datum.itemType);

        return this.getMarkerStyle(
            this.properties.item[datum.itemType].marker,
            datum,
            params,
            { isHighlight: true, resolveMarkerSubPath: ['item', datum.itemType, 'marker'] },
            undefined,
            stylerStyle
        );
    }

    public override getMarkerStyle<TParams>(
        marker: _ModuleSupport.SeriesMarker<TParams>,
        datum: GetMarkerStyleArg<1>,
        params?: TParams,
        opts?: GetMarkerStyleArg<3>,
        defaultOverrideStyle?: GetMarkerStyleArg<4>,
        inheritedStyle?: GetMarkerStyleArg<5>
    ): ReturnType<_ModuleSupport.CartesianSeries<RangeAreaSeriesTypes>['getMarkerStyle']> {
        type P1 = Parameters<RangeAreaSeries['getMarkerStyle']>;
        type P2 = Parameters<_ModuleSupport.CartesianSeries<RangeAreaSeriesTypes>['getMarkerStyle']>;
        true satisfies AreExact<P1, P2>; // break compilation if override/base function signatures do not match.

        // Override the item.(low|high).marker.itemStyler callback property:
        // It is internal only (hidden from API), so is not set automatically like other properties.
        marker.itemStyler = this.properties.marker.itemStyler;
        return super.getMarkerStyle(marker, datum, params, opts, defaultOverrideStyle, inheritedStyle);
    }

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        const hiBox = computeMarkerFocusBounds(this, opts);
        const loBox = computeMarkerFocusBounds(this, { ...opts, datumIndex: opts.datumIndex + 1 });
        if (hiBox && loBox) {
            return BBox.merge([hiBox, loBox]);
        }
        return undefined;
    }

    protected override isDatumEnabled(nodeData: RangeAreaMarkerDatum[], datumIndex: number): boolean {
        return datumIndex % 2 === 0 && super.isDatumEnabled(nodeData, datumIndex);
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
