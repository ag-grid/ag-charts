import {
    type AgBoxPlotSeriesFormatterParams,
    type AgBoxPlotSeriesStyles,
    type AgBoxPlotSeriesTooltipRendererParams,
    _Scene,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Util } from 'ag-charts-community';

import { prepareBoxPlotFromTo, resetBoxPlotSelectionsScalingCenterFn } from './blotPlotUtil';
import { BoxPlotGroup } from './boxPlotGroup';
import type { BoxPlotNodeDatum } from './boxPlotTypes';

const {
    CartesianSeries,
    ChartAxisDirection,
    extent,
    extractDecoratedProperties,
    fixNumericExtent,
    keyProperty,
    mergeDefaults,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_STRING,
    SeriesNodePickMode,
    SeriesTooltip,
    SMALLEST_KEY_INTERVAL,
    STRING_UNION,
    Validate,
    valueProperty,
} = _ModuleSupport;
const { motion } = _Scene;

class BoxPlotSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeClickEvent<BoxPlotNodeDatum, TEvent> {
    readonly xKey?: string;
    readonly minKey?: string;
    readonly q1Key?: string;
    readonly medianKey?: string;
    readonly q3Key?: string;
    readonly maxKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: BoxPlotNodeDatum, series: BoxPlotSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.xKey;
        this.minKey = series.minKey;
        this.q1Key = series.q1Key;
        this.medianKey = series.medianKey;
        this.q3Key = series.q3Key;
        this.maxKey = series.maxKey;
    }
}

class BoxPlotSeriesCap {
    @Validate(NUMBER(0, 1))
    lengthRatio = 0.5;
}

class BoxPlotSeriesWhisker {
    @Validate(OPT_COLOR_STRING)
    stroke?: string;

    @Validate(NUMBER(0))
    strokeWidth?: number;

    @Validate(NUMBER(0, 1))
    strokeOpacity?: number;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[];

    @Validate(NUMBER(0))
    lineDashOffset?: number;
}

export class BoxPlotSeries extends CartesianSeries<BoxPlotGroup, BoxPlotNodeDatum> {
    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(OPT_STRING)
    minKey?: string = undefined;

    @Validate(OPT_STRING)
    minName?: string = undefined;

    @Validate(OPT_STRING)
    q1Key?: string = undefined;

    @Validate(OPT_STRING)
    q1Name?: string = undefined;

    @Validate(OPT_STRING)
    medianKey?: string = undefined;

    @Validate(OPT_STRING)
    medianName?: string = undefined;

    @Validate(OPT_STRING)
    q3Key?: string = undefined;

    @Validate(OPT_STRING)
    q3Name?: string = undefined;

    @Validate(OPT_STRING)
    maxKey?: string = undefined;

    @Validate(OPT_STRING)
    maxName?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#c16068';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#333';

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(STRING_UNION('vertical', 'horizontal'))
    direction: 'vertical' | 'horizontal' = 'vertical';

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgBoxPlotSeriesFormatterParams<unknown>) => AgBoxPlotSeriesStyles = undefined;

    readonly cap = new BoxPlotSeriesCap();

    readonly whisker = new BoxPlotSeriesWhisker();

    readonly tooltip = new SeriesTooltip<AgBoxPlotSeriesTooltipRendererParams>();
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

    async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        const { xKey, minKey, q1Key, medianKey, q3Key, maxKey, data = [] } = this;

        if (!xKey || !minKey || !q1Key || !medianKey || !q3Key || !maxKey) return;

        const isContinuousX = this.getCategoryAxis()?.scale instanceof _Scale.ContinuousScale;

        const { dataModel, processedData } = await dataController.request(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, minKey, true, { id: `minValue` }),
                valueProperty(this, q1Key, true, { id: `q1Value` }),
                valueProperty(this, medianKey, true, { id: `medianValue` }),
                valueProperty(this, q3Key, true, { id: `q3Value` }),
                valueProperty(this, maxKey, true, { id: `maxValue` }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
            ],
            dataVisible: this.visible,
        });

        this.dataModel = dataModel;
        this.processedData = processedData;

        this.smallestDataInterval = {
            x: processedData.reduced?.[SMALLEST_KEY_INTERVAL.property] ?? Infinity,
            y: Infinity,
        };
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { processedData, dataModel, smallestDataInterval } = this;
        if (!(processedData && dataModel)) return [];

        if (direction === this.getValuesDirection()) {
            const minValues = dataModel.getDomain(this, `minValue`, 'value', processedData);
            const maxValues = dataModel.getDomain(this, `maxValue`, 'value', processedData);

            return fixNumericExtent([Math.min(...minValues), Math.max(...maxValues)], this.getValuesAxis());
        }

        const { index, def } = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const keys = processedData.domain.keys[index];
        if (def.type === 'key' && def.valueType === 'category') {
            return keys;
        }

        const keysExtent = extent(keys) ?? [NaN, NaN];
        const scalePadding = smallestDataInterval && isFinite(smallestDataInterval.x) ? smallestDataInterval.x : 0;
        return fixNumericExtent([keysExtent[0] - scalePadding, keysExtent[1]], this.getCategoryAxis());
    }

    async createNodeData() {
        const { visible, dataModel } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValuesAxis();

        if (!(dataModel && visible && xAxis && yAxis)) {
            return [];
        }

        const {
            xKey = '',
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            cap,
            whisker,
            groupScale,
            ctx: { seriesStateManager },
            smallestDataInterval,
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

        const context: _ModuleSupport.SeriesNodeDataContext<BoxPlotNodeDatum> = {
            itemId: xKey,
            nodeData: [],
            labelData: [],
        };

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

            const nodeData: BoxPlotNodeDatum = {
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
            };

            context.nodeData.push(nodeData);
        });

        return [context];
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const {
            id,
            data,
            xKey,
            yName,
            showInLegend,
            visible,
            legendItemName,
            fill,
            stroke,
            fillOpacity,
            strokeOpacity,
            strokeWidth,
        } = this;

        if (!(showInLegend && data?.length && xKey && legendType === 'category')) {
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
                legendItemName,
                marker: { fill, fillOpacity, stroke, strokeOpacity, strokeWidth },
            },
        ];
    }

    protected override getNodeClickEvent(
        event: MouseEvent,
        datum: BoxPlotNodeDatum
    ): BoxPlotSeriesNodeClickEvent<'nodeClick'> {
        return new BoxPlotSeriesNodeClickEvent('nodeClick', event, datum, this);
    }

    protected override getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: BoxPlotNodeDatum
    ): BoxPlotSeriesNodeClickEvent<'nodeDoubleClick'> {
        return new BoxPlotSeriesNodeClickEvent('nodeDoubleClick', event, datum, this);
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
            id: seriesId,
        } = this;
        const { datum } = nodeDatum as { datum: any };

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValuesAxis();

        if (!xAxis || !yAxis || !xKey || !minKey || !q1Key || !medianKey || !q3Key || !maxKey) return '';

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

        return this.tooltip.toTooltipHtml(
            { title, content, backgroundColor: fill },
            {
                datum,
                seriesId,
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
        const isVertical = this.direction === 'vertical';

        motion.resetMotion(datumSelections, resetBoxPlotSelectionsScalingCenterFn(isVertical));

        const { from, to } = prepareBoxPlotFromTo(isVertical);
        motion.staticFromToMotion(
            `${this.id}_empty-update-ready`,
            this.ctx.animationManager,
            datumSelections,
            from,
            to
        );
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
        highlightedItems,
        isHighlight: highlighted,
    }: {
        datumSelection: _Scene.Selection<BoxPlotGroup, BoxPlotNodeDatum>;
        highlightedItems?: BoxPlotNodeDatum[];
        isHighlight: boolean;
    }) {
        const invertAxes = this.isVertical();
        datumSelection.each((boxPlotGroup, nodeDatum) => {
            let activeStyles = this.getFormattedStyles(nodeDatum, highlighted);

            if (highlighted) {
                activeStyles = mergeDefaults(this.highlightStyle.item, activeStyles);
            }

            const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = activeStyles;

            activeStyles.whisker = mergeDefaults(activeStyles.whisker, {
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            });

            // hide duplicates of highlighted nodes
            boxPlotGroup.opacity =
                highlighted || !highlightedItems?.some((datum) => datum.itemId === nodeDatum.itemId) ? 1 : 0;

            boxPlotGroup.updateDatumStyles(
                nodeDatum,
                activeStyles as _ModuleSupport.DeepRequired<AgBoxPlotSeriesStyles>,
                invertAxes
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
            xKey = '',
            minKey = '',
            q1Key = '',
            medianKey = '',
            q3Key = '',
            maxKey = '',
            formatter,
            id: seriesId,
            ctx: { callbackCache },
        } = this;
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

    override getBandScalePadding() {
        return { inner: 0.2, outer: 0.1 };
    }

    protected isVertical() {
        return this.direction === 'vertical';
    }

    protected getValuesDirection() {
        return this.isVertical() ? ChartAxisDirection.Y : ChartAxisDirection.X;
    }

    protected getCategoryDirection() {
        return this.isVertical() ? ChartAxisDirection.X : ChartAxisDirection.Y;
    }

    protected getCategoryAxis(): _ModuleSupport.ChartAxis | undefined {
        return this.axes[this.getCategoryDirection()];
    }

    protected getValuesAxis(): _ModuleSupport.ChartAxis | undefined {
        return this.axes[this.getValuesDirection()];
    }

    convertValuesToScaleByDefs<T extends string>(
        defs: [string, _ModuleSupport.ProcessedDataDef[]][],
        values: Record<T, unknown>
    ): Record<T, number> {
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValuesAxis();
        if (!(xAxis && yAxis)) {
            throw new Error('Axes must be defined');
        }
        const result: Record<string, number> = {};
        for (const [searchId, [{ def }]] of defs) {
            if (Object.prototype.hasOwnProperty.call(values, searchId)) {
                const { scale } = def.type === 'key' ? xAxis : yAxis;
                result[searchId] = Math.round(scale.convert((values as any)[searchId]));
            }
        }
        return result;
    }
}
