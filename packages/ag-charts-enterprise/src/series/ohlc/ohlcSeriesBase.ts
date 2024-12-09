import {
    type AgOhlcSeriesItemType,
    type FillOptions,
    type LineDashOptions,
    type StrokeOptions,
    _ModuleSupport,
} from 'ag-charts-community';

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
    Logger,
    ContinuousScale,
    OrdinalTimeScale,
} = _ModuleSupport;

export interface OhlcNodeDatum extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'> {
    readonly itemId: AgOhlcSeriesItemType;

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
}

class OhlcSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<OhlcNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: OhlcNodeDatum, series: OhlcSeriesBase<OhlcBaseNode, any>) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.openKey = series.properties.openKey;
        this.closeKey = series.properties.closeKey;
        this.highKey = series.properties.highKey;
        this.lowKey = series.properties.lowKey;
    }
}

export abstract class OhlcSeriesBase<
    TNode extends OhlcBaseNode,
    TSeriesOptions extends OhlcSeriesBaseProperties<any>,
> extends _ModuleSupport.AbstractBarSeries<TNode, TSeriesOptions, OhlcNodeDatum> {
    protected override readonly NodeEvent = OhlcSeriesNodeEvent;

    private dataAggregationFilters: OhlcSeriesDataAggregationFilter[] | undefined = undefined;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.AXIS_ALIGNED, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            directionKeys: {
                x: ['xKey'],
                y: ['lowKey', 'highKey', 'openKey', 'closeKey'],
            },
            directionNames: {
                x: ['xName'],
                y: ['lowName', 'highName', 'openName', 'closeName'],
            },
            pathsPerSeries: [],
        });
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (!this.properties.isValid() || !this.visible) return;

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
        if (processedData.rawData.length === 0) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null || !(ContinuousScale.is(xAxis.scale) || OrdinalTimeScale.is(xAxis.scale))) return;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const highValues = dataModel.resolveColumnById(this, `highValue`, processedData);
        const lowValues = dataModel.resolveColumnById(this, `lowValue`, processedData);

        const { index } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const domain = processedData.domain.keys[index];

        return aggregateOhlcData(xValues, highValues, lowValues, domain);
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return [];

        const { openKey } = this.properties;

        if (direction === this.getBarDirection()) {
            const lowValues = dataModel.getDomain(this, `lowValue`, 'value', processedData);
            const highValues = dataModel.getDomain(this, `highValue`, 'value', processedData);
            const openValues = openKey ? dataModel.getDomain(this, `openValue`, 'value', processedData) : [];
            const closeValues = dataModel.getDomain(this, `closeValue`, 'value', processedData);

            return fixNumericExtent([
                Math.min(...lowValues, ...highValues, ...openValues, ...closeValues),
                Math.max(...highValues, ...lowValues, ...openValues, ...closeValues),
            ]);
        }

        const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = processedData.domain.keys[index];
        if (def.type === 'key' && def.valueType === 'category') {
            return keys;
        }
        return this.padBandExtent(keys);
    }

    override getSeriesRange(_direction: _ModuleSupport.ChartAxisDirection, visibleRange: [any, any]): [number, number] {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return [NaN, NaN];

        const xAxis = this.axes[ChartAxisDirection.X]!;
        const xScale = xAxis.scale;
        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);

        const barWidth = xScale.bandwidth ?? 0;

        const [x0, x1] = visibleRangeIndices(xValues.length, visibleRange, (index) => {
            const x = xScale.convert(xValues[index]);
            return [x, x + barWidth];
        });

        return dataModel.getDomainBetweenRange(this, ['highValue', 'lowValue'], [x0, x1], processedData);
    }

    override createNodeData() {
        const { visible, dataModel, processedData } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && processedData != null && processedData.rawData.length !== 0 && xAxis && yAxis)) {
            return;
        }

        const nodeData: OhlcNodeDatum[] = [];
        const { xKey, highKey, lowKey } = this.properties;
        const { rawData } = processedData;
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

        const context = {
            itemId: xKey,
            nodeData,
            labelData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
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

            const centerX = xAxis.scale.convert(xValue) + groupOffset + width / 2;
            const yOpen = yAxis.scale.convert(openValue);
            const yClose = yAxis.scale.convert(closeValue);
            const yHigh = yAxis.scale.convert(highValue);
            const yLow = yAxis.scale.convert(lowValue);

            const isRising = closeValue > openValue;
            const itemId = isRising ? 'up' : 'down';

            const y = Math.min(yHigh, yLow);
            const height = Math.max(yHigh, yLow) - y;

            const midPoint = {
                x: centerX,
                y: y + height / 2,
            };

            nodeData.push({
                series: this,
                itemId,
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
        const range = r1 - r0;

        const xPosition = (index: number) => xScale.convert(xValues[index]) + groupOffset;
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (dataAggregationFilter == null) {
            let [start, end] = visibleRangeIndices(rawData.length, xAxis.range, (index) => {
                const x = xPosition(index);
                return [x, x + effectiveBarWidth];
            });
            // @todo(AG-13575) Remove this if block
            if (processedData.rawData.length < 1e3) {
                start = 0;
                end = processedData.rawData.length;
            }

            for (let datumIndex = start; datumIndex < end; datumIndex += 1) {
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
            const [start, end] = visibleRangeIndices(maxRange, xAxis.range, (index) => {
                const aggIndex = index * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                const closeIndex = indexData[aggIndex + CLOSE];
                if (openIndex === -1) return;
                return [xPosition(openIndex), xPosition(closeIndex) + effectiveBarWidth];
            });

            for (let i = start; i < end; i += 1) {
                const aggIndex = i * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                const closeIndex = indexData[aggIndex + CLOSE];
                const highIndex = indexData[aggIndex + HIGH];
                const lowIndex = indexData[aggIndex + LOW];

                if (openIndex === -1) continue;

                const midDatumIndex = ((openIndex + closeIndex) / 2) | 0;

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

    protected getItemBaseStyle(
        itemId: 'up' | 'down',
        highlighted = false
    ): _ModuleSupport.RequireOptional<FillOptions & StrokeOptions & LineDashOptions> {
        const { properties } = this;
        const item = properties.item[itemId];
        const highlightStyle = highlighted ? properties.highlightStyle.item : undefined;
        return {
            fill: highlightStyle?.fill ?? item.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? item.fillOpacity,
            stroke: highlightStyle?.stroke ?? item.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? item.strokeWidth,
            strokeOpacity: highlightStyle?.strokeOpacity ?? item.strokeOpacity,
            lineDash: highlightStyle?.lineDash ?? item.lineDash,
            lineDashOffset: highlightStyle?.lineDashOffset ?? item.lineDashOffset,
        };
    }

    protected getItemStyleOverrides(
        datumId: string,
        datum: any,
        itemId: 'up' | 'down',
        format: _ModuleSupport.RequireOptional<FillOptions & StrokeOptions & LineDashOptions>,
        highlighted = false
    ) {
        const { id: seriesId, properties } = this;

        const { itemStyler } = properties;

        if (itemStyler == null) return;

        const { xKey, openKey, closeKey, highKey, lowKey } = properties;
        return this.cachedDatumCallback(createDatumId(datumId, highlighted ? 'highlight' : 'node'), () => {
            return itemStyler({
                seriesId,
                datum,
                itemId,
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
                highlighted,
                ...format,
            });
        });
    }

    override getTooltipContent(nodeDatum: OhlcNodeDatum): _ModuleSupport.TooltipContent | string | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
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
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || processedData.rawData.length === 0 || !xAxis || !yAxis) {
            return;
        }

        const { datumIndex } = nodeDatum;
        const datum = processedData.rawData[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const openValue = dataModel.resolveColumnById(this, `openValue`, processedData)[datumIndex];
        const highValue = dataModel.resolveColumnById(this, `highValue`, processedData)[datumIndex];
        const lowValue = dataModel.resolveColumnById(this, `lowValue`, processedData)[datumIndex];
        const closeValue = dataModel.resolveColumnById(this, `closeValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const itemId = closeValue >= openValue ? 'up' : 'down';
        const item = this.properties.item[itemId];

        const format = this.getItemBaseStyle(itemId);
        Object.assign(format, this.getItemStyleOverrides(String(datumIndex), datum, itemId, format));

        return tooltip.formatTooltip(
            {
                heading: xAxis.formatDatum(xValue),
                title: legendItemName,
                symbol: {
                    marker: {
                        fill: item.fill ?? item.stroke,
                        fillOpacity: item.fillOpacity ?? item.strokeOpacity ?? 1,
                        stroke: item.stroke,
                        strokeWidth: item.strokeWidth ?? 1,
                        strokeOpacity: item.strokeOpacity ?? 1,
                    },
                },
                data: [
                    { label: openName, fallbackLabel: openKey, value: yAxis.formatDatum(openValue) },
                    { label: highName, fallbackLabel: highKey, value: yAxis.formatDatum(highValue) },
                    { label: lowName, fallbackLabel: lowKey, value: yAxis.formatDatum(lowValue) },
                    { label: closeName, fallbackLabel: closeKey, value: yAxis.formatDatum(closeValue) },
                ],
            },
            {
                seriesId,
                datum,
                title: yName,
                itemId,
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
            }
        );
    }

    protected getDatumId(datum: OhlcNodeDatum) {
        return createDatumId(datum.xValue);
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
        return computeBarFocusBounds(datum);
    }
}
