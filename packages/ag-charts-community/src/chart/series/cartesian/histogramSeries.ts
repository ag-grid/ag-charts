import type {
    CallbackParamRules,
    DynamicContext,
    LabelFit,
    NormalisedHistogramSeriesStyle,
    PlacedLabel,
    PointLabelDatum,
} from 'ag-charts-core';
import {
    ChartAxisDirection,
    type DomainWithMetadata,
    type Mutable,
    type Point,
    type RequireOptional,
    addValues,
    applyBarLabelOrientation,
    barLabelOrientation,
    barLabelResolvesOrientation,
    barLabelRotation,
    buildBarLabelData,
    createBigIntBins,
    createBigIntTickBins,
    createTicks,
    deepClone,
    findMinMax,
    isBigInt,
    isDate,
    isNumber,
    isNumericValue,
    maxValue,
    measureLabelText,
    mergeDefaults,
    resolveLabelFit,
    tickStep,
    toArray,
    toNumber,
} from 'ag-charts-core';
import type {
    AgHistogramSeriesBinParams,
    AgHistogramSeriesItemStylerParams,
    AgHistogramSeriesLabelFormatterParams,
    AgHistogramSeriesOptions,
    AgHistogramSeriesStylerParams,
    AgNumericValue,
    SelectionState as PublicSelectionState,
} from 'ag-charts-types';

import type { ChartRegistry } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Rect } from '../../../scene/shape/rect';
import type { Text } from '../../../scene/shape/text';
import type { QuadtreeNearest } from '../../../scene/util/quadtree';
import type { ChartAxis } from '../../chartAxis';
import { addAccumulated, area, groupAverage, groupCount, groupSum } from '../../data/aggregateFunctions';
import type { DataController } from '../../data/dataController';
import type {
    AggregatePropertyDefinition,
    DataGroup,
    GroupByFn,
    GroupedData,
    ProcessedOutputDiff,
} from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import type { PropertyDefinition } from '../../data/dataModelTypes';
import {
    SORT_DOMAIN_GROUPS,
    createDatumId,
    keyProperty,
    processedDataIsAnimatable,
    rowCountProperty,
    valueProperty,
} from '../../data/processors';
import { expandPlacementLabelBoxExtent, resolvePlacementLabelPadding } from '../../label';
import {
    adjustLabelPlacement,
    fitLabelToContainer,
    insideBarLabelBounds,
    pickPlacementStyle,
    updateLabelNode,
} from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import { type TooltipContent, type TooltipContentDataRow } from '../../tooltip/tooltip';
import {
    type PickFocusInputs,
    type SeriesNodePickMatch,
    SeriesNodePickMode,
    type SeriesNodeStyleContext,
} from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { toHighlightString } from '../seriesProperties';
import { HighlightState, type SeriesNodeEventTypes } from '../seriesTypes';
import { getItemStyles } from '../util';
import {
    collapsedStartingBarPosition,
    computeBarFocusBounds,
    prepareBarAnimationFunctions,
    resetBarSelectionsDirect,
    resetBarSelectionsFn,
} from './barUtil';
import {
    CartesianSeries,
    CartesianSeriesNodeEvent,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import type {
    CartesianAnimationDataOf,
    CartesianCreateNodeDataContext,
    CartesianSeriesNodeDataContext,
    CartesianSeriesTypes,
} from './cartesianSeriesTypes';
import { upsertNodeDatum } from './cartesianSeriesUtil';
import { type HistogramNodeDatum, HistogramSeriesProperties } from './histogramSeriesProperties';
import { addHitTestersToQuadtree, findQuadtreeMatch } from './quadtreeUtil';
import { rectLabelObstacles } from './util';

const defaultBinCount = 10;

/** True when a value can be converted to a BigInt without throwing — a bigint, or an integral number. */
function isBigIntConvertible(value: AgNumericValue): boolean {
    return typeof value === 'bigint' || Number.isInteger(value);
}

type HistogramAnimationData = CartesianAnimationDataOf<HistogramSeriesTypes>;

/** Bin boundaries are `bigint` for a BigInt x-column and `number` otherwise. */
type BinDomain = [AgNumericValue, AgNumericValue];

interface CalculatedBin {
    domain: BinDomain;
    /** Zero-based positional index of the bin within the series; defined for every bin, including empty ones. */
    binIndex: number;
    datum: any[];
    frequency: number;
    /** Bar height value; area-adjusted when areaPlot is enabled. Kept exact (bigint) for a summed bigint yKey column. */
    total: AgNumericValue;
    /** Raw aggregated yKey value, independent of areaPlot. */
    aggregatedValue: AgNumericValue;
}

interface HistogramSeriesNodeDataContext extends CartesianSeriesNodeDataContext<HistogramNodeDatum> {
    styles: SeriesNodeStyleContext<NormalisedHistogramSeriesStyle>;
}

/**
 * Consolidated type interface for HistogramSeries.
 * Defines all type parameters in one place for the series.
 */
interface HistogramSeriesTypes extends CartesianSeriesTypes {
    readonly node: Rect<HistogramNodeDatum>;
    readonly options: AgHistogramSeriesOptions;
    readonly properties: HistogramSeriesProperties;
    readonly datum: HistogramNodeDatum;
    readonly label: HistogramNodeDatum;
    readonly context: HistogramSeriesNodeDataContext;
    readonly stackContext: never;
    readonly createNodeDataContext: HistogramSeriesNodeDatumContext;
}

/** Context object caching expensive lookups for createNodeData(). */
interface HistogramSeriesNodeDatumContext extends CartesianCreateNodeDataContext<HistogramNodeDatum> {
    // Pre-computed values specific to histogram
    readonly yAxisReversed: boolean;

    // Histogram-specific property lookups
    readonly label: HistogramSeriesProperties['label'];
    readonly labelFit: LabelFit | undefined;
}

class HistogramSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends CartesianSeriesNodeEvent<TEvent> {
    readonly binIndex: number;
    readonly binRange: [AgNumericValue, AgNumericValue];
    readonly aggregatedValue: AgNumericValue;
    readonly frequency: number;

    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: HistogramNodeDatum,
        series: HistogramSeries,
        selectionState: PublicSelectionState | undefined,
        isCollapsed: boolean
    ) {
        super(type, nativeEvent, datum, series, selectionState, isCollapsed);
        this.binIndex = datum.binIndex;
        this.binRange = datum.binRange;
        this.aggregatedValue = datum.aggregatedValue;
        this.frequency = datum.frequency;
    }
}

export class HistogramSeries extends CartesianSeries<HistogramSeriesTypes> {
    static override readonly className = 'HistogramSeries';
    static readonly type = 'histogram' as const;

    override properties = new HistogramSeriesProperties();

    protected override readonly NodeEvent = HistogramSeriesNodeEvent;

    constructor(moduleCtx: DynamicContext<ChartRegistry>) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: undefined,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            datumSelectionGarbageCollection: true,
            animationAlwaysPopulateNodeData: true,
            alwaysClip: true,
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    calculatedBins: CalculatedBin[] = [];

    override get hasData(): boolean {
        return this.calculatedBins.length > 0;
    }

    private computeBins(xExtent: AgNumericValue[]): BinDomain[] {
        const x0 = xExtent[0];
        const x1 = xExtent[1];
        // BigInt boundaries need both endpoints integral, else BigInt() throws — fall back to the Number path.
        const bigIntExtent = (isBigInt(x0) || isBigInt(x1)) && isBigIntConvertible(x0) && isBigIntConvertible(x1);

        if (isNumber(this.properties.binCount)) {
            return bigIntExtent
                ? createBigIntBins(BigInt(x0), BigInt(x1), this.properties.binCount)
                : this.calculateNiceBins([Number(x0), Number(x1)], this.properties.binCount);
        }

        return (
            this.properties.bins ??
            (bigIntExtent
                ? createBigIntTickBins(BigInt(x0), BigInt(x1), defaultBinCount)
                : this.deriveBins([Number(x0), Number(x1)]))
        );
    }

    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    private deriveBins(xDomain: [number, number]): [number, number][] {
        const binStarts = createTicks(xDomain[0], xDomain[1], defaultBinCount).ticks;
        const binSize = tickStep(xDomain[0], xDomain[1], defaultBinCount);
        const [firstBinEnd] = binStarts;

        const expandStartToBin = (n: number): [number, number] => [n, n + binSize];
        return [[firstBinEnd - binSize, firstBinEnd], ...binStarts.map(expandStartToBin)];
    }

    private calculateNiceBins(domain: number[], binCount: number): [number, number][] {
        const startGuess = Math.floor(domain[0]);
        const stop = domain[1];

        const segments = binCount || 1;
        const { start, binSize } = this.calculateNiceStart(startGuess, stop, segments);

        return this.getBins(start, stop, binSize, segments);
    }

    private getBins(start: number, stop: number, step: number, count: number): [number, number][] {
        const bins: [number, number][] = [];
        const precision = this.calculatePrecision(step);

        for (let i = 0; i < count; i++) {
            const a = Math.round((start + i * step) * precision) / precision;
            let b = Math.round((start + (i + 1) * step) * precision) / precision;
            if (i === count - 1) {
                b = Math.max(b, stop);
            }

            bins[i] = [a, b];
        }

        return bins;
    }

    private calculatePrecision(step: number): number {
        let precision = 10;
        if (Number.isFinite(step) && step > 0) {
            while (step < 1) {
                precision *= 10;
                step *= 10;
            }
        }
        return precision;
    }

    private calculateNiceStart(a: number, b: number, segments: number): { start: number; binSize: number } {
        const binSize = Math.abs(b - a) / segments;
        const order = Math.floor(Math.log10(binSize));
        const magnitude = Math.pow(10, order);

        const start = Math.floor(a / magnitude) * magnitude;

        return {
            start,
            binSize,
        };
    }

    override async processData(dataController: DataController) {
        const { visible } = this;
        const { xKey, yKey, areaPlot, aggregation } = this.properties;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ yScale, xScale });

        const visibleProps = visible ? {} : { forceValue: 0 };

        const props: PropertyDefinition<any>[] = [keyProperty(xKey, xScaleType), SORT_DOMAIN_GROUPS];

        const makeAggregate = (id: string): AggregatePropertyDefinition<any, any, any> => {
            if (yKey != null && aggregation === 'sum') return groupSum(id, { visible });
            if (yKey != null && aggregation === 'mean') return groupAverage(id, { visible });
            return groupCount(id, { visible });
        };

        if (yKey == null) {
            // Special property - data model needs at least one value property to perform grouping.
            props.push(rowCountProperty('count'));
        } else {
            props.push(valueProperty(yKey, yScaleType, { invalidValue: undefined, ...visibleProps }));
        }

        // `groupAgg` drives the bar height and the y-axis domain; it is area-adjusted when areaPlot is on.
        const heightAgg = makeAggregate('groupAgg');
        props.push(areaPlot ? area('groupAgg', heightAgg) : heightAgg);
        if (areaPlot) {
            // areaPlot only affects rendering, so `aggregatedValue` uses un-adjusted `rawAgg`, not area-divided `groupAgg`.
            props.push(makeAggregate('rawAgg'));
        }

        let calculatedBinDomains: BinDomain[] = [];
        const groupByFn: GroupByFn = (dataSet) => {
            const xExtent = fixNumericExtent(dataSet.domain.keys[0]);
            if (xExtent.length === 0) {
                // No buckets can be calculated.
                dataSet.domain.groups = [];
                return () => [];
            }

            const bins = this.computeBins(xExtent);
            const binCount = bins.length;
            calculatedBinDomains = [...bins];

            return (keys) => {
                let xValue = keys[0];
                if (isDate(xValue)) {
                    xValue = xValue.getTime();
                }
                if (!isNumericValue(xValue)) return [];

                for (let i = 0; i < binCount; i++) {
                    const nextBin = bins[i];
                    if (xValue >= nextBin[0] && xValue < nextBin[1]) {
                        return nextBin;
                    }
                    if (i === binCount - 1 && xValue <= nextBin[1]) {
                        // Handle edge case of a value being at the maximum extent, and the
                        // final bin aligning with it.
                        return nextBin;
                    }
                }

                return [];
            };
        };

        const { dataModel, processedData: p } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props,
            groupByFn,
        });
        const processedData = p as any as GroupedData<any>;

        const groups = new Map<string, { group: DataGroup; groupIndex: number }>();
        for (const [groupIndex, group] of processedData.groups.entries()) {
            const domain = group.keys;
            groups.set(createDatumId(...domain), { group, groupIndex });
        }

        this.calculatedBins = calculatedBinDomains.map((domain, binIndex): CalculatedBin => {
            const g = groups.get(createDatumId(...domain));

            if (g) {
                const { group, groupIndex } = g;
                const [groupAgg = [0, 0], rawAgg] = group.aggregation;
                const datum = [...dataModel.forEachDatum(this, processedData, group, groupIndex)];
                const frequency = this.frequency(group);
                // addAccumulated keeps bigint sums exact and tolerates a Number-seeded unused-sign accumulator.
                const total = addAccumulated(groupAgg[0], groupAgg[1]);
                // `aggregatedValue` ignores areaPlot's width-division (see `rawAgg` in processData).
                const aggregatedValue = rawAgg ? addAccumulated(rawAgg[0], rawAgg[1]) : total;
                return { domain, datum, binIndex, frequency, total, aggregatedValue };
            } else {
                return { domain, datum: [], binIndex, frequency: 0, total: 0, aggregatedValue: 0 };
            }
        });

        this.animationState.transition('updateData');
    }

    override xCoordinateRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override yCoordinateRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { processedData, dataModel } = this;

        if (!processedData || !dataModel || !this.calculatedBins.length) return { domain: [] };

        const yDomain = dataModel.getDomain(this, `groupAgg`, 'aggregate', processedData).domain;
        const xDomainMin = this.calculatedBins[0].domain[0];
        const xDomainMax = this.calculatedBins[(this.calculatedBins?.length ?? 0) - 1].domain[1];
        if (direction === ChartAxisDirection.X) {
            return { domain: fixNumericExtent([xDomainMin, xDomainMax]) };
        }

        return { domain: fixNumericExtent(yDomain) };
    }

    override getSeriesRange(_direction: ChartAxisDirection, [r0, r1]: [any, any]): [number, number] {
        const { dataModel, processedData } = this;
        if (!dataModel || processedData?.type !== 'grouped') return [Number.NaN, Number.NaN];

        const xScale = this.axes[ChartAxisDirection.X]!.scale;

        const yMin = 0;
        let yMax: AgNumericValue = -Infinity;
        for (const { keys, aggregation } of processedData.groups) {
            const [[negativeAgg, positiveAgg] = [0, 0]] = aggregation;
            const [xDomainMin, xDomainMax] = keys;

            const [x0, x1] = findMinMax([xScale.convert(xDomainMin), xScale.convert(xDomainMax)]);

            if (x1 >= r0 && x0 <= r1) {
                // Sum exactly (operands may be bigint); toNumber narrows the number-typed return once below.
                yMax = maxValue(yMax, addValues(negativeAgg, positiveAgg));
            }
        }

        if (yMin > yMax) return [Number.NaN, Number.NaN];

        return [yMin, toNumber(yMax)];
    }

    private frequency(group: DataGroup) {
        return group.datumIndices.reduce((acc, datumIndices) => acc + datumIndices.length, 0);
    }

    /**
     * Creates the shared context for datum creation.
     * Caches expensive lookups and computations that are constant across all datums.
     *
     * Note: rawData and xValues are empty arrays because HistogramSeries
     * iterates over calculatedBins rather than raw data.
     */
    protected override createNodeDatumContext(
        xAxis: ChartAxis,
        yAxis: ChartAxis
    ): HistogramSeriesNodeDatumContext | undefined {
        const { xKey, yKey, xName, yName, label } = this.properties;
        const { contextNodeData, processedData } = this;

        const canIncrementallyUpdate = contextNodeData?.nodeData != null && processedData?.changeDescription != null;

        return {
            // Axes (from template method parameters)
            xAxis,
            yAxis,

            // Scales
            xScale: xAxis.scale,
            yScale: yAxis.scale,
            yAxisReversed: yAxis.isReversed(),

            // Data source (empty arrays - histogram uses calculatedBins instead)
            rawData: [],
            xValues: [],

            // Property lookups
            xKey,
            yKey,
            xName,
            yName,
            label,
            labelFit: resolveLabelFit(label, !label.collision.suppressHide),

            // Animation flag
            animationEnabled: !this.ctx.animationManager.isSkipped(),

            // Incremental update support
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? contextNodeData.nodeData : [],
            nodeIndex: 0,
        };
    }

    /** The standardised bin metadata passed to every histogram callback. */
    private binParams(bin: CalculatedBin): AgHistogramSeriesBinParams<any> {
        const { datum, binIndex, domain: binRange, aggregatedValue, frequency } = bin;
        return { datum: undefined, datums: datum, binIndex, binRange, aggregatedValue, frequency };
    }

    /**
     * Creates label data for a histogram bin if labels are enabled.
     */
    private createLabelData(
        ctx: HistogramSeriesNodeDatumContext,
        bin: CalculatedBin,
        x: number,
        y: number,
        w: number,
        h: number,
        isUpward: boolean
    ): HistogramNodeDatum['label'] {
        const { label, labelFit, yKey, xKey, xName, yName } = ctx;
        const { total, datum } = bin;

        // Number() coercion: a bigint `0n` total is an empty bin too, but `0n === 0` is false.
        if (!label.enabled || Number(total) === 0) {
            return undefined;
        }

        // Array placement is accepted, but only its first candidate is honoured.
        const placement = toArray(label.placement)[0] ?? 'inside-center';
        const isInside = placement.startsWith('inside');
        const placementStyle = isInside ? label.insideStyle : label.outsideStyle;
        // The baked orientation rotates the box, so the edge facing the bar moves with it (see barSeries).
        const rotation = barLabelRotation(toArray(label.orientation)[0]);
        const resolvesOrientation = barLabelResolvesOrientation(label.orientation);
        const rect = { x, y, width: w, height: h };
        // Region reserves the anchored-side spacing gap (nothing when centred); container is region minus
        // the drawn box. Outside labels float free of the bar (no container/region).
        const bounds = isInside
            ? insideBarLabelBounds(
                  rect,
                  placement,
                  isUpward,
                  true,
                  label.spacing,
                  label.collision.threshold ?? 0,
                  expandPlacementLabelBoxExtent(label)
              )
            : undefined;
        const text = fitLabelToContainer(
            this.getLabelText<AgHistogramSeriesLabelFormatterParams>(total, datum, yKey!, 'y', [], label, {
                ...this.binParams(bin),
                value: total,
                xKey,
                yKey,
                xName,
                yName,
            }),
            labelFit,
            label,
            bounds?.container
        );
        // A rotated label's gap to the bar depends on its box size; measure only when it rotates.
        const { width: labelWidth, height: labelHeight } =
            rotation === 0 ? { width: 0, height: 0 } : measureLabelText(text, label);
        const {
            x: lx,
            y: ly,
            textAlign,
            textBaseline,
        } = adjustLabelPlacement({
            isUpward,
            isVertical: true,
            placement,
            spacing: label.spacing,
            boxPadding: resolvePlacementLabelPadding(label, placementStyle),
            rect,
            rotation,
            labelWidth,
            labelHeight,
        });

        return {
            x: lx,
            y: ly,
            textAlign,
            textBaseline,
            placement: isInside ? 'inside' : 'outside',
            rotation,
            offsetX: 0,
            offsetY: 0,
            // An orientation array resolves against the bar region for inside placements only; outside
            // labels fall back to the plot bounds via no region (see barSeries).
            region: resolvesOrientation ? bounds?.region : undefined,
            text,
        };
    }

    /**
     * Creates a skeleton HistogramNodeDatum with minimal required fields.
     * The node will be populated by updateNodeDatum.
     */
    private createSkeletonNodeDatum(ctx: HistogramSeriesNodeDatumContext, bin: CalculatedBin): HistogramNodeDatum {
        const { xKey, yKey } = ctx;
        const { domain: binRange, datum, binIndex, frequency, total, aggregatedValue } = bin;
        const [binStart, binEnd] = binRange;
        const { getItemId } = this.properties;
        const customId =
            getItemId == null
                ? undefined
                : this.cachedCallWithContext(getItemId, this.binParams(bin), `${this.id}:${binStart},${binEnd}`);
        const itemId = customId ?? `bin:${binStart},${binEnd}`;

        return {
            series: this,
            itemId,
            datumIndex: binIndex,
            datum: undefined,
            datums: datum,
            binIndex,
            binRange,
            aggregatedValue,
            // cumulativeValue is the plotted bar height (crosshair geometry); narrow to Number like other series.
            cumulativeValue: Number(total),
            cumulativeValueExact: total,
            frequency,
            yKey,
            xKey,
            x: 0,
            y: 0,
            xValue: 0,
            yValue: 0,
            width: 0,
            height: 0,
            midPoint: { x: 0, y: 0 },
            topLeftCornerRadius: false,
            topRightCornerRadius: false,
            bottomRightCornerRadius: false,
            bottomLeftCornerRadius: false,
            label: undefined,
            crisp: true,
        };
    }

    /**
     * Updates an existing HistogramNodeDatum in-place.
     * This is more efficient than recreating the entire node when only data values change.
     */
    private updateNodeDatum(ctx: HistogramSeriesNodeDatumContext, node: HistogramNodeDatum, bin: CalculatedBin): void {
        const { xScale, yScale, yAxisReversed } = ctx;
        const { domain: binRange, datum, binIndex, frequency, total, aggregatedValue } = bin;
        const mutableNode = node as Mutable<HistogramNodeDatum>;

        const [xDomainMin, xDomainMax] = binRange;
        const xMinPx = xScale.convert(xDomainMin);
        const xMaxPx = xScale.convert(xDomainMax);

        const yZeroPx = yScale.convert(0);
        const yMaxPx = yScale.convert(total);
        const w = Math.abs(xMaxPx - xMinPx);
        const h = Math.abs(yMaxPx - yZeroPx);

        const x = Math.min(xMinPx, xMaxPx);
        const y = Math.min(yZeroPx, yMaxPx);
        // The bar grows upward when its top edge sits at or above the zero line in screen space;
        // derived from pixels so it stays correct for negative aggregates and a reversed y-axis.
        const isUpward = yMaxPx <= yZeroPx;

        // Update properties
        mutableNode.datumIndex = binIndex;
        mutableNode.datum = undefined;
        mutableNode.datums = datum;
        mutableNode.binIndex = binIndex;
        mutableNode.aggregatedValue = aggregatedValue;
        mutableNode.cumulativeValue = Number(total);
        mutableNode.cumulativeValueExact = total;
        mutableNode.frequency = frequency;
        mutableNode.binRange = binRange;
        mutableNode.x = x;
        mutableNode.y = y;
        mutableNode.xValue = xMinPx;
        mutableNode.yValue = yMaxPx;
        mutableNode.width = w;
        mutableNode.height = h;

        // Update midPoint in place
        if (mutableNode.midPoint) {
            mutableNode.midPoint.x = x + w / 2;
            mutableNode.midPoint.y = y + h / 2;
        } else {
            mutableNode.midPoint = { x: x + w / 2, y: y + h / 2 };
        }

        // Update corner radius flags
        mutableNode.topLeftCornerRadius = !yAxisReversed;
        mutableNode.topRightCornerRadius = !yAxisReversed;
        mutableNode.bottomRightCornerRadius = yAxisReversed;
        mutableNode.bottomLeftCornerRadius = yAxisReversed;

        // Update label
        mutableNode.label = this.createLabelData(ctx, bin, x, y, w, h, isUpward);
    }

    /**
     * Creates a HistogramNodeDatum for a single bin.
     * Creates a skeleton node and uses updateNodeDatum to populate it.
     */
    private createNodeDatum(ctx: HistogramSeriesNodeDatumContext, bin: CalculatedBin): HistogramNodeDatum {
        const node = this.createSkeletonNodeDatum(ctx, bin);
        this.updateNodeDatum(ctx, node, bin);
        return node;
    }

    /**
     * Template method hook: Iterates over calculated bins and creates/updates node datums.
     */
    protected override populateNodeData(ctx: HistogramSeriesNodeDatumContext): void {
        const { processedData } = this;

        if (processedData?.type !== 'grouped') {
            return;
        }

        // Main iteration loop - uses shared upsertNodeDatum utility
        for (const bin of this.calculatedBins) {
            upsertNodeDatum(
                ctx,
                bin,
                (c, b) => this.createNodeDatum(c, b),
                (c, n, b) => this.updateNodeDatum(c, n, b)
            );
        }
    }

    /**
     * Template method hook: Creates the result object shell.
     */
    protected override initializeResult(ctx: HistogramSeriesNodeDatumContext): HistogramSeriesNodeDataContext {
        return {
            itemId: this.properties.yKey ?? this.id,
            nodeData: ctx.nodes,
            labelData: ctx.nodes,
            scales: this.calculateScaling(),
            animationValid: true,
            visible: this.visible || ctx.animationEnabled,
            styles: getItemStyles(this.getItemStyle.bind(this)),
        };
    }

    /**
     * Template method hook: Trims arrays and sorts nodes for keyboard navigation.
     */
    protected override finalizeNodeData(ctx: HistogramSeriesNodeDatumContext): void {
        super.finalizeNodeData(ctx);

        // AG-11323 Sort bins from left-to-right for intuitive keyboard navigation.
        ctx.nodes.sort((a, b) => a.x - b.x);
    }

    protected override nodeFactory() {
        return new Rect<HistogramNodeDatum>();
    }

    protected override updateDatumSelection(opts: {
        nodeData: HistogramNodeDatum[];
        datumSelection: Selection<HistogramNodeDatum, Rect<HistogramNodeDatum>>;
    }) {
        const { nodeData, datumSelection } = opts;

        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id.
            return datumSelection.update(nodeData);
        }

        return datumSelection.update(nodeData, undefined, (datum: HistogramNodeDatum) =>
            createDatumId(...datum.binRange)
        );
    }

    // The theme resolves fill/stroke before any styler runs, so the style fields exposed to styler
    // callbacks are always present even though they are statically optional on the properties.
    private resolvedStyle(
        style: RequireOptional<NormalisedHistogramSeriesStyle>
    ): Required<NormalisedHistogramSeriesStyle> {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cornerRadius } = style;
        return {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cornerRadius,
        } as Required<NormalisedHistogramSeriesStyle>;
    }

    private makeStylerParams(
        highlightState: HighlightState | undefined
    ): AgHistogramSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { xKey, yKey } = this.properties;

        return {
            seriesId,
            xKey,
            yKey,
            ...this.resolvedStyle(this.properties.getStyle()),
            highlightState: toHighlightString(highlightState ?? HighlightState.None),
            selectionState: this.getSelectionStateString(undefined),
            candidateState: this.getCandidateStateString(undefined),
        } satisfies CallbackParamRules<AgHistogramSeriesStylerParams<unknown, unknown>>;
    }

    private makeItemStylerParams(
        bin: CalculatedBin,
        isHighlight: boolean,
        style: RequireOptional<NormalisedHistogramSeriesStyle>
    ): AgHistogramSeriesItemStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { xKey, yKey } = this.properties;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();

        return {
            seriesId,
            xKey,
            yKey,
            ...this.binParams(bin),
            highlightState: this.getHighlightStateString(activeHighlight, isHighlight, bin.binIndex),
            selectionState: this.getSelectionStateString(bin.binIndex),
            candidateState: this.getCandidateStateString(bin.binIndex),
            ...this.resolvedStyle(style),
        } satisfies CallbackParamRules<AgHistogramSeriesItemStylerParams<unknown, unknown>>;
    }

    private getStyle(
        ignoreStylerCallback: boolean,
        isHighlight: boolean,
        datumIndex: number | undefined,
        highlightState: HighlightState | undefined
    ): RequireOptional<NormalisedHistogramSeriesStyle> {
        const { properties } = this;
        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);

        let base: RequireOptional<NormalisedHistogramSeriesStyle> = properties.getStyle();
        const { styler } = properties;
        if (!ignoreStylerCallback && styler != null) {
            const stylerResult = (this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                this.cachedCallWithContext(styler, this.makeStylerParams(highlightState)) ?? {},
                { pick: false }
            ) ?? {}) as RequireOptional<NormalisedHistogramSeriesStyle>;
            base = mergeDefaults(stylerResult, base);
        }

        return mergeDefaults(highlightStyle, base);
    }

    private getItemStyle(
        datumIndex: number | undefined,
        isHighlight: boolean,
        highlightState?: HighlightState
    ): RequireOptional<NormalisedHistogramSeriesStyle> {
        let style = this.getStyle(datumIndex === undefined, isHighlight, datumIndex, highlightState);

        const { itemStyler } = this.properties;
        if (itemStyler != null && datumIndex != null) {
            const bin = this.calculatedBins[datumIndex];
            if (bin != null) {
                const overrides = this.cachedDatumCallback(
                    createDatumId(...bin.domain, isHighlight ? 'highlight' : 'node'),
                    () =>
                        this.ctx.optionsGraphService.resolvePartial(
                            ['series', `${this.declarationOrder}`],
                            this.callWithContext(itemStyler, this.makeItemStylerParams(bin, isHighlight, style))
                        )
                );
                if (overrides) {
                    style = mergeDefaults(overrides as RequireOptional<NormalisedHistogramSeriesStyle>, style);
                }
            }
        }

        return style;
    }

    protected override updateDatumStyles(opts: {
        datumSelection: Selection<HistogramNodeDatum, Rect<HistogramNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        datumSelection.each((node, datum) => {
            if (!datumSelection.isGarbage(node)) {
                datum.style = this.getItemStyle(datum.datumIndex, isHighlight);
            }
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<HistogramNodeDatum, Rect<HistogramNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const { shadow } = this.properties;
        const fillBBox = this.getShapeFillBBox();

        opts.datumSelection.each((rect, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex)];
            const { cornerRadius = 0 } = style;
            const { topLeftCornerRadius, topRightCornerRadius, bottomRightCornerRadius, bottomLeftCornerRadius } =
                datum;

            rect.setStyleProperties(style, fillBBox);
            rect.topLeftCornerRadius = topLeftCornerRadius ? cornerRadius : 0;
            rect.topRightCornerRadius = topRightCornerRadius ? cornerRadius : 0;
            rect.bottomRightCornerRadius = bottomRightCornerRadius ? cornerRadius : 0;
            rect.bottomLeftCornerRadius = bottomLeftCornerRadius ? cornerRadius : 0;
            rect.crisp = datum.crisp;
            rect.fillShadow = shadow;
        });
    }

    getLabelObstacles() {
        return rectLabelObstacles(this.contextNodeData?.nodeData);
    }

    protected override updateLabelSelection(opts: {
        labelData: HistogramNodeDatum[];
        labelSelection: Selection<HistogramNodeDatum, Text<HistogramNodeDatum>>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: {
        labelSelection: Selection<HistogramNodeDatum, Text<HistogramNodeDatum>>;
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const { xKey, yKey, xName, yName, label } = this.properties;
        // Only the first placement is honoured; it is bin-invariant, so the granular value is shared.
        const granularPlacement = toArray(label.placement)[0] ?? 'inside-center';
        // Disabled labels carry no per-datum placement, so fall back to the authored default.
        const defaultPlacement = granularPlacement.startsWith('inside') ? 'inside' : 'outside';
        opts.labelSelection.each((text, datum) => {
            const params: AgHistogramSeriesLabelFormatterParams = {
                datum: undefined,
                datums: datum.datums as any[],
                binIndex: datum.binIndex,
                binRange: datum.binRange,
                aggregatedValue: datum.aggregatedValue,
                frequency: datum.frequency,
                value: datum.cumulativeValue,
                xKey,
                yKey,
                xName,
                yName,
            };
            const placementStyle = pickPlacementStyle(label, datum.label?.placement ?? defaultPlacement);
            text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
            updateLabelNode(
                this,
                text,
                params,
                label,
                datum.label,
                { isHighlight, activeHighlight },
                undefined,
                placementStyle,
                { placement: granularPlacement, orientation: barLabelOrientation(datum.label?.rotation ?? 0) }
            );
        });
    }

    protected override resolveUsesPlacedLabels(): boolean {
        return barLabelResolvesOrientation(this.properties.label.orientation);
    }

    override getLabelData(): PointLabelDatum[] {
        if (!this.usesPlacedLabels || !this.isLabelEnabled()) return [];
        const { label } = this.properties;
        const collideWith = label.collision.resolveCollideWith();
        return buildBarLabelData(this.contextNodeData?.labelData, (node) => ({
            label: node.label,
            config: label,
            collideWith,
        }));
    }

    override updatePlacedLabelData(placed: PlacedLabel<HistogramNodeDatum>[]) {
        applyBarLabelOrientation(placed);
        this.refreshPlacedLabelNodes();
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<HistogramNodeDatum>) {
        const { value: childNode } = this.contentGroup.children().next();
        if (childNode instanceof Group) {
            addHitTestersToQuadtree(quadtree, childNode.children() as Iterable<Rect<HistogramNodeDatum>>);
        }
    }

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const {
            id: seriesId,
            dataModel,
            processedData,
            axes,
            properties,
            ctx: { localeManager },
        } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || processedData?.type !== 'grouped' || !xAxis || !yAxis) {
            return;
        }

        const bin = this.calculatedBins[datumIndex];
        if (bin == null) {
            return;
        }
        const { frequency, aggregatedValue, datum } = bin;
        const binRange = bin.domain;
        const [rangeMin, rangeMax]: AgNumericValue[] = binRange;

        const data: TooltipContentDataRow[] = [
            {
                label: xName,
                fallbackLabel: xKey,
                value: `${this.getAxisValueText(xAxis, 'tooltip', rangeMin, datum, xKey, legendItemName)} - ${this.getAxisValueText(xAxis, 'tooltip', rangeMax, datum, xKey, legendItemName)}`,
            },
            {
                label: localeManager.t('seriesHistogramTooltipFrequency'),
                value: this.getAxisValueText(yAxis, 'tooltip', frequency, datum, yKey!, legendItemName),
            },
        ];

        if (yKey != null) {
            let label: string;
            switch (properties.aggregation) {
                case 'sum':
                    label = localeManager.t('seriesHistogramTooltipSum', { yName: yName ?? yKey });
                    break;
                case 'mean':
                    label = localeManager.t('seriesHistogramTooltipMean', { yName: yName ?? yKey });
                    break;
                case 'count':
                    label = localeManager.t('seriesHistogramTooltipCount', { yName: yName ?? yKey });
                    break;
            }

            data.push({
                label,
                value: this.getAxisValueText(yAxis, 'tooltip', aggregatedValue, datum, yKey, legendItemName),
            });
        }

        return this.formatTooltipWithContext(
            tooltip,
            {
                symbol: this.legendItemSymbol(),
                data,
            },
            {
                seriesId,
                title: yName,
                xKey: xKey as any, // HistogramSeries is an outlier since it's callbacks don't use TDatum.
                xName,
                yKey: yKey as any, // HistogramSeries is an outlier since it's callbacks don't use TDatum.
                yName,
                ...this.binParams(bin),
                ...this.getItemStyle(datumIndex, false),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.properties;

        return {
            marker: {
                fill: deepClone(fill) ?? 'rgba(0, 0, 0, 0)',
                stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                fillOpacity: fillOpacity,
                strokeOpacity: strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
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

        const { xKey: itemId, yName, showInLegend } = this.properties;

        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible && (legendManager?.getItemEnabled({ seriesId, itemId }) ?? true),
                label: {
                    text: yName ?? itemId ?? 'Frequency',
                },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    protected override resetDatumAnimation(data: HistogramAnimationData): void {
        // Use direct reset to bypass resetMotion callback overhead
        resetBarSelectionsDirect([data.datumSelection]);
    }

    override animateEmptyUpdateReady({ datumSelection, labelSelection }: HistogramAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes, 'normal'), 'unknown');
        fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    override animateWaitingUpdateReady(data: HistogramAnimationData) {
        const fns = prepareBarAnimationFunctions(collapsedStartingBarPosition(true, this.axes, 'normal'), 'added');

        const dataDiff: ProcessedOutputDiff = {
            changed: true,
            added: new Set(),
            updated: new Set(),
            removed: new Set(),
            moved: new Set(),
        };

        fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [data.datumSelection],
            fns,
            (node) => createDatumId(...node.unsafeDatum.binRange),
            dataDiff
        );

        if (dataDiff?.changed) {
            seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, data.labelSelection);
        }
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected computeFocusBounds({ datumIndex }: PickFocusInputs): BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.styler != null ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null ||
            this.properties.selection.enabled
        );
    }
}
