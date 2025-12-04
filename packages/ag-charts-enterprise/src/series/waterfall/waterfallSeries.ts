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
    type DomainInput,
    type DomainWithMetadata,
    type Point,
    type RequireOptional,
    easeOut,
    extractDomain,
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

type WaterfallAnimationData = _ModuleSupport.CartesianAnimationData<
    _ModuleSupport.Rect,
    WaterfallNodeDatum,
    WaterfallNodeDatum,
    WaterfallContext
>;

export class WaterfallSeries extends _ModuleSupport.AbstractBarSeries<
    _ModuleSupport.Rect<WaterfallNodeDatum>,
    AgWaterfallSeriesOptions,
    WaterfallSeriesProperties,
    WaterfallNodeDatum,
    WaterfallNodeDatum,
    WaterfallContext
> {
    static readonly className = 'WaterfallSeries';
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
                    dataWithTotals.push({ ...total.toJson(), [xKey]: total.axisLabel });
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

        const { processedData } = await this.requestDataModel<any, any, true>(
            dataController,
            DataSet.wrap(dataWithTotals),
            {
                props: [
                    keyProperty(xKey, xScaleType, { id: `xValue` }),
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

<<<<<<< HEAD
    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): DomainWithMetadata<any> {
=======
    override getSeriesDomain(direction: ChartAxisDirection): DomainInput<any> {
>>>>>>> origin/latest
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

    override createNodeData() {
        const { data, dataModel, processedData } = this;
        const categoryAxis = this.getCategoryAxis();
        const valueAxis = this.getValueAxis();

        if (!data || !categoryAxis || !valueAxis || !dataModel || !processedData) {
            return;
        }

        const { line } = this.properties;
        const xScale = categoryAxis.scale;
        const yScale = valueAxis.scale;
        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;
        const barWidth = this.getBandwidth(categoryAxis) ?? 10;
        const categoryAxisReversed = categoryAxis.isReversed();
        const valueAxisReversed = valueAxis.isReversed();

        if (processedData.type !== 'ungrouped') return;

        const context: WaterfallContext = {
            itemId: this.properties.yKey,
            nodeData: [],
            labelData: [],
            pointData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.groupScale),
            visible: this.visible,
            styles: getItemStylesPerItemId(this.getItemStyle.bind(this), 'total', 'subtotal', 'positive', 'negative'),
        };

        if (!this.visible) return context;

        const pointData: WaterfallNodePointDatum[] = [];

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

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y).domain;

        const crisp = checkCrisp(
            categoryAxis?.scale,
            categoryAxis?.visibleRange,
            this.smallestDataInterval,
            this.largestDataInterval
        );

        function getValues(
            isTotal: boolean,
            isSubtotal: boolean,
            datumIndex: number
        ): { cumulativeValue: number | undefined; trailingValue: number | undefined } {
            if (isTotal || isSubtotal) {
                return {
                    cumulativeValue: yCurrTotalValues[datumIndex],
                    trailingValue: isSubtotal ? trailingSubtotal : 0,
                };
            }

            return {
                cumulativeValue: yCurrValues[datumIndex],
                trailingValue: yPrevValues[datumIndex],
            };
        }

        function getValue(
            isTotal: boolean,
            isSubtotal: boolean,
            rawValue?: number,
            cumulativeValue?: number,
            trailingValue?: number
        ) {
            if (isTotal) {
                return cumulativeValue;
            }
            if (isSubtotal) {
                return (cumulativeValue ?? 0) - (trailingValue ?? 0);
            }
            return rawValue;
        }

        let trailingSubtotal = 0;
        const { xKey, yKey, xName, yName } = this.properties;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        for (const [datumIndex, datum] of rawData.entries()) {
            const datumType = totalTypeValues[datumIndex];

            const isSubtotal = this.isSubtotal(datumType);
            const isTotal = this.isTotal(datumType);
            const isTotalOrSubtotal = isTotal || isSubtotal;

            const xDatum = xValues[datumIndex];
            if (xDatum == null) continue;

            const x = Math.round(xScale.convert(xDatum));

            const rawValue = yRawValues[datumIndex];

            const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, datumIndex);

            if (isTotalOrSubtotal) {
                trailingSubtotal = cumulativeValue ?? 0;
            }

            const currY = Math.round(yScale.convert(cumulativeValue));
            const trailY = Math.round(yScale.convert(trailingValue));

            const value = getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);
            const isPositive = (value ?? 0) >= 0;

            const seriesItemType = this.getSeriesItemType(isPositive, datumType);
            const { strokeWidth, label } = this.getItemConfig(seriesItemType);

            const y = isPositive ? currY : trailY;
            const bottomY = isPositive ? trailY : currY;
            const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));

            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : x,
                y: barAlongX ? x : Math.min(y, bottomY),
                width: barAlongX ? barHeight : barWidth,
                height: barAlongX ? barWidth : barHeight,
            };

            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const pointY = isTotalOrSubtotal ? currY : trailY;
            const pixelAlignmentOffset = (Math.floor(line.strokeWidth) % 2) / 2;

            const startY = categoryAxisReversed ? currY : pointY;
            const stopY = categoryAxisReversed ? pointY : currY;

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

            const pathPoint = {
                // lineTo
                x: categoryAxisReversed ? stopCoordinates.x : startCoordinates.x,
                y: categoryAxisReversed ? stopCoordinates.y : startCoordinates.y,
                // moveTo
                x2: categoryAxisReversed ? startCoordinates.x : stopCoordinates.x,
                y2: categoryAxisReversed ? startCoordinates.y : stopCoordinates.y,
                size: 0,
            };

            pointData.push(pathPoint);

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
            const nodeDatum: WaterfallNodeDatum = {
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
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                midPoint: nodeMidPoint,
                crisp,
                label: {
                    text: labelText,
                    ...adjustLabelPlacement({
                        isUpward: (value ?? -1) >= 0 !== valueAxisReversed,
                        isVertical: !barAlongX,
                        placement: label.placement,
                        spacing,
                        rect,
                    }),
                },
            };

            context.nodeData.push(nodeDatum);
            context.labelData.push(nodeDatum);
        }

        const connectorLinesEnabled = this.properties.line.enabled;
        if (yCurrValues != null && connectorLinesEnabled) {
            context.pointData = pointData;
        }

        return context;
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
        return datumSelection.update(data);
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

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yRaw`, processedData)[datumIndex];
        const yCurrTotalValues = dataModel.resolveColumnById<number>(this, 'yCurrentTotal', processedData);
        const totalTypeValues = dataModel.resolveColumnById<AgWaterfallSeriesItemType | undefined>(
            this,
            `totalTypeValue`,
            processedData
        );

        if (xValue == null) return;

        const datumType = totalTypeValues[datumIndex];
        const isPositive = (yValue ?? 0) >= 0;

        const seriesItemType = this.getSeriesItemType(isPositive, datumType);

        let total: number;
        if (this.isTotal(datumType)) {
            total = yCurrTotalValues[datumIndex];
        } else if (this.isSubtotal(datumType)) {
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
                        missing: _ModuleSupport.isTooltipValueMissing(yValue),
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
