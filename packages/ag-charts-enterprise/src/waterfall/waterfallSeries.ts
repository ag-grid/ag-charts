import type { AgCartesianSeriesLabelFormatterParams, AgTooltipRendererResult } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import type {
    AgWaterfallSeriesFormat,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesFormatterParams,
    AgWaterfallSeriesTooltipRendererParams,
} from './typings';

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
    createLabelData,
    getRectConfig,
    updateRect,
    checkCrisp,
    updateLabel,
} = _ModuleSupport;
const { toTooltipHtml, ContinuousScale, Rect } = _Scene;
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

interface WaterfallSeriesItems {
    readonly positive: WaterfallSeriesItem;
    readonly negative: WaterfallSeriesItem;
    readonly total: WaterfallSeriesItem;
}

type WaterfallContext = _ModuleSupport.SeriesNodeDataContext<WaterfallNodeDatum> & {
    pointData?: WaterfallNodePointDatum[];
};

class WaterfallSeriesNodeBaseClickEvent extends _ModuleSupport.CartesianSeriesNodeBaseClickEvent<any> {
    readonly labelKey?: string;

    constructor(
        labelKey: string | undefined,
        xKey: string,
        yKey: string,
        nativeEvent: MouseEvent,
        datum: WaterfallNodeDatum,
        series: WaterfallBarSeries | WaterfallColumnSeries
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

class WaterfallSeriesTooltip extends _ModuleSupport.SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
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

type SeriesItemType = 'positive' | 'negative' | 'total' | 'subtotal';

export class WaterfallBarSeries extends _ModuleSupport.CartesianSeries<
    _ModuleSupport.SeriesNodeDataContext<any>,
    _Scene.Rect
> {
    static className = 'WaterfallBarSeries';
    static type: 'waterfall-bar' | 'waterfall-column' = 'waterfall-bar' as const;

    readonly item: WaterfallSeriesItems = {
        positive: new WaterfallSeriesItem(),
        negative: new WaterfallSeriesItem(),
        total: new WaterfallSeriesItem(),
    };

    readonly line = new WaterfallSeriesConnectorLine();

    tooltip: WaterfallSeriesTooltip = new WaterfallSeriesTooltip();

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

    @Validate(OPT_STRING)
    typeKey?: string = undefined;

    private seriesItemTypes: Set<SeriesItemType> = new Set(['positive', 'negative', 'total']);

    async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yKey, data = [], typeKey = '' } = this;

        if (!yKey) return;

        const isContinuousX = this.getCategoryAxis()?.scale instanceof ContinuousScale;

        const positiveNumber = (v: any) => {
            return isContinuous(v) && v >= 0;
        };

        const negativeNumber = (v: any) => {
            return isContinuous(v) && v < 0;
        };

        const typeKeyValue = (v: any) => {
            return v === 'total' || v === 'subtotal';
        };

        const propertyDefinition = {
            missingValue: undefined,
            invalidValue: undefined,
        };

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: `xKey` }),
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
                ...(typeKey
                    ? [
                          valueProperty(this, typeKey, false, {
                              id: `typeValue`,
                              missingValue: undefined,
                              validation: typeKeyValue,
                          }),
                      ]
                    : []),
            ],
            dataVisible: this.visible,
        });
        this.dataModel = dataModel;
        this.processedData = processedData;

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
        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xKey`).index;
        const typeKeyIndex = this.typeKey ? dataModel.resolveProcessedDataIndexById(this, `typeValue`).index : -1;
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
            const datumType = values[typeKeyIndex];

            const isSubtotal = this.isSubtotal(datumType);
            const isTotal = this.isTotal(datumType);
            const isTotalOrSubtotal = isTotal || isSubtotal;

            const xDatum = keys[xIndex];
            const x = Math.round(xScale.convert(xDatum));

            const rawValue = values[yRawIndex];

            const { cumulativeValue, trailingValue } = getValues(isTotal, isSubtotal, values);

            if (isSubtotal) {
                trailingSubtotal = cumulativeValue ?? 0;
            }

            const currY = Math.round(yScale.convert(cumulativeValue, { strict: false }));
            const trailY = Math.round(yScale.convert(trailingValue, { strict: false }));

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
        const typeKeyIndex = this.typeKey ? dataModel.resolveProcessedDataIndexById(this, `typeValue`).index : -1;

        const positiveDomain = processedData.domain.values[yPositiveIndex] ?? [];
        const negativeDomain = processedData.domain.values[yNegativeIndex] ?? [];

        if (positiveDomain.length > 0) {
            seriesItemTypes.add('positive');
        }

        if (negativeDomain.length > 0) {
            seriesItemTypes.add('negative');
        }

        const itemTypes = processedData?.domain.values[typeKeyIndex];
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
            highlightStyle: { item: itemHighlightStyle },
            id: seriesId,
            ctx,
        } = this;

        const xAxis = this.axes[ChartAxisDirection.X];
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
                strokeWidth: this.getStrokeWidth(strokeWidth, datum),
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
            axes,
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, id: seriesId } = this;

        const { datum, itemId, xValue, yValue } = nodeDatum;

        const { fill, strokeWidth, name, formatter, tooltip: itemTooltip } = this.getItemConfig(itemId);

        const tooltipRenderer = itemTooltip.renderer ?? this.tooltip.renderer;

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

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
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
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): _ModuleSupport.CategoryLegendDatum[] {
        const { id, seriesItemTypes } = this;

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

    animateEmptyUpdateReady({
        datumSelections,
        labelSelections,
        contextData,
        paths,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, WaterfallNodeDatum>>;
        labelSelections: Array<_Scene.Selection<_Scene.Text, WaterfallNodeDatum>>;
        contextData: Array<WaterfallContext>;
        paths: Array<Array<_Scene.Path>>;
        seriesRect?: _Scene.BBox;
    }) {
        const duration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;

        contextData.forEach(({ pointData }, contextDataIndex) => {
            this.animateRects(datumSelections[contextDataIndex], duration);
            this.animateLabels(labelSelections[contextDataIndex], duration);

            if (contextDataIndex !== 0 || !pointData) {
                return;
            }

            const [lineNode] = paths[contextDataIndex];
            this.animateConnectorLines(lineNode, pointData, duration);
        });
    }

    protected animateRects(datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>, duration: number) {
        const yAxis = this.getValueAxis();
        datumSelection.each((rect, datum) => {
            this.ctx.animationManager?.animateMany(
                `${this.id}_empty-update-ready_${rect.id}`,
                [
                    { from: yAxis?.scale.convert(0) ?? 0, to: datum.x },
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

    protected animateLabels(labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum>, duration: number) {
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

    protected animateConnectorLines(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[], duration: number) {
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

        this.ctx.animationManager?.animate<number>(`${this.id}_empty-update-ready`, {
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

    animateReadyUpdate({
        datumSelections,
        contextData,
        paths,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, WaterfallNodeDatum>>;
        contextData: Array<WaterfallContext>;
        paths: Array<Array<_Scene.Path>>;
    }) {
        this.resetConnectorLinesPath({ contextData, paths });
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    animateReadyHighlight(highlightSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize({
        datumSelections,
        contextData,
        paths,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, WaterfallNodeDatum>>;
        contextData: Array<WaterfallContext>;
        paths: Array<Array<_Scene.Path>>;
    }) {
        this.ctx.animationManager?.reset();
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
        return ChartAxisDirection.X;
    }

    protected getCategoryDirection() {
        return ChartAxisDirection.Y;
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.3 };
    }
}

export class WaterfallColumnSeries extends WaterfallBarSeries {
    static className = 'WaterfallColumnSeries';
    static type = 'waterfall-column' as const;

    protected getBarDirection() {
        return ChartAxisDirection.Y;
    }

    protected getCategoryDirection() {
        return ChartAxisDirection.X;
    }

    protected animateConnectorLines(lineNode: _Scene.Path, pointData: WaterfallNodePointDatum[], duration: number) {
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

        this.ctx.animationManager?.animate<number>(`${this.id}_empty-update-ready`, {
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

    protected animateRects(datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>, duration: number) {
        const yAxis = this.getValueAxis();
        datumSelection.each((rect, datum) => {
            this.ctx.animationManager?.animateMany(
                `${this.id}_empty-update-ready_${rect.id}`,
                [
                    { from: yAxis?.scale.convert(0) ?? 0, to: datum.y },
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
