import {
    AgCandlestickSeriesBaseFormatterParams,
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesItemType,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import type { CandlestickBaseGroup } from './candlestickGroup';
import type { CandlestickSeriesBaseItems, CandlestickSeriesBaseProperties } from './candlestickSeriesProperties';
import type { CandlestickNodeBaseDatum } from './candlestickTypes';
import { prepareCandlestickAnimationFunctions } from './candlestickUtil';

const { motion } = _Scene;

const {
    extent,
    fixNumericExtent,
    keyProperty,
    SeriesNodePickMode,
    SMALLEST_KEY_INTERVAL,
    valueProperty,
    diff,
    animationValidation,
    convertValuesToScaleByDefs,
    mergeDefaults,
    isFiniteNumber,
} = _ModuleSupport;

const { sanitizeHtml, Logger } = _Util;
const { ContinuousScale } = _Scale;

class CandlestickSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<CandlestickNodeBaseDatum, TEvent> {
    readonly xKey?: string;
    readonly openKey?: string;
    readonly closeKey?: string;
    readonly highKey?: string;
    readonly lowKey?: string;

    constructor(
        type: TEvent,
        nativeEvent: Event,
        datum: CandlestickNodeBaseDatum,
        series: CandlestickSeriesBase<
            CandlestickBaseGroup<CandlestickNodeBaseDatum, any>,
            any,
            any,
            CandlestickNodeBaseDatum,
            AgCandlestickSeriesBaseFormatterParams<CandlestickNodeBaseDatum>
        >
    ) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.openKey = series.properties.openKey;
        this.closeKey = series.properties.closeKey;
        this.highKey = series.properties.highKey;
        this.lowKey = series.properties.lowKey;
    }
}

export abstract class CandlestickSeriesBase<
    TItemShapeGroup extends CandlestickBaseGroup<TNodeDatum, TItemOptions>,
    TItemOptions extends AgCandlestickSeriesItemOptions,
    TSeriesOptions extends CandlestickSeriesBaseProperties<
        any,
        TItemOptions,
        CandlestickSeriesBaseItems<TItemOptions>,
        TFormatterParams
    >,
    TNodeDatum extends CandlestickNodeBaseDatum,
    TFormatterParams extends AgCandlestickSeriesBaseFormatterParams<TNodeDatum>,
> extends _ModuleSupport.AbstractBarSeries<TItemShapeGroup, TSeriesOptions, TNodeDatum> {
    protected override readonly NodeEvent = CandlestickSeriesNodeEvent;

    constructor(
        moduleCtx: _ModuleSupport.ModuleContext,
        datumAnimationResetFnc: (
            node: TItemShapeGroup,
            datum: TNodeDatum
        ) => _ModuleSupport.AnimationValue & Partial<TItemShapeGroup>
    ) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            directionKeys: {
                x: ['xKey'],
                y: ['lowKey', 'highKey', 'openKey', 'closeKey'],
            },
            directionNames: {
                x: ['xName'],
                y: ['lowName', 'highName', 'openName', 'closeName'],
            },
            pathsPerSeries: 1,
            datumSelectionGarbageCollection: false,
            animationAlwaysUpdateSelections: true,
            animationResetFns: {
                datum: datumAnimationResetFnc,
            },
        });
    }

    protected override animateEmptyUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<TItemShapeGroup, TNodeDatum>) {
        const animationFns = prepareCandlestickAnimationFunctions(true);
        motion.fromToMotion(this.id, 'datums', this.ctx.animationManager, [datumSelection], animationFns);
    }

    protected override animateWaitingUpdateReady({
        datumSelection,
    }: _ModuleSupport.CartesianAnimationData<TItemShapeGroup, TNodeDatum>) {
        const { processedData } = this;
        const difference = processedData?.reduced?.diff;

        const animationFns = prepareCandlestickAnimationFunctions(false);
        motion.fromToMotion(
            this.id,
            'datums',
            this.ctx.animationManager,
            [datumSelection],
            animationFns,
            (_, datum) => String(datum.xValue),
            difference
        );
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
                extraProps.push(diff(this.processedData));
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

        const { processedData } = await this.requestDataModel(dataController, this.data, {
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

        this.animationState.transition('updateData');
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!(processedData && dataModel)) return [];

        const { openKey } = this.properties;

        if (direction === this.getBarDirection()) {
            const lowValues = dataModel.getDomain(this, `lowValue`, 'value', processedData);
            const highValues = dataModel.getDomain(this, `highValue`, 'value', processedData);
            const openValues = openKey ? dataModel.getDomain(this, `openValue`, 'value', processedData) : [];
            const closeValues = dataModel.getDomain(this, `closeValue`, 'value', processedData);

            return fixNumericExtent(
                [
                    Math.min(...lowValues, ...highValues, ...openValues, ...closeValues),
                    Math.max(...highValues, ...lowValues, ...openValues, ...closeValues),
                ],
                this.getValueAxis()
            );
        }

        const { index, def } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = processedData.domain.keys[index];
        if (def.type === 'key' && def.valueType === 'category') {
            return keys;
        }

        const categoryAxis = this.getCategoryAxis();

        const keysExtent = extent(keys) ?? [NaN, NaN];
        const scalePadding = isFiniteNumber(smallestDataInterval) ? smallestDataInterval : 0;

        const d0 = keysExtent[0] + -scalePadding;
        const d1 = keysExtent[1] + scalePadding;
        return fixNumericExtent([d0, d1], categoryAxis);
    }

    createBaseNodeData() {
        const { visible, dataModel } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(dataModel && xAxis && yAxis)) {
            return;
        }

        const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;

        const nodeData: CandlestickNodeBaseDatum[] = [];

        const ids = ['xValue', 'closeValue', 'highValue', 'lowValue'];
        if (openKey) {
            ids.push('openValue');
        }
        const defs = dataModel.resolveProcessedDataDefsByIds(this, ids);

        const { barWidth, groupIndex } = this.updateGroupScale(xAxis);
        const barOffset = ContinuousScale.is(xAxis.scale) ? barWidth * -0.5 : 0;
        const { groupScale, processedData } = this;

        const context = {
            itemId: xKey,
            nodeData,
            labelData: [],
            scales: this.calculateScaling(),
            visible: this.visible,
        };
        if (!visible) return context;

        processedData?.data.forEach(({ datum, keys, values }) => {
            const { xValue, openValue, closeValue, highValue, lowValue } = dataModel.resolveProcessedDataDefsValues(
                defs,
                { keys, values }
            );

            const hasOpenValue = openValue !== undefined;
            // compare unscaled values
            const validLowValue =
                lowValue !== undefined && (!hasOpenValue || lowValue <= openValue) && lowValue <= closeValue;
            const validHighValue =
                highValue !== undefined && (!hasOpenValue || highValue >= openValue) && highValue >= closeValue;

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

            scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex))) + barOffset;

            const isRising = !hasOpenValue || closeValue > openValue;
            const itemId = this.getSeriesItemType(isRising);

            const [y1, y2] = hasOpenValue
                ? [scaledValues.openValue, scaledValues.closeValue]
                : [scaledValues.lowValue, scaledValues.highValue];

            const y = Math.min(y1, y2);
            const yBottom = Math.max(y1, y2);
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
                midPoint,
                aggregatedValue: closeValue,
            });
        });

        return context;
    }

    private getSeriesItemType(isRising: boolean): AgCandlestickSeriesItemType {
        return isRising ? 'up' : 'down';
    }

    protected getItemConfig(seriesItemType: AgCandlestickSeriesItemType) {
        return this.properties.item[seriesItemType];
    }

    getLegendData(_legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        return [];
    }

    getTooltipHtml(nodeDatum: TNodeDatum): _ModuleSupport.TooltipContent {
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
        const { datum, itemId } = nodeDatum;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xAxis || !yAxis || !this.properties.isValid()) return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;

        const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.substring(1);

        const title = sanitizeHtml(yName);
        const contentData: [string, string | undefined, _ModuleSupport.ChartAxis][] = [
            [xKey, xName, xAxis],
            [highKey, highName, yAxis],
            [lowKey, lowName, yAxis],
            [closeKey, closeName, yAxis],
        ];

        if (openKey) {
            contentData.splice(1, 0, [openKey, openName, yAxis]);
        }

        const content = contentData
            .map(([key, name, axis]) => sanitizeHtml(`${name ?? capitalise(key)}: ${axis.formatDatum(datum[key])}`))
            .join('<br/>');

        const styles = this.getFormattedStyles(nodeDatum);

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: styles.stroke },
            {
                seriesId: this.id,
                datum,
                ...styles,
                xKey,
                openKey: openKey ?? '',
                closeKey,
                highKey,
                lowKey,
                xName,
                yName,
                openName,
                closeName,
                highName,
                lowName,
                title,
                color: styles.fill,
                fill: styles.fill,
                itemId,
            }
        );
    }

    protected override isVertical(): boolean {
        return true;
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected override async updateDatumSelection(opts: {
        nodeData: TNodeDatum[];
        datumSelection: _Scene.Selection<TItemShapeGroup, TNodeDatum>;
        seriesIdx: number;
    }) {
        const data = opts.nodeData ?? [];
        return opts.datumSelection.update(data);
    }

    protected override async updateDatumNodes({
        datumSelection,
        isHighlight: highlighted,
    }: {
        datumSelection: _Scene.Selection<TItemShapeGroup, TNodeDatum>;
        isHighlight: boolean;
    }) {
        datumSelection.each((group, nodeDatum) => {
            const activeStyles = this.getActiveStyles(nodeDatum, highlighted);

            group.updateDatumStyles(nodeDatum, activeStyles);
        });
    }

    protected async updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, TNodeDatum>;
        seriesIdx: number;
    }) {
        // Labels unsupported
    }

    protected async updateLabelSelection(opts: {
        labelData: TNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, TNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
    }

    getFormattedStyles(nodeDatum: TNodeDatum, highlighted = false): TItemOptions {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { xKey, openKey = '', closeKey, highKey, lowKey, formatter } = this.properties;

        if (formatter) {
            const formatStyles = callbackCache.call(
                formatter,
                this.getFormatterParams({
                    ...nodeDatum,
                    seriesId,
                    highlighted,
                    xKey,
                    openKey,
                    closeKey,
                    highKey,
                    lowKey,
                })
            );
            if (formatStyles) {
                return mergeDefaults(formatStyles, this.getSeriesStyles(nodeDatum)) as TItemOptions;
            }
        }
        return this.getSeriesStyles(nodeDatum);
    }

    protected abstract getFormatterParams(params: AgCandlestickSeriesBaseFormatterParams<TNodeDatum>): TFormatterParams;
    protected abstract getSeriesStyles(_nodeDatum: TNodeDatum): TItemOptions;
    protected abstract getActiveStyles(nodeDatum: TNodeDatum, highlighted: boolean): TItemOptions;
}