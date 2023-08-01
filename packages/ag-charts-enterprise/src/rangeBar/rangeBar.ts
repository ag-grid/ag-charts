import type { AgCartesianSeriesLabelFormatterParams, AgTooltipRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import type {
    AgRangeBarSeriesFormat,
    AgRangeBarSeriesFormatterParams,
    AgRangeBarSeriesTooltipRendererParams,
} from './typings';

const {
    Validate,
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    CartesianSeriesNodeClickEvent,
    CartesianSeriesNodeDoubleClickEvent,
    NUMBER,
    OPT_NUMBER,
    OPT_STRING,
    OPT_FUNCTION,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
    getRectConfig,
    updateRect,
    checkCrisp,
    updateLabel,
    CategoryAxis,
} = _ModuleSupport;
const { toTooltipHtml, ContinuousScale, BandScale, Rect } = _Scene;
const { sanitizeHtml } = _Util;

type RangeBarNodeLabelDatum = Readonly<_Scene.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};

interface RangeBarNodeDatum
    extends Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>,
        Readonly<_Scene.Point> {
    readonly index: number;
    readonly itemId: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly label: RangeBarNodeLabelDatum;
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
}

type RangeBarContext = _ModuleSupport.SeriesNodeDataContext<RangeBarNodeDatum>;

class RangeBarSeriesNodeBaseClickEvent extends _ModuleSupport.CartesianSeriesNodeBaseClickEvent<any> {
    constructor(
        xKey: string,
        yKey: string,
        nativeEvent: MouseEvent,
        datum: RangeBarNodeDatum,
        series: RangeBarSeries | RangeColumnSeries
    ) {
        super(xKey, yKey, nativeEvent, datum, series);
    }
}

export class RangeBarSeriesNodeClickEvent extends RangeBarSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

export class RangeBarSeriesNodeDoubleClickEvent extends RangeBarSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

class RangeBarSeriesTooltip extends _ModuleSupport.SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgRangeBarSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

class RangeBarSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams & { itemId: string }) => string = undefined;

    @Validate(OPT_NUMBER(0))
    padding: number = 6;
}

export class RangeBarSeries extends _ModuleSupport.CartesianSeries<
    _ModuleSupport.SeriesNodeDataContext<any>,
    _Scene.Rect
> {
    static className = 'RangeBarSeries';
    static type: 'range-bar' | 'range-column' = 'range-bar' as const;

    readonly label = new RangeBarSeriesLabel();

    tooltip: RangeBarSeriesTooltip = new RangeBarSeriesTooltip();

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgRangeBarSeriesFormatterParams<any>) => AgRangeBarSeriesFormat = undefined;

    shadow?: _Scene.DropShadow = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#233e6f';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#233e6f';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    set data(input: any[] | undefined) {
        this._data = input;
    }
    get data() {
        return this._data;
    }

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
        });
    }

    /**
     * Used to get the position of bars within each group.
     */
    private groupScale = new BandScale<string>();

    protected resolveKeyDirection(direction: _ModuleSupport.ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yLowKey?: string = undefined;

    @Validate(OPT_STRING)
    yLowName?: string = undefined;

    @Validate(OPT_STRING)
    yHighKey?: string = undefined;

    @Validate(OPT_STRING)
    yHighName?: string = undefined;

    async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yLowKey, yHighKey, data = [] } = this;

        if (!yLowKey || !yHighKey) return;

        const isContinuousX = this.getCategoryAxis()?.scale instanceof ContinuousScale;
        const isContinuousY = this.getValueAxis()?.scale instanceof ContinuousScale;

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue` }),
                valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue` }),
            ],
            groupByKeys: true,
            dataVisible: this.visible,
        });
        this.dataModel = dataModel;
        this.processedData = processedData;
    }

    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return [];

        const {
            domain: {
                keys: [keys],
                values,
            },
        } = processedData;

        if (direction === this.getCategoryDirection()) {
            return keys;
        } else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return this.fixNumericExtent(fixedYExtent as any);
        }
    }

    protected getNodeClickEvent(
        event: MouseEvent,
        datum: RangeBarNodeDatum
    ): _ModuleSupport.CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey ?? '', datum.yLowKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: RangeBarNodeDatum
    ): _ModuleSupport.CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey ?? '', datum.yLowKey, event, datum, this); // TODO: Range series has two y keys, yLowKey and yHighKey so it doesn't fit the usual cartesian series pattern. Fix this.
    }

    private getCategoryAxis(): _ModuleSupport.ChartAxis | undefined {
        return this.axes[this.getCategoryDirection()];
    }

    protected getValueAxis(): _ModuleSupport.ChartAxis | undefined {
        return this.axes[this.getBarDirection()];
    }

    async createNodeData() {
        const {
            data,
            dataModel,
            visible,
            groupScale,
            fill,
            stroke,
            strokeWidth,
            ctx: { seriesStateManager },
        } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && visible && xAxis && yAxis && dataModel)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

        const { yLowKey = '', yHighKey = '', xKey = '', processedData } = this;

        const itemId = `${yLowKey}-${yHighKey}`;

        const context: RangeBarContext = {
            itemId,
            nodeData: [],
            labelData: [],
        };

        const domain = [];
        const { index: groupIndex, visibleGroupCount } = seriesStateManager.getVisiblePeerGroupIndex(this);
        for (let groupIdx = 0; groupIdx < visibleGroupCount; groupIdx++) {
            domain.push(String(groupIdx));
        }

        const xBandWidth = xScale.bandwidth;

        groupScale.domain = domain;
        groupScale.range = [0, xBandWidth ?? 0];

        if (xAxis instanceof CategoryAxis) {
            groupScale.paddingInner = xAxis.groupPaddingInner;
        } else {
            // Number or Time axis
            groupScale.padding = 0;
        }

        // To get exactly `0` padding we need to turn off rounding
        if (groupScale.padding === 0) {
            groupScale.round = false;
        } else {
            groupScale.round = true;
        }

        const barWidth =
            groupScale.bandwidth >= 1
                ? // Pixel-rounded value for low-volume range charts.
                  groupScale.bandwidth
                : // Handle high-volume range charts gracefully.
                  groupScale.rawBandwidth;

        const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
        const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;

        processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
            const xDatum = keys[xIndex];
            const x = Math.round(xScale.convert(xDatum)) + groupScale.convert(String(groupIndex));

            const rawLowValue = values[0][yLowIndex];
            const rawHighValue = values[0][yHighIndex];

            const yLowValue = Math.min(rawLowValue, rawHighValue);
            const yHighValue = Math.max(rawLowValue, rawHighValue);
            const yLow = Math.round(yScale.convert(yLowValue, { strict: false }));
            const yHigh = Math.round(yScale.convert(yHighValue, { strict: false }));

            const y = yHigh;
            const bottomY = yLow;
            const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));

            const rect = {
                x: barAlongX ? bottomY : x,
                y: barAlongX ? x : y,
                width: barAlongX ? barHeight : barWidth,
                height: barAlongX ? barWidth : barHeight,
            };

            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const nodeDatum: RangeBarNodeDatum = {
                index: dataIndex,
                series: this,
                itemId,
                datum,
                cumulativeValue: 0,
                xValue: xDatum,
                yLowValue,
                yHighValue,
                yLowKey,
                yHighKey,
                xKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                nodeMidPoint,
                fill,
                stroke,
                strokeWidth,
                label: {
                    x: nodeMidPoint.x,
                    y: nodeMidPoint.y,
                    textAlign: 'center',
                    textBaseline: 'middle',
                    text: `${yLowValue} - ${yHighValue}`,
                },
            };

            context.nodeData.push(nodeDatum);
            context.labelData.push(nodeDatum);
        });

        return [context];
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected async updateDatumSelection(opts: {
        nodeData: RangeBarNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const {
            yLowKey = '',
            yHighKey = '',
            highlightStyle: { item: itemHighlightStyle },
            id: seriesId,
            ctx,
        } = this;

        const xAxis = this.axes[ChartAxisDirection.X];
        const crisp = checkCrisp(xAxis?.visibleRange);

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const {
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
                formatter,
                shadow: fillShadow,
            } = this;
            const style: _ModuleSupport.RectConfig = {
                fill: datum.fill,
                stroke: datum.stroke,
                fillOpacity,
                strokeOpacity,
                lineDash,
                lineDashOffset,
                fillShadow,
                strokeWidth: this.getStrokeWidth(strokeWidth, datum),
            };
            const visible = categoryAlongX ? datum.width > 0 : datum.height > 0;

            const config = getRectConfig({
                datum,
                lowValue: datum.yLowValue,
                highValue: datum.yHighValue,
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                formatter,
                seriesId,
                itemId: datum.itemId,
                ctx,
                yLowKey,
                yHighKey,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect({ rect, config });
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: RangeBarNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, RangeBarNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        if (labelData.length === 0) {
            return labelSelection.update([]);
        }

        const {
            label: { enabled },
        } = this;
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, any> }) {
        const { labelSelection } = opts;
        labelSelection.each((text, datum) => {
            const labelDatum = datum.label;
            const { label } = this;
            updateLabel({ labelNode: text, labelDatum, config: label, visible: true });
        });
    }

    getTooltipHtml(nodeDatum: RangeBarNodeDatum): string {
        const {
            xKey,
            yLowKey,
            yHighKey,
            axes,
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yLowKey || !yHighKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yLowName, yHighName, id: seriesId } = this;

        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;

        const { fill, strokeWidth, formatter, tooltip: itemTooltip } = this;

        const tooltipRenderer = itemTooltip.renderer ?? this.tooltip.renderer;

        let format: any | undefined = undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                lowValue: yLowValue,
                highValue: yHighValue,
                xKey,
                yLowKey,
                yHighKey,
                fill,
                strokeWidth,
                highlighted: false,
                seriesId,
                itemId: nodeDatum.itemId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));

        const yLowSubheading = `${yLowName ?? yLowKey}`;
        const yHighSubheading = `${yHighName ?? yHighKey}`;

        const title = sanitizeHtml(xName);
        const content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
            `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
                    datum,
                    xKey,
                    xValue,
                    xName,
                    yLowKey,
                    yLowValue,
                    yLowName,
                    yHighKey,
                    yHighValue,
                    yHighName,
                    color,
                    seriesId,
                    itemId,
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): _ModuleSupport.CategoryLegendDatum[] {
        const { id } = this;

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];

        const { fill, stroke, fillOpacity, strokeOpacity, yLowName, yHighName, yLowKey, yHighKey } = this;
        const legendItemText = `${yLowName ?? yLowKey}-${yHighName ?? yHighKey}`;
        legendData.push({
            legendType: 'category',
            id,
            itemId: `${yLowKey}-${yHighKey}`,
            seriesId: id,
            enabled: true,
            label: {
                text: `${legendItemText}`,
            },
            marker: {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
            },
        });

        return legendData;
    }

    protected toggleSeriesItem(): void {}

    animateEmptyUpdateReady({
        datumSelections,
        labelSelections,
        contextData,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, RangeBarNodeDatum>>;
        labelSelections: Array<_Scene.Selection<_Scene.Text, RangeBarNodeDatum>>;
        contextData: Array<RangeBarContext>;
        paths: Array<Array<_Scene.Path>>;
        seriesRect?: _Scene.BBox;
    }) {
        const duration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;

        contextData.forEach((_, contextDataIndex) => {
            this.animateRects(datumSelections[contextDataIndex], duration);
            this.animateLabels(labelSelections[contextDataIndex], duration);
        });
    }

    protected animateRects(datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>, duration: number) {
        datumSelection.each((rect, datum) => {
            this.ctx.animationManager?.animateMany(
                `${this.id}_empty-update-ready_${rect.id}`,
                [
                    { from: datum.nodeMidPoint?.x ?? 0, to: datum.x },
                    { from: 0, to: datum.width },
                ],
                {
                    duration,
                    ease: _ModuleSupport.Motion.easeOut,
                    onUpdate([x, width]) {
                        rect.x = x;
                        rect.width = width;

                        rect.y = datum.y;
                        rect.height = datum.height;
                    },
                }
            );
        });
    }

    protected animateLabels(labelSelection: _Scene.Selection<_Scene.Text, RangeBarNodeDatum>, duration: number) {
        labelSelection.each((label) => {
            this.ctx.animationManager?.animate(`${this.id}_empty-update-ready_${label.id}`, {
                from: 0,
                to: 1,
                delay: duration,
                duration: duration / 5,
                onUpdate: (opacity) => {
                    label.opacity = opacity;
                },
            });
        });
    }

    animateReadyUpdate({
        datumSelections,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, RangeBarNodeDatum>>;
        contextData: Array<RangeBarContext>;
        paths: Array<Array<_Scene.Path>>;
    }) {
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    animateReadyHighlight(highlightSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize({
        datumSelections,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, RangeBarNodeDatum>>;
        contextData: Array<RangeBarContext>;
        paths: Array<Array<_Scene.Path>>;
    }) {
        this.ctx.animationManager?.reset();
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    resetSelectionRects(selection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>) {
        selection.each((rect, datum) => {
            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
        });
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    protected getBarDirection() {
        return ChartAxisDirection.X;
    }

    protected getCategoryDirection() {
        return ChartAxisDirection.Y;
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.3 };
    }
}

export class RangeColumnSeries extends RangeBarSeries {
    static className = 'RangeColumnSeries';
    static type = 'range-column' as const;

    protected getBarDirection() {
        return ChartAxisDirection.Y;
    }

    protected getCategoryDirection() {
        return ChartAxisDirection.X;
    }

    protected animateRects(datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>, duration: number) {
        datumSelection.each((rect, datum) => {
            this.ctx.animationManager?.animateMany(
                `${this.id}_empty-update-ready_${rect.id}`,
                [
                    { from: datum.nodeMidPoint?.y ?? 0, to: datum.y },
                    { from: 0, to: datum.height },
                ],
                {
                    duration,
                    ease: _ModuleSupport.Motion.easeOut,
                    onUpdate([y, height]) {
                        rect.y = y;
                        rect.height = height;

                        rect.x = datum.x;
                        rect.width = datum.width;
                    },
                }
            );
        });
    }
}
