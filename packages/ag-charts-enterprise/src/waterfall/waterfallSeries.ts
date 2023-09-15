import type {
    AgCartesianSeriesLabelFormatterParams,
    AgTooltipRendererResult,
    AgWaterfallSeriesFormat,
    AgWaterfallSeriesFormatterParams,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesTooltipRendererParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const {
    Validate,
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    accumulativeValueProperty,
    trailingAccumulatedValueProperty,
    ChartAxisDirection,
    CartesianSeriesNodeClickEvent,
    CartesianSeriesNodeDoubleClickEvent,
    OPTIONAL,
    NUMBER,
    OPT_NUMBER,
    BOOLEAN,
    OPT_STRING,
    OPT_FUNCTION,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
    STRING_UNION,
    createLabelData,
    getRectConfig,
    updateRect,
    checkCrisp,
    updateLabel,
} = _ModuleSupport;
const { ContinuousScale, Rect } = _Scene;
const { sanitizeHtml, isContinuous } = _Util;

const WATERFALL_LABEL_PLACEMENTS: AgWaterfallSeriesLabelPlacement[] = ['start', 'end', 'inside'];
const OPT_WATERFALL_LABEL_PLACEMENT: _ModuleSupport.ValidatePredicate = (v: any, ctx) =>
    OPTIONAL(v, ctx, (v: any) => WATERFALL_LABEL_PLACEMENTS.includes(v));

type WaterfallNodeLabelDatum = Readonly<_Scene.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};

type WaterfallNodePointDatum = _ModuleSupport.SeriesNodeDatum['point'] & {
    readonly x2: number;
    readonly y2: number;
};

interface WaterfallNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<_Scene.Point> {
    readonly index: number;
    readonly itemId: SeriesItemType;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly label: WaterfallNodeLabelDatum;
    readonly fill: string;
    readonly stroke: string;
    readonly strokeWidth: number;
}

type WaterfallContext = _ModuleSupport.SeriesNodeDataContext<WaterfallNodeDatum> & {
    pointData?: WaterfallNodePointDatum[];
};

type WaterfallAnimationData = _ModuleSupport.CartesianAnimationData<WaterfallContext, _Scene.Rect>;

class WaterfallSeriesNodeBaseClickEvent extends _ModuleSupport.CartesianSeriesNodeBaseClickEvent<any> {
    readonly labelKey?: string;

    constructor(
        labelKey: string | undefined,
        xKey: string,
        yKey: string,
        nativeEvent: MouseEvent,
        datum: WaterfallNodeDatum,
        series: WaterfallSeries
    ) {
        super(xKey, yKey, nativeEvent, datum, series);
        this.labelKey = labelKey;
    }
}

export class WaterfallSeriesNodeClickEvent extends WaterfallSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

export class WaterfallSeriesNodeDoubleClickEvent extends WaterfallSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

class WaterfallSeriesItemTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

class WaterfallSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams & { itemId: SeriesItemType }) => string = undefined;

    @Validate(OPT_WATERFALL_LABEL_PLACEMENT)
    placement: AgWaterfallSeriesLabelPlacement = 'end';

    @Validate(OPT_NUMBER(0))
    padding: number = 6;
}

class WaterfallSeriesItem {
    readonly label = new WaterfallSeriesLabel();

    tooltip: WaterfallSeriesItemTooltip = new WaterfallSeriesItemTooltip();

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgWaterfallSeriesFormatterParams<any>) => AgWaterfallSeriesFormat = undefined;

    shadow?: _Scene.DropShadow = undefined;

    @Validate(OPT_STRING)
    name?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#c16068';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#c16068';

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
}

class WaterfallSeriesConnectorLine {
    @Validate(BOOLEAN)
    enabled = true;

    @Validate(OPT_COLOR_STRING)
    stroke: string = 'black';

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 2;
}

class WaterfallSeriesItems {
    readonly positive: WaterfallSeriesItem = new WaterfallSeriesItem();
    readonly negative: WaterfallSeriesItem = new WaterfallSeriesItem();
    readonly total: WaterfallSeriesItem = new WaterfallSeriesItem();
}

type SeriesItemType = 'positive' | 'negative' | 'total' | 'subtotal';
interface TotalMeta {
    totalType: 'subtotal' | 'total';
    index: number;
    axisLabel: any;
}

export class WaterfallSeries extends _ModuleSupport.CartesianSeries<WaterfallContext, _Scene.Rect> {
    static className = 'WaterfallSeries';
    static type = 'waterfall' as const;

    readonly item: WaterfallSeriesItems = new WaterfallSeriesItems();

    readonly totals: TotalMeta[] = [];

    readonly line = new WaterfallSeriesConnectorLine();

    tooltip = new _ModuleSupport.SeriesTooltip<AgWaterfallSeriesTooltipRendererParams>();

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
            pathsPerSeries: 1,
            hasHighlightedLabels: true,
        });
    }

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
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(STRING_UNION('vertical', 'horizontal'))
    direction: 'vertical' | 'horizontal' = 'vertical';

    private seriesItemTypes: Set<SeriesItemType> = new Set(['positive', 'negative', 'total']);

    async processData(dataController: _ModuleSupport.DataController) {
        const { xKey = '', yKey } = this;
        const { data = [] } = this;

        if (!yKey) return;

        const isContinuousX = this.getCategoryAxis()?.scale instanceof ContinuousScale;

        const positiveNumber = (v: any) => {
            return isContinuous(v) && v >= 0;
        };

        const negativeNumber = (v: any) => {
            return isContinuous(v) && v < 0;
        };

        const totalTypeValue = (v: any) => {
            return v === 'total' || v === 'subtotal';
        };

        const propertyDefinition = {
            missingValue: undefined,
            invalidValue: undefined,
        };

        const dataWithTotals: any[] = [];

        const totalsMap = this.totals.reduce((totalsMap, total) => {
            const totalsAtIndex = totalsMap.get(total.index);
            if (totalsAtIndex) {
                totalsAtIndex.push(total);
            } else {
                totalsMap.set(total.index, [total]);
            }
            return totalsMap;
        }, new Map<number, TotalMeta[]>());

        data.forEach((datum, i) => {
            dataWithTotals.push(datum);
            const totalsAtIndex = totalsMap.get(i);
            if (totalsAtIndex) {
                // Use the `toString` method to make the axis labels unique as they're used as categories in the axis scale domain.
                // Add random id property as there is caching for the axis label formatter result. If the label object is not unique, the axis label formatter will not be invoked.
                totalsAtIndex.forEach((total) =>
                    dataWithTotals.push({
                        ...total,
                        [xKey]: total.axisLabel,
                    })
                );
            }
        });

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, dataWithTotals, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                accumulativeValueProperty(this, yKey, true, {
                    ...propertyDefinition,
                    id: `yCurrent`,
                }),
                accumulativeValueProperty(this, yKey, true, {
                    ...propertyDefinition,
                    missingValue: 0,
                    id: `yCurrentTotal`,
                }),
                accumulativeValueProperty(this, yKey, true, {
                    ...propertyDefinition,
                    id: `yCurrentPositive`,
                    validation: positiveNumber,
                }),
                accumulativeValueProperty(this, yKey, true, {
                    ...propertyDefinition,
                    id: `yCurrentNegative`,
                    validation: negativeNumber,
                }),
                trailingAccumulatedValueProperty(this, yKey, true, {
                    ...propertyDefinition,
                    id: `yPrevious`,
                }),
                valueProperty(this, yKey, true, { id: `yRaw` }), // Raw value pass-through.
                valueProperty(this, 'totalType', false, {
                    id: `totalTypeValue`,
                    missingValue: undefined,
                    validation: totalTypeValue,
                }),
            ],
            dataVisible: this.visible,
        });
        this.onDataProcessed(dataModel, processedData);

        this.updateSeriesItemTypes();
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
            const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent').index;
            const yExtent = values[yCurrIndex];
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return this.fixNumericExtent(fixedYExtent as any);
        }
    }

    protected getNodeClickEvent(
        event: MouseEvent,
        datum: WaterfallNodeDatum
    ): _ModuleSupport.CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: WaterfallNodeDatum
    ): _ModuleSupport.CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    private getCategoryAxis(): _ModuleSupport.ChartAxis | undefined {
        return this.axes[this.getCategoryDirection()];
    }

    protected getValueAxis(): _ModuleSupport.ChartAxis | undefined {
        return this.axes[this.getBarDirection()];
    }

    async createNodeData() {
        const { data, dataModel, visible, ctx, line } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && visible && xAxis && yAxis && dataModel)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barAlongX = this.getBarDirection() === ChartAxisDirection.X;

        const barWidth = xScale.bandwidth || 10;
        const halfLineWidth = line.strokeWidth / 2;
        const offsetDirection = barAlongX ? -1 : 1;
        const offset = offsetDirection * halfLineWidth;

        const { yKey = '', xKey = '', processedData } = this;
        if (processedData?.type !== 'ungrouped') return [];

        const contexts: WaterfallContext[] = [];

        const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yRaw`).index;
        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;
        const contextIndexMap = new Map<SeriesItemType, number>();

        const pointData: WaterfallNodePointDatum[] = [];

        const yCurrIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrent').index;
        const yPrevIndex = dataModel.resolveProcessedDataIndexById(this, 'yPrevious').index;
        const yCurrTotalIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentTotal').index;

        function getValues(
            isTotal: boolean,
            isSubtotal: boolean,
            values: any[]
        ): { cumulativeValue: number | undefined; trailingValue: number | undefined } {
            if (isTotal || isSubtotal) {
                return {
                    cumulativeValue: values[yCurrTotalIndex],
                    trailingValue: isSubtotal ? trailingSubtotal : 0,
                };
            }

            return {
                cumulativeValue: values[yCurrIndex],
                trailingValue: values[yPrevIndex],
            };
        }

        function getValue(
            isTotal: boolean,
            isSubtotal: boolean,
            rawValue?: number,
            cumulativeValue?: number,
            trailingValue?: number
        ) {
            if (isTotal) {
                return cumulativeValue;
            }
            if (isSubtotal) {
                return (cumulativeValue ?? 0) - (trailingValue ?? 0);
            }
            return rawValue;
        }

        let trailingSubtotal = 0;
        processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
            const datumType = values[totalTypeIndex];

            const isSubtotal = this.isSubtotal(datumType);
            const isTotal = this.isTotal(datumType);
            const isTotalOrSubtotal = isTotal || isSubtotal;

            const xDatum = keys[xIndex];
            const x = Math.round(xScale.convert(xDatum));

            const rawValue = values[yRawIndex];

            const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, values);

            if (isTotalOrSubtotal) {
                trailingSubtotal = cumulativeValue ?? 0;
            }

            const currY = Math.round(yScale.convert(cumulativeValue));
            const trailY = Math.round(yScale.convert(trailingValue));

            const value = getValue(isTotal, isSubtotal, rawValue, cumulativeValue, trailingValue);
            const isPositive = (value ?? 0) >= 0;

            const seriesItemType = this.getSeriesItemType(isPositive, datumType);
            const { fill, stroke, strokeWidth, label } = this.getItemConfig(seriesItemType);

            const y = (isPositive ? currY : trailY) - offset;
            const bottomY = (isPositive ? trailY : currY) + offset;
            const barHeight = Math.max(strokeWidth, Math.abs(bottomY - y));

            const itemId = seriesItemType;
            let contextIndex = contextIndexMap.get(itemId);
            if (contextIndex === undefined) {
                contextIndex = contexts.length;
                contextIndexMap.set(itemId, contextIndex);
            }
            contexts[contextIndex] ??= {
                itemId,
                nodeData: [],
                labelData: [],
                pointData: [],
            };

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

            const pointY = isTotalOrSubtotal ? currY : trailY;
            const pixelAlignmentOffset = (Math.floor(line.strokeWidth) % 2) / 2;

            const pathPoint = {
                // lineTo
                x: barAlongX ? pointY + pixelAlignmentOffset : rect.x,
                y: barAlongX ? rect.y : pointY + pixelAlignmentOffset,
                // moveTo
                x2: barAlongX ? currY + pixelAlignmentOffset : rect.x + rect.width,
                y2: barAlongX ? rect.y + rect.height : currY + pixelAlignmentOffset,
                size: 0,
            };

            pointData.push(pathPoint);

            const { formatter, placement, padding } = label;

            const nodeDatum: WaterfallNodeDatum = {
                index: dataIndex,
                series: this,
                itemId,
                datum,
                cumulativeValue: cumulativeValue ?? 0,
                xValue: xDatum,
                yValue: value,
                yKey,
                xKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                nodeMidPoint,
                fill,
                stroke,
                strokeWidth,
                label: createLabelData({
                    value,
                    rect,
                    placement,
                    seriesId: this.id,
                    padding,
                    formatter,
                    barAlongX,
                    ctx,
                    itemId,
                }),
            };

            contexts[contextIndex].nodeData.push(nodeDatum);
            contexts[contextIndex].labelData.push(nodeDatum);
        });

        const connectorLinesEnabled = this.line.enabled;
        if (contexts.length > 0 && yCurrIndex !== undefined && connectorLinesEnabled) {
            contexts[0].pointData = pointData;
        }

        return contexts;
    }

    private updateSeriesItemTypes() {
        const { dataModel, seriesItemTypes, processedData } = this;

        if (!dataModel || !processedData) {
            return;
        }

        seriesItemTypes.clear();

        const yPositiveIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentPositive').index;
        const yNegativeIndex = dataModel.resolveProcessedDataIndexById(this, 'yCurrentNegative').index;
        const totalTypeIndex = dataModel.resolveProcessedDataIndexById(this, `totalTypeValue`).index;

        const positiveDomain = processedData.domain.values[yPositiveIndex] ?? [];
        const negativeDomain = processedData.domain.values[yNegativeIndex] ?? [];

        if (positiveDomain.length > 0) {
            seriesItemTypes.add('positive');
        }

        if (negativeDomain.length > 0) {
            seriesItemTypes.add('negative');
        }

        const itemTypes = processedData?.domain.values[totalTypeIndex];
        if (!itemTypes) {
            return;
        }

        itemTypes.forEach((type) => {
            if (type === 'total' || type === 'subtotal') {
                seriesItemTypes.add('total');
            }
        });
    }

    private isSubtotal(datumType: SeriesItemType) {
        return datumType === 'subtotal';
    }

    private isTotal(datumType: SeriesItemType) {
        return datumType === 'total';
    }

    protected nodeFactory() {
        return new Rect();
    }

    private getSeriesItemType(isPositive: boolean, datumType?: SeriesItemType): SeriesItemType {
        return datumType ?? (isPositive ? 'positive' : 'negative');
    }

    private getItemConfig(seriesItemType: SeriesItemType): WaterfallSeriesItem {
        switch (seriesItemType) {
            case 'positive': {
                return this.item.positive;
            }
            case 'negative': {
                return this.item.negative;
            }
            case 'subtotal':
            case 'total': {
                return this.item.total;
            }
        }
    }

    protected async updateDatumSelection(opts: {
        nodeData: WaterfallNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const {
            yKey = '',
            highlightStyle: { item: itemHighlightStyle },
            id: seriesId,
            ctx,
        } = this;

        const xAxis = this.getCategoryAxis();
        const crisp = checkCrisp(xAxis?.visibleRange);

        const categoryAlongX = this.getCategoryDirection() === ChartAxisDirection.X;

        datumSelection.each((rect, datum) => {
            const seriesItemType = datum.itemId;
            const {
                fillOpacity,
                strokeOpacity,
                strokeWidth,
                lineDash,
                lineDashOffset,
                formatter,
                shadow: fillShadow,
            } = this.getItemConfig(seriesItemType);
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
                isHighlighted: isHighlight,
                style,
                highlightStyle: itemHighlightStyle,
                formatter,
                seriesId,
                itemId: datum.itemId,
                ctx,
                value: datum.yValue,
                yKey,
            });
            config.crisp = crisp;
            config.visible = visible;
            updateRect({ rect, config });
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: WaterfallNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        if (labelData.length === 0) {
            return labelSelection.update([]);
        }

        const itemId = labelData[0].itemId;
        const {
            label: { enabled },
        } = this.getItemConfig(itemId);
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, any> }) {
        const { labelSelection } = opts;
        labelSelection.each((text, datum) => {
            const labelDatum = datum.label;
            const { label } = this.getItemConfig(datum.itemId);
            updateLabel({ labelNode: text, labelDatum, config: label, visible: true });
        });
    }

    getTooltipHtml(nodeDatum: WaterfallNodeDatum): string {
        const {
            xKey,
            yKey,
            ctx: { callbackCache },
        } = this;

        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, id: seriesId } = this;

        const { datum, itemId, xValue, yValue } = nodeDatum;

        const { fill, strokeWidth, name, formatter, tooltip: itemTooltip } = this.getItemConfig(itemId);

        let format: any | undefined = undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                value: yValue,
                xKey,
                yKey,
                fill,
                strokeWidth,
                highlighted: false,
                seriesId,
                itemId: nodeDatum.itemId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        const isTotal = this.isTotal(itemId);
        const isSubtotal = this.isSubtotal(itemId);
        const ySubheading = isTotal ? 'Total' : isSubtotal ? 'Subtotal' : name ?? yName ?? yKey;

        const title = sanitizeHtml(yName);
        const content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br>` + `<b>${sanitizeHtml(ySubheading)}</b>: ${yString}`;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        return this.tooltip.toTooltipHtml(
            defaults,
            {
                datum,
                xKey,
                xValue,
                xName,
                yKey,
                yValue,
                yName,
                color,
                seriesId,
                itemId,
            },
            itemTooltip
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, seriesItemTypes } = this;

        if (legendType !== 'category') {
            return [];
        }

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];

        function getLegendItemText(item: SeriesItemType, name?: string): string | undefined {
            if (name !== undefined) {
                return name;
            }
            return `${item.charAt(0).toUpperCase()}${item.substring(1)}`;
        }

        seriesItemTypes.forEach((item) => {
            const { fill, stroke, fillOpacity, strokeOpacity, name } = this.getItemConfig(item);
            const legendItemText = getLegendItemText(item, name);
            legendData.push({
                legendType: 'category',
                id,
                itemId: item,
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
        });

        return legendData;
    }

    protected toggleSeriesItem(): void {}

    animateEmptyUpdateReady({ datumSelections, labelSelections, contextData, paths }: WaterfallAnimationData) {
        const duration = this.ctx.animationManager.defaultDuration();

        contextData.forEach(({ pointData }, contextDataIndex) => {
            this.animateRects(datumSelections[contextDataIndex], duration);
            this.animateLabels(labelSelections[contextDataIndex], duration);

            if (contextDataIndex !== 0 || !pointData) {
                return;
            }

            const [lineNode] = paths[contextDataIndex];
            if (this.direction === 'vertical') {
                this.animateConnectorLinesVertical(lineNode, pointData, duration);
            } else {
                this.animateConnectorLinesHorizontal(lineNode, pointData, duration);
            }
        });
    }

    protected animateRects(datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>, duration: number) {
        const horizontal = this.direction === 'horizontal';
        const yAxis = this.getValueAxis();
        datumSelection.each((rect, datum) => {
            this.ctx.animationManager.animateMany(
                `${this.id}_empty-update-ready_${rect.id}`,
                [
                    { from: yAxis?.scale.convert(0) ?? 0, to: horizontal ? datum.x : datum.y },
                    { from: 0, to: horizontal ? datum.width : datum.height },
                ],
                {
                    duration,
                    ease: _ModuleSupport.Motion.easeOut,
                    onUpdate([val, widthOrHeight]) {
                        if (horizontal) {
                            rect.x = val;
                            rect.width = widthOrHeight;

                            rect.y = datum.y;
                            rect.height = datum.height;
                        } else {
                            rect.y = val;
                            rect.height = widthOrHeight;

                            rect.x = datum.x;
                            rect.width = datum.width;
                        }
                    },
                }
            );
        });
    }

    protected animateLabels(labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum>, duration: number) {
        labelSelection.each((label) => {
            this.ctx.animationManager.animate(`${this.id}_empty-update-ready_${label.id}`, {
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

    protected animateConnectorLinesHorizontal(
        lineNode: _Scene.Path,
        pointData: WaterfallNodePointDatum[],
        duration: number
    ) {
        const { path: linePath } = lineNode;

        this.updateLineNode(lineNode);

        const valueAxis = this.getValueAxis();
        const startX = valueAxis?.scale.convert(0);
        const endX = pointData.reduce((end, point) => {
            if (point.x > end) {
                end = point.x;
            }
            return end;
        }, 0);

        const scale = (value: number, start1: number, end1: number, start2: number, end2: number) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };

        this.ctx.animationManager.animate<number>(`${this.id}_empty-update-ready`, {
            from: startX,
            to: endX,
            duration,
            ease: _ModuleSupport.Motion.easeOut,
            onUpdate(pointX) {
                linePath.clear({ trackChanges: true });

                pointData.forEach((point, index) => {
                    const x = scale(pointX, startX, endX, startX, point.x);
                    const x2 = scale(pointX, startX, endX, startX, point.x2);
                    if (index !== 0) {
                        linePath.lineTo(x, point.y);
                    }
                    linePath.moveTo(x2, point.y2);
                });

                lineNode.checkPathDirty();
            },
        });
    }

    protected animateConnectorLinesVertical(
        lineNode: _Scene.Path,
        pointData: WaterfallNodePointDatum[],
        duration: number
    ) {
        const { path: linePath } = lineNode;

        this.updateLineNode(lineNode);

        const valueAxis = this.getValueAxis();
        const startY = valueAxis?.scale.convert(0);
        const endY = pointData.reduce((end, point) => {
            if (point.y < end) {
                end = point.y;
            }
            return end;
        }, Infinity);

        const scale = (value: number, start1: number, end1: number, start2: number, end2: number) => {
            return ((value - start1) / (end1 - start1)) * (end2 - start2) + start2;
        };

        this.ctx.animationManager.animate<number>(`${this.id}_empty-update-ready`, {
            from: startY,
            to: endY,
            duration,
            ease: _ModuleSupport.Motion.easeOut,
            onUpdate(pointY) {
                linePath.clear({ trackChanges: true });

                pointData.forEach((point, index) => {
                    const y = scale(pointY, startY, endY, startY, point.y);
                    const y2 = scale(pointY, startY, endY, startY, point.y2);
                    if (index !== 0) {
                        linePath.lineTo(point.x, y);
                    }
                    linePath.moveTo(point.x2, y2);
                });

                lineNode.checkPathDirty();
            },
        });
    }

    animateReadyUpdate(data: WaterfallAnimationData) {
        this.resetSelectionRectsAndPaths(data);
    }

    animateReadyHighlight(highlightSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize(data: WaterfallAnimationData) {
        this.resetSelectionRectsAndPaths(data);
    }

    resetSelectionRectsAndPaths({ datumSelections, contextData, paths }: WaterfallAnimationData) {
        this.resetConnectorLinesPath({ contextData, paths });
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    resetSelectionRects(selection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>) {
        selection.each((rect, datum) => {
            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
        });
    }

    resetConnectorLinesPath({
        contextData,
        paths,
    }: {
        contextData: Array<WaterfallContext>;
        paths: Array<Array<_Scene.Path>>;
    }) {
        if (paths.length === 0) {
            return;
        }

        const [lineNode] = paths[0];

        this.updateLineNode(lineNode);

        const { path: linePath } = lineNode;
        linePath.clear({ trackChanges: true });

        const { pointData } = contextData[0];
        if (!pointData) {
            return;
        }
        pointData.forEach((point, index) => {
            if (index !== 0) {
                linePath.lineTo(point.x, point.y);
            }
            linePath.moveTo(point.x2, point.y2);
        });

        lineNode.checkPathDirty();
    }

    protected updateLineNode(lineNode: _Scene.Path) {
        const { stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = this.line;

        lineNode.stroke = stroke;
        lineNode.strokeWidth = this.getStrokeWidth(strokeWidth);
        lineNode.strokeOpacity = strokeOpacity;
        lineNode.lineDash = lineDash;
        lineNode.lineDashOffset = lineDashOffset;

        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.pointerEvents = _Scene.PointerEvents.None;
    }

    protected isLabelEnabled() {
        return this.item.positive.label.enabled || this.item.negative.label.enabled || this.item.total.label.enabled;
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
        return { inner: 0.2, outer: 0.3 };
    }
}
