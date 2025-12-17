import {
    type CallbackParamRules,
    ChartAxisDirection,
    type DomainWithMetadata,
    type LabelPlacement,
    type MeasuredLabel,
    type Mutable,
    type PlacedLabel,
    type Point,
    type RequireOptional,
    type Scale,
    type SizedPoint,
    cachedTextMeasurer,
    clamp,
    dateToNumber,
    extent,
    formatValue,
    isArray,
    measureTextSegments,
    rescaleVisibleRange,
    toPlainText,
} from 'ag-charts-core';
import {
    type AgBubbleSeriesItemStylerParams,
    type AgBubbleSeriesLabelFormatterParams,
    type AgBubbleSeriesOptions,
    type AgBubbleSeriesOptionsKeys,
    type AgBubbleSeriesStylerParams,
    type AgBubbleSeriesStylerResult,
    type AgDrawingMode,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgScatterSeriesItemStylerParams,
    type AgScatterSeriesStylerParams,
    type AgScatterSeriesStylerResult,
    type AgSeriesMarkerStyle,
    type FillOptions,
    type FormatterPropertyType,
    type LineDashOptions,
    type StrokeOptions,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { ContinuousScale } from '../../../scale/continuousScale';
import { LinearScale } from '../../../scale/linearScale';
import type { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { ChartAxis } from '../../chartAxis';
import type { DataController } from '../../data/dataController';
import { DataModel, type ProcessedData, fixNumericExtent } from '../../data/dataModel';
import { createDatumId, processedDataIsAnimatable, valueProperty } from '../../data/processors';
import { expandLabelPadding } from '../../label';
import { getLabelStyles } from '../../labelUtil';
import type { CategoryLegendDatum } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, type TooltipContentDataRow, isTooltipValueMissing } from '../../tooltip/tooltip';
import {
    type PickFocusInputs,
    type SeriesNodePickMatch,
    SeriesNodePickMode,
    type SeriesNodeStyleContext,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { HighlightState, toHighlightString } from '../seriesProperties';
import type { ErrorBoundSeriesNodeDatum, SeriesNodeEventTypes } from '../seriesTypes';
import {
    type BubbleAggregation,
    type BubbleAggregationOptions,
    aggregateBubbleDataFromDataModel,
    computeBubbleAggregationCount,
    computeBubbleAggregationData,
    computeBubbleAggregationDilation,
} from './bubbleAggregation';
import { BubbleSeriesProperties } from './bubbleSeriesProperties';
import {
    CartesianSeries,
    CartesianSeriesNodeEvent,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import type {
    CartesianAnimationDataOf,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
} from './cartesianSeriesTypes';
import {
    computeMarkerFocusBounds,
    getMarkerStyles,
    markerScaleInAnimation,
    resetMarkerFn,
    resetMarkerSelectionsDirect,
} from './markerUtil';
import { addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';

type BubbleScatterAnimationData = CartesianAnimationDataOf<BubbleSeriesTypes>;

class BubbleScatterSeriesNodeEvent<
    TEvent extends string = SeriesNodeEventTypes,
> extends CartesianSeriesNodeEvent<TEvent> {
    readonly sizeKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: BubbleScatterNodeDatum, series: BubbleSeries) {
        super(type, nativeEvent, datum, series);
        this.sizeKey = series.properties.sizeKey;
    }
}

export interface BubbleScatterNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly itemId: string;
    readonly point: Readonly<SizedPoint>;
    readonly sizeValue: any;
    readonly label: MeasuredLabel;
    readonly placement: LabelPlacement;
    readonly anchor: Point;
    readonly count: number;
    readonly dilation: number;
    readonly area: number;
    readonly selected: boolean | undefined;
    style?: AgSeriesMarkerStyle;
}

interface BubbleSeriesNodeDataContext
    extends CartesianSeriesNodeDataContext<BubbleScatterNodeDatum, BubbleScatterNodeDatum> {
    styles: SeriesNodeStyleContext<AgSeriesMarkerStyle>;
}

/**
 * Consolidated type interface for BubbleSeries.
 * Defines all type parameters in one place for the series.
 */
interface BubbleSeriesTypes {
    readonly node: Marker;
    readonly options: AgBubbleSeriesOptions;
    readonly properties: BubbleSeriesProperties;
    readonly datum: BubbleScatterNodeDatum;
    readonly label: BubbleScatterNodeDatum;
    readonly context: BubbleSeriesNodeDataContext;
    readonly stackContext: never;
}

/**
 * Context object cached once per createNodeData() call.
 * Avoids repeated property lookups and scale conversions in hot loops.
 */
interface BubbleSeriesNodeDatumContext {
    // Data arrays (resolved from dataModel - worth caching)
    readonly rawData: any[];
    readonly xDataValues: any[];
    readonly yDataValues: any[];
    readonly sizeDataValues: number[] | undefined;
    readonly labelDataValues: any[] | undefined;
    readonly xFilterDataValues: any[] | undefined;
    readonly yFilterDataValues: any[] | undefined;
    readonly sizeFilterDataValues: number[] | undefined;

    // Scales (axis lookups - worth caching)
    readonly xScale: Scale<any, any>;
    readonly yScale: Scale<any, any>;
    readonly sizeScale: Scale<any, number>;

    // Computed positioning (involves scale conversions - worth caching)
    readonly xOffset: number;
    readonly yOffset: number;

    // Property lookups (constant across all datums)
    readonly xKey: string;
    readonly yKey: string;
    readonly sizeKey: string | undefined;
    readonly labelKey: string | undefined;
    readonly xName: string | undefined;
    readonly yName: string | undefined;
    readonly sizeName: string | undefined;
    readonly labelName: string | undefined;
    readonly legendItemName: string | undefined;

    // Label properties
    readonly labelsEnabled: boolean;
    readonly labelPlacement: LabelPlacement;
    readonly labelAnchor: Point;
    readonly labelTextDomain: any[];
    readonly labelPadding: { left: number; right: number; top: number; bottom: number };
    readonly labelTextMeasurer: { measureLines: (text: string) => { width: number; height: number } };
    readonly label: BubbleSeriesProperties['label'];

    // Other state
    readonly animationEnabled: boolean;
    readonly visible: boolean;

    // Incremental update support
    readonly canIncrementallyUpdate: boolean;
    nodes: BubbleScatterNodeDatum[];
    nodeIndex: number;
}

/**
 * Scratch object for pre-computed datum state.
 * Mutated in-place during iteration to avoid allocations.
 */
interface PreparedBubbleNodeDatumState {
    // Raw values from data arrays
    datum: any;
    xDatum: any;
    yDatum: any;
    sizeValue: number | undefined;

    // Computed coordinates
    x: number;
    y: number;

    // Selection state
    selected: boolean | undefined;

    // Label data
    nodeLabel: MeasuredLabel;

    // Marker sizing
    markerSize: number;

    // Aggregation values
    count: number;
    dilation: number;
    area: number;
}

export class BubbleSeries extends CartesianSeries<BubbleSeriesTypes> {
    static override readonly className: string = 'BubbleSeries';
    static readonly type: string = 'bubble';

    protected override readonly NodeEvent = BubbleScatterSeriesNodeEvent;

    override properties = new BubbleSeriesProperties();

    private dataAggregation: BubbleAggregation | undefined = undefined;

    private readonly sizeScale = new LinearScale();

    private placedLabelData: PlacedLabel<BubbleScatterNodeDatum>[] = [];

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    override get type() {
        return super.type as 'bubble' | 'scatter';
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: {
                ...DEFAULT_CARTESIAN_DIRECTION_KEYS,
                label: ['labelKey'],
                size: ['sizeKey'],
            },
            propertyNames: {
                ...DEFAULT_CARTESIAN_DIRECTION_NAMES,
                label: ['labelName'],
                size: ['sizeName'],
            },
            categoryKey: undefined,
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: [],
            datumSelectionGarbageCollection: false,
            animationResetFns: {
                label: resetLabelFn,
                datum: resetMarkerFn,
            },
            usesPlacedLabels: true,
            clipFocusBox: false,
        });
    }

    override async processData(dataController: DataController) {
        if (this.data == null || !this.visible) return;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const sizeScaleType = this.sizeScale.type;
        const { xKey, yKey, sizeKey, xFilterKey, yFilterKey, sizeFilterKey, labelKey, marker } = this.properties;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(yKey, yScaleType, { id: `yValue` }),
                ...(xFilterKey == null ? [] : [valueProperty(xFilterKey, xScaleType, { id: `xFilterValue` })]),
                ...(yFilterKey == null ? [] : [valueProperty(yFilterKey, yScaleType, { id: `yFilterValue` })]),
                ...(sizeFilterKey == null
                    ? []
                    : [valueProperty(sizeFilterKey, sizeScaleType, { id: `sizeFilterValue` })]),
                ...(sizeKey ? [valueProperty(sizeKey, sizeScaleType, { id: `sizeValue` })] : []),
                ...(labelKey ? [valueProperty(labelKey, 'category', { id: `labelValue` })] : []),
            ],
        });

        const sizeKeyIdx = sizeKey ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`) : undefined;
        const mutableMarkerDomain: [number, number] | undefined = marker.domain
            ? [marker.domain[0], marker.domain[1]]
            : undefined;
        this.sizeScale.domain =
            mutableMarkerDomain ?? (sizeKeyIdx == null ? undefined : processedData.domain.values[sizeKeyIdx]) ?? [];

        this.dataAggregation = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(xValue: any, pixelSize: number, index: number): [number, number] {
        const { properties, sizeScale } = this;
        const { size, sizeKey } = properties;
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const sizeValues =
            sizeKey == null ? undefined : this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!);
        const sizeValue = sizeValues == null ? size : sizeScale.convert(sizeValues[index]);
        const r = 0.5 * sizeValue * pixelSize;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number, index: number): [number, number] {
        const { properties, sizeScale } = this;
        const { size, sizeKey } = properties;
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const sizeValues =
            sizeKey == null ? undefined : this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!);
        const sizeValue = sizeValues == null ? size : sizeScale.convert(sizeValues[index]);
        const r = 0.5 * sizeValue * pixelSize;
        return [y - r, y + r];
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return { domain: [] };

        const dataValues: { [K in ChartAxisDirection]?: string } = {
            [ChartAxisDirection.X]: 'xValue',
            [ChartAxisDirection.Y]: 'yValue',
        };

        const id = dataValues[direction]!;
        const dataDef = dataModel.resolveProcessedDataDefById(this, id);
        const domainData = dataModel.getDomain(this, id, 'value', processedData);
        if (dataDef?.def.type === 'value' && dataDef?.def.valueType === 'category') {
            return { domain: domainData.domain };
        }

        const crossDirection = direction === ChartAxisDirection.X ? ChartAxisDirection.Y : ChartAxisDirection.X;
        const crossId = dataValues[crossDirection]!;

        const ext = this.domainForClippedRange(direction, [id], crossId);
        return { domain: fixNumericExtent(extent(ext)) };
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yValue'], 'xValue', visibleRange);
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        const { dataAggregation, axes } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        if (dataAggregation == null || xAxis == null || yAxis == null) {
            return this.countVisibleItems('xValue', ['yValue'], xVisibleRange, yVisibleRange, minVisibleItems);
        }

        const aggregationOptions = this.aggregationOptions(xAxis, yAxis, xVisibleRange, yVisibleRange ?? [0, 1]);
        return computeBubbleAggregationCount(0, dataAggregation, aggregationOptions);
    }

    private aggregateData(dataModel: DataModel<any, any, true>, processedData: ProcessedData<any>) {
        if (processedData.type === 'grouped') return;
        if (processedData.input.count <= this.properties.maxRenderedItems) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];
        if (xAxis == null || yAxis == null) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        if (!ContinuousScale.is(xScale) || !ContinuousScale.is(yScale)) return;

        return aggregateBubbleDataFromDataModel(
            xScale.type,
            yScale.type,
            dataModel,
            processedData,
            this.sizeScale,
            this.properties.sizeKey != null,
            this
        );
    }

    private aggregationOptions(
        xAxis: ChartAxis,
        yAxis: ChartAxis,
        xVisibleRange: [number, number] = xAxis.visibleRange,
        yVisibleRange: [number, number] = yAxis.visibleRange
    ): BubbleAggregationOptions {
        const { processedData, dataModel } = this;
        const { sizeKey } = this.properties;
        const [markerSize, markerMaxSize] = this.getSizeRange();
        const xRange = Math.abs(xAxis.range[1] - xAxis.range[0]);
        const yRange = Math.abs(yAxis.range[1] - yAxis.range[0]);
        const minSize = Math.max(markerSize, 1);
        const maxSize = sizeKey ? Math.max(markerMaxSize, 1) : minSize;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        if (processedData != null && dataModel != null) {
            if (ContinuousScale.is(xScale)) {
                xVisibleRange = rescaleVisibleRange(
                    xVisibleRange,
                    xScale.domain.map(dateToNumber) as [number, number],
                    dataModel.getDomain(this, `xValue`, 'value', processedData).domain.map(dateToNumber) as [
                        number,
                        number,
                    ]
                );
            }
            if (ContinuousScale.is(yScale)) {
                yVisibleRange = rescaleVisibleRange(
                    yVisibleRange,
                    yScale.domain.map(dateToNumber) as [number, number],
                    dataModel.getDomain(this, `yValue`, 'value', processedData).domain.map(dateToNumber) as [
                        number,
                        number,
                    ]
                );
            }
        }

        return { xRange, yRange, minSize, maxSize, xVisibleRange, yVisibleRange };
    }

    /**
     * Creates and returns a context object that caches expensive property lookups
     * and scale conversions. Called once per createNodeData() invocation.
     */
    private createNodeDatumContext(xAxis: ChartAxis, yAxis: ChartAxis): BubbleSeriesNodeDatumContext | undefined {
        const { dataModel, processedData, sizeScale, visible } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources.get(this.id)?.data;
        if (rawData == null) return undefined;

        const {
            xKey,
            yKey,
            sizeKey,
            xFilterKey,
            yFilterKey,
            sizeFilterKey,
            labelKey,
            xName,
            yName,
            sizeName,
            labelName,
            label,
            legendItemName,
            marker,
        } = this.properties;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        // Determine if we can incrementally update existing nodes
        const canIncrementallyUpdate =
            processedData.changeDescription != null && this.contextNodeData?.nodeData != null;

        // Determine label text domain for formatting
        let labelTextDomain: any[];
        if (labelKey) {
            labelTextDomain = [];
        } else if (sizeKey) {
            labelTextDomain = dataModel.getDomain(this, `sizeValue`, 'value', processedData).domain;
        } else {
            labelTextDomain = [];
        }

        return {
            // Data arrays
            rawData,
            xDataValues: dataModel.resolveColumnById(this, `xValue`, processedData),
            yDataValues: dataModel.resolveColumnById(this, `yValue`, processedData),
            sizeDataValues:
                sizeKey == null ? undefined : dataModel.resolveColumnById<number>(this, `sizeValue`, processedData),
            labelDataValues:
                labelKey == null ? undefined : dataModel.resolveColumnById(this, `labelValue`, processedData),
            xFilterDataValues:
                xFilterKey == null ? undefined : dataModel.resolveColumnById(this, `xFilterValue`, processedData),
            yFilterDataValues:
                yFilterKey == null ? undefined : dataModel.resolveColumnById(this, `yFilterValue`, processedData),
            sizeFilterDataValues:
                sizeFilterKey == null
                    ? undefined
                    : dataModel.resolveColumnById<number>(this, `sizeFilterValue`, processedData),

            // Scales
            xScale,
            yScale,
            sizeScale,

            // Computed positioning
            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: (yScale.bandwidth ?? 0) / 2,

            // Property lookups
            xKey,
            yKey,
            sizeKey,
            labelKey,
            xName,
            yName,
            sizeName,
            labelName,
            legendItemName,

            // Label properties
            labelsEnabled: label.enabled,
            labelPlacement: label.placement,
            labelAnchor: Marker.anchor(marker.shape),
            labelTextDomain,
            labelPadding: expandLabelPadding(label),
            labelTextMeasurer: cachedTextMeasurer(label),
            label,

            // Other state
            animationEnabled: !this.ctx.animationManager.isSkipped(),
            visible,

            // Incremental update support
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
            nodeIndex: 0,
        };
    }

    override createNodeData() {
        const { axes } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis) return;

        // 1. Create shared context (instantiated once per createNodeData call)
        const ctx = this.createNodeDatumContext(xAxis, yAxis);
        if (!ctx) return;

        // 2. Set size scale range
        this.sizeScale.range = this.getSizeRange();

        // 3. Pre-allocate scratch object for datum state
        const scratch: PreparedBubbleNodeDatumState = {
            datum: undefined,
            xDatum: undefined,
            yDatum: undefined,
            sizeValue: undefined,
            x: 0,
            y: 0,
            selected: undefined,
            nodeLabel: { text: '', width: 0, height: 0 },
            markerSize: 0,
            count: 1,
            dilation: 1,
            area: 0,
        };

        // 4. Strategy selection - delegate to specialized methods
        if (ctx.visible) {
            const { dataAggregation } = this;
            if (dataAggregation == null) {
                this.createNodeDataSimple(ctx, scratch);
            } else {
                this.createNodeDataWithAggregation(ctx, scratch, xAxis, yAxis, dataAggregation);
            }
        }

        // 5. Cleanup: trim excess nodes from incremental updates
        if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length) {
            ctx.nodes.length = ctx.nodeIndex;
        }

        // 6. Return result
        const { marker } = this.properties;
        type StylerResult = AgBubbleSeriesStylerResult | AgScatterSeriesStylerResult | undefined;
        type StylerParams =
            | AgBubbleSeriesStylerParams<unknown, unknown>
            | AgScatterSeriesStylerParams<unknown, unknown>;
        type ItemStylerParams =
            | AgBubbleSeriesItemStylerParams<unknown, unknown>
            | AgScatterSeriesItemStylerParams<unknown, unknown>;
        return {
            itemId: ctx.yKey,
            nodeData: ctx.nodes,
            labelData: ctx.labelsEnabled ? ctx.nodes : [],
            scales: this.calculateScaling(),
            visible: this.visible || ctx.animationEnabled,
            styles: getMarkerStyles<StylerParams, StylerResult, ItemStylerParams>(this, this.properties, marker),
        };
    }

    /**
     * Simple iteration path for ungrouped data without aggregation.
     */
    private createNodeDataSimple(ctx: BubbleSeriesNodeDatumContext, scratch: PreparedBubbleNodeDatumState): void {
        const dataLength = ctx.rawData.length;
        for (let datumIndex = 0; datumIndex < dataLength; datumIndex++) {
            scratch.count = 1;
            scratch.dilation = 1;
            scratch.area = 0;
            this.upsertNodeDatum(ctx, scratch, datumIndex);
        }
    }

    /**
     * Aggregation path for large datasets using quadtree-based 2D spatial aggregation.
     */
    private createNodeDataWithAggregation(
        ctx: BubbleSeriesNodeDatumContext,
        scratch: PreparedBubbleNodeDatumState,
        xAxis: ChartAxis,
        yAxis: ChartAxis,
        dataAggregation: BubbleAggregation
    ): void {
        const { maxRenderedItems } = this.properties;
        const aggregationOptions = this.aggregationOptions(xAxis, yAxis);
        const aggregationDilation = computeBubbleAggregationDilation(
            dataAggregation,
            aggregationOptions,
            maxRenderedItems
        );

        const { groupedAggregation, singleDatumIndices } = computeBubbleAggregationData(
            aggregationDilation,
            dataAggregation,
            aggregationOptions
        );

        for (const { datumIndex, count, dilation, area } of groupedAggregation) {
            scratch.count = count;
            scratch.dilation = dilation;
            scratch.area = area;
            this.upsertNodeDatum(ctx, scratch, datumIndex);
        }
        for (const datumIndex of singleDatumIndices) {
            scratch.count = 1;
            scratch.dilation = 1;
            scratch.area = 0;
            this.upsertNodeDatum(ctx, scratch, datumIndex);
        }
    }

    /**
     * Decision point: reuse existing node or create new one.
     * Centralizes the incremental update logic.
     */
    private upsertNodeDatum(
        ctx: BubbleSeriesNodeDatumContext,
        scratch: PreparedBubbleNodeDatumState,
        datumIndex: number
    ): void {
        const prepared = this.prepareNodeDatumState(ctx, scratch, datumIndex);
        if (!prepared) return;

        const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

        if (canReuseNode) {
            // Update existing node in-place
            this.updateNodeDatum(ctx, ctx.nodes[ctx.nodeIndex], scratch, datumIndex);
        } else {
            // Create new node
            const nodeData = this.createSkeletonNodeDatum(ctx, scratch, datumIndex);
            this.updateNodeDatum(ctx, nodeData, scratch, datumIndex);
            ctx.nodes.push(nodeData);
        }
        ctx.nodeIndex++;
    }

    /**
     * Validates and prepares state needed for node creation/update.
     * Returns undefined if datum should be skipped (invalid data).
     */
    private prepareNodeDatumState(
        ctx: BubbleSeriesNodeDatumContext,
        scratch: PreparedBubbleNodeDatumState,
        datumIndex: number
    ): PreparedBubbleNodeDatumState | undefined {
        const datum = ctx.rawData[datumIndex];
        const xDatum = ctx.xDataValues[datumIndex];
        const yDatum = ctx.yDataValues[datumIndex];

        // Skip invalid data points
        if (xDatum == null || yDatum == null) return undefined;

        const sizeValue = ctx.sizeDataValues?.[datumIndex];
        const x = ctx.xScale.convert(xDatum) + ctx.xOffset;
        const y = ctx.yScale.convert(yDatum) + ctx.yOffset;

        // Compute selection state
        let selected: boolean | undefined;
        if (ctx.xFilterDataValues != null && ctx.yFilterDataValues != null) {
            selected = ctx.xFilterDataValues[datumIndex] === xDatum && ctx.yFilterDataValues[datumIndex] === yDatum;
            if (ctx.sizeFilterDataValues != null) {
                selected &&= ctx.sizeFilterDataValues[datumIndex] === sizeValue;
            }
        }

        // Compute label (skip expensive formatting if labels disabled)
        let nodeLabel: MeasuredLabel;
        if (ctx.labelsEnabled) {
            nodeLabel = this.computeLabel(ctx, datum, yDatum, sizeValue, datumIndex);
        } else {
            nodeLabel = { text: '', width: 0, height: 0 };
        }

        // Compute marker size
        const markerSize = sizeValue == null ? ctx.sizeScale.range[0] : ctx.sizeScale.convert(sizeValue);

        // Populate scratch object
        scratch.datum = datum;
        scratch.xDatum = xDatum;
        scratch.yDatum = yDatum;
        scratch.sizeValue = sizeValue;
        scratch.x = x;
        scratch.y = y;
        scratch.selected = selected;
        scratch.nodeLabel = nodeLabel;
        scratch.markerSize = markerSize;

        return scratch;
    }

    /**
     * Computes label text and measurements for a datum.
     * Separated to enable skipping when labels are disabled.
     */
    private computeLabel(
        ctx: BubbleSeriesNodeDatumContext,
        datum: any,
        yDatum: any,
        sizeValue: number | undefined,
        datumIndex: number
    ): MeasuredLabel {
        let labelTextValue: any;
        let labelTextKey: string;
        let labelTextProperty: FormatterPropertyType;

        if (ctx.labelKey && ctx.labelDataValues) {
            labelTextValue = ctx.labelDataValues[datumIndex];
            labelTextKey = ctx.labelKey;
            labelTextProperty = 'label';
        } else if (ctx.sizeKey) {
            labelTextValue = sizeValue;
            labelTextKey = ctx.sizeKey;
            labelTextProperty = 'size';
        } else {
            labelTextValue = yDatum;
            labelTextKey = ctx.yKey;
            labelTextProperty = 'y';
        }

        const labelText = this.getLabelText<AgBubbleSeriesLabelFormatterParams>(
            labelTextValue,
            datum,
            labelTextKey,
            labelTextProperty,
            ctx.labelTextDomain,
            ctx.label,
            {
                value: labelTextValue,
                datum,
                xKey: ctx.xKey,
                yKey: ctx.yKey,
                // sizeKey may be undefined for ScatterSeries (which extends BubbleSeries)
                sizeKey: ctx.sizeKey!,
                labelKey: ctx.labelKey,
                xName: ctx.xName,
                yName: ctx.yName,
                sizeName: ctx.sizeName,
                labelName: ctx.labelName,
                legendItemName: ctx.legendItemName,
            }
        );

        let { width, height } = isArray(labelText)
            ? measureTextSegments(labelText, ctx.label)
            : ctx.labelTextMeasurer.measureLines(String(labelText));

        width += ctx.labelPadding.left + ctx.labelPadding.right;
        height += ctx.labelPadding.bottom + ctx.labelPadding.top;

        return { text: labelText, width, height };
    }

    /**
     * Creates a minimal skeleton node - actual values set by updateNodeDatum.
     */
    private createSkeletonNodeDatum(
        ctx: BubbleSeriesNodeDatumContext,
        _scratch: PreparedBubbleNodeDatumState,
        _datumIndex: number
    ): BubbleScatterNodeDatum {
        return {
            series: this,
            itemId: ctx.yKey,
            yKey: ctx.yKey,
            xKey: ctx.xKey,
            datum: undefined,
            datumIndex: 0,
            xValue: undefined,
            yValue: undefined,
            sizeValue: undefined,
            capDefaults: { lengthRatioMultiplier: this.properties.marker.getDiameter(), lengthMax: Infinity },
            point: { x: 0, y: 0, size: 0 },
            midPoint: { x: 0, y: 0 },
            label: { text: '', width: 0, height: 0 },
            anchor: ctx.labelAnchor,
            placement: ctx.labelPlacement,
            count: 1,
            dilation: 1,
            area: 0,
            selected: undefined,
        };
    }

    /**
     * Updates node properties in-place.
     * Shared by both create (skeleton + update) and incremental update paths.
     */
    private updateNodeDatum(
        ctx: BubbleSeriesNodeDatumContext,
        node: BubbleScatterNodeDatum,
        scratch: PreparedBubbleNodeDatumState,
        datumIndex: number
    ): void {
        const mutableNode = node as Mutable<BubbleScatterNodeDatum>;
        const { x, y, markerSize, dilation } = scratch;

        // Update basic properties
        mutableNode.datum = scratch.datum;
        mutableNode.datumIndex = datumIndex;
        mutableNode.xValue = scratch.xDatum;
        mutableNode.yValue = scratch.yDatum;
        mutableNode.sizeValue = scratch.sizeValue;
        mutableNode.selected = scratch.selected;
        mutableNode.count = scratch.count;
        mutableNode.dilation = scratch.dilation;
        mutableNode.area = scratch.area;
        mutableNode.label = scratch.nodeLabel;
        mutableNode.anchor = ctx.labelAnchor;
        mutableNode.placement = ctx.labelPlacement;

        // Update point in-place
        const mutablePoint = mutableNode.point as Mutable<SizedPoint>;
        mutablePoint.x = x;
        mutablePoint.y = y;
        mutablePoint.size = Math.sqrt(dilation) * markerSize;

        // Update midPoint in-place
        const mutableMidPoint = mutableNode.midPoint as Mutable<Point>;
        mutableMidPoint.x = x;
        mutableMidPoint.y = y;
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    override getLabelData() {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    protected override updateDatumSelection(opts: {
        nodeData: BubbleScatterNodeDatum[];
        datumSelection: Selection<Marker, BubbleScatterNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;

        if (this.properties.marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        // Skip datum ID computation when animation is not supported (large datasets)
        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id.
            return datumSelection.update(nodeData);
        }

        const { sizeKey } = this.properties;
        let getId: ((datum: BubbleScatterNodeDatum) => string) | undefined;
        if (sizeKey) {
            getId = (datum) =>
                createDatumId(datum.xValue, datum.yValue, datum.sizeValue, toPlainText(datum.label.text));
        }
        return datumSelection.update(nodeData, undefined, getId);
    }

    override updateDatumStyles(opts: {
        datumSelection: Selection<Marker, BubbleScatterNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        const params = { xKey, yKey, sizeKey, labelKey };

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        datumSelection.each((node, datum) => {
            if (!datumSelection.isGarbage(node)) {
                const highlightState = this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex);
                const stylerStyle = this.getStyle(highlightState);
                datum.style = this.getMarkerStyle(
                    marker,
                    datum,
                    params,
                    {
                        isHighlight,
                        highlightState,
                        resolveMarkerSubPath: [],
                    },
                    stylerStyle
                );
            }
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<Marker, BubbleScatterNodeDatum>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) return;
        const { datumSelection, isHighlight, drawingMode } = opts;

        this.sizeScale.range = this.getSizeRange();
        const fillBBox = this.getShapeFillBBox();

        const aggregated = this.dataAggregation != null;

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        datumSelection.each((node, datum, index) => {
            const {
                point: { size },
                count,
                area,
                dilation,
            } = datum;
            let style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];

            style = { ...style };
            style.size = size;

            if (dilation > 1) {
                const fillOpacity = style.fillOpacity ?? 0;
                // See /tools/bubble-aggregation
                const opacityScale =
                    0.269669 +
                    0.000683 * count +
                    -37.534348 * area +
                    0.004449 * count * area +
                    -0 * count ** 2 +
                    44.428603 * area ** 2;
                style.fillOpacity = clamp(fillOpacity / dilation, (fillOpacity / 0.1) * opacityScale, 1);
            }

            this.applyMarkerStyle(style, node, datum.point, fillBBox, { selected: datum.selected });
            node.drawingMode = drawingMode;
            node.zIndex = aggregated ? [-count, index] : 0;
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    public override updatePlacedLabelData(labelData: PlacedLabel<BubbleScatterNodeDatum>[]) {
        this.placedLabelData = labelData;
        this.labelSelection.update(
            labelData.map((v) => ({
                ...v.datum,
                point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                },
            })),
            (text) => {
                text.pointerEvents = PointerEvents.None;
            }
        );
        this.updateLabelNodes({ labelSelection: this.labelSelection });
        this.updateHighlightLabelSelection();
    }

    private updateHighlightLabelSelection() {
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightItem =
            this.isSeriesHighlighted(highlightedDatum) && highlightedDatum?.datum
                ? (highlightedDatum as BubbleScatterNodeDatum)
                : undefined;

        const highlightLabelData =
            highlightItem == null
                ? []
                : this.placedLabelData
                      .filter((label) => label.datum.datumIndex === highlightItem.datumIndex)
                      .map((label) => ({
                          ...label.datum,
                          point: {
                              x: label.x,
                              y: label.y,
                              size: label.datum.point.size,
                          },
                      }));

        this.highlightLabelSelection =
            this.updateLabelSelection({
                labelData: highlightLabelData,
                labelSelection: this.highlightLabelSelection,
            }) ?? this.highlightLabelSelection;

        this.highlightLabelGroup.visible = highlightLabelData.length > 0;
        this.highlightLabelGroup.batchedUpdate(() => {
            this.updateLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });
        });
    }

    protected updateLabelNodes(opts: {
        labelSelection: Selection<Text, BubbleScatterNodeDatum>;
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const params: AgBubbleSeriesLabelFormatterParams = this.makeLabelFormatterParams();

        opts.labelSelection.each((text, datum) => {
            const style = getLabelStyles(this, datum, params, this.properties.label, isHighlight, activeHighlight);
            text.text = datum.label.text;
            text.fill = style.color;
            text.x = datum.point?.x ?? 0;
            text.y = datum.point?.y ?? 0;
            text.fontStyle = style.fontStyle;
            text.fontWeight = style.fontWeight;
            text.fontSize = style.fontSize;
            text.fontFamily = style.fontFamily;
            text.textBaseline = 'top';
            text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
            text.setBoxing(style);
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: BubbleScatterNodeDatum[];
        labelSelection: Selection<Text, BubbleScatterNodeDatum>;
    }): Selection<Text, BubbleScatterNodeDatum> {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    makeStylerParams(
        highlightStateEnum?: HighlightState
    ): AgBubbleSeriesStylerParams<unknown, unknown> | AgScatterSeriesStylerParams<unknown, unknown> {
        const {
            id: seriesId,
            properties: {
                size,
                maxSize,
                shape,
                fill,
                fillOpacity,
                lineDash,
                lineDashOffset,
                stroke,
                strokeOpacity,
                strokeWidth,
                xKey,
                yKey,
                sizeKey,
                labelKey,
            },
        } = this;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        if (this.type === 'bubble') {
            type ResultRules = CallbackParamRules<AgBubbleSeriesStylerParams<unknown, unknown>>;
            return {
                highlightState,
                size,
                maxSize,
                shape,
                fill,
                fillOpacity,
                lineDash,
                lineDashOffset,
                seriesId,
                sizeKey,
                stroke,
                strokeOpacity,
                strokeWidth,
                xKey,
                yKey,
                labelKey,
            } satisfies ResultRules;
        } else if (this.type === 'scatter') {
            type ResultRules = CallbackParamRules<AgScatterSeriesStylerParams<unknown, unknown>>;
            return {
                highlightState,
                size,
                shape,
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
                labelKey,
            } satisfies ResultRules;
        } else {
            // verify that the else branch is unreachable.
            return this.type satisfies never;
        }
    }

    private makeLabelFormatterParams(): AgBubbleSeriesLabelFormatterParams {
        const { xKey, xName, yKey, yName, sizeKey, sizeName, labelKey, labelName, legendItemName } = this.properties;
        return {
            xKey,
            xName,
            yKey,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            legendItemName,
        } satisfies RequireOptional<AgBubbleSeriesLabelFormatterParams>;
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties, ctx } = this;
        const { formatManager } = ctx;
        const {
            xKey,
            xName,
            yKey,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            title,
            tooltip,
            marker,
            legendItemName,
        } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const data: TooltipContentDataRow[] = [];

        if (this.isLabelEnabled() && labelKey != null) {
            const value = dataModel.resolveColumnById<number>(this, `labelValue`, processedData)[datumIndex];
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'category',
                value,
                datum,
                seriesId,
                legendItemName,
                key: labelKey,
                source: 'tooltip',
                property: 'label',
                domain: [],
                boundSeries: this.getFormatterContext('label'),
            });
            data.push({ label: labelName, fallbackLabel: labelKey, value: content ?? formatValue(value) });
        }

        data.push(
            {
                label: xName,
                fallbackLabel: xKey,
                value: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                missing: isTooltipValueMissing(xValue),
            },
            {
                label: yName,
                fallbackLabel: yKey,
                value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, legendItemName),
                missing: isTooltipValueMissing(yValue),
            }
        );

        if (sizeKey != null) {
            const value = dataModel.resolveColumnById<number>(this, `sizeValue`, processedData)[datumIndex];
            // Only add size row if value is not null/undefined
            if (value != null) {
                const domain = dataModel.getDomain(this, `sizeValue`, 'value', processedData).domain;
                const content = formatManager.format(this.callWithContext.bind(this), {
                    type: 'number',
                    value,
                    datum,
                    seriesId,
                    legendItemName,
                    key: sizeKey,
                    source: 'tooltip',
                    property: 'size',
                    boundSeries: this.getFormatterContext('size'),
                    domain,
                    fractionDigits: undefined,
                });
                data.push({ label: sizeName, fallbackLabel: sizeKey, value: content ?? formatValue(value) });
            }
        }

        const activeStyle = this.getMarkerStyle(
            marker,
            { datum, datumIndex },
            { xKey, yKey, sizeKey, labelKey },
            { resolveMarkerSubPath: [] }
        );

        return this.formatTooltipWithContext(
            tooltip,
            {
                title,
                symbol: this.legendItemSymbol(),
                data,
            },
            {
                seriesId,
                datum,
                title: yKey,
                xKey,
                xName,
                yKey,
                yName,
                sizeKey,
                sizeName,
                labelKey,
                labelName,
                legendItemName,
                ...(activeStyle as RequireOptional<FillOptions & StrokeOptions & LineDashOptions>),
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const style = this.getStyle();
        const marker = this.getMarkerStyle<AgBubbleSeriesOptionsKeys>(
            this.properties.marker,
            {},
            undefined,
            {
                isHighlight: false,
                checkForHighlight: false,
                resolveMarkerSubPath: [],
            },
            style satisfies RequireOptional<AgSeriesMarkerStyle>
        );
        return {
            marker,
        };
    }

    getLegendData(): CategoryLegendDatum[] {
        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { yKey: itemId, yName, legendItemName, title, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: legendItemName ?? title ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            },
        ];
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: BubbleScatterAnimationData) {
        markerScaleInAnimation(this, this.ctx.animationManager, datumSelection);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    protected override resetDatumAnimation(data: BubbleScatterAnimationData): void {
        // Use direct reset to bypass resetMotion callback overhead
        resetMarkerSelectionsDirect([data.datumSelection]);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Marker();
    }

    public getStyle(highlightState?: HighlightState): Required<AgBubbleSeriesStylerResult> {
        const { properties } = this;

        let stylerResult: AgBubbleSeriesStylerResult = {};
        if (properties.styler) {
            const stylerParams = this.makeStylerParams(highlightState);
            const cbResult = this.cachedCallWithContext(properties.styler, stylerParams) ?? {};
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            stylerResult = resolved ?? {};
        }

        return {
            fill: stylerResult.fill ?? properties.fill!,
            fillOpacity: stylerResult.fillOpacity ?? properties.fillOpacity,
            lineDash: stylerResult.lineDash ?? properties.lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? properties.lineDashOffset,
            shape: stylerResult.shape ?? properties.shape,
            size: stylerResult.size ?? properties.size,
            maxSize: stylerResult.maxSize ?? properties.maxSize,
            stroke: stylerResult.stroke ?? properties.stroke!,
            strokeOpacity: stylerResult.strokeOpacity ?? properties.strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? properties.strokeWidth,
        };
    }

    public getSizeRange(): [number, number] {
        const { size, maxSize } = this.getStyle();
        return [size, maxSize];
    }

    public getFormattedMarkerStyle(datum: BubbleScatterNodeDatum) {
        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        return this.getMarkerStyle(marker, datum, { xKey, yKey, sizeKey, labelKey }, { resolveMarkerSubPath: [] });
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        const { styler, itemStyler, marker, label } = this.properties;
        return !!(styler ?? itemStyler ?? marker.itemStyler ?? label.itemStyler);
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<BubbleScatterNodeDatum>) {
        addHitTestersToQuadtree(quadtree, this.datumNodesIter());
    }

    protected override pickNodeDataClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }
}
