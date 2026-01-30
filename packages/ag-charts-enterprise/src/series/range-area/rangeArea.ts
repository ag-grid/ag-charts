import {
    type AgDrawingMode,
    type AgRangeAreaSeriesItemType,
    type AgRangeAreaSeriesLabelFormatterParams,
    type AgRangeAreaSeriesLineStyle,
    type AgRangeAreaSeriesOptions,
    type AgRangeAreaSeriesStyle,
    type AgRangeAreaSeriesStylerParams,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    AGGREGATION_INDEX_UNSET,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    type AreExact,
    type CallbackParamRules,
    ChartAxisDirection,
    DebugMetrics,
    type DeepRequired,
    type DomainWithMetadata,
    type Point,
    type RequireOptional,
    extent,
    findMinMax,
    mergeDefaults,
} from 'ag-charts-core';

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
const HIGH = AGGREGATION_INDEX_Y_MAX;
const LOW = AGGREGATION_INDEX_Y_MIN;
const SPAN = AGGREGATION_SPAN;

const {
    valueProperty,
    keyProperty,
    updateLabelNode,
    fixNumericExtent,
    buildResetPathFn,
    resetLabelFn,
    resetMarkerFn,
    resetMarkerPositionFn,
    pathSwipeInAnimation,
    resetMotion,
    markerSwipeScaleInAnimation,
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
    markerEnabled,
    getMarkerStyles,
    calculateSegments,
    toHighlightString,
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
type PartialStylerResult = AgRangeAreaSeriesStyle & { opacity?: number };
type StylerResult = DeepRequired<PartialStylerResult, 'fill'> & { topLevel: Required<AgRangeAreaSeriesLineStyle> };
type StylerMarkerOptionsResult = DeepRequired<ResolvedStyleMixin>;

/**
 * Context object for efficient node datum creation.
 * Caches expensive-to-compute values that are reused across all datum iterations.
 */
interface RangeAreaSeriesNodeDatumContext extends _ModuleSupport.CartesianCreateNodeDataContext<RangeAreaMarkerDatum> {
    // Data arrays (from dataModel - cache once)
    readonly yHighValues: any[];
    readonly yLowValues: any[];

    // Pre-computed offsets
    readonly xOffset: number;

    // Axis range for visible range filtering
    readonly xAxisRange: [number, number];

    // Aggregation (using shared ExtremesAggregationFilter)
    readonly dataAggregationFilter: RangeAreaSeriesDataAggregationFilter | undefined;
    readonly range: number;

    // Pre-computed flags
    readonly labelsEnabled: boolean;

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

/**
 * Scratch object for per-datum processing to avoid allocations per iteration.
 */
interface RangeAreaNodeDatumScratch {
    datum: any;
    xValue: any;
    yHighValue: number;
    yLowValue: number;
    x: number;
    yHighCoordinate: number;
    yLowCoordinate: number;
    inverted: boolean;
}

class RangeAreaSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RangeAreaMarkerDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: RangeAreaMarkerDatum, series: RangeAreaSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}

interface RangeAreaSpanPointDatum {
    high: _ModuleSupport.LineSpanPointDatum;
    low: _ModuleSupport.LineSpanPointDatum;
}

/**
 * Consolidated type interface for RangeAreaSeries.
 */
interface RangeAreaSeriesTypes extends _ModuleSupport.CartesianSeriesTypes {
    readonly node: _ModuleSupport.Marker;
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

export class RangeAreaSeries extends _ModuleSupport.CartesianSeries<RangeAreaSeriesTypes> {
    static override readonly className = 'RangeAreaSeries';
    static readonly type = 'range-area' as const;

    override properties = new RangeAreaProperties();

    protected override readonly NodeEvent = RangeAreaSeriesNodeEvent;

    private readonly aggregationManager = new AggregationManager<RangeAreaSeriesDataAggregationFilter>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
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
                valueProperty(yLowKey, yScaleType, { id: `yLowValue` }),
                valueProperty(yHighKey, yScaleType, { id: `yHighValue` }),
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
        this.aggregationManager.markStale();

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
        const existingNodes = this.contextNodeData?.nodeData;
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const canIncrementallyUpdate =
            existingNodes != null &&
            (processedData.changeDescription != null ||
                !processedDataIsAnimatable(processedData) ||
                dataAggregationFilter != null);

        return {
            xAxis,
            yAxis,
            rawData,
            xValues: dataModel.resolveKeysById(this, 'xValue', processedData),
            yHighValues: dataModel.resolveColumnById(this, 'yHighValue', processedData),
            yLowValues: dataModel.resolveColumnById(this, 'yLowValue', processedData),
            xScale,
            yScale,
            xAxisRange,
            xOffset: (xScale.bandwidth ?? 0) / 2,
            dataAggregationFilter,
            range,
            labelsEnabled: this.properties.label.enabled,
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

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [number, number]) {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yHighValue', 'yLowValue'], 'xValue', visibleRange);
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
        yHighValueOverride?: number,
        yLowValueOverride?: number
    ): void {
        scratch.xValue = ctx.xValues[datumIndex];
        if (scratch.xValue === undefined && !this.properties.allowNullKeys) return;

        scratch.datum = ctx.rawData[datumIndex];
        scratch.yHighValue = yHighValueOverride ?? ctx.yHighValues[datumIndex];
        scratch.yLowValue = yLowValueOverride ?? ctx.yLowValues[datumIndex];

        const currentSpanPoints = ctx.spanPoints.at(-1);

        if (Number.isFinite(scratch.yHighValue) && Number.isFinite(scratch.yLowValue)) {
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

    /**
     * Creates or updates marker datum for a single boundary (high or low).
     * Supports incremental updates by reusing existing marker data objects when possible.
     */
    private upsertMarkerDatum(
        ctx: RangeAreaSeriesNodeDatumContext,
        scratch: RangeAreaNodeDatumScratch,
        datumIndex: number,
        itemType: 'high' | 'low',
        yValue: number,
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
            const labelDatum = this.createLabelData({
                datumIndex,
                point: { x: scratch.x, y },
                value: yValue,
                yLowValue: scratch.yLowValue,
                yHighValue: scratch.yHighValue,
                itemType,
                inverted: scratch.inverted,
                datum: scratch.datum,
                series: this,
            });
            ctx.labelData.push(labelDatum);
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

            for (let bucketIndex = start; bucketIndex < end; bucketIndex += 1) {
                const midIndex = midpointIndices[bucketIndex];
                if (midIndex === AGGREGATION_INDEX_UNSET) continue; // Empty bucket

                const aggIndex = bucketIndex * SPAN;
                const yHighDatumIndex = indexData[aggIndex + HIGH];
                const yLowDatumIndex = indexData[aggIndex + LOW];

                // Use high index for position (x coordinate), but get extreme values from respective datums
                // In aggregated mode, the yHigh and yLow extrema may come from DIFFERENT data points in the bucket
                this.handleDatumPoint(
                    ctx,
                    scratch,
                    yHighDatumIndex,
                    ctx.yHighValues[yHighDatumIndex],
                    ctx.yLowValues[yLowDatumIndex]
                );
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

    private createLabelData({
        datumIndex,
        point,
        value,
        itemType,
        inverted,
        datum,
        series,
    }: {
        datumIndex: number;
        point: Point;
        value: any;
        yLowValue: any;
        yHighValue: any;
        itemType: AgRangeAreaSeriesItemType;
        inverted: boolean;
        datum: any;
        series: RangeAreaSeries;
    }): RangeAreaLabelDatum {
        const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, legendItemName, label } = this.properties;
        const { placement } = label;
        const spacing = label.spacing + (typeof label.padding === 'number' ? label.padding : 0);

        let actualItemId = itemType;
        if (inverted) {
            actualItemId = itemType === 'low' ? 'high' : 'low';
        }
        const direction =
            (placement === 'outside' && actualItemId === 'high') || (placement === 'inside' && actualItemId === 'low')
                ? -1
                : 1;

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y).domain;

        return {
            x: point.x,
            y: point.y + spacing * direction,
            series,
            itemType,
            datum,
            datumIndex,
            text: this.getLabelText<AgRangeAreaSeriesLabelFormatterParams>(
                value,
                datum,
                itemType === 'high' ? yHighKey : yLowKey,
                'y',
                yDomain,
                label,
                { value, datum, itemType, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName, legendItemName }
            ),
            textAlign: 'center',
            textBaseline: direction === -1 ? 'bottom' : 'top',
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

        const { item, fill, fillOpacity, opacity } = mergeDefaults(highlightStyle, this.getStyle(highlightState));

        lowStrokePath.setProperties({
            datum: segments,
            segments,
            fill: undefined,
            lineCap: 'round',
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            stroke: item.low.stroke,
            strokeWidth: item.low.strokeWidth,
            strokeOpacity: item.low.strokeOpacity,
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
            stroke: item.high.stroke,
            strokeWidth: item.high.strokeWidth,
            strokeOpacity: item.high.strokeOpacity,
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
            _ModuleSupport.Marker,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ): void {
        // Use direct reset for datum selection to bypass resetMotion callback overhead
        resetMarkerSelectionsDirect([data.datumSelection]);
    }

    protected override updateDatumSelection(opts: {
        nodeData: RangeAreaMarkerDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RangeAreaMarkerDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const { processedData, axes, properties } = this;

        type LowHighRules = { [K in 'low' | 'high']: { marker: { enabled: boolean } } };
        const rules: LowHighRules = properties.styler ? this.getStylerMarkerOptions().item : properties.item;
        const { low, high } = rules;

        const markersEnabled = markerEnabled(processedData!.input.count, axes[ChartAxisDirection.X]!.scale, {
            enabled: low.marker.enabled || high.marker.enabled,
        });

        if (properties.item.low.marker.isDirty() || properties.item.high.marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        let resolvedNodeData: typeof nodeData;
        if (markersEnabled) {
            if (low.marker.enabled && high.marker.enabled) {
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

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
    }) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        datumSelection.each((_, datum) => {
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const stylerStyle = this.getStyle(highlightState);
            const { fill, fillOpacity, item } = stylerStyle;
            const { stroke, strokeWidth, strokeOpacity } = item[datum.itemType];
            const { marker } = this.properties.item[datum.itemType];

            const params = this.makeItemStylerParams(datum.itemType);
            datum.style = this.getMarkerStyle(
                marker,
                datum,
                params,
                { isHighlight, highlightState, resolveMarkerSubPath: ['item', datum.itemType, 'marker'] },
                stylerStyle.item[datum.itemType].marker,
                {
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                }
            );
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }

        const { datumSelection, isHighlight } = opts;
        const fillBBox = this.getShapeFillBBox();

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const drawingMode = this.getDrawingMode(isHighlight, opts.drawingMode);

        datumSelection.each((node, datum) => {
            const { itemType } = datum;
            const style =
                datum.style ??
                contextNodeData.styles[itemType][
                    this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ];
            this.applyMarkerStyle(style, node, datum.point, fillBBox);
            node.drawingMode = drawingMode;
        });

        if (!isHighlight) {
            this.properties.item.low.marker.markClean();
            this.properties.item.high.marker.markClean();
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: RangeAreaLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RangeAreaLabelDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RangeAreaLabelDatum>;
        isHighlight?: boolean;
    }) {
        const params: RequireOptional<AgRangeAreaSeriesLabelFormatterParams> = {
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
        const { isHighlight = false, labelSelection } = opts;
        labelSelection.each((textNode, datum) => {
            textNode.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
            updateLabelNode(this, textNode, params, this.properties.label, datum, isHighlight, activeHighlight);
        });
    }

    protected override getHighlightLabelData(labelData: RangeAreaLabelDatum[], highlightedItem: RangeAreaMarkerDatum) {
        if (!labelData?.length) return [];

        return labelData.filter((labelDatum) => labelDatum.datum === highlightedItem.datum);
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

    private getStyle(highlightState?: _ModuleSupport.HighlightState): StylerResult {
        return this.getStylerCouple(highlightState)[0];
    }

    private getStylerMarkerOptions(): StylerMarkerOptionsResult {
        return this.getStylerCouple()[1];
    }

    private getStylerCouple(highlightState?: _ModuleSupport.HighlightState): [StylerResult, StylerMarkerOptionsResult] {
        const { fill, fillOpacity, item, styler } = this.properties;

        let stylerResult: AgRangeAreaSeriesStyle & ResolvedStyleMixin = {};
        if (styler) {
            const stylerParams = this.makeStylerParams(highlightState);
            stylerResult =
                this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.cachedCallWithContext(styler, stylerParams) ?? {},
                    { pick: false }
                ) ?? {};
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
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgRangeAreaSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { fill, fillOpacity, item, xKey, yHighKey, yLowKey } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type ParamsRules = DeepRequired<AgRangeAreaSeriesStylerParams<unknown, unknown>, 'fill'>;
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
        const yHighValue = dataModel.resolveColumnById(this, `yHighValue`, processedData)[datumIndex];
        const yLowValue = dataModel.resolveColumnById(this, `yLowValue`, processedData)[datumIndex];

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        const stylerStyle = this.getStyle();
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
        const { fill, topLevel } = this.getStyle();
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
        return new Marker();
    }

    override animateEmptyUpdateReady(
        animationData: _ModuleSupport.CartesianAnimationData<
            _ModuleSupport.Marker,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ) {
        const { datumSelection, labelSelection, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([datumSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, datumSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection, this.highlightLabelSelection);
    }

    protected override animateReadyResize(
        animationData: _ModuleSupport.CartesianAnimationData<
            _ModuleSupport.Marker,
            RangeAreaMarkerDatum,
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
            _ModuleSupport.Marker,
            RangeAreaMarkerDatum,
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

            markerFadeInAnimation(this, animationManager, 'added', datumSelection);
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
            markerFadeInAnimation(this, animationManager, undefined, datumSelection);
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
        const stylerStyle = this.getStyle();
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
            this.properties.styler != null ||
            this.properties.marker.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
