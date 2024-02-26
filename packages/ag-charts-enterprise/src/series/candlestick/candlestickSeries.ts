import { AgCandlestickSeriesItemType, _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

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

export class CandlestickSeries extends _ModuleSupport.AbstractBarSeries<CandlestickGroup, CandlestickNodeDatum> {
    static type = 'candlestick' as const;

    override properties = new CandlestickSeriesProperties();

    protected override readonly NodeEvent = CandlestickSeriesNodeEvent;

    /**
     * Used to get the position of items within each group.
     */
    private groupScale = new _Scale.BandScale<string>();

    protected smallestDataInterval?: { x: number; y: number } = undefined;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
        });
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (!this.properties.isValid()) {
            return;
        }

        const { xKey, openKey, closeKey, highKey, lowKey } = this.properties;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const isContinuousX = this.getCategoryAxis()?.scale instanceof _Scale.ContinuousScale;
        const extraProps = [];
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation(this));
        }

        const { processedData } = await this.requestDataModel(dataController, this.data ?? [], {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, openKey, true, { id: `openValue` }),
                valueProperty(this, closeKey, true, { id: `closeValue` }),
                valueProperty(this, highKey, true, { id: `highValue` }),
                valueProperty(this, lowKey, true, { id: `lowValue` }),
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
        const {
            groupScale,
            smallestDataInterval,
            ctx: { seriesStateManager },
        } = this;

        const xBandWidth =
            xAxis.scale instanceof _Scale.ContinuousScale
                ? xAxis.scale.calcBandwidth(smallestDataInterval?.x)
                : xAxis.scale.bandwidth;

        const domain = [];
        const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
        for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
            domain.push(String(groupIdx));
        }
        groupScale.domain = domain;
        groupScale.range = [0, xBandWidth ?? 0];

        if (xAxis instanceof _ModuleSupport.CategoryAxis) {
            groupScale.paddingInner = xAxis.groupPaddingInner;
        }

        const barWidth =
            groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume bar charts.
                  groupScale.bandwidth
                : // Handle high-volume bar charts gracefully.
                  groupScale.rawBandwidth;

        const nodeData: CandlestickNodeDatum[] = [];

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [
            'xValue',
            'openValue',
            'closeValue',
            'highValue',
            'lowValue',
        ]);

        this.processedData?.data.forEach(({ datum, keys, values }) => {
            const { xValue, openValue, closeValue, highValue, lowValue } = dataModel.resolveProcessedDataDefsValues(
                defs,
                { keys, values }
            );

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
        const { datum } = nodeDatum as { datum: any };

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xAxis || !yAxis || !this.properties.isValid()) return '';

        const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.substring(1);

        const title = _Util.sanitizeHtml(yName);
        const contentData: [string, string | undefined, _ModuleSupport.ChartAxis][] = [
            [xKey, xName, xAxis],
            [openKey, openName, yAxis],
            [closeKey, closeName, yAxis],
            [highKey, highName, yAxis],
            [lowKey, lowName, yAxis],
        ];
        const content = contentData
            .map(([key, name, axis]) =>
                _Util.sanitizeHtml(`${name ?? capitalise(key)}: ${axis.formatDatum(datum[key])}`)
            )
            .join('<br/>');

        const { fill } = this.getFormattedStyles(nodeDatum);

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
    }) {}

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
