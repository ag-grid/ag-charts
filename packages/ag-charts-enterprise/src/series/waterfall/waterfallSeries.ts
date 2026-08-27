import type {
    AgWaterfallSeriesItemStylerParams,
    AgWaterfallSeriesItemType,
    AgWaterfallSeriesLabelFormatterParams,
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesStyle,
    AgWaterfallSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    type BarPlacedLabelDatum,
    type BoxBounds,
    type CallbackParamRules,
    ChartAxisDirection,
    type DomainWithMetadata,
    type DynamicContext,
    type FillStrokeMorph,
    type Mutable,
    type Normalised,
    type NormalisedColorType,
    type NormalisedTextOrSegments,
    type PlacedLabel,
    type Point,
    type PointLabelDatum,
    type PositionedCandidateResolver,
    type RequireOptional,
    applyBarLabelOrientation,
    applyPlacedBarLabelVisibility,
    barLabelObstacles,
    barLabelOrientation,
    barLabelPropsRouteThroughEngine,
    barLabelResolvesOrientation,
    barLabelRotation,
    barLabelRoutesThroughEngine,
    barLabelUsesPositionedCandidates,
    buildBarLabelData,
    buildBarPositionedLabelDatum,
    easeOut,
    firstCandidate,
    fontWithSize,
    isContinuous,
    maxValue,
    measureLabelText,
    mergeDefaults,
    minValue,
    resolveLabelFit,
    resolveLabelFitDescriptors,
    subtractValues,
    toArray,
    zeroLike,
} from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import type { WaterfallSeriesItem, WaterfallSeriesTotal } from './waterfallSeriesProperties';
import { WaterfallSeriesProperties } from './waterfallSeriesProperties';

/** Post-theme/styler-resolution waterfall style: colour refs are already resolved to concrete colours. */
type NormalisedWaterfallSeriesStyle = Normalised<AgWaterfallSeriesStyle, never, FillStrokeMorph>;

const {
    adjustLabelPlacement,
    buildBarLabelCandidates,
    createBarCandidateStyleResolver,
    createBarPositionedCandidateResolver,
    styledBarLabelBox,
    toResolvedPlacement,
    insideBarLabelBounds,
    resolvePlacementLabelBoxExtent,
    fitLabelToContainerAutoSize,
    SeriesNodePickMode,
    fixNumericExtent,
    valueProperty,
    keyProperty,
    accumulativeValueProperty,
    trailingAccumulatedValueProperty,
    createDatumId,
    checkCrisp,
    updateLabelNode,
    pickPlacementStyle,
    expandPlacementLabelBoxExtent,
    prepareBarAnimationFunctions,
    collapsedStartingBarPosition,
    resetBarSelectionsDirect,
    resetBarSelectionsFn,
    seriesLabelFadeInAnimation,
    resetLabelFn,
    animationValidation,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
    computeBarFocusBounds,
    BandScale,
    Rect,
    motion,
    getItemId,
    getItemStylesPerItemId,
    DataSet,
    processedDataIsAnimatable,
    upsertNodeDatum,
} = _ModuleSupport;

type WaterfallNodeLabelDatum = Point & {
    readonly text: NormalisedTextOrSegments;
    /** Reduced font size the text was fitted at; `undefined` when it renders at the configured size. */
    fittedFontSize?: number;
    // Mutable so the placement engine can retarget the label to a chosen candidate's anchor.
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    rotation: number;
    /** Bar rect an orientation candidate must fit within; unset for outside placements. */
    readonly region?: BoxBounds;
    /** Flush offset written by the placement engine to keep a rotated label inside its region. */
    offsetX?: number;
    offsetY?: number;
    /** Granular resolved placement, coarsened to select the `insideStyle`/`outsideStyle` overrides. */
    placement?: _ModuleSupport.BarLabelPlacement;
    /** Pre-positioned cascade candidates, present only when the label routes through the engine. */
    candidates?: readonly _ModuleSupport.BarPositionedCandidate[];
    /** Engine-routed label the placement engine dropped (no candidate fit); rendered invisible. */
    hidden?: boolean;
};

type WaterfallNodePointDatum = _ModuleSupport.DataModelSeriesNodeDatum['point'] & {
    readonly x2: number;
    readonly y2: number;
};

export interface WaterfallNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<Point> {
    readonly index: number;
    // Synthetic total/subtotal bars set this to `totals.itemId` (or `axisLabel`); real bars leave it unset to resolve via `dataIdKey`/`datumIndex`.
    readonly itemId?: string;
    readonly itemType: AgWaterfallSeriesItemType;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly label: WaterfallNodeLabelDatum;
    readonly crisp: boolean;
    readonly clipBBox?: _ModuleSupport.BBox;
    readonly opacity?: number;
    style?: Required<AgWaterfallSeriesStyle>;
}

interface WaterfallContext extends _ModuleSupport.AbstractBarSeriesNodeDataContext<WaterfallNodeDatum> {
    pointData?: WaterfallNodePointDatum[];
    styles: Record<AgWaterfallSeriesItemType, _ModuleSupport.SeriesNodeStyleContext<Required<AgWaterfallSeriesStyle>>>;
}

/** Internal context for createNodeData() - caches expensive lookups */
interface WaterfallSeriesNodeDatumContext extends _ModuleSupport.CartesianCreateNodeDataContext<WaterfallNodeDatum> {
    readonly categoryAxis: _ModuleSupport.ChartAxis;
    readonly valueAxis: _ModuleSupport.ChartAxis;
    readonly barAlongX: boolean;
    readonly barWidth: number;
    readonly groupOffset: number;
    readonly barOffset: number;
    readonly categoryIsBand: boolean;
    readonly categoryAxisReversed: boolean;
    readonly valueAxisReversed: boolean;
    readonly crisp: boolean;
    // Override from base to make required (Waterfall always has yKey)
    readonly yKey: string;
    readonly yName: string | undefined;
    readonly lineStrokeWidth: number;
    readonly yDomain: number[];
    readonly yRawValues: (AgNumericValue | undefined)[];
    readonly totalTypeValues: (AgWaterfallSeriesItemType | undefined)[];
    readonly yCurrValues: AgNumericValue[];
    readonly yPrevValues: AgNumericValue[];
    readonly yCurrTotalValues: AgNumericValue[];
    // Mutable state for connector line points (built during populateNodeData)
    pointData: WaterfallNodePointDatum[];
}

/** Parameters for creating/updating a WaterfallNodeDatum */
interface WaterfallNodeDatumParams {
    datumIndex: number;
    itemId: string | undefined;
    datum: unknown;
    xDatum: any;
    value: AgNumericValue | undefined;
    // bigint-capable so a cumulative beyond Number.MAX_VALUE survives to yScale.convert().
    cumulativeValue: AgNumericValue | undefined;
    trailingValue: AgNumericValue | undefined;
    datumType: AgWaterfallSeriesItemType | undefined;
}

/**
 * Consolidated type interface for WaterfallSeries.
 * Defines all type parameters in one place for the series.
 */
interface WaterfallSeriesTypes extends _ModuleSupport.AbstractBarSeriesTypes {
    readonly node: _ModuleSupport.Rect<WaterfallNodeDatum>;
    readonly options: AgWaterfallSeriesOptions;
    readonly properties: WaterfallSeriesProperties;
    readonly datum: WaterfallNodeDatum;
    readonly label: WaterfallNodeDatum;
    readonly context: WaterfallContext;
    readonly stackContext: never;
    readonly createNodeDataContext: WaterfallSeriesNodeDatumContext;
}

type WaterfallAnimationData = _ModuleSupport.AbstractBarSeriesAnimationData<WaterfallSeriesTypes>;

export class WaterfallSeries extends _ModuleSupport.AbstractBarSeries<WaterfallSeriesTypes> {
    static override readonly className = 'WaterfallSeries';
    static readonly type = 'waterfall' as const;

    override properties = new WaterfallSeriesProperties();

    override createNodeParams(datum: WaterfallNodeDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
            itemType: datum.itemType,
        };
    }

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: undefined,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: ['connector'],
            pathsZIndexSubOrderOffset: [-1, -1],
            animationResetFns: {
                datum: resetBarSelectionsFn,
                label: resetLabelFn,
            },
        });
    }

    private readonly seriesItemTypes: Set<AgWaterfallSeriesItemType> = new Set(['positive', 'negative', 'total']);

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yKey, totals } = this.properties;
        const { data } = this;

        if (!this.visible) return;

        const positiveNumber = (v: unknown) => isContinuous(v) && Number(v) >= 0;
        const negativeNumber = (v: unknown) => isContinuous(v) && Number(v) >= 0;
        const totalTypeValue = (v: unknown) => v === 'total' || v === 'subtotal';
        const propertyDefinition = { missingValue: undefined, invalidValue: undefined };
        const dataWithTotals: unknown[] = [];

        const totalsMap = totals.reduce<Map<number, WaterfallSeriesTotal[]>>((result, total) => {
            const totalsAtIndex = result.get(total.index);
            if (totalsAtIndex) {
                totalsAtIndex.push(total);
            } else {
                result.set(total.index, [total]);
            }
            return result;
        }, new Map());

        for (const [i, datum] of data?.data.entries() ?? []) {
            dataWithTotals.push(datum);
            const totalsAtIndex = totalsMap.get(i);
            if (totalsAtIndex) {
                for (const total of totalsAtIndex) {
                    const { axisLabel, itemId } = total;
                    // itemId becomes the bar's category identity, keeping totals with the same axisLabel distinct on the category scale.
                    const xValue = itemId == null ? axisLabel : { id: itemId, toString: () => axisLabel };
                    dataWithTotals.push({ ...total.toJson(), [xKey]: xValue });
                }
            }
        }

        const extraProps = [];

        if (!this.ctx.animationManager.isSkipped()) {
            extraProps.push(animationValidation());
        }

        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const allowNullKey = this.properties.allowNullKeys ?? false;
        const { processedData } = await this.requestDataModel<any, any, true>(
            dataController,
            DataSet.wrap(dataWithTotals, this.ctx.logger),
            {
                props: [
                    keyProperty(xKey, xScaleType, { id: `xValue`, allowNullKey }),
                    accumulativeValueProperty(yKey, yScaleType, {
                        ...propertyDefinition,
                        id: `yCurrent`,
                    }),
                    accumulativeValueProperty(yKey, yScaleType, {
                        ...propertyDefinition,
                        missingValue: 0,
                        id: `yCurrentTotal`,
                    }),
                    accumulativeValueProperty(yKey, yScaleType, {
                        ...propertyDefinition,
                        id: `yCurrentPositive`,
                        validation: positiveNumber,
                    }),
                    accumulativeValueProperty(yKey, yScaleType, {
                        ...propertyDefinition,
                        id: `yCurrentNegative`,
                        validation: negativeNumber,
                    }),
                    trailingAccumulatedValueProperty(yKey, yScaleType, {
                        ...propertyDefinition,
                        id: `yPrevious`,
                    }),
                    valueProperty(yKey, yScaleType, { id: `yRaw` }), // Raw value pass-through.
                    valueProperty('totalType', 'category', {
                        id: `totalTypeValue`,
                        missingValue: undefined,
                        validation: totalTypeValue,
                    }),
                    ...(isContinuousX
                        ? [_ModuleSupport.SMALLEST_KEY_INTERVAL, _ModuleSupport.LARGEST_KEY_INTERVAL]
                        : []),
                    ...extraProps,
                ],
            }
        );

        this.smallestDataInterval = processedData.reduced?.smallestKeyInterval;
        this.largestDataInterval = processedData.reduced?.largestKeyInterval;

        this.updateSeriesItemTypes();

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { processedData, dataModel } = this;
        if (!processedData || !dataModel) return { domain: [] };

        const {
            keys: [keys],
            values,
        } = processedData.domain;

        if (direction === this.getCategoryDirection()) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain: keys, sortMetadata };
            }
            const isDirectionY = direction === ChartAxisDirection.Y;
            const isReversed = this.getCategoryAxis()!.isReversed();
            return { domain: this.padBandExtent(keys, isReversed !== isDirectionY) };
        } else {
            const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent');
            const yExtent = values[yCurrIndex];
            // minValue/maxValue avoid Math.min/max, which throw on bigint; zeroLike keeps the baseline the same type.
            const fixedYExtent = [
                minValue(zeroLike(yExtent[0]), yExtent[0]),
                maxValue(zeroLike(yExtent[1]), yExtent[1]),
            ];
            return { domain: fixNumericExtent(fixedYExtent) };
        }
    }

    override getSeriesRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    protected override populateNodeData(ctx: WaterfallSeriesNodeDatumContext): void {
        let trailingSubtotal: AgNumericValue = 0;

        const paramsScratch: WaterfallNodeDatumParams = {
            datumIndex: 0,
            itemId: undefined,
            datum: undefined,
            xDatum: undefined,
            value: undefined,
            cumulativeValue: undefined,
            trailingValue: undefined,
            datumType: undefined,
        };

        for (const [datumIndex, datum] of ctx.rawData.entries()) {
            const datumType = ctx.totalTypeValues[datumIndex];
            const isSubtotal = this.isSubtotal(datumType);
            const isTotal = this.isTotal(datumType);
            const isTotalOrSubtotal = isTotal || isSubtotal;

            const xDatum = ctx.xValues[datumIndex];
            if (xDatum === undefined && !this.properties.allowNullKeys) continue;

            const rawValue = ctx.yRawValues[datumIndex];
            const { cumulativeValue, trailingValue } = this.computeWaterfallValues(
                ctx,
                datumIndex,
                isTotal,
                isSubtotal,
                trailingSubtotal
            );

            if (isTotalOrSubtotal) {
                trailingSubtotal = cumulativeValue ?? 0;
            }

            const value = this.computeDisplayValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);

            // Synthetic bars have no data row, so their totals `itemId` (or axis label) is their only stable identifier.
            const totalItemId = isTotalOrSubtotal
                ? ((datum as { itemId?: string } | undefined)?.itemId ?? String(xDatum))
                : undefined;

            paramsScratch.datumIndex = datumIndex;
            paramsScratch.itemId = totalItemId;
            paramsScratch.datum = isTotalOrSubtotal ? undefined : datum;
            paramsScratch.xDatum = xDatum;
            paramsScratch.value = value;
            paramsScratch.cumulativeValue = cumulativeValue;
            paramsScratch.trailingValue = trailingValue;
            paramsScratch.datumType = datumType;

            const nodeDatum = upsertNodeDatum(
                ctx,
                paramsScratch,
                (c, p) => this.createNodeDatum(c, p),
                (c, n, p) => this.updateNodeDatum(c, n, p)
            );

            if (nodeDatum) {
                const pathPoint = this.createPointDatum(
                    ctx,
                    nodeDatum,
                    cumulativeValue,
                    trailingValue,
                    isTotalOrSubtotal
                );
                ctx.pointData.push(pathPoint);
            }
        }
    }

    protected override finalizeNodeData(ctx: WaterfallSeriesNodeDatumContext): void {
        // Trim excess nodes if the data shrunk
        if (ctx.nodeIndex < ctx.nodes.length) {
            ctx.nodes.length = ctx.nodeIndex;
        }
    }

    protected override initializeResult(ctx: WaterfallSeriesNodeDatumContext): WaterfallContext {
        return {
            itemId: this.properties.yKey,
            nodeData: ctx.nodes,
            labelData: ctx.nodes,
            pointData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.ctx.seriesStateManager.getGroupScale(this)!),
            visible: this.visible,
            styles: getItemStylesPerItemId(this.getItemStyle.bind(this), 'total', 'subtotal', 'positive', 'negative'),
        };
    }

    protected override assembleResult(
        ctx: WaterfallSeriesNodeDatumContext,
        result: WaterfallContext
    ): WaterfallContext {
        const connectorLinesEnabled = this.properties.line.enabled;
        if (ctx.yCurrValues != null && connectorLinesEnabled) {
            result.pointData = ctx.pointData;
        }
        return result;
    }

    protected override createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): WaterfallSeriesNodeDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || processedData?.type !== 'ungrouped') return undefined;

        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();
        if (!categoryAxis || !valueAxis) return undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yRawValues = dataModel.resolveColumnById(this, `yRaw`, processedData, 'mixed-numeric');
        const totalTypeValues = dataModel.resolveColumnById<AgWaterfallSeriesItemType | undefined>(
            this,
            `totalTypeValue`,
            processedData,
            'object'
        );
        const yCurrValues = dataModel.resolveColumnById(this, 'yCurrent', processedData, 'mixed-numeric');
        const yPrevValues = dataModel.resolveColumnById(this, 'yPrevious', processedData, 'mixed-numeric');
        const yCurrTotalValues = dataModel.resolveColumnById(this, 'yCurrentTotal', processedData, 'mixed-numeric');

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        const { xKey, yKey, xName, yName, line } = this.properties;
        const { contextNodeData } = this;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const canIncrementallyUpdate = contextNodeData?.nodeData != null && processedData.changeDescription != null;

        const { barWidth, groupOffset, barOffset } = this.getBarDimensions();

        return {
            xAxis,
            yAxis,
            xScale,
            yScale,
            categoryAxis,
            valueAxis,
            barAlongX: this.getBarDirection() === ChartAxisDirection.X,
            barWidth,
            groupOffset,
            barOffset,
            categoryIsBand: BandScale.is(categoryAxis.scale),
            categoryAxisReversed: categoryAxis.isReversed(),
            valueAxisReversed: valueAxis.isReversed(),
            crisp: checkCrisp(
                categoryAxis.scale,
                categoryAxis.visibleRange,
                this.smallestDataInterval,
                this.largestDataInterval
            ),
            animationEnabled,
            xKey,
            yKey,
            xName,
            yName,
            lineStrokeWidth: line.strokeWidth,
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y).domain,
            xValues,
            rawData,
            yRawValues,
            totalTypeValues,
            yCurrValues,
            yPrevValues,
            yCurrTotalValues,
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? contextNodeData.nodeData : [],
            nodeIndex: 0,
            pointData: [],
        };
    }

    private computeWaterfallValues(
        ctx: WaterfallSeriesNodeDatumContext,
        datumIndex: number,
        isTotal: boolean,
        isSubtotal: boolean,
        trailingSubtotal: AgNumericValue
    ): { cumulativeValue: AgNumericValue | undefined; trailingValue: AgNumericValue | undefined } {
        if (isTotal || isSubtotal) {
            return {
                cumulativeValue: ctx.yCurrTotalValues[datumIndex],
                trailingValue: isSubtotal ? trailingSubtotal : 0,
            };
        }

        return {
            cumulativeValue: ctx.yCurrValues[datumIndex],
            trailingValue: ctx.yPrevValues[datumIndex],
        };
    }

    private computeDisplayValue(
        isTotal: boolean,
        isSubtotal: boolean,
        rawValue?: AgNumericValue,
        cumulativeValue?: AgNumericValue,
        trailingValue?: AgNumericValue
    ): AgNumericValue | undefined {
        // Preserve the original (possibly bigint) value so the label and formatter callback keep full precision.
        if (isTotal) {
            return cumulativeValue;
        }
        if (isSubtotal) {
            // subtractValues stays exact for bigint cumulatives (Number()ing each first would round beyond 2^53).
            return subtractValues(cumulativeValue ?? 0, trailingValue ?? 0);
        }
        return rawValue;
    }

    /**
     * Creates a skeleton WaterfallNodeDatum with minimal required fields.
     * The node will be populated by updateNodeDatum.
     */
    private createSkeletonNodeDatum(
        ctx: WaterfallSeriesNodeDatumContext,
        params: WaterfallNodeDatumParams
    ): WaterfallNodeDatum {
        const { xKey, yKey, crisp } = ctx;
        const { datumIndex, itemId, datum, xDatum, value, cumulativeValue, datumType } = params;

        const isPositive = (value ?? 0) >= 0;
        const seriesItemType = this.getSeriesItemType(isPositive, datumType);

        return {
            index: datumIndex,
            series: this,
            itemId,
            itemType: seriesItemType,
            datum,
            datumIndex,
            cumulativeValue: Number(cumulativeValue ?? 0),
            cumulativeValueExact: cumulativeValue ?? 0,
            totalValue: this.getTotalValue(seriesItemType, value),
            xValue: xDatum,
            yValue: value,
            yKey,
            xKey,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            midPoint: { x: 0, y: 0 },
            crisp,
            label: {
                text: '',
                x: 0,
                y: 0,
                textAlign: 'center',
                textBaseline: 'middle',
                rotation: 0,
                offsetX: 0,
                offsetY: 0,
            },
        };
    }

    /**
     * Updates an existing WaterfallNodeDatum in-place.
     * This is more efficient than recreating the entire node when only data values change.
     */
    private updateNodeDatum(
        ctx: WaterfallSeriesNodeDatumContext,
        node: WaterfallNodeDatum,
        params: WaterfallNodeDatumParams
    ): void {
        const {
            xScale,
            yScale,
            barAlongX,
            barWidth,
            groupOffset,
            barOffset,
            categoryIsBand,
            valueAxisReversed,
            xKey,
            yKey,
            xName,
            yName,
            yDomain,
            crisp,
        } = ctx;
        const { datumIndex, itemId, datum, xDatum, value, cumulativeValue, trailingValue, datumType } = params;
        const mutableNode = node as Mutable<WaterfallNodeDatum>;

        const converted = xScale.convert(xDatum);
        if (!Number.isFinite(converted)) return;
        // A continuous axis keeps the bar's edge on the converted point; centring it there would clip extent bars past the axis range.
        const x = categoryIsBand ? converted + groupOffset + barOffset : Math.round(converted);

        const isPositive = (value ?? 0) >= 0;
        const seriesItemType = this.getSeriesItemType(isPositive, datumType);
        const { strokeWidth, label } = this.getItemConfig(seriesItemType);

        const currY = Math.round(yScale.convert(cumulativeValue));
        const trailY = Math.round(yScale.convert(trailingValue));

        const y = isPositive ? currY : trailY;
        const bottomY = isPositive ? trailY : currY;
        const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));

        const rectX = barAlongX ? Math.min(y, bottomY) : x;
        const rectY = barAlongX ? x : Math.min(y, bottomY);
        const rectWidth = barAlongX ? barHeight : barWidth;
        const rectHeight = barAlongX ? barWidth : barHeight;

        mutableNode.index = datumIndex;
        mutableNode.itemId = itemId;
        mutableNode.itemType = seriesItemType;
        mutableNode.datum = datum;
        mutableNode.datumIndex = datumIndex;
        mutableNode.cumulativeValue = Number(cumulativeValue ?? 0);
        mutableNode.cumulativeValueExact = cumulativeValue ?? 0;
        mutableNode.totalValue = this.getTotalValue(seriesItemType, value);
        mutableNode.xValue = xDatum;
        mutableNode.yValue = value;
        mutableNode.x = rectX;
        mutableNode.y = rectY;
        mutableNode.width = rectWidth;
        mutableNode.height = rectHeight;
        mutableNode.crisp = crisp;

        if (mutableNode.midPoint) {
            mutableNode.midPoint.x = rectX + rectWidth / 2;
            mutableNode.midPoint.y = rectY + rectHeight / 2;
        } else {
            mutableNode.midPoint = { x: rectX + rectWidth / 2, y: rectY + rectHeight / 2 };
        }

        // Update label - skip expensive getLabelText() when labels are disabled
        if (label.enabled) {
            const labelText = this.getLabelText<AgWaterfallSeriesLabelFormatterParams>(
                value,
                datum,
                yKey,
                'y',
                yDomain,
                label,
                {
                    itemType: seriesItemType,
                    itemId: getItemId(node, this.data?.dataIdKey),
                    value,
                    totalValue: mutableNode.totalValue,
                    datum,
                    xKey,
                    yKey,
                    xName,
                    yName,
                }
            );

            // Label config is item-type specific, so the fit is resolved per datum rather than hoisted.
            const alwaysShow = label.collision.alwaysShow;
            const labelFit = resolveLabelFit(label, !alwaysShow);
            const routesThroughEngine = barLabelRoutesThroughEngine(
                label.orientation,
                label.placement,
                alwaysShow,
                labelFit
            );
            const usesPositionedCandidates = barLabelUsesPositionedCandidates(
                label.orientation,
                label.placement,
                alwaysShow,
                labelFit
            );
            // Array placement is accepted, but only its first candidate is honoured here.
            const placement = toArray(label.placement)[0];
            const insidePlacement = placement == null || placement.startsWith('inside');
            const placementStyle = insidePlacement ? label.insideStyle : label.outsideStyle;
            const boxPadding = resolvePlacementLabelBoxExtent(label, placementStyle);
            const rect = { x: rectX, y: rectY, width: rectWidth, height: rectHeight };
            const isUpward = (value ?? -1) >= 0 !== valueAxisReversed;
            const resolvesOrientation = barLabelResolvesOrientation(label.orientation);
            const labelRotation = barLabelRotation(firstCandidate(label.orientation));
            // Only bind text to the bar when `inside` is the sole placement, so a non-inside fallback can keep the full text.
            const insideOnly = toArray(label.placement).every((p) => p.startsWith('inside'));
            // Inside labels fit within the bar region; outside labels sit beside it, so leave them unbound.
            const bounds =
                insideOnly && (labelFit != null || resolvesOrientation)
                    ? insideBarLabelBounds(
                          rect,
                          placement ?? 'inside-center',
                          isUpward,
                          !barAlongX,
                          label.spacing,
                          expandPlacementLabelBoxExtent(label)
                      )
                    : undefined;
            // The engine refits per orientation since a rotated label measures against the bar's other axis (see barSeries).
            const { text: fittedLabelText, fontSize: fittedFontSize } = routesThroughEngine
                ? { text: labelText, fontSize: undefined }
                : fitLabelToContainerAutoSize(labelText, labelFit, label, bounds?.container);
            if (usesPositionedCandidates) {
                // Pre-positions a candidate per placement x orientation for the engine to cascade through until one fits.
                const measured = measureLabelText(fittedLabelText, label);
                const placements = toArray(label.placement);
                if (placements.length === 0) placements.push('inside-center');
                const orientations = toArray(label.orientation);
                if (orientations.length === 0) orientations.push('horizontal');
                const plotRegion = this.resolveLabelPlotRegion(label.collision);
                const candidates = buildBarLabelCandidates({
                    isUpward,
                    isVertical: !barAlongX,
                    placements,
                    orientations,
                    spacing: label.spacing,
                    label,
                    textWidth: measured.width,
                    textHeight: measured.height,
                    rect,
                    plotRegion,
                    fitted: labelFit != null,
                    text: fittedLabelText,
                });
                // The first candidate is baked as a backward-safe default until the engine writes the chosen one back.
                const { anchor, region, placement: granular } = candidates[0];
                mutableNode.label.text = fittedLabelText;
                mutableNode.label.x = anchor.x;
                mutableNode.label.y = anchor.y;
                mutableNode.label.textAlign = anchor.textAlign;
                mutableNode.label.textBaseline = anchor.textBaseline;
                mutableNode.label.rotation = labelRotation;
                mutableNode.label.region = region;
                mutableNode.label.offsetX = 0;
                mutableNode.label.offsetY = 0;
                mutableNode.label.placement = granular;
                mutableNode.label.candidates = candidates;
                mutableNode.label.hidden = false;
                mutableNode.label.fittedFontSize = undefined;
            } else {
                // A rotated label's gap to the bar depends on its box size; measure only when it rotates.
                const { width: labelWidth, height: labelHeight } =
                    labelRotation === 0
                        ? { width: 0, height: 0 }
                        : measureLabelText(fittedLabelText, fontWithSize(label, fittedFontSize));
                const labelPlacement = adjustLabelPlacement({
                    isUpward,
                    isVertical: !barAlongX,
                    placement,
                    spacing: label.spacing,
                    boxPadding,
                    rect,
                    rotation: labelRotation,
                    labelWidth,
                    labelHeight,
                });
                mutableNode.label.text = fittedLabelText;
                mutableNode.label.x = labelPlacement.x;
                mutableNode.label.y = labelPlacement.y;
                mutableNode.label.textAlign = labelPlacement.textAlign;
                mutableNode.label.textBaseline = labelPlacement.textBaseline;
                // An orientation array resolves against the bar rect for inside placements only (see barSeries).
                mutableNode.label.rotation = labelRotation;
                mutableNode.label.region = resolvesOrientation ? bounds?.region : undefined;
                mutableNode.label.offsetX = 0;
                mutableNode.label.offsetY = 0;
                mutableNode.label.placement = placement ?? 'inside-center';
                mutableNode.label.candidates = undefined;
                mutableNode.label.hidden = false;
                mutableNode.label.fittedFontSize = fittedFontSize;
            }
        } else {
            mutableNode.label.text = '';
            mutableNode.label.candidates = undefined;
            mutableNode.label.hidden = false;
            mutableNode.label.fittedFontSize = undefined;
        }
    }

    /**
     * Creates a WaterfallNodeDatum for a single data point.
     * Creates a skeleton node and uses updateNodeDatum to populate it.
     */
    private createNodeDatum(
        ctx: WaterfallSeriesNodeDatumContext,
        params: WaterfallNodeDatumParams
    ): WaterfallNodeDatum {
        const node = this.createSkeletonNodeDatum(ctx, params);
        this.updateNodeDatum(ctx, node, params);
        return node;
    }

    private createPointDatum(
        ctx: WaterfallSeriesNodeDatumContext,
        nodeDatum: WaterfallNodeDatum,
        cumulativeValue: AgNumericValue | undefined,
        trailingValue: AgNumericValue | undefined,
        isTotalOrSubtotal: boolean
    ): WaterfallNodePointDatum {
        const { yScale, barAlongX, categoryAxisReversed, lineStrokeWidth } = ctx;

        const currY = Math.round(yScale.convert(cumulativeValue));
        const trailY = Math.round(yScale.convert(trailingValue));

        const pointY = isTotalOrSubtotal ? currY : trailY;
        const pixelAlignmentOffset = (Math.floor(lineStrokeWidth) % 2) / 2;

        const startY = categoryAxisReversed ? currY : pointY;
        const stopY = categoryAxisReversed ? pointY : currY;

        const rect = { x: nodeDatum.x, y: nodeDatum.y, width: nodeDatum.width, height: nodeDatum.height };

        let startCoordinates: { x: number; y: number };
        let stopCoordinates: { x: number; y: number };
        if (barAlongX) {
            startCoordinates = {
                x: startY + pixelAlignmentOffset,
                y: rect.y,
            };
            stopCoordinates = {
                x: stopY + pixelAlignmentOffset,
                y: rect.y + rect.height,
            };
        } else {
            startCoordinates = {
                x: rect.x,
                y: startY + pixelAlignmentOffset,
            };
            stopCoordinates = {
                x: rect.x + rect.width,
                y: stopY + pixelAlignmentOffset,
            };
        }

        return {
            // lineTo
            x: categoryAxisReversed ? stopCoordinates.x : startCoordinates.x,
            y: categoryAxisReversed ? stopCoordinates.y : startCoordinates.y,
            // moveTo
            x2: categoryAxisReversed ? startCoordinates.x : stopCoordinates.x,
            y2: categoryAxisReversed ? startCoordinates.y : stopCoordinates.y,
            size: 0,
        };
    }

    private updateSeriesItemTypes() {
        const { dataModel, seriesItemTypes, processedData } = this;

        if (!dataModel || !processedData) {
            return;
        }

        seriesItemTypes.clear();

        const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentPositive');
        const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentNegative');
        const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`);

        const positiveDomain = processedData.domain.values[yPositiveIndex] ?? [];
        const negativeDomain = processedData.domain.values[yNegativeIndex] ?? [];

        if (positiveDomain.length > 0) {
            seriesItemTypes.add('positive');
        }

        if (negativeDomain.length > 0) {
            seriesItemTypes.add('negative');
        }

        const itemTypes = processedData?.domain.values[totalTypeIndex];
        if (!itemTypes) {
            return;
        }

        for (const type of itemTypes) {
            if (type === 'total' || type === 'subtotal') {
                seriesItemTypes.add('total');
            }
        }
    }

    private isSubtotal(datumType: AgWaterfallSeriesItemType | undefined) {
        return datumType === 'subtotal';
    }

    private isTotal(datumType: AgWaterfallSeriesItemType | undefined) {
        return datumType === 'total';
    }

    private getTotalValue(
        itemType: AgWaterfallSeriesItemType,
        value: AgNumericValue | undefined
    ): AgNumericValue | undefined {
        if (value == null) return undefined;
        return this.isTotal(itemType) || this.isSubtotal(itemType) ? value : undefined;
    }

    protected override nodeFactory() {
        return new Rect<WaterfallNodeDatum>();
    }

    private getSeriesItemType(isPositive: boolean, datumType?: AgWaterfallSeriesItemType): AgWaterfallSeriesItemType {
        return datumType ?? (isPositive ? 'positive' : 'negative');
    }

    private getItemConfig(seriesItemType: AgWaterfallSeriesItemType): WaterfallSeriesItem {
        switch (seriesItemType) {
            case 'positive': {
                return this.properties.item.positive;
            }
            case 'negative': {
                return this.properties.item.negative;
            }
            case 'subtotal':
            case 'total': {
                return this.properties.item.total;
            }
        }
    }

    protected override updateDatumSelection(opts: {
        nodeData: WaterfallNodeDatum[];
        datumSelection: _ModuleSupport.Selection<WaterfallNodeDatum, _ModuleSupport.Rect<WaterfallNodeDatum>>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];

        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id.
            return datumSelection.update(data);
        }

        return datumSelection.update(data, undefined, (datum) => createDatumId(datum.datumIndex));
    }

    private getItemStyle(
        nodeDatum: WaterfallNodeDatum | undefined,
        isHighlight: boolean,
        highlightState?: _ModuleSupport.HighlightState,
        itemType: AgWaterfallSeriesItemType = 'total',
        selectionState?: _ModuleSupport.SelectionState
    ): Required<AgWaterfallSeriesStyle> {
        const { properties } = this;
        const { datumIndex = 0, datum, totalValue } = nodeDatum ?? {};

        const propertyItemId = itemType === 'subtotal' ? 'total' : itemType;
        const item = properties.item[propertyItemId];
        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const resolvedSelectionState = selectionState ?? this.getDataSelectionState(datumIndex);
        const selectionStyle = this.getSelectionStyle(datumIndex, resolvedSelectionState);
        const baseStyle = mergeDefaults(selectionStyle, highlightStyle, properties.getStyle(itemType));

        const { itemStyler } = item;

        let style = baseStyle;

        if (itemStyler != null && nodeDatum != null) {
            const itemId = getItemId(nodeDatum, this.data?.dataIdKey);
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(
                        itemType,
                        datumIndex,
                        datum,
                        itemId,
                        totalValue,
                        isHighlight,
                        style
                    );
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`, 'item', propertyItemId],
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
        itemType: AgWaterfallSeriesItemType,
        datumIndex: number,
        datum: unknown,
        itemId: string | number,
        totalValue: AgNumericValue | undefined,
        isHighlight: boolean,
        style: Required<AgWaterfallSeriesStyle>
    ) {
        const { id: seriesId, properties } = this;
        const { xKey, yKey } = properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionStateString = this.getSelectionStateString(datumIndex);
        const candidateStateString = this.getCandidateStateString(datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill as NormalisedColorType) ?? style.fill;

        return {
            seriesId,
            itemType,
            itemId,
            totalValue,
            datum,
            xKey,
            yKey,
            highlightState: highlightStateString,
            selectionState: selectionStateString,
            candidateState: candidateStateString,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgWaterfallSeriesItemStylerParams>;
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<WaterfallNodeDatum, _ModuleSupport.Rect<WaterfallNodeDatum>>;
        isHighlight: boolean;
    }) {
        const { positive, negative, total } = this.properties.item;
        const hasItemStyler = positive.itemStyler != null || negative.itemStyler != null || total.itemStyler != null;
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        if (!hasItemStyler) {
            // No itemStyler: style is a pure function of (itemType, highlightState, selectionState).
            const styleByState = new Map<string, Required<AgWaterfallSeriesStyle>>();
            const thisSeries = this;

            datumSelection.each(function updateDatumSelectionStyles(_, datum) {
                const highlightState = thisSeries.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
                const selectionState = thisSeries.getDataSelectionState(datum.datumIndex);
                const stateKey = `${datum.itemType}:${highlightState}:${selectionState ?? '-'}`;
                let style = styleByState.get(stateKey);
                if (style === undefined) {
                    style = thisSeries.getItemStyle(
                        undefined,
                        isHighlight,
                        highlightState,
                        datum.itemType,
                        selectionState
                    );
                    styleByState.set(stateKey, style);
                }
                datum.style = style;
            });
            return;
        }

        datumSelection.each((_, datum) => {
            datum.style = this.getItemStyle(datum, isHighlight, undefined, datum.itemType);
        });
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<WaterfallNodeDatum, _ModuleSupport.Rect<WaterfallNodeDatum>>;
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

        datumSelection.each((rect, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[datum.itemType][
                    this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ];
            // `style` is fully resolved by render time; narrow it to the shape-compatible normalised style.
            rect.setStyleProperties(style as Required<NormalisedWaterfallSeriesStyle>, fillBBox);

            rect.cornerRadius = style.cornerRadius ?? 0;
            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
            rect.crisp = datum.crisp;
            rect.crispCentreDirection = crispCentreDirection;
        });
    }

    getLabelObstacles() {
        return barLabelObstacles(
            this.contextNodeData?.nodeData,
            this.contextNodeData?.labelData,
            this.isLabelEnabled() && !this.usesPlacedLabels,
            (node) => {
                const { label } = this.getItemConfig(node.itemType);
                return {
                    label: node.label,
                    config: fontWithSize(label, node.label?.fittedFontSize),
                    box: expandPlacementLabelBoxExtent(label),
                };
            }
        );
    }

    override getLabelData(): PointLabelDatum[] {
        if (!this.usesPlacedLabels) return [];
        const data: PointLabelDatum[] = [];
        for (const node of this.contextNodeData?.labelData ?? []) {
            const nodeLabel = node.label;
            if (nodeLabel == null || nodeLabel.text === '') continue;
            const label = this.getItemConfig(node.itemType).label;
            const collideWith = label.collision.resolveCollideWith();
            const threshold = label.collision.threshold ?? 0;
            // Inflate the measured text by the label's drawn box (padding + border stroke) so collisions
            // avoid the box, not just the text.
            const box = expandPlacementLabelBoxExtent(label);
            const { width, height } = measureLabelText(nodeLabel.text, label);
            const measured = {
                width: width + box.left + box.right,
                height: height + box.top + box.bottom,
            };
            const configuredFit = resolveLabelFitDescriptors(label, box, !label.collision.alwaysShow)(nodeLabel.text);
            if (nodeLabel.candidates == null) {
                // On this route the placement is baked, so styled geometry resolves at the first orientation.
                const styled = styledBarLabelBox(
                    label.itemStyler == null
                        ? undefined
                        : createBarCandidateStyleResolver(
                              this,
                              label,
                              this.makeLabelStylerParams(node, node.totalValue),
                              this.labelPath(node.itemType)
                          ),
                    node,
                    nodeLabel.placement ?? 'inside-center',
                    firstCandidate(label.orientation) ?? 'horizontal',
                    nodeLabel.text
                );
                // A label its styler disabled reserves nothing and blocks no neighbour on the baked route.
                if (styled?.hidden === true) continue;
                data.push(
                    ...buildBarLabelData([node], () => ({
                        label: nodeLabel,
                        config: label,
                        size: styled?.size ?? measured,
                        collideWith,
                        threshold,
                        fit:
                            configuredFit == null || styled == null
                                ? configuredFit
                                : { ...configuredFit, font: styled.font, boxPadding: styled.boxPadding },
                    }))
                );
            } else {
                const ownBox = { x: node.x, y: node.y, width: node.width, height: node.height };
                data.push(
                    buildBarPositionedLabelDatum(
                        nodeLabel.text,
                        // Each candidate carries the box its own style resolves.
                        measured.width,
                        measured.height,
                        nodeLabel.candidates,
                        nodeLabel,
                        ownBox,
                        label.collision.alwaysShow,
                        collideWith,
                        threshold,
                        false,
                        configuredFit,
                        node
                    )
                );
            }
        }
        return data;
    }

    override getLabelCandidateResolver(): PositionedCandidateResolver | undefined {
        const { positive, negative, total } = this.properties.item;
        if (positive.label.itemStyler == null && negative.label.itemStyler == null && total.label.itemStyler == null) {
            return undefined;
        }
        const paramsFor = (styleDatum: _ModuleSupport.SeriesNodeDatum) => {
            const node = styleDatum as WaterfallNodeDatum;
            return this.makeLabelStylerParams(node, node.totalValue);
        };
        // Each item type carries its own label config, styler and options path, so unlike the other bar
        // series the resolver is picked per node rather than bound once.
        const byItemType = new Map<AgWaterfallSeriesItemType, PositionedCandidateResolver | null>();
        return (datum, candidate) => {
            const node = (datum as BarPlacedLabelDatum<WaterfallNodeDatum>).styleDatum;
            if (node == null) return candidate;
            let resolve = byItemType.get(node.itemType);
            if (resolve === undefined) {
                resolve =
                    createBarPositionedCandidateResolver(
                        this,
                        this.getItemConfig(node.itemType).label,
                        paramsFor,
                        this.labelPath(node.itemType)
                    ) ?? null;
                byItemType.set(node.itemType, resolve);
            }
            return resolve?.(datum, candidate) ?? candidate;
        };
    }

    override updatePlacedLabelData(placed: PlacedLabel<WaterfallNodeDatum>[]) {
        applyBarLabelOrientation(placed);
        applyPlacedBarLabelVisibility(this.contextNodeData?.labelData, placed, (node) => node.label);
        this.refreshPlacedLabelNodes();
    }

    protected override resolveUsesPlacedLabels(): boolean {
        const { positive, negative, total } = this.properties.item;
        return [positive, negative, total].some((item) => barLabelPropsRouteThroughEngine(item.label));
    }

    protected override updateLabelSelection(opts: {
        labelData: WaterfallNodeDatum[];
        labelSelection: _ModuleSupport.Selection<WaterfallNodeDatum, _ModuleSupport.Text<WaterfallNodeDatum>>;
    }) {
        const { labelData, labelSelection } = opts;

        if (labelData.length === 0) {
            return labelSelection.update([]);
        }

        const data = labelData.filter((labelDatum) => {
            const { label } = this.getItemConfig(labelDatum.itemType);
            return label.enabled;
        });

        return labelSelection.update(data);
    }

    /**
     * The styler params for one label. Item-type specific, so they are built per datum rather than
     * hoisted; the placement pass and the render pass must produce identical params for the styler
     * result to be shared between them.
     */
    private makeLabelStylerParams(
        datum: WaterfallNodeDatum,
        totalValue: AgNumericValue | undefined
    ): RequireOptional<AgWaterfallSeriesLabelFormatterParams> {
        return {
            itemType: datum.itemType,
            itemId: getItemId(datum, this.data?.dataIdKey),
            totalValue,
            xKey: this.properties.xKey,
            xName: this.properties.xName,
            yKey: this.properties.yKey,
            yName: this.properties.yName,
        };
    }

    /** Options path of an item type's label, which the styler result is resolved against. */
    private labelPath(itemType: WaterfallNodeDatum['itemType']): string[] {
        const propertyItemId = itemType === 'subtotal' ? 'total' : itemType;
        return ['series', `${this.declarationOrder}`, 'item', propertyItemId, 'label'];
    }

    protected updateLabelNodes({
        labelSelection,
        isHighlight,
    }: {
        labelSelection: _ModuleSupport.Selection<WaterfallNodeDatum, _ModuleSupport.Text<WaterfallNodeDatum>>;
        isHighlight: boolean;
    }) {
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        labelSelection.each((textNode, datum) => {
            if (datum.label.hidden) {
                textNode.visible = false;
                return;
            }
            const styleOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex)?.opacity ?? 1;
            textNode.visible = true;
            textNode.fillOpacity = styleOpacity;
            const label = this.getItemConfig(datum.itemType).label;
            const placementStyle = pickPlacementStyle(
                label,
                datum.label.placement == null ? undefined : toResolvedPlacement(datum.label.placement)
            );
            updateLabelNode(
                this,
                textNode,
                this.makeLabelStylerParams(datum, datum.totalValue),
                label,
                datum.label,
                { isHighlight, activeHighlight },
                this.labelPath(datum.itemType),
                placementStyle,
                {
                    placement: datum.label.placement,
                    orientation: barLabelOrientation(datum.label.rotation ?? 0),
                }
            );
        });
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yRaw`, processedData, 'mixed-numeric')[datumIndex];
        const yCurrTotalValues = dataModel.resolveColumnById(this, 'yCurrentTotal', processedData, 'mixed-numeric');
        const totalTypeValues = dataModel.resolveColumnById<AgWaterfallSeriesItemType | undefined>(
            this,
            `totalTypeValue`,
            processedData,
            'object'
        );

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        const datumType = totalTypeValues[datumIndex];

        // Synthetic total/subtotal bars expose no user datum to the renderer or axis formatters.
        const datum =
            this.isTotal(datumType) || this.isSubtotal(datumType)
                ? undefined
                : processedData.dataSources.get(this.id)?.data[datumIndex];

        const isPositive = (yValue ?? 0) >= 0;

        const seriesItemType = this.getSeriesItemType(isPositive, datumType);

        let total: AgNumericValue;
        if (this.isTotal(datumType)) {
            total = yCurrTotalValues[datumIndex];
        } else if (this.isSubtotal(datumType)) {
            total = yCurrTotalValues[datumIndex];
            for (let previousIndex = datumIndex - 1; previousIndex >= 0; previousIndex -= 1) {
                if (this.isSubtotal(totalTypeValues[previousIndex])) {
                    total = subtractValues(total, yCurrTotalValues[previousIndex]);
                    break;
                }
            }
        } else {
            total = yValue;
        }

        const nodeDatum = this.contextNodeData?.nodeData?.[datumIndex];
        const format = this.getItemStyle(nodeDatum, false, undefined, nodeDatum?.itemType);

        // Override only the renderer; other tooltip fields are read directly off `series.properties.tooltip` upstream.
        let effectiveTooltip = tooltip;
        const itemTooltipRenderer = this.getItemConfig(seriesItemType).tooltip?.renderer;
        if (itemTooltipRenderer != null) {
            effectiveTooltip = _ModuleSupport.makeSeriesTooltip<AgWaterfallSeriesTooltipRendererParams>();
            effectiveTooltip.renderer = itemTooltipRenderer;
        }

        return this.formatTooltipWithContext(
            effectiveTooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                symbol: this.legendItemSymbol(seriesItemType),
                data: [
                    {
                        label: yName,
                        fallbackLabel: yKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', total, datum, yKey, legendItemName),
                        missing: _ModuleSupport.isTooltipValueMissing(total),
                    },
                ],
            },
            {
                seriesId,
                datum,
                title: yName,
                itemType: seriesItemType,
                totalValue: nodeDatum?.totalValue,
                itemId: nodeDatum ? getItemId(nodeDatum, this.data?.dataIdKey) : datumIndex,
                xKey,
                xName,
                yKey,
                yName,
                ...format,
            }
        );
    }

    private legendItemSymbol(item: AgWaterfallSeriesItemType): _ModuleSupport.LegendSymbolOptions {
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.getItemConfig(item);
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

    getLegendData(legendType: _ModuleSupport.ChartLegendType) {
        if (legendType !== 'category') {
            return [];
        }

        const { id, seriesItemTypes } = this;
        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];
        const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.substring(1);

        const { showInLegend } = this.properties;

        for (const item of seriesItemTypes) {
            const { name } = this.getItemConfig(item);
            legendData.push({
                legendType: 'category',
                id,
                itemId: createDatumId(item),
                seriesId: id,
                enabled: true,
                label: { text: name ?? capitalise(item) },
                symbol: this.legendItemSymbol(item),
                hideInLegend: !showInLegend,
                isFixed: true,
            });
        }

        return legendData;
    }

    protected override toggleSeriesItem(): void {
        // Legend item toggling is unsupported.
    }

    protected override resetDatumAnimation(data: WaterfallAnimationData): void {
        // Use direct reset to bypass resetMotion callback overhead
        resetBarSelectionsDirect([data.datumSelection]);
    }

    override animateEmptyUpdateReady(opts: WaterfallAnimationData) {
        const { datumSelection, labelSelection, contextData } = opts;
        const fns = prepareBarAnimationFunctions(
            collapsedStartingBarPosition(this.isVertical(), this.axes, 'normal'),
            'unknown'
        );
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], fns);

        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);

        const { pointData } = contextData;
        if (!pointData) return;

        if (this.isVertical()) {
            this.animateConnectorLinesVertical(opts);
        } else {
            this.animateConnectorLinesHorizontal(opts);
        }
    }

    protected animateConnectorLinesHorizontal(opts: WaterfallAnimationData) {
        const { pointData = [] } = opts.contextData;
        const [lineNode] = opts.paths;
        const { path: linePath } = lineNode;

        this.updateLineNode(lineNode);

        const valueAxis = this.getValueAxis();
        const valueAxisReversed = valueAxis?.isReversed();
        const compare = valueAxisReversed ? (v: number, v2: number) => v < v2 : (v: number, v2: number) => v > v2;

        const startX = valueAxis?.scale.convert(0);
        const endX = pointData.reduce(
            (end, point) => {
                if (compare(point.x, end)) {
                    end = point.x;
                }
                return end;
            },
            valueAxisReversed ? Infinity : 0
        );

        const scale = (value: number, start1: number, end1: number, start2: number, end2: number) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };

        this.ctx.animationManager.animate({
            id: `${this.id}_connectors`,
            groupId: this.id,
            phase: 'initial',
            from: startX,
            to: endX,
            ease: easeOut,
            collapsable: false,
            onUpdate(pointX) {
                linePath.clear(true);

                for (const [index, point] of pointData.entries()) {
                    const x = scale(pointX, startX, endX, startX, point.x);
                    const x2 = scale(pointX, startX, endX, startX, point.x2);
                    if (index !== 0) {
                        linePath.lineTo(x, point.y);
                    }
                    linePath.moveTo(x2, point.y2);
                }

                lineNode.checkPathDirty();
            },
            onStop: () => this.resetConnectorLinesPath(opts),
        });
    }

    protected animateConnectorLinesVertical(opts: WaterfallAnimationData) {
        const { pointData = [] } = opts.contextData;
        const [lineNode] = opts.paths;
        const { path: linePath } = lineNode;

        this.updateLineNode(lineNode);

        const valueAxis = this.getValueAxis();
        const valueAxisReversed = valueAxis?.isReversed();
        const compare = valueAxisReversed ? (v: number, v2: number) => v > v2 : (v: number, v2: number) => v < v2;

        const startY = valueAxis?.scale.convert(0);
        const endY = pointData.reduce(
            (end, point) => {
                if (compare(point.y, end)) {
                    end = point.y;
                }
                return end;
            },
            valueAxisReversed ? 0 : Infinity
        );

        const scale = (value: number, start1: number, end1: number, start2: number, end2: number) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };

        this.ctx.animationManager.animate({
            id: `${this.id}_connectors`,
            groupId: this.id,
            phase: 'initial',
            from: startY,
            to: endY,
            ease: easeOut,
            collapsable: false,
            onUpdate(pointY) {
                linePath.clear(true);

                for (const [index, point] of pointData.entries()) {
                    const y = scale(pointY, startY, endY, startY, point.y);
                    const y2 = scale(pointY, startY, endY, startY, point.y2);
                    if (index !== 0) {
                        linePath.lineTo(point.x, y);
                    }
                    linePath.moveTo(point.x2, y2);
                }

                lineNode.checkPathDirty();
            },
            onStop: () => this.resetConnectorLinesPath(opts),
        });
    }

    override animateReadyResize(data: WaterfallAnimationData) {
        super.animateReadyResize(data);
        this.resetConnectorLinesPath(data);
    }

    protected override updatePaths(opts: { contextData: WaterfallContext; paths: _ModuleSupport.Path[] }) {
        this.resetConnectorLinesPath({ contextData: opts.contextData, paths: opts.paths });
    }

    resetConnectorLinesPath({
        contextData,
        paths,
    }: {
        contextData: WaterfallContext;
        paths: Array<_ModuleSupport.Path>;
    }) {
        if (paths.length === 0) {
            return;
        }

        const [lineNode] = paths;

        this.updateLineNode(lineNode);

        const { path: linePath } = lineNode;
        linePath.clear(true);

        const { pointData } = contextData;
        if (!pointData) {
            return;
        }
        for (const [index, point] of pointData.entries()) {
            if (index !== 0) {
                linePath.lineTo(point.x, point.y);
            }
            linePath.moveTo(point.x2, point.y2);
        }

        lineNode.checkPathDirty();
    }

    protected updateLineNode(lineNode: _ModuleSupport.Path) {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.properties.line;
        lineNode.setProperties({
            fill: undefined,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            lineJoin: 'round',
            pointerEvents: _ModuleSupport.PointerEvents.None,
        });
    }

    protected isLabelEnabled() {
        const { positive, negative, total } = this.properties.item;
        return positive.label.enabled || negative.label.enabled || total.label.enabled;
    }

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeBarFocusBounds(this, this.contextNodeData?.nodeData[datumIndex]);
    }

    protected override hasItemStylers(): boolean {
        const { positive, negative, total } = this.properties.item;
        return (
            this.properties.selection.enabled ||
            positive.itemStyler != null ||
            positive.label.itemStyler != null ||
            negative.itemStyler != null ||
            negative.label.itemStyler != null ||
            total.itemStyler != null ||
            total.label.itemStyler != null
        );
    }
}
