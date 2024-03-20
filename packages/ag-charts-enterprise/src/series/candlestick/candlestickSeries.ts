import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import type { AgCandlestickSeriesItemType } from 'ag-charts-community/src/options/next';

import { ActiveCandlestickGroupStyles, CandlestickGroup } from './candlestickGroup';
import { CandlestickSeriesItem, CandlestickSeriesProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeDatum } from './candlestickTypes';
import { prepareCandlestickFromTo, resetCandlestickSelectionsScalingStartFn } from './candlestickUtil';

const {
    extent,
    extractDecoratedProperties,
    fixNumericExtent,
    keyProperty,
    mergeDefaults,
    SeriesNodePickMode,
    SMALLEST_KEY_INTERVAL,
    valueProperty,
    diff,
    animationValidation,
    ChartAxisDirection,
    convertValuesToScaleByDefs,
} = _ModuleSupport;
const { motion } = _Scene;

const { sanitizeHtml, Logger } = _Util;
const { ContinuousScale, OrdinalTimeScale } = _Scale;

class CandlestickSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<CandlestickNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: CandlestickNodeDatum, series: CandlestickSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.openKey = series.properties.openKey;
        this.closeKey = series.properties.closeKey;
        this.highKey = series.properties.highKey;
        this.lowKey = series.properties.lowKey;
    }
}

export class CandlestickSeries extends _ModuleSupport.AbstractBarSeries<
    CandlestickGroup,
    CandlestickSeriesProperties,
    CandlestickNodeDatum
> {
    static readonly className = 'CandleStickSeries';
    static readonly type = 'candlestick' as const;

    override properties = new CandlestickSeriesProperties();

    protected override readonly NodeEvent = CandlestickSeriesNodeEvent;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            directionKeys: {
                x: ['xKey'],
                y: ['lowKey', 'highKey', 'openKey', 'closeKey'],
            },
            directionNames: {
                x: ['xName'],
                y: ['lowName', 'highName', 'openName', 'closeName'],
            },
            pathsPerSeries: 1,
        });
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (!this.properties.isValid()) {
            return;
        }

        const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;

        const animationEnabled = !this.ctx.animationManager.isSkipped();

        const xScale = this.getCategoryAxis()?.scale;
        const isContinuousX = ContinuousScale.is(xScale) || OrdinalTimeScale.is(xScale);
        const xValueType = ContinuousScale.is(xScale) ? 'range' : 'category';

        const extraProps = [];
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const { processedData } = await this.requestDataModel(dataController, this.data, {
            props: [
                keyProperty(xKey, isContinuousX, { id: `xValue`, valueType: xValueType }),
                valueProperty(openKey, true, { id: `openValue` }),
                valueProperty(closeKey, true, { id: `closeValue` }),
                valueProperty(highKey, true, { id: `highValue` }),
                valueProperty(lowKey, true, { id: `lowValue` }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...extraProps,
            ],
            dataVisible: this.visible,
        });

        this.smallestDataInterval = {
            x: processedData.reduced?.smallestKeyInterval ?? Infinity,
            y: Infinity,
        };

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!(processedData && dataModel)) return [];

        if (direction === this.getBarDirection()) {
            const lowValues = dataModel.getDomain(this, `lowValue`, 'value', processedData);
            const highValues = dataModel.getDomain(this, `highValue`, 'value', processedData);
            const openValues = dataModel.getDomain(this, `openValue`, 'value', processedData);
            const closeValues = dataModel.getDomain(this, `closeValue`, 'value', processedData);

            return fixNumericExtent(
                [
                    Math.min(...lowValues, ...highValues, ...openValues, ...closeValues),
                    Math.max(...highValues, ...lowValues, ...openValues, ...closeValues),
                ],
                this.getValueAxis()
            );
        }

        const { index, def } = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const keys = processedData.domain.keys[index];
        if (def.type === 'key' && def.valueType === 'category') {
            return keys;
        }

        const categoryAxis = this.getCategoryAxis();
        const isReversed = categoryAxis?.isReversed();

        const keysExtent = extent(keys) ?? [NaN, NaN];
        const scalePadding = smallestDataInterval && isFinite(smallestDataInterval.x) ? smallestDataInterval.x : 0;

        if (direction === ChartAxisDirection.Y) {
            const d0 = keysExtent[0] + (isReversed ? 0 : -scalePadding);
            const d1 = keysExtent[1] + (isReversed ? scalePadding : 0);
            return fixNumericExtent([d0, d1], categoryAxis);
        }

        const d0 = keysExtent[0] + (isReversed ? -scalePadding : 0);
        const d1 = keysExtent[1] + (isReversed ? 0 : scalePadding);
        return fixNumericExtent([d0, d1], categoryAxis);
    }

    async createNodeData() {
        const { visible, dataModel } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && visible && xAxis && yAxis)) {
            return [];
        }

        const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;

        const nodeData: CandlestickNodeDatum[] = [];

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [
            'xValue',
            'openValue',
            'closeValue',
            'highValue',
            'lowValue',
        ]);

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const { groupScale, processedData } = this;

        processedData?.data.forEach(({ datum, keys, values }) => {
            const { xValue, openValue, closeValue, highValue, lowValue } = dataModel.resolveProcessedDataDefsValues(
                defs,
                { keys, values }
            );

            // compare unscaled values
            const validLowValue = lowValue !== undefined && lowValue <= openValue && lowValue <= closeValue;
            const validHighValue = highValue !== undefined && highValue >= openValue && highValue >= closeValue;

            if (!validLowValue) {
                Logger.warnOnce(
                    `invalid low value for key [${lowKey}] in data element, low value cannot be higher than datum open or close values`
                );
                return;
            }

            if (!validHighValue) {
                Logger.warnOnce(
                    `invalid high value for key [${highKey}] in data element, high value cannot be lower than datum open or close values.`
                );
                return;
            }

            const scaledValues = convertValuesToScaleByDefs({
                defs,
                values: {
                    xValue,
                    openValue,
                    closeValue,
                    highValue,
                    lowValue,
                },
                xAxis,
                yAxis,
            });

            scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex)));

            const isRising = closeValue > openValue;
            const itemId = this.getSeriesItemType(isRising);
            const {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                wick,
                cornerRadius,
            } = this.getItemConfig(itemId);

            const y = Math.min(scaledValues.openValue, scaledValues.closeValue);
            const yBottom = Math.max(scaledValues.openValue, scaledValues.closeValue);
            const height = yBottom - y;

            const midPoint = {
                x: scaledValues.xValue + Math.round(barWidth) / 2,
                y: y + height / 2,
            };

            nodeData.push({
                series: this,
                itemId,
                datum,
                xKey,
                xValue,
                openKey,
                closeKey,
                highKey,
                lowKey,
                openValue,
                closeValue,
                highValue,
                lowValue,
                bandwidth: Math.round(barWidth),
                scaledValues,
                wick,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                cornerRadius,
                midPoint,
                aggregatedValue: closeValue,
            });
        });

        return [{ itemId: xKey, nodeData, labelData: [], scales: super.calculateScaling(), visible: this.visible }];
    }

    private getSeriesItemType(isRising: boolean): AgCandlestickSeriesItemType {
        return isRising ? 'up' : 'down';
    }

    private getItemConfig(seriesItemType: AgCandlestickSeriesItemType): CandlestickSeriesItem {
        switch (seriesItemType) {
            case 'up': {
                return this.properties.item.up;
            }
            case 'down': {
                return this.properties.item.down;
            }
        }
    }

    getLegendData(_legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        return [];
    }

    getTooltipHtml(nodeDatum: CandlestickNodeDatum): string {
        const {
            xKey,
            openKey,
            closeKey,
            highKey,
            lowKey,
            xName,
            yName,
            openName,
            closeName,
            highName,
            lowName,
            tooltip,
        } = this.properties;
        const { datum } = nodeDatum;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xAxis || !yAxis || !this.properties.isValid()) return '';

        const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.substring(1);

        const title = sanitizeHtml(yName);
        const contentData: [string, string | undefined, _ModuleSupport.ChartAxis][] = [
            [xKey, xName, xAxis],
            [openKey, openName, yAxis],
            [highKey, highName, yAxis],
            [lowKey, lowName, yAxis],
            [closeKey, closeName, yAxis],
        ];
        const content = contentData
            .map(([key, name, axis]) => sanitizeHtml(`${name ?? capitalise(key)}: ${axis.formatDatum(datum[key])}`))
            .join('<br/>');

        let { fill } = this.getFormattedStyles(nodeDatum);

        if (fill === 'transparent') {
            fill = this.properties.item.down.fill;
        }

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: fill },
            {
                seriesId: this.id,
                datum,
                fill,
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
                xName,
                yName,
                openName,
                closeName,
                highName,
                lowName,
            }
        );
    }

    protected override animateEmptyUpdateReady({
        datumSelections,
    }: _ModuleSupport.CartesianAnimationData<CandlestickGroup, CandlestickNodeDatum>) {
        const isVertical = this.isVertical();
        const { from, to } = prepareCandlestickFromTo(isVertical);
        motion.resetMotion(datumSelections, resetCandlestickSelectionsScalingStartFn(isVertical));
        motion.staticFromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, from, to, {
            phase: 'initial',
        });
    }

    protected override isVertical(): boolean {
        return true;
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected override async updateDatumSelection(opts: {
        nodeData: CandlestickNodeDatum[];
        datumSelection: _Scene.Selection<CandlestickGroup, CandlestickNodeDatum>;
        seriesIdx: number;
    }) {
        const data = opts.nodeData ?? [];
        return opts.datumSelection.update(data);
    }

    protected override async updateDatumNodes({
        datumSelection,
        isHighlight: highlighted,
    }: {
        datumSelection: _Scene.Selection<CandlestickGroup, CandlestickNodeDatum>;
        isHighlight: boolean;
    }) {
        datumSelection.each((candlestickGroup, nodeDatum) => {
            let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);

            if (highlighted) {
                activeStyles = mergeDefaults(this.properties.highlightStyle.item, activeStyles);
            }

            const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;

            activeStyles.wick = mergeDefaults(activeStyles.wick, {
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });

            candlestickGroup.updateDatumStyles(
                nodeDatum,
                activeStyles as _ModuleSupport.DeepRequired<ActiveCandlestickGroupStyles>
            );
        });
    }

    protected async updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, CandlestickNodeDatum>;
        seriesIdx: number;
    }) {
        // Labels unsupported
    }

    protected async updateLabelSelection(opts: {
        labelData: CandlestickNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, CandlestickNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
    }

    protected override nodeFactory() {
        return new CandlestickGroup();
    }

    getFormattedStyles(nodeDatum: CandlestickNodeDatum, highlighted = false): ActiveCandlestickGroupStyles {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { xKey, openKey, closeKey, highKey, lowKey, formatter } = this.properties;
        const {
            datum,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wick,
            itemId,
            cornerRadius,
        } = nodeDatum;
        const activeStyles = {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wick: extractDecoratedProperties(wick),
            cornerRadius,
        };

        if (formatter) {
            const formatStyles = callbackCache.call(formatter, {
                datum,
                seriesId,
                itemId,
                highlighted,
                ...activeStyles,
                xKey,
                openKey,
                closeKey,
                highKey,
                lowKey,
            });
            if (formatStyles) {
                return mergeDefaults(formatStyles, activeStyles);
            }
        }
        return activeStyles;
    }
}
