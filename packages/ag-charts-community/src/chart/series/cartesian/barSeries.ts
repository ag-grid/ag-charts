import type { CallbackParamRules, DomainWithMetadata, Mutable, Point, RequireOptional, Scale } from 'ag-charts-core';
import {
    AGGREGATION_INDEX_UNSET,
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    ChartAxisDirection,
    DebugMetrics,
    areScalingEqual,
    isFiniteNumber,
    mergeDefaults,
} from 'ag-charts-core';
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
import type { ChartAxis } from '../../chartAxis';
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
import { AggregationManager } from '../aggregationManager';
import { type PickFocusInputs, SeriesNodePickMode, type SeriesNodeStyleContext } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { HighlightState, toHighlightString } from '../seriesProperties';
import type { ErrorBoundSeriesNodeDatum } from '../seriesTypes';
import { datumStylerProperties, getItemStyles, visibleRangeIndices } from '../util';
import {
    AbstractBarSeries,
    type AbstractBarSeriesAnimationData,
    type AbstractBarSeriesNodeDataContext,
} from './abstractBarSeries';
import {
    type BarSeriesDataAggregationFilter,
    aggregateBarDataFromDataModel,
    aggregateBarDataFromDataModelPartial,
} from './barAggregation';
import { BarSeriesProperties } from './barSeriesProperties';
import {
    checkCrisp,
    collapsedStartingBarPosition,
    computeBarFocusBounds,
    prepareBarAnimationFunctions,
    resetBarSelectionsDirect,
    resetBarSelectionsFn,
} from './barUtil';
import {
    type CartesianAnimationData,
    type CartesianSeriesNodeDatum,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { calculateDataDiff } from './diffUtil';
import { calculateSegments } from './util';

interface BarNodeLabelDatum extends Readonly<Point> {
    readonly text: TextOrSegments;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
}

/**
 * Shared context for creating/updating BarNodeDatum instances.
 * Instantiated once per createNodeData() call and reused across all datum operations
 * to minimize memory allocations. Only contains values that are expensive to compute
 * or resolve - cheap property lookups use `this` directly in methods.
 */
interface BarSeriesNodeDatumContext {
    // Data arrays (resolved from dataModel - worth caching)
    readonly rawData: { data: any[] } | undefined;
    readonly xValues: any[];
    readonly yRawValues: any[];
    readonly yFilterValues: any[] | undefined;
    readonly yStartValues: any[] | undefined;
    readonly yEndValues: any[] | undefined;

    // Scales (axis lookups - worth caching)
    readonly xScale: Scale<any, any>;
    readonly yScale: Scale<any, any>;

    // Axes (for range calculations and other operations)
    readonly xAxis: ChartAxis;
    readonly yAxis: ChartAxis;

    // Computed positioning (involves scale conversions - worth caching)
    readonly groupOffset: number;
    readonly barOffset: number;
    readonly barWidth: number;
    readonly range: number;

    // Pre-computed values (scale conversions or computed - worth caching)
    readonly yReversed: boolean;
    readonly bboxBottom: number;
    readonly labelSpacing: number;
    readonly crisp: boolean;
    readonly isStacked: boolean;
    readonly animationEnabled: boolean;
    readonly dataAggregationFilter: BarSeriesDataAggregationFilter | undefined;
    readonly canIncrementallyUpdate: boolean;

    // Mutable working state (arrays and counters that change during node creation)
    phantomNodes: BarNodeDatum[];
    nodes: BarNodeDatum[];
    labels: BarNodeDatum[];
    nodeIndex: number;
    phantomIndex: number;

    // Property lookups (constant across all datums - worth caching)
    readonly barAlongX: boolean;
    readonly shouldFlipXY: boolean;
    readonly xKey: string;
    readonly yKey: string;
    readonly xName: string | undefined;
    readonly yName: string | undefined;
    readonly legendItemName: string | undefined;
    readonly label: BarSeriesProperties['label'];
    readonly yDomain: any[];
}

/** Result of creating node datum(s) for a single data point */
interface CreateNodeDatumResult {
    nodeData: BarNodeDatum | undefined;
    phantomNodeData: BarNodeDatum | undefined;
}

interface PreparedBarNodeDatumState {
    datum: any;
    xValue: any;
    yRawValue: number;
    yFilterValue?: number;
    labelText?: TextOrSegments;
    inset: boolean;
    isPositive: boolean;
    precomputedBottomY?: number;
    precomputedIsUpward?: boolean;
}

interface NodeDatumParams {
    nodeDatumScratch: PreparedBarNodeDatumState;
    datumIndex: number;
    x: number;
    width: number;
    yStart: number;
    yEnd: number;
    yRange: number;
    featherRatio: number;
    opacity: number;
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

export class BarSeries extends AbstractBarSeries<
    BarShape<BarNodeDatum>,
    AgBarSeriesOptions,
    BarSeriesProperties,
    BarNodeDatum,
    BarNodeDatum,
    BarSeriesNodeDataContext
> {
    static override readonly className = 'BarSeries';
    static readonly type = 'bar' as const;

    override properties = new BarSeriesProperties();

    override connectsToYAxis = true;

    private readonly aggregationManager = new AggregationManager<BarSeriesDataAggregationFilter>();

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
        if (this.needsDataModelDiff() && this.processedData) {
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

        this.aggregateData(dataModel, processedData);

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.animationState.transition('updateData');
    }

    private yCumulativeKey(dataModel: DataModel<any, any>) {
        return dataModel.hasColumnById(this, `yValue-end`) ? 'yValue-end' : 'yValue-raw';
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { processedData, dataModel } = this;

        if (dataModel == null || processedData == null) return { domain: [] };

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return { domain: this.padBandExtent(keys.domain) };
        }

        const yKey = this.yCumulativeKey(dataModel);
        let yExtent = this.domainForClippedRange(direction, [yKey], 'xValue');
        const yFilterExtent = this.crossFilteringEnabled()
            ? dataModel.getDomain(this, `yFilterValue`, 'value', processedData).domain
            : undefined;
        if (yFilterExtent != null) {
            yExtent = [Math.min(yExtent[0], yFilterExtent[0]), Math.max(yExtent[1], yFilterExtent[1])];
        }

        const yAxis = this.getValueAxis();
        if (yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
            const fixedYExtent = Number.isFinite(yExtent[1] - yExtent[0])
                ? [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])]
                : [];
            return { domain: fixNumericExtent(fixedYExtent) };
        } else {
            return { domain: fixNumericExtent(yExtent) };
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
        // Mark existing filters as stale before recomputing
        this.aggregationManager.markStale();

        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateBarDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateBarDataFromDataModel(xAxis.scale.type, dataModel, processedData, this, existingFilters),
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
        // Fallback: estimate from chart dimensions
        return this.ctx.scene?.canvas?.width ?? 800;
    }

    /**
     * Creates shared context for node datum creation/update operations.
     * This context is instantiated once and reused across all datum operations
     * to minimize memory allocations. Only caches values that are expensive to
     * compute - cheap property lookups use `this` directly.
     */
    private createNodeDatumContext(xAxis: ChartAxis, yAxis: ChartAxis): BarSeriesNodeDatumContext | undefined {
        const { dataModel, processedData, groupScale } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources?.get(this.id);
        if (rawData == null) return undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const { barWidth, groupIndex: groupScaleIndex } = this.updateGroupScale(xAxis);
        const range = Math.abs(xScale.range[1] - xScale.range[0]);

        // Ensure we have the aggregation level needed for the current range
        // This will force-compute deferred levels if necessary
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        const isStacked = dataModel.hasColumnById(this, `yValue-start`);
        const { label } = this.properties;
        const canIncrementallyUpdate =
            this.contextNodeData?.nodeData != null &&
            (processedData.changeDescription != null ||
                !processedDataIsAnimatable(processedData) ||
                dataAggregationFilter != null);

        return {
            rawData,
            xValues: dataModel.resolveKeysById(this, `xValue`, processedData),
            yRawValues: dataModel.resolveColumnById(this, `yValue-raw`, processedData),
            yFilterValues: this.crossFilteringEnabled()
                ? dataModel.resolveColumnById(this, `yFilterValue`, processedData)
                : undefined,
            yStartValues: isStacked ? dataModel.resolveColumnById(this, `yValue-start`, processedData) : undefined,
            yEndValues: isStacked ? dataModel.resolveColumnById(this, `yValue-end`, processedData) : undefined,
            xScale,
            yScale,
            xAxis,
            yAxis,
            groupOffset: groupScale.convert(String(groupScaleIndex)),
            barOffset: ContinuousScale.is(xScale) ? barWidth * -0.5 : 0,
            barWidth,
            range,
            yReversed: yAxis.isReversed(),
            bboxBottom: yScale.convert(0),
            labelSpacing: label.spacing + (typeof label.padding === 'number' ? label.padding : 0),
            crisp:
                dataAggregationFilter == null &&
                (this.properties.crisp ??
                    checkCrisp(xAxis?.scale, xAxis?.visibleRange, this.smallestDataInterval, this.largestDataInterval)),
            isStacked,
            animationEnabled: !this.ctx.animationManager.isSkipped(),
            dataAggregationFilter,
            canIncrementallyUpdate,
            phantomNodes: canIncrementallyUpdate ? this.contextNodeData.phantomNodeData ?? [] : [],
            nodes: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
            labels: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
            nodeIndex: 0,
            phantomIndex: 0,
            barAlongX: this.getBarDirection() === ChartAxisDirection.X,
            shouldFlipXY: this.shouldFlipXY(),
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
            xName: this.properties.xName,
            yName: this.properties.yName,
            legendItemName: this.properties.legendItemName,
            label,
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y).domain,
        };
    }

    /**
     * Computes the x position for a datum at the given index.
     */
    private computeXPosition(ctx: BarSeriesNodeDatumContext, datumIndex: number): number {
        return ctx.xScale.convert(ctx.xValues[datumIndex]) + ctx.groupOffset + ctx.barOffset;
    }

    private prepareNodeDatumState(
        ctx: BarSeriesNodeDatumContext,
        nodeDatumScratch: PreparedBarNodeDatumState,
        datumIndex: number,
        yStart: number,
        yEnd: number
    ): PreparedBarNodeDatumState | undefined {
        if (!Number.isFinite(yEnd)) {
            return undefined;
        }

        const xValue = ctx.xValues[datumIndex];
        if (xValue == null) {
            return undefined;
        }

        const datum = ctx.rawData?.data[datumIndex];
        const yRawValue = ctx.yRawValues[datumIndex];
        const yFilterValue = ctx.yFilterValues == null ? undefined : Number(ctx.yFilterValues[datumIndex]);
        if (yFilterValue != null && !Number.isFinite(yFilterValue)) {
            return undefined;
        }

        const labelText =
            ctx.label.enabled && yRawValue != null
                ? this.getLabelText<AgBarSeriesLabelFormatterParams>(
                      yFilterValue ?? yRawValue,
                      datum,
                      ctx.yKey,
                      'y',
                      ctx.yDomain,
                      ctx.label,
                      {
                          datum,
                          value: yFilterValue ?? yRawValue,
                          xKey: ctx.xKey,
                          yKey: ctx.yKey,
                          xName: ctx.xName,
                          yName: ctx.yName,
                          legendItemName: ctx.legendItemName,
                      }
                  )
                : undefined;

        const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);

        nodeDatumScratch.datum = datum;
        nodeDatumScratch.xValue = xValue;
        nodeDatumScratch.yRawValue = yRawValue;
        nodeDatumScratch.yFilterValue = yFilterValue;
        nodeDatumScratch.labelText = labelText;
        nodeDatumScratch.inset = yFilterValue != null && yFilterValue > yRawValue;
        nodeDatumScratch.isPositive = isPositive;
        nodeDatumScratch.precomputedBottomY = yFilterValue == null ? undefined : ctx.yScale.convert(yStart);
        nodeDatumScratch.precomputedIsUpward = yFilterValue == null ? undefined : isPositive !== ctx.yReversed;

        return nodeDatumScratch;
    }

    /**
     * Creates a skeleton BarNodeDatum with minimal required fields.
     * The node will be populated by updateNodeDatum.
     */
    private createSkeletonNodeDatum(
        ctx: BarSeriesNodeDatumContext,
        params: NodeDatumParams,
        phantom: boolean
    ): BarNodeDatum {
        // Note: prepareNodeDatumState has already been called and succeeded before this method is invoked,
        // so params.nodeDatumScratch should have valid values, but we use safe defaults for TypeScript.
        const scratch = params.nodeDatumScratch;
        return {
            series: this,
            itemId: phantom ? createDatumId(ctx.yKey, phantom) : ctx.yKey,
            datum: scratch.datum,
            datumIndex: params.datumIndex,
            cumulativeValue: 0, // Will be updated by updateNodeDatum
            phantom,
            xValue: scratch.xValue ?? '',
            yValue: 0, // Will be updated by updateNodeDatum
            yKey: ctx.yKey,
            xKey: ctx.xKey,
            capDefaults: {
                lengthRatioMultiplier: 0, // Will be updated by updateNodeDatum
                lengthMax: 0, // Will be updated by updateNodeDatum
            },
            x: 0, // Will be updated by updateNodeDatum
            y: 0, // Will be updated by updateNodeDatum
            width: 0, // Will be updated by updateNodeDatum
            height: 0, // Will be updated by updateNodeDatum
            midPoint: { x: 0, y: 0 }, // Required - updated in place by updateNodeDatum
            opacity: params.opacity,
            featherRatio: params.featherRatio,
            topLeftCornerRadius: false, // Will be updated by updateNodeDatum
            topRightCornerRadius: false, // Will be updated by updateNodeDatum
            bottomRightCornerRadius: false, // Will be updated by updateNodeDatum
            bottomLeftCornerRadius: false, // Will be updated by updateNodeDatum
            clipBBox: undefined, // Will be created/updated by updateNodeDatum
            crisp: ctx.crisp,
            label: undefined, // Will be created/updated by updateNodeDatum
            missing: false, // Will be updated by updateNodeDatum
            focusable: !phantom,
        };
    }

    /**
     * Creates a BarNodeDatum (and optionally a phantom node) for a single data point.
     * Creates skeleton nodes and uses updateNodeDatum to populate them with calculated values.
     */
    private createNodeDatum(ctx: BarSeriesNodeDatumContext, params: NodeDatumParams): CreateNodeDatumResult {
        const prepared = this.prepareNodeDatumState(
            ctx,
            params.nodeDatumScratch,
            params.datumIndex,
            params.yStart,
            params.yEnd
        );
        if (!prepared) {
            return { nodeData: undefined, phantomNodeData: undefined };
        }

        // Create skeleton main node and populate it
        const nodeData = this.createSkeletonNodeDatum(ctx, params, false);
        this.updateNodeDatum(ctx, nodeData, params, prepared);

        // Create phantom node if cross-filtering is active
        let phantomNodeData: BarNodeDatum | undefined;
        if (prepared.yFilterValue != null) {
            phantomNodeData = this.createSkeletonNodeDatum(ctx, params, true);
            this.updateNodeDatum(ctx, phantomNodeData, params);
        }

        return { nodeData, phantomNodeData };
    }

    /**
     * Updates an existing BarNodeDatum in-place for value-only changes.
     * This is more efficient than recreating the entire node when only data values change
     * but the structure (insertions/removals) remains the same.
     */
    private updateNodeDatum(
        ctx: BarSeriesNodeDatumContext,
        node: BarNodeDatum,
        params: NodeDatumParams,
        prepared?: PreparedBarNodeDatumState
    ): void {
        prepared ??= this.prepareNodeDatumState(
            ctx,
            params.nodeDatumScratch,
            params.datumIndex,
            params.yStart,
            params.yEnd
        );
        if (!prepared) {
            return;
        }

        const mutableNode = node as Mutable<BarNodeDatum>;

        // Update main node properties
        const phantom = node.phantom;
        const prevY = params.yStart;
        const yValue = phantom ? prepared.yFilterValue! : prepared.yFilterValue ?? prepared.yRawValue;
        const cumulativeValue = phantom ? prepared.yFilterValue! : prepared.yFilterValue ?? params.yEnd;
        const nodeLabelText = phantom ? undefined : prepared.labelText;

        let currY: number;
        if (phantom) {
            currY = params.yEnd;
        } else if (prepared.yFilterValue == null) {
            currY = params.yEnd;
        } else {
            currY = params.yStart + prepared.yFilterValue;
        }

        let nodeYRange: number;
        if (phantom) {
            nodeYRange = params.yRange;
        } else {
            nodeYRange = Math.max(params.yStart + (prepared.yFilterValue ?? -Infinity), params.yRange);
        }

        let crossScale: number | undefined;
        if (phantom) {
            crossScale = undefined;
        } else if (prepared.inset) {
            crossScale = 0.6;
        } else {
            crossScale = undefined;
        }

        const isUpward = prepared.precomputedIsUpward ?? prepared.isPositive !== ctx.yReversed;

        const y = ctx.yScale.convert(currY);
        const bottomY = prepared.precomputedBottomY ?? ctx.yScale.convert(prevY);
        const bboxHeight = ctx.yScale.convert(nodeYRange);

        const xOffset = params.width * 0.5 * (1 - (crossScale ?? 1));
        const rectX = ctx.barAlongX ? Math.min(y, bottomY) : params.x + xOffset;
        const rectY = ctx.barAlongX ? params.x + xOffset : Math.min(y, bottomY);
        const rectWidth = ctx.barAlongX ? Math.abs(bottomY - y) : params.width * (crossScale ?? 1);
        const rectHeight = ctx.barAlongX ? params.width * (crossScale ?? 1) : Math.abs(bottomY - y);

        const barRectX = ctx.barAlongX ? Math.min(ctx.bboxBottom, bboxHeight) : params.x + xOffset;
        const barRectY = ctx.barAlongX ? params.x + xOffset : Math.min(ctx.bboxBottom, bboxHeight);
        const barRectWidth = ctx.barAlongX ? Math.abs(ctx.bboxBottom - bboxHeight) : params.width * (crossScale ?? 1);
        const barRectHeight = ctx.barAlongX ? params.width * (crossScale ?? 1) : Math.abs(ctx.bboxBottom - bboxHeight);

        // Update mutable properties
        mutableNode.datum = prepared.datum;
        mutableNode.datumIndex = params.datumIndex;
        mutableNode.cumulativeValue = cumulativeValue;
        mutableNode.xValue = prepared.xValue;
        mutableNode.yValue = yValue;
        mutableNode.x = barRectX;
        mutableNode.y = barRectY;
        mutableNode.width = barRectWidth;
        mutableNode.height = barRectHeight;

        // Update midPoint in place
        const mutableMidPoint = mutableNode.midPoint as Mutable<Point>;
        mutableMidPoint.x = rectX + rectWidth / 2;
        mutableMidPoint.y = rectY + rectHeight / 2;

        // Update capDefaults
        const lengthRatioMultiplier = ctx.shouldFlipXY ? rectHeight : rectWidth;
        mutableNode.capDefaults.lengthRatioMultiplier = lengthRatioMultiplier;
        mutableNode.capDefaults.lengthMax = lengthRatioMultiplier;

        mutableNode.opacity = params.opacity;
        mutableNode.featherRatio = params.featherRatio;
        mutableNode.topLeftCornerRadius = ctx.barAlongX !== isUpward;
        mutableNode.topRightCornerRadius = isUpward;
        mutableNode.bottomRightCornerRadius = ctx.barAlongX === isUpward;
        mutableNode.bottomLeftCornerRadius = !isUpward;

        // Update clipBBox in place
        const existingClipBBox = mutableNode.clipBBox;
        if (existingClipBBox) {
            existingClipBBox.x = rectX;
            existingClipBBox.y = rectY;
            existingClipBBox.width = rectWidth;
            existingClipBBox.height = rectHeight;
        } else {
            mutableNode.clipBBox = new BBox(rectX, rectY, rectWidth, rectHeight);
        }

        mutableNode.crisp = ctx.crisp;

        // Update label in place
        if (nodeLabelText == null) {
            mutableNode.label = undefined;
        } else {
            const labelPlacement = adjustLabelPlacement({
                isUpward,
                isVertical: !ctx.barAlongX,
                placement: ctx.label.placement,
                spacing: ctx.labelSpacing,
                rect: { x: rectX, y: rectY, width: rectWidth, height: rectHeight },
            });

            const existingLabel = mutableNode.label;
            if (existingLabel) {
                // Update existing label object in place
                existingLabel.text = nodeLabelText;
                existingLabel.x = labelPlacement.x;
                existingLabel.y = labelPlacement.y;
                existingLabel.textAlign = labelPlacement.textAlign;
                existingLabel.textBaseline = labelPlacement.textBaseline;
            } else {
                // Create new label object (first time label is added)
                mutableNode.label = {
                    text: nodeLabelText,
                    ...labelPlacement,
                };
            }
        }

        mutableNode.missing = isTooltipValueMissing(yValue);
    }

    /**
     * Creates node data using aggregation filters for large datasets.
     */
    private createNodeDataWithAggregation(
        ctx: BarSeriesNodeDatumContext,
        xPosition: (index: number) => number,
        nodeDatumParamsScratch: NodeDatumParams
    ): void {
        const sign = ctx.yReversed ? -1 : 1;

        for (let p = 0; p < 2; p += 1) {
            const positive = p === 0;
            const indices = positive
                ? ctx.dataAggregationFilter!.positiveIndices
                : ctx.dataAggregationFilter!.negativeIndices;
            const indexData: Uint32Array = positive
                ? ctx.dataAggregationFilter!.positiveIndexData
                : ctx.dataAggregationFilter!.negativeIndexData;

            const Y_MIN = positive ? AGGREGATION_INDEX_Y_MIN : AGGREGATION_INDEX_Y_MAX;
            const Y_MAX = positive ? AGGREGATION_INDEX_Y_MAX : AGGREGATION_INDEX_Y_MIN;

            const visibleRange = this.visibleRangeIndices('xValue', ctx.xAxis.range, indices);
            const start = visibleRange[0];
            const end = visibleRange[1];

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * AGGREGATION_SPAN;
                const xMinIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MIN];
                const xMaxIndex = indexData[aggIndex + AGGREGATION_INDEX_X_MAX];
                const yMinIndex = indexData[aggIndex + Y_MIN];
                const yMaxIndex = indexData[aggIndex + Y_MAX];

                if (xMinIndex === AGGREGATION_INDEX_UNSET) continue;
                if (ctx.xValues[yMaxIndex] == null || ctx.xValues[yMinIndex] == null) continue;

                const x = xPosition(Math.trunc((xMinIndex + xMaxIndex) / 2));
                // The width of the shape is the width from the left of the first bar to the right of the second bar
                const width = Math.abs(xPosition(xMaxIndex) - xPosition(xMinIndex)) + ctx.barWidth;

                // start & end may be incorrect when there's a lot of missing data
                if (x - width < 0 || x > ctx.range) continue;

                const bandCount = Math.abs(xMaxIndex - xMinIndex) + 1;
                // This means the density of the fill is higher than it would be if we drew the bars individually.
                // Adjust the opacity to account for this
                const opacity = BandScale.is(ctx.xScale)
                    ? Math.min((ctx.xScale.bandwidth * Math.max(bandCount - 1, 1)) / (ctx.xScale.step * bandCount), 1)
                    : 1;

                nodeDatumParamsScratch.datumIndex = yMaxIndex;
                nodeDatumParamsScratch.x = x;
                nodeDatumParamsScratch.width = width;
                nodeDatumParamsScratch.opacity = opacity;
                if (ctx.isStacked) {
                    nodeDatumParamsScratch.yStart = Number(ctx.yStartValues![yMinIndex]);
                    nodeDatumParamsScratch.yEnd = Number(ctx.yEndValues![yMaxIndex]);
                    nodeDatumParamsScratch.featherRatio = 0;
                } else {
                    const yEndMax = Number(ctx.yRawValues[yMaxIndex]);
                    const yEndMin = Number(ctx.yRawValues[yMinIndex]);

                    nodeDatumParamsScratch.yStart = 0;
                    nodeDatumParamsScratch.yEnd = yEndMax;
                    nodeDatumParamsScratch.featherRatio = (positive ? 1 : -1) * sign * (1 - yEndMin / yEndMax);
                }
                nodeDatumParamsScratch.yRange = nodeDatumParamsScratch.yEnd;

                this.upsertNodeDatum(ctx, nodeDatumParamsScratch);
            }
        }
    }

    /**
     * Creates node data for grouped data processing.
     */
    private createNodeDataGrouped(
        ctx: BarSeriesNodeDatumContext,
        xPosition: (index: number) => number,
        nodeDatumParamsScratch: NodeDatumParams
    ): void {
        const processedData = this.processedData! as import('../../data/dataModelTypes').GroupedData<any>;
        const invalidData = processedData.invalidData?.get(this.id);
        const width = ctx.barWidth;
        const yRangeIndex = ctx.isStacked ? this.dataModel!.resolveProcessedDataIndexById(this, `yValue-range`) : -1;
        const columnIndex = processedData.columnScopes.findIndex((s) => s.has(this.id));
        const groups = processedData.groups;

        const visibleRange = visibleRangeIndices(1, groups.length, ctx.xAxis.range, (groupIndex) => {
            const group = groups[groupIndex];
            const xValue = group.keys[0];
            return this.xCoordinateRange(xValue);
        });
        const start = visibleRange[0];
        const end = visibleRange[1];

        for (let groupIndex = start; groupIndex < end; groupIndex += 1) {
            const group = groups[groupIndex];
            const aggregation = group.aggregation;

            const datumIndices = group.datumIndices[columnIndex];
            if (datumIndices == null) continue;

            for (const relativeDatumIndex of datumIndices) {
                const datumIndex = groupIndex + relativeDatumIndex;
                const x = xPosition(datumIndex);
                if (invalidData?.[datumIndex] === true) continue;

                const yRawValue = ctx.yRawValues[datumIndex];
                if (yRawValue == null) continue;
                const isPositive = yRawValue >= 0 && !Object.is(yRawValue, -0);
                const yStart = ctx.isStacked ? Number(ctx.yStartValues?.[datumIndex]) : 0;
                const yEnd = ctx.isStacked ? Number(ctx.yEndValues?.[datumIndex]) : yRawValue;
                let yRange = yEnd;
                if (ctx.isStacked) {
                    yRange = aggregation[yRangeIndex][isPositive ? 1 : 0];
                }

                nodeDatumParamsScratch.datumIndex = datumIndex;
                nodeDatumParamsScratch.x = x;
                nodeDatumParamsScratch.width = width;
                nodeDatumParamsScratch.yStart = yStart;
                nodeDatumParamsScratch.yEnd = yEnd;
                nodeDatumParamsScratch.yRange = yRange;
                nodeDatumParamsScratch.featherRatio = 0;
                nodeDatumParamsScratch.opacity = 1;

                this.upsertNodeDatum(ctx, nodeDatumParamsScratch);
            }
        }
    }

    /**
     * Creates node data for simple (non-grouped) data processing.
     */
    private createNodeDataSimple(
        ctx: BarSeriesNodeDatumContext,
        xPosition: (index: number) => number,
        nodeDatumParamsScratch: NodeDatumParams
    ): void {
        const invalidData = this.processedData!.invalidData?.get(this.id);
        const width = ctx.barWidth;
        const visibleRange = this.visibleRangeIndices('xValue', ctx.xAxis.range);
        let start = visibleRange[0];
        let end = visibleRange[1];
        // @todo(AG-13575) Remove this if block
        if (this.processedData!.input.count < 1e3) {
            start = 0;
            end = this.processedData!.input.count;
        }

        for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
            if (invalidData?.[datumIndex] === true) continue;

            const yRawValue = ctx.yRawValues[datumIndex];
            if (yRawValue == null) continue;

            const x = xPosition(datumIndex);
            const yEnd = Number(yRawValue);

            nodeDatumParamsScratch.datumIndex = datumIndex;
            nodeDatumParamsScratch.x = x;
            nodeDatumParamsScratch.width = width;
            nodeDatumParamsScratch.yStart = 0;
            nodeDatumParamsScratch.yEnd = yEnd;
            nodeDatumParamsScratch.yRange = yEnd;
            nodeDatumParamsScratch.featherRatio = 0;
            nodeDatumParamsScratch.opacity = 1;

            this.upsertNodeDatum(ctx, nodeDatumParamsScratch);
        }
    }

    /**
     * Handles node creation/update - reuses existing nodes when possible for incremental updates.
     * This method decides whether to update existing nodes in-place or create new ones.
     */
    private upsertNodeDatum(ctx: BarSeriesNodeDatumContext, params: NodeDatumParams) {
        // Check if we can reuse existing nodes
        const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;
        const needsPhantom = ctx.yFilterValues != null;
        const canReusePhantom =
            needsPhantom && ctx.canIncrementallyUpdate && ctx.phantomIndex < ctx.phantomNodes.length;

        let nodeData: BarNodeDatum | undefined;
        let phantomNodeData: BarNodeDatum | undefined;
        if (canReuseNode) {
            // Reuse existing main node by updating in place
            nodeData = ctx.nodes[ctx.nodeIndex];
            this.updateNodeDatum(ctx, nodeData, params);
            // Update label reference (same node is used for labels)
            if (ctx.nodeIndex >= ctx.labels.length) {
                ctx.labels.push(nodeData);
            }
        } else {
            const result = this.createNodeDatum(ctx, params);
            if (result.nodeData) {
                ctx.nodes.push(result.nodeData);
                ctx.labels.push(result.nodeData);
            }
            phantomNodeData = result.phantomNodeData;
        }
        ctx.nodeIndex++;

        if (!needsPhantom) {
            return { nodeData: ctx.nodes[ctx.nodeIndex] };
        }

        if (canReusePhantom) {
            // Reuse existing phantom node by updating in place
            phantomNodeData = ctx.phantomNodes[ctx.phantomIndex];
            this.updateNodeDatum(ctx, phantomNodeData, params);
        } else if (phantomNodeData) {
            ctx.phantomNodes.push(phantomNodeData);
        } else {
            const result = this.createNodeDatum(ctx, params);
            if (result.phantomNodeData) {
                ctx.phantomNodes.push(result.phantomNodeData);
            }
        }
        ctx.phantomIndex++;

        return { nodeData, phantomNodeData };
    }

    createNodeData() {
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!this.dataModel || !this.processedData || !xAxis || !yAxis) return;

        // Create shared context for datum creation (instantiated once, reused for all datums)
        const ctx = this.createNodeDatumContext(xAxis, yAxis);
        if (!ctx) return;

        // Helper for x position calculation (uses context)
        const xPosition = (index: number): number => this.computeXPosition(ctx, index);

        // Scratch object for node datum parameters - avoid memory churn whilst minimizing parameter sprawl.
        const nodeDatumParamsScratch: NodeDatumParams = {
            nodeDatumScratch: {
                datum: undefined,
                xValue: undefined,
                yRawValue: 0,
                yFilterValue: undefined,
                labelText: undefined,
                inset: false,
                isPositive: false,
                precomputedBottomY: undefined,
                precomputedIsUpward: undefined,
            },
            datumIndex: 0,
            x: 0,
            width: 0,
            yStart: 0,
            yEnd: 0,
            yRange: 0,
            featherRatio: 0,
            opacity: 1,
        };

        if (ctx.dataAggregationFilter != null) {
            this.createNodeDataWithAggregation(ctx, xPosition, nodeDatumParamsScratch);
        } else if (this.processedData.type === 'grouped') {
            this.createNodeDataGrouped(ctx, xPosition, nodeDatumParamsScratch);
        } else {
            this.createNodeDataSimple(ctx, xPosition, nodeDatumParamsScratch);
        }

        // Trim excess nodes if we did incremental updates and have leftover nodes
        if (ctx.canIncrementallyUpdate) {
            if (ctx.nodeIndex < ctx.nodes.length) {
                ctx.nodes.length = ctx.nodeIndex;
            }
            if (ctx.phantomIndex < ctx.phantomNodes.length) {
                ctx.phantomNodes.length = ctx.phantomIndex;
            }
            // Labels array should match nodes array length
            if (ctx.labels.length > ctx.nodes.length) {
                ctx.labels.length = ctx.nodes.length;
            }
        }

        const segments = calculateSegments(
            this.properties.segmentation,
            ctx.xAxis,
            ctx.yAxis,
            this.chart!.seriesRect!,
            this.ctx.scene
        );

        return {
            itemId: this.properties.yKey,
            nodeData: ctx.nodes,
            phantomNodeData: ctx.phantomNodes,
            labelData: ctx.labels,
            scales: this.calculateScaling(),
            visible: this.visible || ctx.animationEnabled,
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
        if (!processedDataIsAnimatable(this.processedData!)) {
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
        const xDomain = dataModel.getDomain(this, `xValue`, 'key', processedData).domain;
        const yDomain = dataModel.getDomain(this, this.yCumulativeKey(dataModel), 'value', processedData).domain;

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
        const { itemStyler, simpleItemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);

        // Fast path: simpleItemStyler bypasses options graph resolution
        if (simpleItemStyler && processedData != null && datumIndex != null) {
            const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
            const overrides = simpleItemStyler(datum);
            return mergeDefaults(
                overrides,
                highlightStyle,
                this.getStyle(false, highlightState)
            ) as Required<AgBarSeriesStyle>;
        }

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
        const { drawingMode, isHighlight } = opts;

        const series = this;
        const contextStyles = contextNodeData.styles;

        function updateDatumNode(rect: BarShape, datum: BarNodeDatum): void {
            const style =
                datum.style ?? contextStyles[series.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];

            rect.setStyleProperties(style, fillBBox);

            const cornerRadius = style.cornerRadius ?? 0;
            const visible = categoryAlongX
                ? (datum.clipBBox?.width ?? datum.width) > 0
                : (datum.clipBBox?.height ?? datum.height) > 0;

            rect.setStaticProperties(
                drawingMode,
                datum.topLeftCornerRadius ? cornerRadius : 0,
                datum.topRightCornerRadius ? cornerRadius : 0,
                datum.bottomRightCornerRadius ? cornerRadius : 0,
                datum.bottomLeftCornerRadius ? cornerRadius : 0,
                visible,
                datum.crisp,
                shadow,
                direction,
                datum.featherRatio
            );
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
        // Use direct reset for phantom selection to bypass resetMotion callback overhead
        resetBarSelectionsDirect([data.datumSelection, this.phantomSelection]);
    }

    override animateReadyHighlight(data: Selection<BarShape<BarNodeDatum>, BarNodeDatum>) {
        // Use direct reset for phantom selection to bypass resetMotion callback overhead
        resetBarSelectionsDirect([data, this.phantomHighlightSelection]);
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
            this.properties.simpleItemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
