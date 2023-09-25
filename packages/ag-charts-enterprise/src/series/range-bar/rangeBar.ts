import type {
    AgRangeBarSeriesFormat,
    AgRangeBarSeriesFormatterParams,
    AgRangeBarSeriesLabelFormatterParams,
    AgRangeBarSeriesLabelPlacement,
    AgRangeBarSeriesTooltipRendererParams,
    AgTooltipRendererResult,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const {
    Validate,
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    OPTIONAL,
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
    SMALLEST_KEY_INTERVAL,
    STRING_UNION,
    Motion,
    diff,
} = _ModuleSupport;
const { ContinuousScale, BandScale, Rect, PointerEvents } = _Scene;
const { sanitizeHtml, isNumber, extent, zipObject } = _Util;

const RANGE_BAR_LABEL_PLACEMENTS: AgRangeBarSeriesLabelPlacement[] = ['inside', 'outside'];
const OPT_RANGE_BAR_LABEL_PLACEMENT: _ModuleSupport.ValidatePredicate = (v: any, ctx) =>
    OPTIONAL(v, ctx, (v: any) => RANGE_BAR_LABEL_PLACEMENTS.includes(v));

const DEFAULT_DIRECTION_KEYS = {
    [_ModuleSupport.ChartAxisDirection.X]: ['xKey'],
    [_ModuleSupport.ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
};
const DEFAULT_DIRECTION_NAMES = {
    [ChartAxisDirection.X]: ['xName'],
    [ChartAxisDirection.Y]: ['yLowName', 'yHighName', 'yName'],
};

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type RangeBarNodeLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
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
    readonly labels: RangeBarNodeLabelDatum[];
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
}

type RangeBarContext = _ModuleSupport.SeriesNodeDataContext<RangeBarNodeDatum, RangeBarNodeLabelDatum>;

type RangeBarAnimationData = _ModuleSupport.CartesianAnimationData<RangeBarContext, _Scene.Rect>;

class RangeBarSeriesNodeBaseClickEvent extends _ModuleSupport.SeriesNodeBaseClickEvent<RangeBarNodeDatum> {
    readonly xKey: string;
    readonly yLowKey: string;
    readonly yHighKey: string;

    constructor(
        xKey: string,
        yLowKey: string,
        yHighKey: string,
        nativeEvent: MouseEvent,
        datum: RangeBarNodeDatum,
        series: RangeBarSeries
    ) {
        super(nativeEvent, datum, series);
        this.xKey = xKey;
        this.yLowKey = yLowKey;
        this.yHighKey = yHighKey;
    }
}

export class RangeBarSeriesNodeClickEvent extends RangeBarSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

export class RangeBarSeriesNodeDoubleClickEvent extends RangeBarSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

class RangeBarSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgRangeBarSeriesLabelFormatterParams) => string = undefined;

    @Validate(OPT_RANGE_BAR_LABEL_PLACEMENT)
    placement: AgRangeBarSeriesLabelPlacement = 'inside';

    @Validate(OPT_NUMBER(0))
    padding: number = 6;
}

export class RangeBarSeries extends _ModuleSupport.CartesianSeries<RangeBarContext, _Scene.Rect> {
    static className = 'RangeBarSeries';
    static type = 'range-bar' as const;

    readonly label = new RangeBarSeriesLabel();

    tooltip = new _ModuleSupport.SeriesTooltip<AgRangeBarSeriesTooltipRendererParams>();

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgRangeBarSeriesFormatterParams<any>) => AgRangeBarSeriesFormat = undefined;

    shadow?: _Scene.DropShadow = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#99CCFF';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#99CCFF';

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

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            directionKeys: DEFAULT_DIRECTION_KEYS,
            directionNames: DEFAULT_DIRECTION_NAMES,
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

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(STRING_UNION('vertical', 'horizontal'))
    direction: 'vertical' | 'horizontal' = 'vertical';

    protected smallestDataInterval?: { x: number; y: number } = undefined;
    async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yLowKey, yHighKey, data = [] } = this;

        if (!yLowKey || !yHighKey) return;

        const isContinuousX = this.getCategoryAxis()?.scale instanceof ContinuousScale;
        const isContinuousY = this.getValueAxis()?.scale instanceof ContinuousScale;

        const animationProp = [];
        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            animationProp.push(diff(this.processedData));
        }

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue` }),
                valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue` }),
                ...(isContinuousX ? [SMALLEST_KEY_INTERVAL] : []),
                ...animationProp,
            ],
            groupByKeys: true,
            dataVisible: this.visible,
        });
        this.dataModel = dataModel;
        this.processedData = processedData;

        this.smallestDataInterval = {
            x: processedData.reduced?.[SMALLEST_KEY_INTERVAL.property] ?? Infinity,
            y: Infinity,
        };

        this.animationState.transition('updateData');
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
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);

            if (keyDef?.def.type === 'key' && keyDef?.def.valueType === 'category') {
                return keys;
            }

            const { reduced: { [SMALLEST_KEY_INTERVAL.property]: smallestX } = {} } = processedData;
            const scalePadding = isFinite(smallestX) ? smallestX : 0;
            const keysExtent = extent(keys) ?? [NaN, NaN];

            const categoryAxis = this.getCategoryAxis();
            if (direction === ChartAxisDirection.Y) {
                return this.fixNumericExtent([keysExtent[0] + -scalePadding, keysExtent[1]], categoryAxis);
            }
            return this.fixNumericExtent([keysExtent[0], keysExtent[1] + scalePadding], categoryAxis);
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

    protected getNodeClickEvent(event: MouseEvent, datum: RangeBarNodeDatum): RangeBarSeriesNodeClickEvent {
        return new RangeBarSeriesNodeClickEvent(datum.xKey, datum.yLowKey, datum.yHighKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(event: MouseEvent, datum: RangeBarNodeDatum): RangeBarSeriesNodeDoubleClickEvent {
        return new RangeBarSeriesNodeDoubleClickEvent(datum.xKey, datum.yLowKey, datum.yHighKey, event, datum, this);
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
            smallestDataInterval,
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

        const xBandWidth =
            xScale instanceof ContinuousScale ? xScale.calcBandwidth(smallestDataInterval?.x) : xScale.bandwidth;

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
            const yLow = Math.round(yScale.convert(yLowValue));
            const yHigh = Math.round(yScale.convert(yHighValue));

            const y = yHigh;
            const bottomY = yLow;
            const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));

            const rect: Bounds = {
                x: barAlongX ? bottomY : x,
                y: barAlongX ? x : y,
                width: barAlongX ? barHeight : barWidth,
                height: barAlongX ? barWidth : barHeight,
            };

            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const labelData: RangeBarNodeDatum['labels'] = this.createLabelData({
                rect,
                barAlongX,
                yLowValue,
                yHighValue,
                datum,
                series: this,
            });

            const nodeDatum: RangeBarNodeDatum = {
                index: dataIndex,
                series: this,
                itemId,
                datum,
                cumulativeValue: 0,
                xValue: xDatum,
                yLowValue: rawLowValue,
                yHighValue: rawHighValue,
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
                labels: labelData,
            };

            context.nodeData.push(nodeDatum);
            context.labelData.push(...labelData);
        });

        return [context];
    }

    private createLabelData({
        rect,
        barAlongX,
        yLowValue,
        yHighValue,
        datum,
        series,
    }: {
        rect: Bounds;
        barAlongX: boolean;
        yLowValue: number;
        yHighValue: number;
        datum: any;
        series: RangeBarSeries;
    }): RangeBarNodeLabelDatum[] {
        const { placement, padding } = this.label;

        const paddingDirection = placement === 'outside' ? 1 : -1;
        const labelPadding = padding * paddingDirection;
        const yLowLabel: RangeBarNodeLabelDatum = {
            x: rect.x + (barAlongX ? -labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : rect.height + labelPadding),
            textAlign: barAlongX ? 'left' : 'center',
            textBaseline: barAlongX ? 'middle' : 'bottom',
            text: this.getLabelText({ itemId: 'low', value: yLowValue, yLowValue, yHighValue }),
            itemId: 'low',
            datum,
            series,
        };
        const yHighLabel: RangeBarNodeLabelDatum = {
            x: rect.x + (barAlongX ? rect.width + labelPadding : rect.width / 2),
            y: rect.y + (barAlongX ? rect.height / 2 : -labelPadding),
            textAlign: barAlongX ? 'right' : 'center',
            textBaseline: barAlongX ? 'middle' : 'top',
            text: this.getLabelText({ itemId: 'high', value: yHighValue, yLowValue, yHighValue }),
            itemId: 'high',
            datum,
            series,
        };

        if (placement === 'outside') {
            yLowLabel.textAlign = barAlongX ? 'right' : 'center';
            yLowLabel.textBaseline = barAlongX ? 'middle' : 'top';

            yHighLabel.textAlign = barAlongX ? 'left' : 'center';
            yHighLabel.textBaseline = barAlongX ? 'middle' : 'bottom';
        }
        return [yLowLabel, yHighLabel];
    }

    private getLabelText({
        itemId,
        value,
        yLowValue,
        yHighValue,
    }: {
        itemId: string;
        value: any;
        yLowValue: any;
        yHighValue: any;
    }) {
        const {
            id: seriesId,
            label: { formatter },
            ctx: { callbackCache },
        } = this;
        let labelText;
        if (formatter) {
            labelText = callbackCache.call(formatter, {
                value: isNumber(value) ? value : undefined,
                seriesId,
                itemId,
                yLowValue,
                yHighValue,
            });
        }
        return labelText ?? (isNumber(value) ? value.toFixed(2) : '');
    }

    protected nodeFactory() {
        return new Rect();
    }

    datumSelectionGarbageCollection = false;

    protected async updateDatumSelection(opts: {
        nodeData: RangeBarNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, RangeBarNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data, undefined, (datum) => this.getDatumId(datum));
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
                strokeWidth: this.getStrokeWidth(strokeWidth),
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

    protected getHighlightLabelData(
        labelData: RangeBarNodeLabelDatum[],
        highlightedItem: RangeBarNodeDatum
    ): RangeBarNodeLabelDatum[] | undefined {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }

    protected async updateLabelSelection(opts: {
        labelData: RangeBarNodeLabelDatum[];
        labelSelection: RangeBarAnimationData['labelSelections'][number];
    }) {
        const { labelData, labelSelection } = opts;

        if (labelData.length === 0) {
            return labelSelection.update([]);
        }
        const {
            label: { enabled },
        } = this;
        const data = enabled ? labelData : [];

        return labelSelection.update(data, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, any> }) {
        const { labelSelection } = opts;
        labelSelection.each((text, datum) => {
            const { label } = this;
            updateLabel({ labelNode: text, labelDatum: datum, config: label, visible: true });
        });
    }

    getTooltipHtml(nodeDatum: RangeBarNodeDatum): string {
        const {
            xKey,
            yLowKey,
            yHighKey,
            ctx: { callbackCache },
        } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xKey || !yLowKey || !yHighKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yLowName, yHighName, yName, id: seriesId } = this;

        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;

        const { fill, strokeWidth, formatter, tooltip } = this;

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
                itemId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));

        const xSubheading = xName ?? xKey;
        const yLowSubheading = yLowName ?? yLowKey;
        const yHighSubheading = yHighName ?? yHighKey;

        const title = sanitizeHtml(yName);

        const content = yName
            ? `<b>${sanitizeHtml(xSubheading)}</b>: ${xString}<br>` +
              `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
              `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        return tooltip.toTooltipHtml(defaults, {
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
            yName,
            color,
            seriesId,
            itemId,
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, visible } = this;

        if (legendType !== 'category') {
            return [];
        }

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];

        const { fill, stroke, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } = this;
        const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
        legendData.push({
            legendType: 'category',
            id,
            itemId: `${yLowKey}-${yHighKey}`,
            seriesId: id,
            enabled: visible,
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

    animateEmptyUpdateReady({ datumSelections, labelSelections, contextData }: RangeBarAnimationData) {
        contextData.forEach((_, contextDataIndex) => {
            this.animateRects(datumSelections[contextDataIndex]);
            this.animateLabels(labelSelections[contextDataIndex]);
        });
    }

    protected animateRects(datumSelection: RangeBarAnimationData['datumSelections'][number]) {
        const horizontal = this.getBarDirection() === ChartAxisDirection.X;
        datumSelection.each((rect, datum) => {
            this.ctx.animationManager.animate({
                id: `${this.id}_empty-update-ready_${rect.id}`,
                from: { cord: (horizontal ? datum.nodeMidPoint?.x : datum.nodeMidPoint?.y) ?? 0, dimension: 0 },
                to: { cord: horizontal ? datum.x : datum.y, dimension: horizontal ? datum.width : datum.height },
                ease: _ModuleSupport.Motion.easeOut,
                onUpdate({ cord, dimension }) {
                    rect.setProperties(
                        horizontal
                            ? { x: cord, y: datum.y, width: dimension, height: datum.height }
                            : { x: datum.x, y: cord, width: datum.width, height: dimension }
                    );
                },
            });
        });
    }

    animateWaitingUpdateReady({ datumSelections, labelSelections }: RangeBarAnimationData) {
        const { processedData } = this;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            datumSelections.forEach((datumSelection) => {
                this.resetSelectionRects(datumSelection);
            });
            return;
        }

        const totalDuration = this.ctx.animationManager.defaultDuration;
        const labelDuration = totalDuration / 5;

        let sectionDuration = totalDuration;
        if (diff.added.length > 0 || diff.removed.length > 0) {
            sectionDuration = Math.floor(totalDuration / 2);
        }

        const addedIds = zipObject(diff.added, true);
        const removedIds = zipObject(diff.removed, true);

        const horizontal = this.getBarDirection() === ChartAxisDirection.X;

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum, index) => {
                let from = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                let to = { x: datum.x, y: datum.y, width: datum.width, height: datum.height };

                const start = {
                    x: horizontal ? datum.nodeMidPoint?.x ?? 0 : datum.x,
                    y: horizontal ? datum.y : datum.nodeMidPoint?.y ?? 0,
                    width: horizontal ? 0 : datum.width,
                    height: horizontal ? datum.height : 0,
                };

                const isAdded = datum.xValue !== undefined && addedIds[datum.xValue] !== undefined;
                const isRemoved = datum.xValue !== undefined && removedIds[datum.xValue] !== undefined;
                const cleanup = index === datumSelection.nodes().length - 1;

                if (isAdded) {
                    from = start;
                } else if (isRemoved) {
                    from = to;
                    to = start;
                }

                this.ctx.animationManager.animate({
                    id: `${this.id}_waiting-update-ready_${rect.id}`,
                    from,
                    to,
                    duration: sectionDuration,
                    ease: Motion.easeOut,
                    onUpdate(props) {
                        rect.setProperties(props);
                    },
                    onComplete() {
                        if (cleanup) {
                            datumSelection.cleanup();
                        }
                    },
                    onStop() {
                        if (cleanup) {
                            datumSelection.cleanup();
                        }
                    },
                });
            });
        });

        this.ctx.animationManager.animate({
            id: `${this.id}_waiting-update-ready_labels`,
            from: 0,
            to: 1,
            delay: totalDuration,
            duration: labelDuration,
            onUpdate: (opacity) => {
                labelSelections.forEach((labelSelection) => {
                    labelSelection.each((label) => {
                        label.opacity = opacity;
                    });
                });
            },
        });
    }

    protected animateLabels(labelSelection: RangeBarAnimationData['labelSelections'][number]) {
        const duration = this.ctx.animationManager.defaultDuration;
        this.ctx.animationManager.animate({
            id: `${this.id}_empty-update-ready_labels`,
            from: 0,
            to: 1,
            delay: duration,
            duration: duration / 5,
            onUpdate: (opacity) => {
                labelSelection.each((label) => {
                    label.opacity = opacity;
                });
            },
        });
    }

    animateReadyUpdate({ datumSelections }: RangeBarAnimationData) {
        this.resetSelections(datumSelections);
    }

    animateReadyHighlight(highlightSelection: RangeBarAnimationData['datumSelections'][number]) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize({ datumSelections }: RangeBarAnimationData) {
        this.resetSelections(datumSelections);
    }

    resetSelections(datumSelections: RangeBarAnimationData['datumSelections']) {
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
        selection.cleanup();
    }

    private getDatumId(datum: RangeBarNodeDatum) {
        return `${datum.xValue}`;
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    protected getBarDirection() {
        if (this.direction === 'horizontal') {
            return ChartAxisDirection.X;
        }
        return ChartAxisDirection.Y;
    }

    protected getCategoryDirection() {
        if (this.direction === 'horizontal') {
            return ChartAxisDirection.Y;
        }
        return ChartAxisDirection.X;
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.1 };
    }

    protected onDataChange() {}
}
