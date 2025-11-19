import {
    type AgCandlestickSeriesItemOptions,
    type AgOhlcSeriesBaseOptions,
    type AgOhlcSeriesItemOptions,
    type AgOhlcSeriesItemType,
    type FillOptions,
    type LineDashOptions,
    type StrokeOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import { Logger, mergeDefaults, simpleMemorize2 } from 'ag-charts-core';

import {
    CLOSE,
    HIGH,
    LOW,
    OPEN,
    type OhlcSeriesDataAggregationFilter,
    SPAN,
    aggregateOhlcData,
} from './ohlcAggregation';
import type { OhlcBaseNode } from './ohlcNode';
import type { OhlcSeriesBaseProperties } from './ohlcSeriesProperties';

const {
    fixNumericExtent,
    keyProperty,
    createDatumId,
    SeriesNodePickMode,
    ChartAxisDirection,
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

const memoizedAggregateOhlcData = simpleMemorize2(aggregateOhlcData);
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

    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: OhlcNodeDatum,
        series: OhlcSeriesBase<OhlcBaseNode, AgOhlcSeriesBaseOptions, any>
    ) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.openKey = series.properties.openKey;
        this.closeKey = series.properties.closeKey;
        this.highKey = series.properties.highKey;
        this.lowKey = series.properties.lowKey;
    }
}

interface OhlcSeriesBaseNodeDataContext extends _ModuleSupport.AbstractBarSeriesNodeDataContext<OhlcNodeDatum> {
    styles: Record<'up' | 'down', _ModuleSupport.SeriesNodeStyleContext<OhlcCandleStickSeriesStyle>>;
}

export abstract class OhlcSeriesBase<
    TNode extends OhlcBaseNode,
    TOpts extends AgOhlcSeriesBaseOptions,
    TProps extends OhlcSeriesBaseProperties<TOpts>,
> extends _ModuleSupport.AbstractBarSeries<
    TNode,
    TOpts,
    TProps,
    OhlcNodeDatum,
    OhlcNodeDatum,
    OhlcSeriesBaseNodeDataContext
> {
    protected override readonly NodeEvent = OhlcSeriesNodeEvent;

    private dataAggregationFilters: OhlcSeriesDataAggregationFilter[] | undefined = undefined;

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
        if (animationEnabled) {
            if (this.processedData) {
                extraProps.push(diff(this.id, this.processedData));
            }
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

        this.dataAggregationFilters = this.aggregateData(
            dataModel,
            processedData as any as _ModuleSupport.UngroupedData<any>
        );

        this.animationState.transition('updateData');
    }

    private aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.UngroupedData<any>
    ) {
        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const highValues = dataModel.resolveColumnById(this, `highValue`, processedData);
        const lowValues = dataModel.resolveColumnById(this, `lowValue`, processedData);

        const { index } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const domain = processedData.domain.keys[index];

        return memoizedAggregateOhlcData(
            xAxis.scale.type,
            xValues,
            highValues,
            lowValues,
            domain,
            processedData.reduced?.smallestKeyInterval
        );
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return [];

        if (direction !== this.getBarDirection()) {
            const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const keys = processedData.domain.keys[index];
            if (def.type === 'key' && def.valueType === 'category') {
                return keys;
            }
            return this.padBandExtent(keys);
        }

        const yExtent = this.domainForClippedRange(direction, ['highValue', 'lowValue'], 'xValue');
        return fixNumericExtent(yExtent);
    }

    override getSeriesRange(_direction: _ModuleSupport.ChartAxisDirection, visibleRange: [any, any]): any[] {
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

    override createNodeData() {
        const { visible, dataModel, processedData } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && processedData && xAxis && yAxis)) return;

        const nodeData: OhlcNodeDatum[] = [];
        const { xKey, highKey, lowKey } = this.properties;
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const openValues = dataModel.resolveColumnById(this, 'openValue', processedData);
        const closeValues = dataModel.resolveColumnById(this, 'closeValue', processedData);
        const highValues = dataModel.resolveColumnById(this, 'highValue', processedData);
        const lowValues = dataModel.resolveColumnById(this, 'lowValue', processedData);

        const { groupScale } = this;
        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const groupOffset = groupScale.convert(String(groupIndex));
        // CRT-340 Use atleast 1px width to prevent nothing being drawn.
        const effectiveBarWidth = barWidth >= 1 ? barWidth : groupScale.rawBandwidth;

        const applyWidthOffset = BandScale.is(xAxis.scale);

        const context = {
            itemId: xKey,
            nodeData,
            labelData: [],
            scales: this.calculateScaling(),
            groupScale: this.getScaling(this.groupScale),
            visible: this.visible,
            styles: getItemStylesPerItemId(this.getItemStyle.bind(this), 'up', 'down'),
        };
        if (!visible) return context;

        const handleDatum = (
            datumIndex: number,
            xValue: any,
            openValue: any,
            closeValue: any,
            highValue: any,
            lowValue: any,
            width: number,
            crisp: boolean
        ) => {
            const datum = rawData[datumIndex];

            const xOffset = applyWidthOffset ? width / 2 : 0;
            const centerX = xAxis.scale.convert(xValue) + groupOffset + xOffset;
            const yOpen = yAxis.scale.convert(openValue);
            const yClose = yAxis.scale.convert(closeValue);
            const yHigh = yAxis.scale.convert(highValue);
            const yLow = yAxis.scale.convert(lowValue);

            const isRising = closeValue > openValue;
            const itemType = isRising ? 'up' : 'down';

            const y = Math.min(yHigh, yLow);
            const height = Math.max(yHigh, yLow) - y;

            const midPoint = {
                x: centerX,
                y: y + height / 2,
            };

            nodeData.push({
                series: this,
                itemType,
                datum,
                datumIndex,
                xKey,
                xValue,
                openValue,
                closeValue,
                highValue,
                lowValue,
                midPoint,
                aggregatedValue: closeValue,
                isRising,
                centerX,
                width,
                y,
                height,
                yOpen,
                yClose,
                crisp,
            });
        };

        const { dataAggregationFilters } = this;
        const xScale = xAxis.scale;
        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        const xPosition = (index: number) => xScale.convert(xValues[index]) + groupOffset;
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (dataAggregationFilter == null) {
            const invalidData = processedData.invalidData?.get(this.id);
            let [start, end] = visibleRangeIndices(1, rawData.length, xAxis.range, (index) => {
                const xOffset = applyWidthOffset ? 0 : -effectiveBarWidth / 2;
                const x = xPosition(index) + xOffset;
                return [x, x + effectiveBarWidth];
            });
            // @todo(AG-13575) Remove this if block
            if (processedData.input.count < 1e3) {
                start = 0;
                end = processedData.input.count;
            }

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
                if (invalidData?.[datumIndex] === true) continue;

                const xValue = xValues[datumIndex];
                if (xValue == null) continue;

                const openValue = openValues[datumIndex];
                const closeValue = closeValues[datumIndex];
                const highValue = highValues[datumIndex];
                const lowValue = lowValues[datumIndex];

                // compare unscaled values
                const validLowValue = lowValue != null && lowValue <= openValue && lowValue <= closeValue;
                const validHighValue = highValue != null && highValue >= openValue && highValue >= closeValue;

                if (!validLowValue) {
                    Logger.warnOnce(
                        `invalid low value for key [${lowKey}] in data element, low value cannot be higher than datum open or close values`
                    );
                    continue;
                }

                if (!validHighValue) {
                    Logger.warnOnce(
                        `invalid high value for key [${highKey}] in data element, high value cannot be lower than datum open or close values.`
                    );
                    continue;
                }

                handleDatum(datumIndex, xValue, openValue, closeValue, highValue, lowValue, effectiveBarWidth, true);
            }
        } else {
            const { maxRange, indexData } = dataAggregationFilter;
            const [start, end] = visibleRangeIndices(1, maxRange, xAxis.range, (index) => {
                const aggIndex = index * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                const closeIndex = indexData[aggIndex + CLOSE];
                if (openIndex === -1) return;
                const xOffset = applyWidthOffset ? 0 : -effectiveBarWidth / 2;
                return [xPosition(openIndex) + xOffset, xPosition(closeIndex) + xOffset + effectiveBarWidth];
            });

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                const closeIndex = indexData[aggIndex + CLOSE];
                const highIndex = indexData[aggIndex + HIGH];
                const lowIndex = indexData[aggIndex + LOW];

                if (openIndex === -1) continue;

                const midDatumIndex = Math.trunc((openIndex + closeIndex) / 2);

                const xValue = xValues[midDatumIndex];
                if (xValue == null) continue;

                const openValue = openValues[openIndex];
                const closeValue = closeValues[closeIndex];
                const highValue = highValues[highIndex];
                const lowValue = lowValues[lowIndex];

                const width = Math.abs(xPosition(closeIndex) - xPosition(openIndex)) + effectiveBarWidth;

                handleDatum(midDatumIndex, xValue, openValue, closeValue, highValue, lowValue, width, false);
            }
        }

        return context;
    }

    protected override isVertical(): boolean {
        return true;
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected override updateDatumSelection(opts: {
        nodeData: OhlcNodeDatum[];
        datumSelection: _ModuleSupport.Selection<TNode, OhlcNodeDatum>;
        seriesIdx: number;
    }) {
        const data = opts.nodeData ?? [];
        return opts.datumSelection.update(data);
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
