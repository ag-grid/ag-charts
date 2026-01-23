import {
    type AgCandlestickSeriesItemOptions,
    type AgOhlcSeriesItemOptions,
    type AgOhlcSeriesItemType,
    type FillOptions,
    type LineDashOptions,
    type StrokeOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import type { AgOhlcSeriesBaseOptions } from 'ag-charts-community';
import {
    AGGREGATION_INDEX_X_MAX,
    AGGREGATION_INDEX_X_MIN,
    AGGREGATION_INDEX_Y_MAX,
    AGGREGATION_INDEX_Y_MIN,
    AGGREGATION_SPAN,
    ChartAxisDirection,
    DebugMetrics,
    Logger,
    type Mutable,
    type Point,
    type Scale,
    mergeDefaults,
} from 'ag-charts-core';

import {
    type OhlcSeriesDataAggregationFilter,
    aggregateOhlcDataFromDataModel,
    aggregateOhlcDataFromDataModelPartial,
} from './ohlcAggregation';
import { OhlcBaseNode } from './ohlcNode';
import type { OhlcSeriesBaseProperties } from './ohlcSeriesProperties';

// Semantic constants for OHLC data access
const OPEN = AGGREGATION_INDEX_X_MIN;
const HIGH = AGGREGATION_INDEX_Y_MAX;
const LOW = AGGREGATION_INDEX_Y_MIN;
const CLOSE = AGGREGATION_INDEX_X_MAX;
const SPAN = AGGREGATION_SPAN;

const {
    AggregationManager,
    fixNumericExtent,
    keyProperty,
    createDatumId,
    SeriesNodePickMode,
    SMALLEST_KEY_INTERVAL,
    valueProperty,
    diff,
    animationValidation,
    computeBarFocusBounds,
    visibleRangeIndices,
    BandScale,
    processedDataIsAnimatable,
    getItemStylesPerItemId,
} = _ModuleSupport;

interface OhlcCandleStickSeriesStyle extends AgCandlestickSeriesItemOptions, AgOhlcSeriesItemOptions {}

export interface OhlcNodeDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly itemId?: never;
    readonly itemType: AgOhlcSeriesItemType;

    readonly openValue: number;
    readonly closeValue: number;
    readonly highValue?: number;
    readonly lowValue?: number;
    readonly aggregatedValue: number;

    readonly isRising: boolean;

    readonly centerX: number;
    readonly width: number;
    readonly y: number;
    readonly height: number;
    readonly yOpen: number;
    readonly yClose: number;

    readonly crisp: boolean;

    style?: Required<OhlcCandleStickSeriesStyle>;
}

class OhlcSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<OhlcNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: OhlcNodeDatum, series: OhlcSeriesBase<OhlcSeriesBaseTypes>) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.openKey = series.properties.openKey;
        this.closeKey = series.properties.closeKey;
        this.highKey = series.properties.highKey;
        this.lowKey = series.properties.lowKey;
    }
}

/**
 * Pre-validated and computed state for a single OHLC datum.
 * Used as a scratch object to minimize allocations in the main data loop.
 */
interface PreparedOhlcNodeDatumState {
    datum: any;
    xValue: any;
    openValue: number;
    closeValue: number;
    highValue: number;
    lowValue: number;
    isRising: boolean;
    itemType: 'up' | 'down';
}

/**
 * Shared context for creating/updating OhlcNodeDatum instances.
 * Instantiated once per createNodeData() call and reused across all datum operations
 * to minimize memory allocations. Only contains values that are expensive to compute
 * or resolve - cheap property lookups use `this` directly in methods.
 */
interface OhlcSeriesNodeDatumContext {
    // Data arrays (resolved from dataModel - worth caching)
    readonly rawData: any[];
    readonly xValues: any[];
    readonly openValues: any[];
    readonly closeValues: any[];
    readonly highValues: any[];
    readonly lowValues: any[];

    // Scales (axis lookups - worth caching)
    readonly xScale: Scale<any, any>;
    readonly yScale: Scale<any, any>;

    // Axes (for range calculations and other operations)
    readonly xAxis: _ModuleSupport.ChartAxis;
    readonly yAxis: _ModuleSupport.ChartAxis;

    // Pre-computed positioning values
    readonly barWidth: number;
    readonly groupOffset: number;
    readonly applyWidthOffset: boolean;
    readonly crisp: boolean;

    // Property lookups (constant across all datums - worth caching)
    readonly xKey: string;
    readonly openKey: string;
    readonly closeKey: string;
    readonly highKey: string;
    readonly lowKey: string;

    // Aggregation state
    readonly dataAggregationFilter: OhlcSeriesDataAggregationFilter | undefined;
    readonly range: number;

    // Scratch object for reuse (mutated in loops)
    readonly nodeDatumStateScratch: PreparedOhlcNodeDatumState;

    // Incremental update tracking
    readonly canIncrementallyUpdate: boolean;
    nodeIndex: number; // mutable - tracks current position

    // Working state (mutable)
    nodeData: OhlcNodeDatum[];
}

interface OhlcSeriesBaseNodeDataContext extends _ModuleSupport.AbstractBarSeriesNodeDataContext<OhlcNodeDatum> {
    styles: Record<'up' | 'down', _ModuleSupport.SeriesNodeStyleContext<OhlcCandleStickSeriesStyle>>;
}

/**
 * Base type interface for OHLC series types.
 * Template parameter TNode allows subclasses to specify their node type.
 */
export interface OhlcSeriesBaseTypes extends _ModuleSupport.AbstractBarSeriesTypes {
    readonly node: OhlcBaseNode<any>;
    readonly options: AgOhlcSeriesBaseOptions;
    readonly properties: OhlcSeriesBaseProperties<this['options']>;
    readonly datum: OhlcNodeDatum;
    readonly label: OhlcNodeDatum;
    readonly context: OhlcSeriesBaseNodeDataContext;
}

/**
 * High-performance direct reset for OHLC selections.
 * Bypasses resetMotion callback pattern and decorator system entirely.
 * Uses batchedUpdate to consolidate markDirty calls per selection.
 */
function resetOhlcSelectionsDirect<D extends OhlcNodeDatum>(
    selections: { nodes(): Iterable<OhlcBaseNode<D>>; cleanup(): void; batchedUpdate(fn: () => void): void }[]
): void {
    for (const selection of selections) {
        const nodes = selection.nodes();
        selection.batchedUpdate(function resetOhlcNodes() {
            for (const node of nodes) {
                const datum = node.datum;
                if (datum == null) continue;

                // Direct method bypasses decorators - writes to __centerX, __y, etc.
                node.setStaticProperties(
                    datum.centerX,
                    datum.width,
                    datum.y,
                    datum.height,
                    datum.yOpen,
                    datum.yClose,
                    datum.crisp
                );
            }
            // Important: cleanup garbage-collected nodes (same as resetMotion does)
            selection.cleanup();
        });
    }
}

export abstract class OhlcSeriesBase<
    TTypes extends OhlcSeriesBaseTypes,
> extends _ModuleSupport.AbstractBarSeries<TTypes> {
    protected override readonly NodeEvent = OhlcSeriesNodeEvent;

    private readonly aggregationManager = new AggregationManager<OhlcSeriesDataAggregationFilter>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.AXIS_ALIGNED, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            propertyKeys: {
                x: ['xKey'],
                y: ['lowKey', 'highKey', 'openKey', 'closeKey'],
            },
            propertyNames: {
                x: ['xName'],
                y: ['lowName', 'highName', 'openName', 'closeName'],
            },
            categoryKey: 'xValue',
            pathsPerSeries: [],
        });
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (!this.visible) return;

        const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        if (this.needsDataModelDiff() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }
        if (openKey) {
            extraProps.push(
                valueProperty(openKey, yScaleType, {
                    id: `openValue`,
                    invalidValue: undefined,
                    missingValue: undefined,
                })
            );
        }

        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(closeKey, yScaleType, { id: `closeValue` }),
                valueProperty(highKey, yScaleType, { id: `highValue` }),
                valueProperty(lowKey, yScaleType, { id: `lowValue` }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
        });

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;

        this.aggregateData(dataModel, processedData as any as _ModuleSupport.UngroupedData<any>);

        this.animationState.transition('updateData');
    }

    private aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.UngroupedData<any>
    ) {
        this.aggregationManager.markStale();

        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateOhlcDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateOhlcDataFromDataModel(xAxis.scale.type, dataModel, processedData, this, existingFilters),
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
        if (!xAxis) return -1;
        const [r0, r1] = xAxis.scale.range;
        return Math.abs(r1 - r0);
    }

    override getSeriesDomain(direction: ChartAxisDirection) {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return { domain: [] };

        if (direction !== this.getBarDirection()) {
            const { def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
            if (def.type === 'key' && def.valueType === 'category') {
                return keys;
            }
            return { domain: this.padBandExtent(keys.domain) };
        }

        const yExtent = this.domainForClippedRange(direction, ['highValue', 'lowValue'], 'xValue');
        return { domain: fixNumericExtent(yExtent) };
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [number, number]) {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['highValue', 'lowValue'], 'xValue', visibleRange);
    }

    override getZoomRangeFittingItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined {
        return this.zoomFittingVisibleItems(
            'xValue',
            ['highValue', 'lowValue'],
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
            ['highValue', 'lowValue'],
            xVisibleRange,
            yVisibleRange,
            minVisibleItems
        );
    }

    /**
     * Creates shared context for node datum creation/update operations.
     * This context is instantiated once and reused across all datum operations
     * to minimize memory allocations. Only caches values that are expensive to
     * compute - cheap property lookups use `this` directly.
     */
    private buildDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): OhlcSeriesNodeDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        if (rawData.length === 0) return undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const applyWidthOffset = BandScale.is(xScale);

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        // Ensure we have the aggregation level needed for the current range
        // This will force-compute deferred levels if necessary
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        const crisp = dataAggregationFilter == null;
        const canIncrementallyUpdate =
            this.contextNodeData?.nodeData != null &&
            (processedData.changeDescription != null ||
                !processedDataIsAnimatable(processedData) ||
                dataAggregationFilter != null);

        const { groupOffset, barWidth } = this.getBarDimensions();

        return {
            rawData,
            xValues: dataModel.resolveKeysById(this, 'xValue', processedData),
            openValues: dataModel.resolveColumnById(this, 'openValue', processedData),
            closeValues: dataModel.resolveColumnById(this, 'closeValue', processedData),
            highValues: dataModel.resolveColumnById(this, 'highValue', processedData),
            lowValues: dataModel.resolveColumnById(this, 'lowValue', processedData),
            xScale,
            yScale,
            xAxis,
            yAxis,
            groupOffset,
            barWidth,
            applyWidthOffset, // TODO: replace with barOffset?
            crisp,
            xKey: this.properties.xKey,
            openKey: this.properties.openKey,
            closeKey: this.properties.closeKey,
            highKey: this.properties.highKey,
            lowKey: this.properties.lowKey,
            dataAggregationFilter,
            range,
            nodeDatumStateScratch: {
                datum: undefined,
                xValue: undefined,
                openValue: 0,
                closeValue: 0,
                highValue: 0,
                lowValue: 0,
                isRising: true,
                itemType: 'up',
            },
            canIncrementallyUpdate,
            nodeIndex: 0,
            nodeData: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
        };
    }

    /**
     * Validates and prepares state for a single OHLC datum.
     * Mutates ctx.nodeDatumStateScratch with computed values.
     * Returns the scratch object if valid, undefined if invalid.
     */
    private prepareOhlcNodeDatumState(
        ctx: OhlcSeriesNodeDatumContext,
        datumIndex: number
    ): PreparedOhlcNodeDatumState | undefined {
        const xValue = ctx.xValues[datumIndex];
        if (xValue == null) {
            return undefined;
        }

        const openValue = ctx.openValues[datumIndex];
        const closeValue = ctx.closeValues[datumIndex];
        const highValue = ctx.highValues[datumIndex];
        const lowValue = ctx.lowValues[datumIndex];

        // Validate that low value is less than or equal to open and close
        const validLowValue = lowValue != null && lowValue <= openValue && lowValue <= closeValue;
        // Validate that high value is greater than or equal to open and close
        const validHighValue = highValue != null && highValue >= openValue && highValue >= closeValue;

        if (!validLowValue) {
            Logger.warnOnce(
                `invalid low value for key [${ctx.lowKey}] in data element, low value cannot be higher than datum open or close values`
            );
            return undefined;
        }

        if (!validHighValue) {
            Logger.warnOnce(
                `invalid high value for key [${ctx.highKey}] in data element, high value cannot be lower than datum open or close values.`
            );
            return undefined;
        }

        const datum = ctx.rawData[datumIndex];
        const isRising = closeValue > openValue;
        const itemType = isRising ? 'up' : 'down';

        // Mutate scratch object
        const scratch = ctx.nodeDatumStateScratch;
        scratch.datum = datum;
        scratch.xValue = xValue;
        scratch.openValue = openValue;
        scratch.closeValue = closeValue;
        scratch.highValue = highValue;
        scratch.lowValue = lowValue;
        scratch.isRising = isRising;
        scratch.itemType = itemType;

        return scratch;
    }

    /**
     * Creates a skeleton OhlcNodeDatum from prepared state.
     * Takes pre-computed positioning and state from scratch object.
     */
    private createSkeletonNodeDatum(
        ctx: OhlcSeriesNodeDatumContext,
        scratch: PreparedOhlcNodeDatumState,
        datumIndex: number,
        centerX: number,
        width: number,
        crisp: boolean
    ): OhlcNodeDatum {
        const xOffset = ctx.applyWidthOffset ? width / 2 : 0;
        const adjustedCenterX = centerX + xOffset;

        const yOpen = ctx.yScale.convert(scratch.openValue);
        const yClose = ctx.yScale.convert(scratch.closeValue);
        const yHigh = ctx.yScale.convert(scratch.highValue);
        const yLow = ctx.yScale.convert(scratch.lowValue);

        const y = Math.min(yHigh, yLow);
        const height = Math.max(yHigh, yLow) - y;

        return {
            series: this,
            itemType: scratch.itemType,
            datum: scratch.datum,
            datumIndex,
            xKey: ctx.xKey,
            xValue: scratch.xValue,
            openValue: scratch.openValue,
            closeValue: scratch.closeValue,
            highValue: scratch.highValue,
            lowValue: scratch.lowValue,
            midPoint: {
                x: adjustedCenterX,
                y: y + height / 2,
            },
            aggregatedValue: scratch.closeValue,
            isRising: scratch.isRising,
            centerX: adjustedCenterX,
            width,
            y,
            height,
            yOpen,
            yClose,
            crisp,
        };
    }

    /**
     * Updates an existing OhlcNodeDatum in-place for value-only changes.
     * This is more efficient than recreating the entire node when only data values change
     * but the structure (insertions/removals) remains the same.
     */
    private updateNodeDatum(
        ctx: OhlcSeriesNodeDatumContext,
        node: OhlcNodeDatum,
        prepared: PreparedOhlcNodeDatumState,
        datumIndex: number,
        centerX: number,
        width: number,
        crisp: boolean
    ): void {
        const mutableNode = node as Mutable<OhlcNodeDatum>;

        // Compute positioning
        const xOffset = ctx.applyWidthOffset ? width / 2 : 0;
        const adjustedCenterX = centerX + xOffset;

        const yOpen = ctx.yScale.convert(prepared.openValue);
        const yClose = ctx.yScale.convert(prepared.closeValue);
        const yHigh = ctx.yScale.convert(prepared.highValue);
        const yLow = ctx.yScale.convert(prepared.lowValue);

        const y = Math.min(yHigh, yLow);
        const height = Math.max(yHigh, yLow) - y;

        // Update all properties in-place
        mutableNode.datum = prepared.datum;
        mutableNode.datumIndex = datumIndex;
        mutableNode.itemType = prepared.itemType;
        mutableNode.xValue = prepared.xValue;
        mutableNode.openValue = prepared.openValue;
        mutableNode.closeValue = prepared.closeValue;
        mutableNode.highValue = prepared.highValue;
        mutableNode.lowValue = prepared.lowValue;
        mutableNode.aggregatedValue = prepared.closeValue;
        mutableNode.isRising = prepared.isRising;
        mutableNode.centerX = adjustedCenterX;
        mutableNode.width = width;
        mutableNode.y = y;
        mutableNode.height = height;
        mutableNode.yOpen = yOpen;
        mutableNode.yClose = yClose;
        mutableNode.crisp = crisp;

        // Update midPoint in place to avoid allocation
        const mutableMidPoint = mutableNode.midPoint as Mutable<Point>;
        mutableMidPoint.x = adjustedCenterX;
        mutableMidPoint.y = y + height / 2;
    }

    /**
     * Handles node creation/update - reuses existing nodes when possible for incremental updates.
     * This method decides whether to update existing nodes in-place or create new ones.
     */
    private upsertNodeDatum(
        ctx: OhlcSeriesNodeDatumContext,
        datumIndex: number,
        centerX: number,
        width: number,
        crisp: boolean
    ): void {
        const prepared = this.prepareOhlcNodeDatumState(ctx, datumIndex);
        if (!prepared) return;

        const canReuse = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodeData.length;

        if (canReuse) {
            // Update existing node in-place
            this.updateNodeDatum(ctx, ctx.nodeData[ctx.nodeIndex], prepared, datumIndex, centerX, width, crisp);
        } else {
            // Create new node
            const newNode = this.createSkeletonNodeDatum(ctx, prepared, datumIndex, centerX, width, crisp);
            ctx.nodeData.push(newNode);
        }
        ctx.nodeIndex++;
    }

    override createNodeData() {
        const { visible } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xAxis || !yAxis) return;

        // Create shared context for datum creation (instantiated once, reused for all datums)
        const ctx = this.buildDatumContext(xAxis, yAxis);

        const resultContext = {
            itemId: this.properties.xKey,
            nodeData: ctx?.nodeData ?? [],
            labelData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.ctx.seriesStateManager.getGroupScale(this)!),
            visible: this.visible,
            styles: getItemStylesPerItemId(this.getItemStyle.bind(this), 'up', 'down'),
        };

        if (!visible || !ctx) return resultContext;

        const xPosition = (index: number) => ctx.xScale.convert(ctx.xValues[index]) + ctx.groupOffset;

        if (ctx.dataAggregationFilter == null) {
            const invalidData = this.processedData!.invalidData?.get(this.id);
            let [start, end] = visibleRangeIndices(1, ctx.rawData.length, ctx.xAxis.range, (index) => {
                const xOffset = ctx.applyWidthOffset ? 0 : -ctx.barWidth / 2;
                const x = xPosition(index) + xOffset;
                return [x, x + ctx.barWidth];
            });
            // @todo(AG-13575) Remove this if block
            if (this.processedData!.input.count < 1e3) {
                start = 0;
                end = this.processedData!.input.count;
            }

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                if (invalidData?.[datumIndex] === true) continue;

                const centerX = xPosition(datumIndex);
                this.upsertNodeDatum(ctx, datumIndex, centerX, ctx.barWidth, ctx.crisp);
            }

            // Trim excess nodes if data shrunk
            if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodeData.length) {
                ctx.nodeData.length = ctx.nodeIndex;
            }
        } else {
            const { maxRange, indexData, midpointIndices } = ctx.dataAggregationFilter;
            const [start, end] = visibleRangeIndices(1, maxRange, ctx.xAxis.range, (index) => {
                const aggIndex = index * SPAN;
                const closeIndex = indexData[aggIndex + CLOSE];
                const midDatumIndex = midpointIndices[index];
                if (midDatumIndex === -1) return;
                const xOffset = ctx.applyWidthOffset ? 0 : -ctx.barWidth / 2;
                return [xPosition(midDatumIndex) + xOffset, xPosition(closeIndex) + xOffset + ctx.barWidth];
            });

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                const closeIndex = indexData[aggIndex + CLOSE];
                const highIndex = indexData[aggIndex + HIGH];
                const lowIndex = indexData[aggIndex + LOW];

                const midDatumIndex = midpointIndices[i];
                if (midDatumIndex === -1) continue;

                // Use prepareOhlcNodeDatumState to validate and prepare scratch state
                const prepared = this.prepareOhlcNodeDatumState(ctx, midDatumIndex);
                if (!prepared) continue;

                // Override values from aggregated indices
                prepared.openValue = ctx.openValues[openIndex];
                prepared.closeValue = ctx.closeValues[closeIndex];
                prepared.highValue = ctx.highValues[highIndex];
                prepared.lowValue = ctx.lowValues[lowIndex];
                prepared.isRising = prepared.closeValue > prepared.openValue;
                prepared.itemType = prepared.isRising ? 'up' : 'down';

                const centerX = xPosition(midDatumIndex);
                const width = Math.abs(xPosition(closeIndex) - xPosition(openIndex)) + ctx.barWidth;

                const canReuse = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodeData.length;

                if (canReuse) {
                    // Update existing node in-place
                    this.updateNodeDatum(
                        ctx,
                        ctx.nodeData[ctx.nodeIndex],
                        prepared,
                        midDatumIndex,
                        centerX,
                        width,
                        false
                    );
                } else {
                    // Create new node
                    const nodeDatum = this.createSkeletonNodeDatum(ctx, prepared, midDatumIndex, centerX, width, false);
                    ctx.nodeData.push(nodeDatum);
                }
                ctx.nodeIndex++;
            }

            // Trim excess nodes if data shrunk
            if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodeData.length) {
                ctx.nodeData.length = ctx.nodeIndex;
            }
        }

        return resultContext;
    }

    protected override isVertical(): boolean {
        return true;
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected override resetDatumAnimation(
        data: _ModuleSupport.CartesianAnimationData<
            TTypes['node'],
            OhlcNodeDatum,
            OhlcNodeDatum,
            OhlcSeriesBaseNodeDataContext
        >
    ) {
        // Use direct reset to bypass resetMotion callback overhead
        resetOhlcSelectionsDirect([data.datumSelection]);
    }

    protected override updateDatumSelection(opts: {
        nodeData: OhlcNodeDatum[];
        datumSelection: _ModuleSupport.Selection<TTypes['node'], OhlcNodeDatum>;
        seriesIdx: number;
    }) {
        const data = opts.nodeData ?? [];
        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to ensure we match up nodes by id.
            return opts.datumSelection.update(data);
        }
        return opts.datumSelection.update(data, undefined, (datum) => createDatumId(datum.xValue));
    }

    protected updateLabelNodes(_opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, OhlcNodeDatum>;
        seriesIdx: number;
    }) {
        // Labels unsupported
    }

    protected override updateLabelSelection(opts: {
        labelData: OhlcNodeDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, OhlcNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
    }

    protected getItemStyle(
        datumIndex: number | undefined,
        isHighlight: boolean,
        highlightState?: _ModuleSupport.HighlightState,
        itemType: 'up' | 'down' = 'up'
    ) {
        const { properties, dataModel, processedData } = this;
        const { itemStyler } = properties;

        const highlightStyle: FillOptions & StrokeOptions & LineDashOptions & { opacity?: number } =
            this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle(itemType));

        let style = baseStyle;

        if (itemStyler && dataModel != null && processedData != null && datumIndex != null) {
            const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
            const overrides = this.cachedDatumCallback(
                createDatumId(createDatumId(xValue), isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(itemType, datumIndex, isHighlight, style);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`, 'item', itemType],
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
        itemType: 'up' | 'down',
        datumIndex: number,
        isHighlight: boolean,
        style:
            | (Required<AgOhlcSeriesItemOptions> & { opacity: number })
            | (Required<AgCandlestickSeriesItemOptions> & { opacity: number })
    ) {
        const { id: seriesId, properties, processedData } = this;
        const { xKey, openKey, closeKey, highKey, lowKey } = properties;

        const datum = processedData!.dataSources.get(seriesId)?.data[datumIndex];
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);

        const params = {
            seriesId,
            datum,
            itemType,
            xKey,
            openKey,
            closeKey,
            highKey,
            lowKey,
            highlightState: highlightStateString,
            ...style,
        };

        if ('fill' in params && 'fill' in style) {
            params.fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;
        }

        return params;
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const {
            xKey,
            xName,
            yName,
            openKey,
            openName,
            highKey,
            highName,
            lowKey,
            lowName,
            closeKey,
            closeName,
            legendItemName,
            tooltip,
        } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const openValue = dataModel.resolveColumnById(this, `openValue`, processedData)[datumIndex];
        const highValue = dataModel.resolveColumnById(this, `highValue`, processedData)[datumIndex];
        const lowValue = dataModel.resolveColumnById(this, `lowValue`, processedData)[datumIndex];
        const closeValue = dataModel.resolveColumnById(this, `closeValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const itemType = closeValue >= openValue ? 'up' : 'down';
        const item = this.properties.item[itemType];

        const format = this.getItemStyle(datumIndex, false);

        const marker = {
            fill: item.fill ?? item.stroke,
            fillOpacity: item.fillOpacity ?? item.strokeOpacity ?? 1,
            stroke: item.stroke,
            strokeWidth: item.strokeWidth ?? 1,
            strokeOpacity: item.strokeOpacity ?? 1,
            lineDash: item.lineDash ?? [0],
            lineDashOffset: item.lineDashOffset ?? 0,
        };

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                title: legendItemName,
                symbol: {
                    marker,
                },
                data: [
                    {
                        label: openName,
                        fallbackLabel: openKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', openValue, datum, openKey, legendItemName),
                        missing: _ModuleSupport.isTooltipValueMissing(openValue),
                    },
                    {
                        label: highName,
                        fallbackLabel: highKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', highValue, datum, highKey, legendItemName),
                        missing: _ModuleSupport.isTooltipValueMissing(highValue),
                    },
                    {
                        label: lowName,
                        fallbackLabel: lowKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', lowValue, datum, lowKey, legendItemName),
                        missing: _ModuleSupport.isTooltipValueMissing(lowValue),
                    },
                    {
                        label: closeName,
                        fallbackLabel: closeKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', closeValue, datum, closeKey, legendItemName),
                        missing: _ModuleSupport.isTooltipValueMissing(closeValue),
                    },
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
                openKey,
                openName,
                highKey,
                highName,
                lowKey,
                lowName,
                closeKey,
                closeName,
                ...format,
            } as const
        );
    }

    override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        const nodeDatum = this.getNodeData()?.at(opts.datumIndex);
        if (nodeDatum == null) return;
        const { centerX, y, width, height } = nodeDatum;
        const datum = {
            x: centerX - width / 2,
            y: y,
            width: width,
            height: height,
        };
        return computeBarFocusBounds(this, datum);
    }
}
