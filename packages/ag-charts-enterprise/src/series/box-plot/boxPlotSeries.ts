import { type AgBoxPlotSeriesStyles, _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { prepareBoxPlotFromTo, resetBoxPlotSelectionsScalingCenterFn } from './blotPlotUtil';
import { BoxPlotGroup } from './boxPlotGroup';
import { BoxPlotSeriesProperties } from './boxPlotSeriesProperties';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

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
} = _ModuleSupport;
const { motion } = _Scene;

class BoxPlotSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<BoxPlotNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly minKey?: string;
    readonly q1Key?: string;
    readonly medianKey?: string;
    readonly q3Key?: string;
    readonly maxKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: BoxPlotNodeDatum, series: BoxPlotSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.minKey = series.properties.minKey;
        this.q1Key = series.properties.q1Key;
        this.medianKey = series.properties.medianKey;
        this.q3Key = series.properties.q3Key;
        this.maxKey = series.properties.maxKey;
    }
}

export class BoxPlotSeries extends _ModuleSupport.AbstractBarSeries<BoxPlotGroup, BoxPlotNodeDatum> {
    static type = 'box-plot' as const;

    override properties = new BoxPlotSeriesProperties();

    protected override readonly NodeEvent = BoxPlotSeriesNodeEvent;

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

        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey } = this.properties;

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
                valueProperty(this, minKey, true, { id: `minValue` }),
                valueProperty(this, q1Key, true, { id: `q1Value` }),
                valueProperty(this, medianKey, true, { id: `medianValue` }),
                valueProperty(this, q3Key, true, { id: `q3Value` }),
                valueProperty(this, maxKey, true, { id: `maxValue` }),
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
            const minValues = dataModel.getDomain(this, `minValue`, 'value', processedData);
            const maxValues = dataModel.getDomain(this, `maxValue`, 'value', processedData);

            return fixNumericExtent([Math.min(...minValues), Math.max(...maxValues)], this.getValueAxis());
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

        const { xKey, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } =
            this.properties;
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

        const nodeData: BoxPlotNodeDatum[] = [];

        const defs = dataModel.resolveProcessedDataDefsByIds(this, [
            'xValue',
            'minValue',
            'q1Value',
            `medianValue`,
            `q3Value`,
            `maxValue`,
        ]);

        this.processedData?.data.forEach(({ datum, keys, values }) => {
            const { xValue, minValue, q1Value, medianValue, q3Value, maxValue } =
                dataModel.resolveProcessedDataDefsValues(defs, { keys, values });

            if (
                [minValue, q1Value, medianValue, q3Value, maxValue].some((value) => typeof value !== 'number') ||
                minValue > q1Value ||
                q1Value > medianValue ||
                medianValue > q3Value ||
                q3Value > maxValue
            ) {
                return;
            }

            const scaledValues = this.convertValuesToScaleByDefs(defs, {
                xValue,
                minValue,
                q1Value,
                medianValue,
                q3Value,
                maxValue,
            });

            scaledValues.xValue += Math.round(groupScale.convert(String(groupIndex)));

            nodeData.push({
                series: this,
                itemId: xValue,
                datum,
                xKey,
                bandwidth: Math.round(barWidth),
                scaledValues,
                cap,
                whisker,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });
        });

        return [{ itemId: xKey, nodeData, labelData: [], scales: super.calculateScaling(), visible: this.visible }];
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, data } = this;
        const {
            xKey,
            yName,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            showInLegend,
            legendItemName,
            visible,
        } = this.properties;

        if (!showInLegend || !data?.length || !xKey || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id,
                itemId: id,
                seriesId: id,
                enabled: visible,
                label: {
                    text: legendItemName ?? yName ?? id,
                },
                marker: { fill, fillOpacity, stroke, strokeOpacity, strokeWidth },
                legendItemName,
            },
        ];
    }

    getTooltipHtml(nodeDatum: BoxPlotNodeDatum): string {
        const {
            xKey,
            minKey,
            q1Key,
            medianKey,
            q3Key,
            maxKey,
            xName,
            yName,
            minName,
            q1Name,
            medianName,
            q3Name,
            maxName,
            tooltip,
        } = this.properties;
        const { datum } = nodeDatum as { datum: any };

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xAxis || !yAxis || !this.properties.isValid()) return '';

        const title = _Util.sanitizeHtml(yName);
        const contentData: [string, string | undefined, _ModuleSupport.ChartAxis][] = [
            [xKey, xName, xAxis],
            [minKey, minName, yAxis],
            [q1Key, q1Name, yAxis],
            [medianKey, medianName, yAxis],
            [q3Key, q3Name, yAxis],
            [maxKey, maxName, yAxis],
        ];
        const content = contentData
            .map(([key, name, axis]) => _Util.sanitizeHtml(`${name ?? key}: ${axis.formatDatum(datum[key])}`))
            .join(title ? '<br/>' : ', ');

        const { fill } = this.getFormattedStyles(nodeDatum);

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: fill },
            {
                seriesId: this.id,
                datum,
                fill,
                xKey,
                minKey,
                q1Key,
                medianKey,
                q3Key,
                maxKey,
                xName,
                minName,
                q1Name,
                medianName,
                q3Name,
                maxName,
            }
        );
    }

    protected override animateEmptyUpdateReady({
        datumSelections,
    }: _ModuleSupport.CartesianAnimationData<BoxPlotGroup, BoxPlotNodeDatum>) {
        const isVertical = this.isVertical();
        const { from, to } = prepareBoxPlotFromTo(isVertical);
        motion.resetMotion(datumSelections, resetBoxPlotSelectionsScalingCenterFn(isVertical));
        motion.staticFromToMotion(this.id, 'datums', this.ctx.animationManager, datumSelections, from, to, {
            phase: 'initial',
        });
    }

    protected isLabelEnabled(): boolean {
        return false;
    }

    protected override async updateDatumSelection(opts: {
        nodeData: BoxPlotNodeDatum[];
        datumSelection: _Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {
        const data = opts.nodeData ?? [];
        return opts.datumSelection.update(data);
    }

    protected override async updateDatumNodes({
        datumSelection,
        isHighlight: highlighted,
    }: {
        datumSelection: _Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        isHighlight: boolean;
    }) {
        const isVertical = this.isVertical();
        const isReversedValueAxis = this.getValueAxis()?.isReversed();
        const { cornerRadius } = this.properties;
        datumSelection.each((boxPlotGroup, nodeDatum) => {
            let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);

            if (highlighted) {
                activeStyles = mergeDefaults(this.properties.highlightStyle.item, activeStyles);
            }

            const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;

            activeStyles.whisker = mergeDefaults(activeStyles.whisker, {
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });

            boxPlotGroup.updateDatumStyles(
                nodeDatum,
                activeStyles as _ModuleSupport.DeepRequired<AgBoxPlotSeriesStyles>,
                isVertical,
                isReversedValueAxis,
                cornerRadius
            );
        });
    }

    protected async updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {}

    protected async updateLabelSelection(opts: {
        labelData: BoxPlotNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BoxPlotNodeDatum>;
        seriesIdx: number;
    }) {
        const { labelData, labelSelection } = opts;
        return labelSelection.update(labelData);
    }

    protected override nodeFactory() {
        return new BoxPlotGroup();
    }

    getFormattedStyles(nodeDatum: BoxPlotNodeDatum, highlighted = false): AgBoxPlotSeriesStyles {
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, formatter } = this.properties;
        const { datum, fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset, cap, whisker } =
            nodeDatum;
        const activeStyles: AgBoxPlotSeriesStyles = {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cap: extractDecoratedProperties(cap),
            whisker: extractDecoratedProperties(whisker),
        };

        if (formatter) {
            const formatStyles = callbackCache.call(formatter, {
                datum,
                seriesId,
                highlighted,
                ...activeStyles,
                xKey,
                minKey,
                q1Key,
                medianKey,
                q3Key,
                maxKey,
            });
            if (formatStyles) {
                return mergeDefaults(formatStyles, activeStyles);
            }
        }
        return activeStyles;
    }

    convertValuesToScaleByDefs<T extends string>(
        defs: [string, _ModuleSupport.ProcessedDataDef[]][],
        values: Record<T, unknown>
    ): Record<T, number> {
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();
        if (!(xAxis && yAxis)) {
            throw new Error('Axes must be defined');
        }
        const result: Record<string, number> = {};
        for (const [searchId, [{ def }]] of defs) {
            if (Object.hasOwn(values, searchId)) {
                const { scale } = def.type === 'key' ? xAxis : yAxis;
                result[searchId] = Math.round(scale.convert((values as any)[searchId]));
            }
        }
        return result;
    }
}
