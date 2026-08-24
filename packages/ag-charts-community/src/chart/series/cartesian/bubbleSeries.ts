import type { DynamicContext, NormalisedSeriesMarkerStyle } from 'ag-charts-core';
import {
    type BoxBounds,
    type CallbackParamRules,
    type CandidateStyleResolver,
    ChartAxisDirection,
    type DomainWithMetadata,
    type FitRegionMask,
    type LabelFit,
    type LabelFitDescriptor,
    type LabelPlacement,
    type MeasuredLabel,
    type Mutable,
    type PlacedLabel,
    type Point,
    type RequireOptional,
    type SizedPoint,
    applyStyledMarkerSize,
    cachedTextMeasurer,
    clamp,
    dateToNumber,
    extent,
    findDiscreteColorBinLabel,
    formatValue,
    insetFitRegion,
    maskFitRegion,
    measurePlacedLabel,
    placedLabelFit,
    rescaleVisibleRange,
    resolveLabelFit,
    resolveSeriesLabelDefaults,
    toArray,
    toNumber,
    toPlainText,
    withFitRegion,
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
    type AgNumericValue,
    type AgScatterSeriesItemStylerParams,
    type AgScatterSeriesStylerParams,
    type AgScatterSeriesStylerResult,
    type FillOptions,
    type FormatterPropertyType,
    type LineDashOptions,
    type StrokeOptions,
} from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import { configureColorScale } from '../../../scale/colorScaleUtil';
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
import { expandPlacementLabelBoxExtent, placedLabelTextOffset, styledLabelTextOffset } from '../../label';
import {
    boundLabelFit,
    compassCandidatePlacement,
    createCandidateStyleResolver,
    getLabelStyles,
    pickPlacementStyle,
} from '../../labelUtil';
import {
    type CategoryLegendDatum,
    type ChartLegendType,
    type GradientLegendDatum,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
} from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type MarkerLabelRect, markerLabelRect, markerRowSpans } from '../../marker/markerLabelRect';
import { type TooltipContent, type TooltipContentDataRow, isTooltipValueMissing } from '../../tooltip/tooltip';
import { IndexSetBucketLookupManager } from '../bucketLookupFeature';
import {
    type MarkerStyleApply,
    type MarkerStyleCompute,
    type PickFocusInputs,
    type SeriesNodePickMatch,
    SeriesNodePickMode,
    type SeriesNodeStyleContext,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { toHighlightString, toSelectionString } from '../seriesProperties';
import {
    type BucketLookupFeature,
    type ErrorBoundSeriesNodeDatum,
    HighlightState,
    type SelectionState,
} from '../seriesTypes';
import {
    type BubbleAggregation,
    type BubbleAggregationOptions,
    aggregateBubbleDataFromDataModel,
    computeBubbleAggregationCount,
    computeBubbleAggregationData,
    computeBubbleAggregationDilation,
} from './bubbleAggregation';
import { BubbleScatterSeriesProperties, BubbleSeriesProperties } from './bubbleSeriesProperties';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import type {
    CartesianAnimationDataOf,
    CartesianMarkerLikeContext,
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
    CartesianSeriesTypes,
} from './cartesianSeriesTypes';
import { upsertNodeDatum } from './cartesianSeriesUtil';
import {
    computeMarkerFocusBounds,
    getMarkerStyles,
    markerScaleInAnimation,
    resetMarkerFn,
    resetMarkerSelectionsDirect,
} from './markerUtil';
import { addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';

type BubbleScatterAnimationData = CartesianAnimationDataOf<BubbleSeriesTypes>;

/** Per-pass context for the no-itemStyler / no-colorScale marker-style pass. */
interface BubbleNoStylerPassCtx {
    marker: BubbleScatterSeriesProperties['marker'];
    params: { xKey: string; yKey: string; sizeKey?: string; labelKey?: string; colorKey?: string };
    isHighlight: boolean;
}

/** Per-pass context for the itemStyler / colorScale marker-style pass. */
interface BubbleStylerPassCtx extends BubbleNoStylerPassCtx {
    colorScaleValid: boolean;
    colorKey: string | undefined;
}

type BubbleNoStylerCompute = MarkerStyleCompute<
    BubbleSeries,
    BubbleNoStylerPassCtx,
    BubbleScatterNodeDatum,
    NormalisedSeriesMarkerStyle
>;
type BubbleNoStylerApply = MarkerStyleApply<
    BubbleSeries,
    BubbleNoStylerPassCtx,
    BubbleScatterNodeDatum,
    NormalisedSeriesMarkerStyle
>;
type BubbleStylerCompute = MarkerStyleCompute<
    BubbleSeries,
    BubbleStylerPassCtx,
    BubbleScatterNodeDatum,
    ReturnType<BubbleSeries['getStyle']>
>;
type BubbleStylerApply = MarkerStyleApply<
    BubbleSeries,
    BubbleStylerPassCtx,
    BubbleScatterNodeDatum,
    ReturnType<BubbleSeries['getStyle']>
>;

export interface BubbleScatterNodeDatum extends CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly sizeValue: any;
    readonly colorValue: any;
    readonly label: MeasuredLabel;
    /** Per-candidate fit inputs, so a styled label is re-measured under the font its styler resolves. */
    readonly fit: LabelFitDescriptor | undefined;
    /** Marker diameter a `marker.itemStyler` resolved; overrides `point.size` for the label's geometry. */
    markerSize?: number;
    readonly placement: LabelPlacement;
    readonly anchor: Point;
    readonly insideOffset: Point | undefined;
    readonly insideSize: { width: number; height: number } | undefined;
    /** Series-area rect a label must fit within; a label overflowing it fails collision containment. */
    readonly region?: BoxBounds;
    readonly count: number;
    readonly dilation: number;
    readonly area: number;
    // WARNING! This selected-state is related to cross-filtering which is not an officially documented or supported
    // feature. It has nothing to do with the official data selection API in the options contract. Do not use, or use
    // with extreme caution.
    readonly crossFilterSelected: boolean | undefined;
    style?: NormalisedSeriesMarkerStyle;
}

interface BubbleSeriesNodeDataContext extends CartesianSeriesNodeDataContext<
    BubbleScatterNodeDatum,
    BubbleScatterNodeDatum
> {
    styles: SeriesNodeStyleContext<NormalisedSeriesMarkerStyle>;
}

/**
 * Consolidated type interface for BubbleSeries.
 * Defines all type parameters in one place for the series.
 */
interface BubbleSeriesTypes extends CartesianSeriesTypes {
    readonly node: Marker<BubbleScatterNodeDatum>;
    readonly options: AgBubbleSeriesOptions;
    readonly properties: BubbleScatterSeriesProperties;
    readonly datum: BubbleScatterNodeDatum;
    readonly label: BubbleScatterNodeDatum;
    readonly context: BubbleSeriesNodeDataContext;
    readonly stackContext: never;
    readonly createNodeDataContext: BubbleSeriesNodeDatumContext;
}

/** Context object caching expensive lookups for createNodeData(). */
interface BubbleSeriesNodeDatumContext extends CartesianMarkerLikeContext<BubbleScatterNodeDatum> {
    // Override yKey to be required (base interface has it optional)
    readonly yKey: string;

    // Data arrays (BubbleSeries-specific naming - resolved from dataModel)
    readonly xDataValues: any[];
    readonly yDataValues: any[];
    readonly sizeDataValues: number[] | undefined;
    readonly labelDataValues: any[] | undefined;
    readonly crossFilterSelectedDataValues: boolean[] | undefined;
    readonly colorDataValues: number[] | undefined;

    // Additional scale (size is BubbleSeries-specific)
    readonly sizeScale: ContinuousScale<AgNumericValue>;

    // Property lookups (BubbleSeries-specific)
    readonly sizeKey: string | undefined;
    readonly labelKey: string | undefined;
    readonly colorKey: string | undefined;
    readonly sizeName: string | undefined;
    readonly labelName: string | undefined;
    readonly colorName: string | undefined;
    readonly legendItemName: string | undefined;

    // Label properties
    readonly labelsEnabled: boolean;
    readonly labelPlacement: LabelPlacement;
    readonly labelAnchor: Point;
    readonly labelInsideOffset: Point | undefined;
    readonly labelInsideRect: MarkerLabelRect | undefined;
    /** The marker outline the label's text is bounded by, rather than the rect inscribed in it. */
    readonly labelInsideMask: FitRegionMask | undefined;
    readonly labelInsideSize: { width: number; height: number } | undefined;
    readonly labelTextDomain: any[];
    readonly labelPadding: { left: number; right: number; top: number; bottom: number };
    readonly labelTextMeasurer: { measureLines: (text: string) => { width: number; height: number } };
    readonly labelFit: LabelFit | undefined;
    /**
     * Policy without the marker container, applied when {@link labelFit} leaves nothing to draw. Set only
     * when the label must survive that, so leaving it unset keeps an erased label erased.
     */
    readonly labelFitOverflow: LabelFit | undefined;
    /** The label's geometry is resolved per candidate placement by an `itemStyler`. */
    readonly labelStyled: boolean;
    readonly label: BubbleScatterSeriesProperties['label'];
    readonly plotRegion: BoxBounds | undefined;

    // Other state
    readonly visible: boolean;
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
    colorValue: number | undefined;

    // Computed coordinates
    x: number;
    y: number;

    // Cross-Filter (undocumented) Selection state
    crossFilterSelected: boolean | undefined;

    // Label data
    nodeLabel: MeasuredLabel;
    nodeLabelFit: LabelFitDescriptor | undefined;

    // Marker sizing
    markerSize: number;

    // Aggregation values
    count: number;
    dilation: number;
    area: number;
}

function ascending([v0, v1]: [number, number]): [number, number] {
    return v0 <= v1 ? [v0, v1] : [v1, v0];
}

/**
 * A single-valued data domain has no extent to rescale into — every datum collapses onto one
 * aggregation ratio, so the whole axis counts as visible rather than a zero-width NaN window.
 */
function rescaleAggregationVisibleRange(
    visibleRange: [number, number],
    scaleDomain: [number, number],
    dataDomain: [number, number]
): [number, number] {
    const dataSpan = dataDomain[1] - dataDomain[0];
    return dataSpan > 0 ? rescaleVisibleRange(visibleRange, scaleDomain, dataDomain) : [0, 1];
}

export class BubbleSeries extends CartesianSeries<BubbleSeriesTypes> {
    static override readonly className: string = 'BubbleSeries';
    static readonly type: string = 'bubble';

    override createNodeParams(datum: BubbleScatterNodeDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
            sizeKey: this.properties.sizeKey,
            colorKey: this.properties.colorKey,
        };
    }

    override properties: BubbleScatterSeriesProperties = new BubbleSeriesProperties();

    private dataAggregation: BubbleAggregation | undefined = undefined;
    private aggregateIndexSet: Map<number, number[]> | undefined = undefined;

    private readonly sizeScale = new LinearScale();
    readonly colorScale = new ColorScale();
    private colorScaleValid = false;

    private placedLabelData: PlacedLabel<BubbleScatterNodeDatum>[] = [];

    override get pickModeAxis() {
        return 'main-category' as const;
    }

    override get type() {
        return super.type as 'bubble' | 'scatter';
    }

    constructor(moduleCtx: DynamicContext<ChartRegistry>) {
        super({
            moduleCtx,
            propertyKeys: {
                ...DEFAULT_CARTESIAN_DIRECTION_KEYS,
                label: ['labelKey'],
                size: ['sizeKey'],
                color: ['colorKey'],
            },
            propertyNames: {
                ...DEFAULT_CARTESIAN_DIRECTION_NAMES,
                label: ['labelName'],
                size: ['sizeName'],
                color: ['colorName'],
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
        const colorScaleType = this.colorScale.type;
        const { xKey, yKey, sizeKey, selectedKey, labelKey, colorKey, marker } = this.properties;
        const allowNullKey = this.properties.allowNullKeys ?? false;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: `xValue`, allowNullKey }),
                valueProperty(yKey, yScaleType, { id: `yValue`, allowNullKey }),
                ...(selectedKey == null ? [] : [valueProperty(selectedKey, 'category', { id: `selectedValue` })]),
                ...(sizeKey ? [valueProperty(sizeKey, sizeScaleType, { id: `sizeValue` })] : []),
                ...(labelKey ? [valueProperty(labelKey, 'category', { id: `labelValue` })] : []),
                ...(colorKey
                    ? [valueProperty(colorKey, colorScaleType, { id: `colorValue`, invalidValue: undefined })]
                    : []),
            ],
        });

        const sizeKeyIdx = sizeKey ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`) : undefined;
        const mutableMarkerDomain: [AgNumericValue, AgNumericValue] | undefined = marker.sizeDomain
            ? [marker.sizeDomain[0], marker.sizeDomain[1]]
            : undefined;
        this.sizeScale.domain =
            mutableMarkerDomain ?? (sizeKeyIdx == null ? undefined : processedData.domain.values[sizeKeyIdx]) ?? [];

        this.colorScaleValid = false;
        if (colorKey) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            const rawDomain = processedData.domain.values[colorKeyIdx].filter((v: any) => v != null);
            const domain = extent(rawDomain);

            if (domain != null) {
                configureColorScale(this.colorScale, this.properties.colorScale, domain, this.ctx.logger);
                this.colorScaleValid = true;
            }
        }

        this.dataAggregation = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    private isColorScaleValid() {
        return this.colorScaleValid;
    }

    private resolveScaledSize(index: number): number {
        const { properties, sizeScale } = this;
        const { sizeKey, marker } = properties;
        if (sizeKey == null) return marker.size;
        const sizeValues = this.dataModel!.resolveColumnById(this, `sizeValue`, this.processedData!, 'number');
        const sizeValue = sizeValues[index];
        return sizeValue == null ? this.getSizeRange()[0] : sizeScale.convertClamped(sizeValue);
    }

    override xCoordinateRange(xValue: any, pixelSize: number, index: number): [number, number] {
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const r = 0.5 * this.resolveScaledSize(index) * pixelSize;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number, index: number): [number, number] {
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const r = 0.5 * this.resolveScaledSize(index) * pixelSize;
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

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [number, number]): [number, number] {
        // domainForVisibleRange may yield a bigint; narrow once for this number-typed range contract.
        const [y0, y1] = this.domainForVisibleRange(ChartAxisDirection.Y, ['yValue'], 'xValue', visibleRange);
        return [toNumber(y0), toNumber(y1)];
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

    protected override createBucketLookupFeature(): BucketLookupFeature {
        return new IndexSetBucketLookupManager({
            series: this,
            dataSelectionService: this.ctx.dataSelectionService,
            getIndexSetMap: () => this.aggregateIndexSet,
        });
    }

    private aggregateData(dataModel: DataModel<any, any, true>, processedData: ProcessedData<any>) {
        if (processedData.type === 'grouped') return;
        const renderableCount = processedData.input.count - this.invalidDataCount() - this.missingDataCount();
        if (renderableCount <= this.properties.maxRenderedItems) return;

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
                xVisibleRange = rescaleAggregationVisibleRange(
                    xVisibleRange,
                    xScale.domain.map(dateToNumber) as [number, number],
                    dataModel.getDomain(this, `xValue`, 'value', processedData).domain.map(dateToNumber) as [
                        number,
                        number,
                    ]
                );
            }
            if (ContinuousScale.is(yScale)) {
                yVisibleRange = rescaleAggregationVisibleRange(
                    yVisibleRange,
                    yScale.domain.map(dateToNumber) as [number, number],
                    dataModel.getDomain(this, `yValue`, 'value', processedData).domain.map(dateToNumber) as [
                        number,
                        number,
                    ]
                );
            }
        }

        // A reversed axis reverses its scale domain, so the rescaled visible range comes back
        // descending; the quadtree cull assumes an ascending [min, max] window.
        return {
            xRange,
            yRange,
            minSize,
            maxSize,
            xVisibleRange: ascending(xVisibleRange),
            yVisibleRange: ascending(yVisibleRange),
        };
    }

    /**
     * Creates and returns a context object that caches expensive property lookups
     * and scale conversions. Called once per createNodeData() invocation.
     */
    protected override createNodeDatumContext(
        xAxis: ChartAxis,
        yAxis: ChartAxis
    ): BubbleSeriesNodeDatumContext | undefined {
        const { dataModel, processedData, sizeScale, visible } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources.get(this.id)?.data;
        if (rawData == null) return undefined;

        const {
            xKey,
            yKey,
            sizeKey,
            selectedKey,
            labelKey,
            colorKey,
            xName,
            yName,
            sizeName,
            labelName,
            colorName,
            label,
            legendItemName,
            marker,
        } = this.properties;

        const placements = toArray(label.placement);
        // Only fit to the marker when `inside` is the sole placement; a mixed fallback list keeps
        // full-size text and lets the engine reject an oversized inside candidate (via insideSize)
        // so a directional fallback isn't constrained to the marker.
        const insideOnly = placements.length > 0 && placements.every((placement) => placement === 'inside');
        const insideRect = placements.includes('inside') ? markerLabelRect(marker.shape) : undefined;
        const collideWith = label.collision.resolveCollideWith();
        const labelFit = resolveLabelFit(label, !label.collision.alwaysShow, insideOnly);

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

        const xDataValues = dataModel.resolveColumnById(this, `xValue`, processedData, 'object');

        return {
            // Axes (from template method parameters)
            xAxis,
            yAxis,

            // Data arrays
            rawData,
            xValues: xDataValues, // Base interface field
            xDataValues, // BubbleSeries-specific alias
            yDataValues: dataModel.resolveColumnById(this, `yValue`, processedData, 'object'),
            sizeDataValues:
                sizeKey == null ? undefined : dataModel.resolveColumnById(this, `sizeValue`, processedData, 'number'),
            labelDataValues:
                labelKey == null ? undefined : dataModel.resolveColumnById(this, `labelValue`, processedData, 'object'),
            crossFilterSelectedDataValues:
                selectedKey == null
                    ? undefined
                    : dataModel.resolveColumnById(this, `selectedValue`, processedData, 'boolean'),
            colorDataValues:
                colorKey == null ? undefined : dataModel.resolveColumnById(this, `colorValue`, processedData, 'number'),

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
            colorKey,
            xName,
            yName,
            sizeName,
            labelName,
            colorName,
            legendItemName,

            // Label properties
            labelsEnabled: label.enabled,
            labelPlacement: placements[0],
            labelAnchor: Marker.anchor(marker.shape),
            labelInsideOffset: insideRect ? { x: insideRect.cx, y: insideRect.cy } : undefined,
            // Truncation container applies only when `inside` is the sole placement; a mixed list
            // measures full text so directional fallbacks aren't constrained to the marker.
            labelInsideRect: insideOnly ? insideRect : undefined,
            labelInsideMask: insideOnly ? markerRowSpans(marker.shape) : undefined,
            labelInsideSize:
                !insideOnly && insideRect ? { width: insideRect.width, height: insideRect.height } : undefined,
            labelTextDomain,
            labelPadding: expandPlacementLabelBoxExtent(label),
            labelTextMeasurer: cachedTextMeasurer(label),
            labelFit,
            // Keeps the label on a marker too small to hold even an ellipsis.
            labelFitOverflow: insideOnly && label.collision.alwaysShow ? labelFit : undefined,
            labelStyled: label.itemStyler != null,
            label,
            // The series-area clamp is opt-in via `collideWith.seriesArea`. Inside-only labels are
            // additionally exempt: fitted to and centred on their marker, an edge marker's label rides
            // with the point, so only directional placements can spill past the series area.
            plotRegion: insideOnly || !collideWith.seriesArea ? undefined : this.getSeriesPlotRegion(),

            // Other state
            animationEnabled: !this.ctx.animationManager.isSkipped(),
            visible,

            // Incremental update support
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
            nodeIndex: 0,
        };
    }

    // ============================================================================
    // Template Method Hooks
    // ============================================================================

    /**
     * Populates the node data array by iterating over visible data.
     * Strategy selection happens inside: simple or aggregation path.
     */
    protected override populateNodeData(ctx: BubbleSeriesNodeDatumContext): void {
        // Set size scale range
        this.sizeScale.range = this.getSizeRange();

        // Pre-allocate scratch object for datum state
        const scratch: PreparedBubbleNodeDatumState = {
            datum: undefined,
            xDatum: undefined,
            yDatum: undefined,
            sizeValue: undefined,
            colorValue: undefined,
            x: 0,
            y: 0,
            crossFilterSelected: undefined,
            nodeLabel: { text: '', width: 0, height: 0 },
            nodeLabelFit: undefined,
            markerSize: 0,
            count: 1,
            dilation: 1,
            area: 0,
        };

        this.aggregateIndexSet = undefined;

        // Strategy selection - delegate to specialized methods
        const { dataAggregation } = this;
        if (dataAggregation == null) {
            this.createNodeDataSimple(ctx, scratch);
        } else {
            this.createNodeDataWithAggregation(ctx, scratch, ctx.xAxis, ctx.yAxis, dataAggregation);
        }
    }

    /**
     * Initializes the result context object with default values.
     * Called before populate phase to allow early return for invisible series.
     */
    protected override initializeResult(ctx: BubbleSeriesNodeDatumContext): BubbleSeriesNodeDataContext {
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
     * Validates datum state and upserts node - centralizes duplicated upsert pattern.
     */
    private upsertBubbleNodeDatum(
        ctx: BubbleSeriesNodeDatumContext,
        scratch: PreparedBubbleNodeDatumState,
        datumIndex: number
    ): void {
        if (!this.prepareNodeDatumState(ctx, scratch, datumIndex)) return;
        upsertNodeDatum(
            ctx,
            { scratch, datumIndex },
            (c, p) => {
                const node = this.createSkeletonNodeDatum(c, p.scratch, p.datumIndex);
                this.updateNodeDatum(c, node, p.scratch, p.datumIndex);
                return node;
            },
            (c, n, p) => this.updateNodeDatum(c, n, p.scratch, p.datumIndex)
        );
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
            this.upsertBubbleNodeDatum(ctx, scratch, datumIndex);
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

        const aggregateIndexSet = new Map<number, number[]>();
        for (const { datumIndex, count, dilation, area, indices } of groupedAggregation) {
            scratch.count = count;
            scratch.dilation = dilation;
            scratch.area = area;
            aggregateIndexSet.set(datumIndex, indices);
            this.upsertBubbleNodeDatum(ctx, scratch, datumIndex);
        }
        this.aggregateIndexSet = aggregateIndexSet.size > 0 ? aggregateIndexSet : undefined;

        for (const datumIndex of singleDatumIndices) {
            scratch.count = 1;
            scratch.dilation = 1;
            scratch.area = 0;
            this.upsertBubbleNodeDatum(ctx, scratch, datumIndex);
        }
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

        // Skip invalid data points (unless allowNullKeys is enabled)
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if ((xDatum === undefined || yDatum === undefined) && !allowNullKeys) return undefined;

        const sizeValue = ctx.sizeDataValues?.[datumIndex];
        const x = ctx.xScale.convert(xDatum) + ctx.xOffset;
        const y = ctx.yScale.convert(yDatum) + ctx.yOffset;

        if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;

        const crossFilterSelected = ctx.crossFilterSelectedDataValues?.[datumIndex];

        // Compute marker size
        const markerSize = sizeValue == null ? ctx.sizeScale.range[0] : ctx.sizeScale.convertClamped(sizeValue);

        // Compute label (skip expensive formatting if labels disabled)
        if (ctx.labelsEnabled) {
            const markerPixelSize = ctx.labelPlacement === 'inside' ? Math.sqrt(scratch.dilation) * markerSize : 0;
            this.computeLabel(ctx, scratch, datum, yDatum, sizeValue, datumIndex, markerPixelSize);
        } else {
            scratch.nodeLabel = { text: '', width: 0, height: 0 };
            scratch.nodeLabelFit = undefined;
        }

        const colorValue = ctx.colorDataValues?.[datumIndex];

        // Populate scratch object
        scratch.datum = datum;
        scratch.xDatum = xDatum;
        scratch.yDatum = yDatum;
        scratch.sizeValue = sizeValue;
        scratch.colorValue = colorValue;
        scratch.x = x;
        scratch.y = y;
        scratch.crossFilterSelected = crossFilterSelected;
        scratch.markerSize = markerSize;

        return scratch;
    }

    /**
     * Computes label text and measurements for a datum.
     * Separated to enable skipping when labels are disabled.
     */
    private computeLabel(
        ctx: BubbleSeriesNodeDatumContext,
        scratch: PreparedBubbleNodeDatumState,
        datum: any,
        yDatum: any,
        sizeValue: number | undefined,
        datumIndex: number,
        markerSize: number
    ): void {
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
                colorKey: ctx.colorKey,
                colorName: ctx.colorName,
                legendItemName: ctx.legendItemName,
            }
        );

        const rect = ctx.labelInsideRect;
        const threshold = ctx.label.collision.threshold ?? 0;
        const container = rect
            ? {
                  width: Math.max(0, markerSize * rect.width - 2 * threshold),
                  height: Math.max(0, markerSize * rect.height - 2 * threshold),
              }
            : undefined;
        const region =
            ctx.labelInsideMask == null || rect == null
                ? undefined
                : insetFitRegion(
                      maskFitRegion(ctx.labelInsideMask, markerSize, {
                          x: rect.cx * markerSize,
                          y: rect.cy * markerSize,
                      }),
                      threshold,
                      threshold
                  );
        // The marker's outline bounds the width; the inscribed rect still bounds the height, anchors the
        // label at its centre via `labelInsideOffset`, and carries the collision threshold's inset.
        const boundedFit =
            region == null
                ? boundLabelFit(ctx.labelFit, container)
                : withFitRegion(
                      boundLabelFit(ctx.labelFit, { width: Infinity, height: container?.height ?? Infinity }),
                      region
                  );
        scratch.nodeLabel = measurePlacedLabel(labelText, ctx.label, ctx, boundedFit);
        // The marker container is per datum, so the fit the engine re-applies per candidate must carry
        // this datum's bound rather than the series-level policy.
        scratch.nodeLabelFit = placedLabelFit(labelText, ctx.label, ctx, boundedFit);
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
            yKey: ctx.yKey,
            xKey: ctx.xKey,
            datum: undefined,
            datumIndex: 0,
            xValue: undefined,
            yValue: undefined,
            sizeValue: undefined,
            colorValue: undefined,
            capDefaults: { lengthRatioMultiplier: this.properties.marker.getDiameter(), lengthMax: Infinity },
            point: { x: 0, y: 0, size: 0 },
            midPoint: { x: 0, y: 0 },
            label: { text: '', width: 0, height: 0 },
            fit: undefined,
            anchor: ctx.labelAnchor,
            insideOffset: ctx.labelInsideOffset,
            insideSize: ctx.labelInsideSize,
            region: ctx.plotRegion,
            placement: ctx.labelPlacement,
            count: 1,
            dilation: 1,
            area: 0,
            crossFilterSelected: undefined,
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
        mutableNode.colorValue = scratch.colorValue;
        mutableNode.crossFilterSelected = scratch.crossFilterSelected;
        mutableNode.count = scratch.count;
        mutableNode.dilation = scratch.dilation;
        mutableNode.area = scratch.area;
        mutableNode.label = scratch.nodeLabel;
        mutableNode.fit = scratch.nodeLabelFit;
        mutableNode.anchor = ctx.labelAnchor;
        mutableNode.insideOffset = ctx.labelInsideOffset;
        mutableNode.insideSize = ctx.labelInsideSize;
        mutableNode.region = ctx.plotRegion;
        mutableNode.placement = ctx.labelPlacement;

        // Update point in-place
        const mutablePoint = mutableNode.point;
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
        const labelData = this.contextNodeData?.labelData ?? [];
        // A marker itemStyler resolves its size after node data was built, so the styled size is stamped
        // on here — the label's obstacles, gap and inside-marker rect all scale off the drawn marker.
        if (this.properties.marker.itemStyler != null) {
            for (const datum of labelData) {
                applyStyledMarkerSize(datum, datum.style?.size);
            }
        }
        return labelData;
    }

    override getLabelDefaults() {
        const { label } = this.properties;
        return resolveSeriesLabelDefaults(label.collision, toArray(label.placement), label.spacing);
    }

    override getLabelCandidateStyler(): CandidateStyleResolver | undefined {
        return createCandidateStyleResolver(
            this,
            this.properties.label,
            this.makeLabelFormatterParams(),
            compassCandidatePlacement
        );
    }

    protected override updateDatumSelection(opts: {
        nodeData: BubbleScatterNodeDatum[];
        datumSelection: Selection<BubbleScatterNodeDatum, Marker<BubbleScatterNodeDatum>>;
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

    private static readonly computeNoStylerMarkerTemplate: BubbleNoStylerCompute = (
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
            ctx.params,
            { isHighlight: ctx.isHighlight, highlightState, selectionState, resolveMarkerSubPath: [] },
            { ...stylerStyle, size: datum.point.size }
        );
    };

    private static readonly applyNoStylerTemplate: BubbleNoStylerApply = (_series, _ctx, datum, _h, _s, template) => {
        // Reuse the cached object directly when size matches (e.g. ScatterSeries with fixed size).
        datum.style = template.size === datum.point.size ? template : { ...template, size: datum.point.size };
    };

    private static readonly computePerDatumStylerStyle: BubbleStylerCompute = (series, _ctx, highlightState) => {
        return series.getStyle(highlightState);
    };

    private static readonly applyPerDatumStyle: BubbleStylerApply = (
        series,
        ctx,
        datum,
        highlightState,
        selectionState,
        stylerStyle
    ) => {
        if (ctx.colorScaleValid && datum.colorValue != null) {
            stylerStyle.fill = series.colorScale.convert(datum.colorValue);
        } else if (
            ctx.colorKey != null &&
            datum.colorValue == null &&
            series.properties.colorScale.missingDataFill != null
        ) {
            stylerStyle.fill = series.properties.colorScale.missingDataFill;
        }
        datum.style = series.getMarkerStyle(
            ctx.marker,
            datum,
            ctx.params,
            { isHighlight: ctx.isHighlight, highlightState, selectionState, resolveMarkerSubPath: [] },
            { ...stylerStyle, size: datum.point.size }
        );
    };

    override updateDatumStyles(opts: {
        datumSelection: Selection<BubbleScatterNodeDatum, Marker<BubbleScatterNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { xKey, yKey, sizeKey, labelKey, colorKey, marker } = this.properties;
        const colorScaleValid = this.isColorScaleValid();
        const params = { xKey, yKey, sizeKey, labelKey, colorKey };

        if (marker.itemStyler == null && !colorScaleValid) {
            // No itemStyler / colour-scale: only datum.point.size varies per datum, so cache a
            // per-state template and splice the size in at apply time.
            this.runMarkerStylePass<
                BubbleNoStylerPassCtx,
                BubbleScatterNodeDatum,
                NormalisedSeriesMarkerStyle,
                BubbleSeries
            >(
                datumSelection,
                isHighlight,
                { marker, params, isHighlight },
                {
                    compute: BubbleSeries.computeNoStylerMarkerTemplate,
                    apply: BubbleSeries.applyNoStylerTemplate,
                }
            );
            return;
        }

        // colorKey forces cacheable=false: applyPerDatumStyle mutates stylerStyle.fill per datum.
        this.runMarkerStylePass<
            BubbleStylerPassCtx,
            BubbleScatterNodeDatum,
            ReturnType<BubbleSeries['getStyle']>,
            BubbleSeries
        >(
            datumSelection,
            isHighlight,
            { marker, params, isHighlight, colorScaleValid, colorKey },
            {
                cacheable: colorKey == null,
                compute: BubbleSeries.computePerDatumStylerStyle,
                apply: BubbleSeries.applyPerDatumStyle,
            }
        );
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<BubbleScatterNodeDatum, Marker<BubbleScatterNodeDatum>>;
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
        // resolveMarkerDrawingMode only inspects `style` when the base mode is 'cutout'; for every
        // other mode it returns the input unchanged. Hoist that constant out of the per-marker loop.
        const constantDrawingMode = drawingMode === 'cutout' ? undefined : drawingMode;

        datumSelection.each((node, datum, index) => {
            const {
                point: { size },
                count,
                area,
                dilation,
            } = datum;
            const state = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const style = datum.style == null ? { ...contextNodeData.styles[state], size } : { ...datum.style };

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

            this.applyMarkerStyle(style, node, datum.point, fillBBox, {
                crossFilterSelected: datum.crossFilterSelected,
                hideWithSize0: false,
            });
            const nextDrawingMode = constantDrawingMode ?? this.resolveMarkerDrawingModeForState(drawingMode, style);
            if (node.__drawingMode !== nextDrawingMode) {
                node.drawingMode = nextDrawingMode;
            }
            node.zIndex = aggregated ? [-count, index] : 0;
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    // Maps a placed label inline rather than through `getHighlightLabelData`, since a bubble's label
    // anchor is its `point` (carrying the marker size) rather than a plain `(x, y)`.
    private placedLabelDatum(placed: PlacedLabel<BubbleScatterNodeDatum>): BubbleScatterNodeDatum {
        return {
            ...placed.datum,
            placement: placed.placement ?? placed.datum.placement,
            // A re-fitted label is fitted to the candidate the engine chose, so the node renders that
            // text at that size rather than the up-front measurement the cascade started from.
            label:
                placed.datum.fit == null
                    ? placed.datum.label
                    : { text: placed.text, width: placed.width, height: placed.height, fontSize: placed.fontSize },
            point: {
                x: placed.x,
                y: placed.y,
                size: placed.datum.point.size,
            },
        };
    }

    public override updatePlacedLabelData(labelData: PlacedLabel<BubbleScatterNodeDatum>[]) {
        this.placedLabelData = labelData;
        this.labelSelection.update(
            labelData.map((v) => this.placedLabelDatum(v)),
            (text) => {
                text.pointerEvents = PointerEvents.None;
            }
        );
        this.updateLabelNodes({ labelSelection: this.labelSelection });
        this.updateHighlightLabelSelection();
    }

    protected override updateHighlightLabelSelection() {
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightItem =
            this.isSeriesHighlighted(highlightedDatum) && highlightedDatum?.datum ? highlightedDatum : undefined;

        const highlightLabelData =
            highlightItem == null
                ? []
                : this.placedLabelData
                      .filter((label) => label.datum.datumIndex === highlightItem.datumIndex)
                      .map((label) => this.placedLabelDatum(label));

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
        labelSelection: Selection<BubbleScatterNodeDatum, Text<BubbleScatterNodeDatum>>;
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const params: AgBubbleSeriesLabelFormatterParams = this.makeLabelFormatterParams();
        const { label } = this.properties;
        const insideStyle = pickPlacementStyle(label, 'inside');
        const outsideStyle = pickPlacementStyle(label, 'outside');
        const insideOffset = placedLabelTextOffset(label, insideStyle);
        const outsideOffset = placedLabelTextOffset(label, outsideStyle);
        // A styled label's reservation was sized from the style resolved at its winning placement, so its
        // offset comes from that same style rather than the two placements' shared reservation.
        const styled = label.itemStyler != null;

        opts.labelSelection.each((text, datum) => {
            const isInside = datum.placement === 'inside';
            const placementStyle = isInside ? insideStyle : outsideStyle;
            const placementOffset = isInside ? insideOffset : outsideOffset;
            const style = getLabelStyles(
                this,
                datum,
                params,
                label,
                isHighlight,
                activeHighlight,
                undefined,
                placementStyle,
                { placement: datum.placement }
            );
            if (!style.enabled) {
                text.visible = false;
                return;
            }
            const offset = styled ? styledLabelTextOffset(style) : placementOffset;
            text.visible = true;
            text.text = datum.label.text;
            text.fill = style.color;
            text.x = (datum.point?.x ?? 0) + offset.x;
            text.y = (datum.point?.y ?? 0) + offset.y;
            text.fontStyle = style.fontStyle;
            text.fontWeight = style.fontWeight;
            text.fontSize = datum.label.fontSize ?? style.fontSize;
            text.fontFamily = style.fontFamily;
            text.textBaseline = 'top';
            text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
            text.setBoxing(style);
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: BubbleScatterNodeDatum[];
        labelSelection: Selection<BubbleScatterNodeDatum, Text<BubbleScatterNodeDatum>>;
    }): Selection<BubbleScatterNodeDatum, Text<BubbleScatterNodeDatum>> {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    makeStylerParams(
        highlightStateEnum: HighlightState | undefined,
        selectionStateEnum: SelectionState | undefined,
        candidateStateEnum: SelectionState | undefined
    ): AgBubbleSeriesStylerParams<unknown, unknown> | AgScatterSeriesStylerParams<unknown, unknown> {
        const {
            id: seriesId,
            properties: {
                marker,
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
                colorKey,
            },
        } = this;
        const { size: minSize, maxSize } = marker;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);
        const selectionState = toSelectionString(selectionStateEnum);
        const candidateState = toSelectionString(candidateStateEnum);

        if (this.type === 'bubble') {
            type ResultRules = CallbackParamRules<AgBubbleSeriesStylerParams<unknown, unknown>>;
            return {
                highlightState,
                selectionState,
                candidateState,
                minSize,
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
                colorKey,
            } satisfies ResultRules;
        } else if (this.type === 'scatter') {
            type ResultRules = CallbackParamRules<AgScatterSeriesStylerParams<unknown, unknown>>;
            return {
                highlightState,
                selectionState,
                candidateState,
                size: minSize,
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
                colorKey,
            } satisfies ResultRules;
        } else {
            // verify that the else branch is unreachable.
            return this.type satisfies never;
        }
    }

    private makeLabelFormatterParams(): AgBubbleSeriesLabelFormatterParams {
        const {
            xKey,
            xName,
            yKey,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            colorKey,
            colorName,
            legendItemName,
        } = this.properties;
        return {
            xKey,
            xName,
            yKey,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            colorKey,
            colorName,
            legendItemName,
        } satisfies RequireOptional<AgBubbleSeriesLabelFormatterParams>;
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties, ctx, colorScale } = this;
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
            colorKey,
            colorName,
            title,
            tooltip,
            marker,
            legendItemName,
        } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData, 'object')[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData, 'object')[datumIndex];

        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return;

        const data: TooltipContentDataRow[] = [];

        if (this.isLabelEnabled() && labelKey != null) {
            const value = dataModel.resolveColumnById<string | number | Date>(
                this,
                `labelValue`,
                processedData,
                'object'
            )[datumIndex];
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
                value: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName, allowNullKeys),
                missing: isTooltipValueMissing(xValue, allowNullKeys),
            },
            {
                label: yName,
                fallbackLabel: yKey,
                value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, legendItemName, allowNullKeys),
                missing: isTooltipValueMissing(yValue, allowNullKeys),
            }
        );

        const addValueRow = (
            columnId: string,
            key: string,
            name: string | undefined,
            property: FormatterPropertyType
        ): number | undefined => {
            const value = dataModel.resolveColumnById(this, columnId, processedData, 'number')[datumIndex];
            if (value == null) return undefined;
            const domain = dataModel.getDomain(this, columnId, 'value', processedData).domain;
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value,
                datum,
                seriesId,
                legendItemName,
                key,
                source: 'tooltip',
                property,
                boundSeries: this.getFormatterContext(property),
                domain,
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            data.push({ label: name, fallbackLabel: key, value: content ?? formatValue(value) });
            return value;
        };

        if (sizeKey != null) {
            addValueRow('sizeValue', sizeKey, sizeName, 'size');
        }

        let resolvedColorFill: string | undefined;
        if (colorKey != null && this.isColorScaleValid()) {
            const colorValue = addValueRow('colorValue', colorKey, colorName, 'color');
            if (colorValue != null) {
                resolvedColorFill = colorScale.convert(colorValue);
                const binLabel = findDiscreteColorBinLabel(
                    colorScale,
                    properties.colorScale.fills,
                    colorValue,
                    formatValue
                );
                if (binLabel != null) {
                    data.at(-1)!.value = binLabel;
                }
            } else if (properties.colorScale.missingDataFill != null) {
                resolvedColorFill = properties.colorScale.missingDataFill;
            }
        }

        const activeStyle = this.getMarkerStyle(
            marker,
            { datum, datumIndex },
            { xKey, yKey, sizeKey, labelKey, colorKey },
            { resolveMarkerSubPath: [] }
        );
        if (resolvedColorFill != null) {
            // `getMarkerStyle` does not apply the colour-scale fill — that lives in
            // `updateDatumStyles`. Override so the tooltip swatch and fill-bound context match
            // the on-canvas marker colour.
            activeStyle.fill = resolvedColorFill;
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                title,
                symbol: this.legendItemSymbol(activeStyle),
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
                colorKey,
                colorName,
                legendItemName,
                ...(activeStyle as RequireOptional<FillOptions & StrokeOptions & LineDashOptions>),
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    private legendItemSymbol(styleOverride?: Partial<NormalisedSeriesMarkerStyle>): LegendSymbolOptions {
        const style = this.getStyle(undefined);
        const marker = this.getMarkerStyle<AgBubbleSeriesOptionsKeys>(
            this.properties.marker,
            {},
            undefined,
            {
                isHighlight: false,
                checkForHighlight: false,
                resolveMarkerSubPath: [],
            },
            style satisfies RequireOptional<NormalisedSeriesMarkerStyle>
        );
        return {
            marker: styleOverride ? { ...marker, ...styleOverride } : marker,
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] | GradientLegendDatum[] {
        if (this.isColorScaleValid() && this.dataModel) {
            const { colorScale: colorScaleProps } = this.properties;

            if (legendType === 'category' && colorScaleProps.mode === 'discrete' && colorScaleProps.fills.length > 0) {
                return buildColorCategoryLegendData(
                    this.colorScale,
                    colorScaleProps.fills,
                    this.id,
                    this.visible,
                    colorScaleLegendFormatterContext(this),
                    this.properties.shape
                );
            }

            if (legendType === 'gradient' && colorScaleProps.mode !== 'discrete') {
                return [
                    {
                        ...buildGradientLegendDatum(
                            this.colorScale,
                            colorScaleProps.fills,
                            this.id,
                            this.visible,
                            this.getFormatterContext('color')
                        ),
                        showSeparately: true,
                    },
                ];
            }

            return [];
        }

        if (legendType !== 'category') return [];

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
                enabled: visible && (legendManager?.getItemEnabled({ seriesId, itemId }) ?? true),
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
        return new Marker<BubbleScatterNodeDatum>();
    }

    public getStyle(
        highlightState: HighlightState | undefined
    ): Required<NormalisedSeriesMarkerStyle> & { maxSize: number } {
        const { properties } = this;
        const { marker } = properties;

        let stylerResult: AgBubbleSeriesStylerResult | AgScatterSeriesStylerResult = {};
        if (properties.styler) {
            const selectionState: SelectionState | undefined = this.getDataSelectionState(undefined);
            const candidateState: SelectionState | undefined = this.getDataCandidacyState(undefined);
            const stylerParams = this.makeStylerParams(highlightState, selectionState, candidateState);
            const cbResult = this.cachedCallWithContext(properties.styler, stylerParams) ?? {};
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            stylerResult = resolved ?? {};
        }

        const floorOverride = this.getSizeFloorOverride(stylerResult);

        // resolvePartial has already resolved any colour refs in stylerResult, and the marker
        // properties hold resolved colours, so the merged style is a NormalisedSeriesMarkerStyle.
        return {
            fill: stylerResult.fill ?? properties.fill!,
            fillOpacity: stylerResult.fillOpacity ?? properties.fillOpacity,
            lineDash: stylerResult.lineDash ?? properties.lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? properties.lineDashOffset,
            shape: stylerResult.shape ?? properties.shape,
            size: floorOverride ?? marker.size,
            maxSize: (stylerResult as AgBubbleSeriesStylerResult).maxSize ?? marker.maxSize,
            stroke: stylerResult.stroke ?? properties.stroke!,
            strokeOpacity: stylerResult.strokeOpacity ?? properties.strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? properties.strokeWidth,
        } as Required<NormalisedSeriesMarkerStyle> & { maxSize: number };
    }

    // Bubble and scatter share the `marker.size` backing field but expose it under different styler keys:
    // bubble as the scale floor `minSize`, scatter as the fixed `size`. Subclasses override to pick their key.
    protected getSizeFloorOverride(
        stylerResult: AgBubbleSeriesStylerResult | AgScatterSeriesStylerResult
    ): number | undefined {
        return (stylerResult as AgBubbleSeriesStylerResult).minSize;
    }

    public getSizeRange(): [number, number] {
        // `minSize` is authoritative: raise the upper bound to it when a smaller `maxSize` would invert the range.
        const { size, maxSize } = this.getStyle(undefined);
        return [size, Math.max(size, maxSize)];
    }

    public getFormattedMarkerStyle(datum: BubbleScatterNodeDatum) {
        const { xKey, yKey, sizeKey, labelKey, colorKey, marker } = this.properties;
        return this.getMarkerStyle(
            marker,
            datum,
            { xKey, yKey, sizeKey, labelKey, colorKey },
            { resolveMarkerSubPath: [] }
        );
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        const { selection, styler, itemStyler, marker, label } = this.properties;
        return (
            selection.enabled ||
            !!(styler ?? itemStyler ?? marker.itemStyler ?? label.itemStyler) ||
            this.isColorScaleValid()
        );
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<BubbleScatterNodeDatum>) {
        addHitTestersToQuadtree(quadtree, this.datumNodesIter(), this.ctx.logger);
    }

    protected override pickNodeDataClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }
}
