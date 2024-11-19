import { type AgOhlcSeriesItemType, _ModuleSupport } from 'ag-charts-community';

import { visibleRange } from '../../utils/aggregation';
import { CLOSE, HIGH, LOW, OPEN, type OhlcSeriesDataAggregationFilter, SPAN, aggregateData } from './ohlcAggregation';
import type { OhlcBaseNode } from './ohlcNode';
import type { OhlcSeriesBaseProperties } from './ohlcSeriesProperties';

const {
    fixNumericExtent,
    keyProperty,
    findMinMax,
    createDatumId,
    SeriesNodePickMode,
    ChartAxisDirection,
    SMALLEST_KEY_INTERVAL,
    valueProperty,
    diff,
    animationValidation,
    computeBarFocusBounds,
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

        return aggregateData(xValues, highValues, lowValues, domain);
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
        const effectiveBarWidth = barWidth >= 1 ? barWidth : groupScale.rawBandwidth;
        const barOffset = ContinuousScale.is(xAxis.scale) ? effectiveBarWidth * -0.5 : 0;

        const context = {
            itemId: xKey,
            nodeData,
            labelData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
        };
        if (!visible) return context;

        const handleDatum = (
            datum: any,
            xValue: any,
            openValue: any,
            closeValue: any,
            highValue: any,
            lowValue: any,
            width: number,
            crisp: boolean
        ) => {
            // CRT-340 Use atleast 1px width to prevent nothing being drawn.

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
        const [x0, x1] = findMinMax(xAxis.range);
        const xFor = (index: number) => {
            const xDatum = xValues[index];
            return xScale.convert(xDatum) + groupOffset + barOffset;
        };

        const [r0, r1] = xScale.range;
        const range = r1 - r0;

        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        if (dataAggregationFilter == null) {
            const [start, end] = visibleRange(rawData.length, x0, x1, xFor);

            for (let i = start; i < end; i += 1) {
                const xValue = xValues[i];
                if (xValue == null) continue;

                const datum = rawData[i];
                const openValue = openValues[i];
                const closeValue = closeValues[i];
                const highValue = highValues[i];
                const lowValue = lowValues[i];

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

                handleDatum(datum, xValue, openValue, closeValue, highValue, lowValue, effectiveBarWidth, true);
            }
        } else {
            const { maxRange, indexData } = dataAggregationFilter;
            const [start, end] = visibleRange(maxRange, x0, x1, (index) => {
                const aggIndex = index * SPAN;
                const openIndex = indexData[aggIndex + OPEN];
                const closeIndex = indexData[aggIndex + CLOSE];
                const midDatumIndex = ((openIndex + closeIndex) / 2) | 0;
                return openIndex !== -1 ? xFor(midDatumIndex) : NaN;
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

                const datum = rawData[midDatumIndex];
                const openValue = openValues[openIndex];
                const closeValue = closeValues[closeIndex];
                const highValue = highValues[highIndex];
                const lowValue = lowValues[lowIndex];

                const width =
                    Math.abs(xScale.convert(xValues[closeIndex]) - xScale.convert(xValues[openIndex])) +
                    effectiveBarWidth;

                handleDatum(datum, xValue, openValue, closeValue, highValue, lowValue, width, false);
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

    protected updateLabelSelection(opts: {
        labelData: OhlcNodeDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, OhlcNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
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
        return computeBarFocusBounds(datum, this.contentGroup, opts.seriesRect);
    }
}
