import type {
    AgWaterfallSeriesItemType,
    AgWaterfallSeriesLabelFormatterParams,
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesStyle,
    TextOrSegments,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    ChartAxisDirection,
    type DomainWithMetadata,
    type Mutable,
    type Point,
    type RequireOptional,
    easeOut,
    isContinuous,
    mergeDefaults,
} from 'ag-charts-core';

import type { WaterfallSeriesItem, WaterfallSeriesTotal } from './waterfallSeriesProperties';
import { WaterfallSeriesProperties } from './waterfallSeriesProperties';

const {
    adjustLabelPlacement,
    SeriesNodePickMode,
    fixNumericExtent,
    valueProperty,
    keyProperty,
    accumulativeValueProperty,
    trailingAccumulatedValueProperty,
    createDatumId,
    checkCrisp,
    updateLabelNode,
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
    Rect,
    motion,
    getItemStylesPerItemId,
    DataSet,
    processedDataIsAnimatable,
    upsertNodeDatum,
} = _ModuleSupport;

type WaterfallNodeLabelDatum = Readonly<Point> & {
    readonly text: TextOrSegments;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};

type WaterfallNodePointDatum = _ModuleSupport.DataModelSeriesNodeDatum['point'] & {
    readonly x2: number;
    readonly y2: number;
};

interface WaterfallNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<Point> {
    readonly index: number;
    readonly itemId?: never;
    readonly itemType: AgWaterfallSeriesItemType;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly label: WaterfallNodeLabelDatum;
    readonly crisp: boolean;
    // Required for types
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
    readonly categoryAxisReversed: boolean;
    readonly valueAxisReversed: boolean;
    readonly crisp: boolean;
    // Override from base to make required (Waterfall always has yKey)
    readonly yKey: string;
    readonly yName: string | undefined;
    readonly lineStrokeWidth: number;
    readonly yDomain: number[];
    // Data arrays
    readonly yRawValues: (number | undefined)[];
    readonly totalTypeValues: (AgWaterfallSeriesItemType | undefined)[];
    readonly yCurrValues: number[];
    readonly yPrevValues: number[];
    readonly yCurrTotalValues: number[];
    // Mutable state for connector line points (built during populateNodeData)
    pointData: WaterfallNodePointDatum[];
}

/** Parameters for creating/updating a WaterfallNodeDatum */
interface WaterfallNodeDatumParams {
    datumIndex: number;
    datum: unknown;
    xDatum: any;
    value: number | undefined;
    cumulativeValue: number | undefined;
    trailingValue: number | undefined;
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

function isTotalNode(
    isTotal: boolean,
    isSubtotal: boolean,
    datum: unknown
): datum is { externalDatum: Record<string, unknown> } {
    return (isTotal || isSubtotal) && typeof datum === 'object' && datum && 'externalDatum' in datum;
}

export class WaterfallSeries extends _ModuleSupport.AbstractBarSeries<WaterfallSeriesTypes> {
    static override readonly className = 'WaterfallSeries';
    static readonly type = 'waterfall' as const;

    override properties = new WaterfallSeriesProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
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
            // Use the `toString` method to make the axis labels unique as they're used as categories in the axis scale domain.
            // Add random id property as there is caching for the axis label formatter result. If the label object is not unique, the axis label formatter will not be invoked.
            const totalsAtIndex = totalsMap.get(i);
            if (totalsAtIndex) {
                for (const total of totalsAtIndex) {
                    // Ensure that key `externalDatum` isn't already in use:
                    total satisfies typeof total & { externalDatum?: never };
                    dataWithTotals.push({
                        ...total.toJson(),
                        [xKey]: total.axisLabel,
                        externalDatum: { ...data?.data.at(total.index) },
                    });
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
            DataSet.wrap(dataWithTotals),
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
            const fixedYExtent = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])];
            return { domain: fixNumericExtent(fixedYExtent) };
        }
    }

    override getSeriesRange(): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    protected override populateNodeData(ctx: WaterfallSeriesNodeDatumContext): void {
        let trailingSubtotal = 0;

        // Scratch object for params - reused across iterations
        const paramsScratch: WaterfallNodeDatumParams = {
            datumIndex: 0,
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
            if (isTotalNode(isTotal, isSubtotal, datum)) {
                datum.externalDatum[this.properties.yKey] = value;
            }

            // Update scratch params
            paramsScratch.datumIndex = datumIndex;
            paramsScratch.datum = datum;
            paramsScratch.xDatum = xDatum;
            paramsScratch.value = value;
            paramsScratch.cumulativeValue = cumulativeValue;
            paramsScratch.trailingValue = trailingValue;
            paramsScratch.datumType = datumType;

            // Use shared utility for create/update logic
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
        if (!dataModel || !processedData || processedData.type !== 'ungrouped') return undefined;

        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();
        if (!categoryAxis || !valueAxis) return undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yRawValues = dataModel.resolveColumnById(this, `yRaw`, processedData);
        const totalTypeValues = dataModel.resolveColumnById<AgWaterfallSeriesItemType | undefined>(
            this,
            `totalTypeValue`,
            processedData
        );
        const yCurrValues = dataModel.resolveColumnById<number>(this, 'yCurrent', processedData);
        const yPrevValues = dataModel.resolveColumnById<number>(this, 'yPrevious', processedData);
        const yCurrTotalValues = dataModel.resolveColumnById<number>(this, 'yCurrentTotal', processedData);

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        const { xKey, yKey, xName, yName, line } = this.properties;
        const { contextNodeData } = this;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const canIncrementallyUpdate = contextNodeData?.nodeData != null && processedData.changeDescription != null;

        const { barWidth } = this.getBarDimensions();

        return {
            xAxis,
            yAxis,
            xScale,
            yScale,
            categoryAxis,
            valueAxis,
            barAlongX: this.getBarDirection() === ChartAxisDirection.X,
            barWidth,
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
        trailingSubtotal: number
    ): { cumulativeValue: number | undefined; trailingValue: number | undefined } {
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
        rawValue?: number,
        cumulativeValue?: number,
        trailingValue?: number
    ): number | undefined {
        if (isTotal) {
            return cumulativeValue;
        }
        if (isSubtotal) {
            return (cumulativeValue ?? 0) - (trailingValue ?? 0);
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
        const { datumIndex, datum, xDatum, value, cumulativeValue, datumType } = params;

        const isPositive = (value ?? 0) >= 0;
        const seriesItemType = this.getSeriesItemType(isPositive, datumType);

        return {
            index: datumIndex,
            series: this,
            itemType: seriesItemType,
            datum,
            datumIndex,
            cumulativeValue: cumulativeValue ?? 0,
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
            label: { text: '', x: 0, y: 0, textAlign: 'center', textBaseline: 'middle' },
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
        const { xScale, yScale, barAlongX, barWidth, valueAxisReversed, xKey, yKey, xName, yName, yDomain, crisp } =
            ctx;
        const { datumIndex, datum, xDatum, value, cumulativeValue, trailingValue, datumType } = params;
        const mutableNode = node as Mutable<WaterfallNodeDatum>;

        const x = Math.round(xScale.convert(xDatum));
        if (!Number.isFinite(x)) return;

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

        // Update properties
        mutableNode.index = datumIndex;
        mutableNode.itemType = seriesItemType;
        mutableNode.datum = datum;
        mutableNode.datumIndex = datumIndex;
        mutableNode.cumulativeValue = cumulativeValue ?? 0;
        mutableNode.xValue = xDatum;
        mutableNode.yValue = value;
        mutableNode.x = rectX;
        mutableNode.y = rectY;
        mutableNode.width = rectWidth;
        mutableNode.height = rectHeight;
        mutableNode.crisp = crisp;

        // Update midPoint in place
        if (mutableNode.midPoint) {
            mutableNode.midPoint.x = rectX + rectWidth / 2;
            mutableNode.midPoint.y = rectY + rectHeight / 2;
        } else {
            mutableNode.midPoint = { x: rectX + rectWidth / 2, y: rectY + rectHeight / 2 };
        }

        // Update label - skip expensive getLabelText() when labels are disabled
        if (label.enabled) {
            const itemType = seriesItemType === 'subtotal' ? 'total' : seriesItemType;
            const labelText = this.getLabelText<AgWaterfallSeriesLabelFormatterParams>(
                value,
                datum,
                yKey,
                'y',
                yDomain,
                label,
                {
                    itemType,
                    value,
                    datum,
                    xKey,
                    yKey,
                    xName,
                    yName,
                }
            );

            const spacing: number = label.spacing + (typeof label.padding === 'number' ? label.padding : 0);
            const labelPlacement = adjustLabelPlacement({
                isUpward: (value ?? -1) >= 0 !== valueAxisReversed,
                isVertical: !barAlongX,
                placement: label.placement,
                spacing,
                rect: { x: rectX, y: rectY, width: rectWidth, height: rectHeight },
            });

            mutableNode.label.text = labelText;
            mutableNode.label.x = labelPlacement.x;
            mutableNode.label.y = labelPlacement.y;
            mutableNode.label.textAlign = labelPlacement.textAlign;
            mutableNode.label.textBaseline = labelPlacement.textBaseline;
        } else {
            // Clear label when disabled
            mutableNode.label.text = '';
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
        cumulativeValue: number | undefined,
        trailingValue: number | undefined,
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

    protected override nodeFactory() {
        return new Rect();
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
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, WaterfallNodeDatum>;
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
        nodeDatum: Pick<WaterfallNodeDatum, 'datum' | 'datumIndex'> | undefined,
        isHighlight: boolean,
        highlightState?: _ModuleSupport.HighlightState,
        itemType: AgWaterfallSeriesItemType = 'total'
    ): Required<AgWaterfallSeriesStyle> {
        const { properties } = this;
        const { datumIndex = 0, datum } = nodeDatum ?? {};

        const propertyItemId = itemType === 'subtotal' ? 'total' : itemType;
        const item = properties.item[propertyItemId];
        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle(itemType));

        const { itemStyler } = item;

        let style = baseStyle;

        if (itemStyler != null && nodeDatum != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(itemType, datumIndex, datum, isHighlight, style);
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
        isHighlight: boolean,
        style: Required<AgWaterfallSeriesStyle>
    ) {
        const { id: seriesId, properties } = this;
        const { xKey, yKey } = properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightStateString = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            itemType,
            datum,
            xKey,
            yKey,
            highlightState: highlightStateString,
            ...style,
            fill,
        };
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, WaterfallNodeDatum>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, datum) => {
            datum.style = this.getItemStyle(datum, isHighlight, undefined, datum.itemType);
        });
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, WaterfallNodeDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;
        const fillBBox = this.getShapeFillBBox();

        datumSelection.each((rect, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[datum.itemType][
                    this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)
                ];
            rect.setStyleProperties(style, fillBBox);

            rect.cornerRadius = style.cornerRadius ?? 0;
            rect.visible = categoryAlongX ? datum.width > 0 : datum.height > 0;
            rect.crisp = datum.crisp;
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: WaterfallNodeDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, WaterfallNodeDatum>;
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

    protected updateLabelNodes({
        labelSelection,
        isHighlight,
    }: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, WaterfallNodeDatum>;
        isHighlight: boolean;
    }) {
        const params: RequireOptional<AgWaterfallSeriesLabelFormatterParams> = {
            itemType: 'positive',
            xKey: this.properties.xKey,
            xName: this.properties.xName ?? this.properties.xName,
            yKey: this.properties.yKey,
            yName: this.properties.yName ?? this.properties.yName,
        };
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        labelSelection.each((textNode, datum) => {
            params.itemType = datum.itemType;
            const styleOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex)?.opacity ?? 1;
            textNode.visible = true;
            textNode.fillOpacity = styleOpacity;
            const label = this.getItemConfig(datum.itemType).label;
            updateLabelNode(this, textNode, params, label, datum.label, isHighlight, activeHighlight);
        });
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yRaw`, processedData)[datumIndex];
        const yCurrTotalValues = dataModel.resolveColumnById<number>(this, 'yCurrentTotal', processedData);
        const totalTypeValues = dataModel.resolveColumnById<AgWaterfallSeriesItemType | undefined>(
            this,
            `totalTypeValue`,
            processedData
        );

        // sonarjs/different-types-comparison: array access can return undefined if index is out of bounds
        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return; // eslint-disable-line sonarjs/different-types-comparison

        const datumType = totalTypeValues[datumIndex];
        const isPositive = (yValue ?? 0) >= 0;
        const isTotal = this.isTotal(datumType);
        const isSubtotal = this.isSubtotal(datumType);

        const seriesItemType = this.getSeriesItemType(isPositive, datumType);

        let total: number;
        if (isTotal) {
            total = yCurrTotalValues[datumIndex];
        } else if (isSubtotal) {
            total = yCurrTotalValues[datumIndex];
            for (let previousIndex = datumIndex - 1; previousIndex >= 0; previousIndex -= 1) {
                if (this.isSubtotal(totalTypeValues[previousIndex])) {
                    total = total - yCurrTotalValues[previousIndex];
                    break;
                }
            }
        } else {
            total = yValue;
        }

        const dataSourceDatum: unknown = processedData.dataSources.get(this.id)?.data[datumIndex];
        const datum: unknown = isTotalNode(isTotal, isSubtotal, dataSourceDatum)
            ? dataSourceDatum.externalDatum
            : dataSourceDatum;

        const nodeDatum = this.contextNodeData?.nodeData?.[datumIndex];
        const format = this.getItemStyle(nodeDatum, false, undefined, nodeDatum?.itemType);

        return this.formatTooltipWithContext(
            tooltip,
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
            { seriesId, datum, title: yName, itemType: seriesItemType, xKey, xName, yKey, yName, ...format }
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
            positive.itemStyler != null ||
            positive.label.itemStyler != null ||
            negative.itemStyler != null ||
            negative.label.itemStyler != null ||
            total.itemStyler != null ||
            total.label.itemStyler != null
        );
    }
}
