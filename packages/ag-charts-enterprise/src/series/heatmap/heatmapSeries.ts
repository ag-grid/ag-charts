import type {
    AgHeatmapSeriesFormat,
    AgHeatmapSeriesFormatterParams,
    AgHeatmapSeriesLabelFormatterParams,
    AgHeatmapSeriesTooltipRendererParams,
    AgTooltipRendererResult,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const {
    Validate,
    SeriesNodePickMode,
    valueProperty,
    ChartAxisDirection,
    COLOR_STRING_ARRAY,
    OPT_NUMBER,
    OPT_STRING,
    OPT_FUNCTION,
    OPT_NUMBER_ARRAY,
    OPT_COLOR_STRING,
} = _ModuleSupport;
const { Rect } = _Scene;
const { ContinuousScale, ColorScale } = _Scale;
const { sanitizeHtml, Color, Logger } = _Util;

interface HeatmapNodeDatum extends Required<_ModuleSupport.CartesianSeriesNodeDatum> {
    readonly label: _Util.MeasuredLabel;
    readonly width: number;
    readonly height: number;
    readonly fill: string;
    readonly colorValue: any;
}

class HeatmapSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.CartesianSeriesNodeClickEvent<HeatmapNodeDatum, HeatmapSeries, TEvent> {
    readonly labelKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: HeatmapNodeDatum, series: HeatmapSeries) {
        super(type, nativeEvent, datum, series);
        this.labelKey = series.labelKey;
    }
}

class HeatmapSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgHeatmapSeriesLabelFormatterParams) => string = undefined;
}

export class HeatmapSeries extends _ModuleSupport.CartesianSeries<_Scene.Rect, HeatmapNodeDatum> {
    static className = 'HeatmapSeries';
    static type = 'heatmap' as const;

    readonly label = new HeatmapSeriesLabel();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_STRING)
    labelKey?: string = undefined;

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(OPT_STRING)
    labelName?: string = 'Label';

    @Validate(OPT_STRING)
    colorKey?: string = 'color';

    @Validate(OPT_STRING)
    colorName?: string = 'color';

    @Validate(OPT_NUMBER_ARRAY)
    colorDomain: number[] | undefined = undefined;

    @Validate(COLOR_STRING_ARRAY)
    colorRange: string[] = ['#cb4b3f', '#6acb64'];

    colorScale: _Scale.ColorScale;

    @Validate(OPT_COLOR_STRING)
    stroke: string = 'black';

    @Validate(OPT_NUMBER(0))
    strokeWidth: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgHeatmapSeriesFormatterParams<any>) => AgHeatmapSeriesFormat = undefined;

    readonly tooltip = new _ModuleSupport.SeriesTooltip<AgHeatmapSeriesTooltipRendererParams>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasMarkers: false,
        });

        this.label.enabled = false;

        this.colorScale = new ColorScale();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey = '', yKey = '', axes, labelKey } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis) {
            return;
        }

        const data = xKey && yKey && this.data ? this.data : [];
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const isContinuousX = xScale instanceof ContinuousScale;
        const isContinuousY = yScale instanceof ContinuousScale;

        const { colorScale, colorDomain, colorRange, colorKey } = this;

        const { dataModel, processedData } = await dataController.request<any>(this.id, data ?? [], {
            props: [
                valueProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yKey, isContinuousY, { id: 'yValue' }),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: 'labelValue' })] : []),
            ],
        });
        this.dataModel = dataModel;
        this.processedData = processedData;

        if (colorKey) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
            colorScale.domain = colorDomain ?? processedData.domain.values[colorKeyIdx];
            colorScale.range = colorRange;
            colorScale.update();
        }
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;

        if (!dataModel || !processedData) return [];

        if (direction === ChartAxisDirection.X) {
            return dataModel.getDomain(this, `xValue`, 'value', processedData);
        } else {
            return dataModel.getDomain(this, `yValue`, 'value', processedData);
        }
    }

    protected override getNodeClickEvent(
        event: MouseEvent,
        datum: HeatmapNodeDatum
    ): HeatmapSeriesNodeClickEvent<'nodeClick'> {
        return new HeatmapSeriesNodeClickEvent('nodeClick', event, datum, this);
    }

    protected override getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: HeatmapNodeDatum
    ): HeatmapSeriesNodeClickEvent<'nodeDoubleClick'> {
        return new HeatmapSeriesNodeClickEvent('nodeDoubleClick', event, datum, this);
    }

    async createNodeData() {
        const {
            data,
            visible,
            axes,
            dataModel,
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && dataModel && visible && xAxis && yAxis)) {
            return [];
        }

        if (xAxis.type !== 'category' || yAxis.type !== 'category') {
            Logger.warnOnce(
                `Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
            );
            return [];
        }

        const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
        const labelDataIdx = this.labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : -1;
        const colorDataIdx = this.colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const { colorScale, label, labelKey, xKey = '', yKey = '', colorKey } = this;
        const nodeData: HeatmapNodeDatum[] = new Array(this.processedData?.data.length ?? 0);

        const width = xScale.bandwidth ?? 10;
        const height = yScale.bandwidth ?? 10;

        const font = label.getFont();
        let actualLength = 0;
        for (const { values, datum } of this.processedData?.data ?? []) {
            const xDatum = values[xDataIdx];
            const yDatum = values[yDataIdx];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            const labelValue = labelKey ? values[labelDataIdx] : colorKey ? values[colorDataIdx] : '';
            let text: string;
            if (label.formatter) {
                const labelFormatterParams = {
                    seriesId: this.id,
                    value: labelValue,
                };
                text = callbackCache.call(label.formatter, labelFormatterParams) ?? '';
            } else {
                text = String(labelValue);
            }
            const size = _Scene.HdpiCanvas.getTextSize(text, font);

            const colorValue = colorKey ? values[colorDataIdx] : undefined;
            const fill = colorScale.convert(colorValue);

            nodeData[actualLength++] = {
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                xValue: xDatum,
                yValue: yDatum,
                colorValue: colorValue,
                datum,
                point: { x, y, size: 0 },
                width,
                height,
                fill,
                label: {
                    text,
                    ...size,
                },
                nodeMidPoint: { x, y },
            };
        }

        nodeData.length = actualLength;

        return [{ itemId: this.yKey ?? this.id, nodeData, labelData: nodeData }];
    }

    override getLabelData(): _Util.PointLabelDatum[] {
        return this.contextNodeData?.reduce<_Util.PointLabelDatum[]>((r, n) => r.concat(n.labelData), []);
    }

    protected override nodeFactory() {
        return new Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: HeatmapNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, HeatmapNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, HeatmapNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight: isDatumHighlighted } = opts;

        const {
            xKey = '',
            yKey = '',
            labelKey,
            colorKey,
            formatter,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                    fillOpacity: highlightedFillOpacity,
                },
            },
            id: seriesId,
            ctx: { callbackCache },
        } = this;

        const xAxis = this.axes[ChartAxisDirection.X];
        const [visibleMin, visibleMax] = xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;
        datumSelection.each((rect, datum) => {
            const { point, width, height } = datum;

            const fill =
                isDatumHighlighted && highlightedFill !== undefined
                    ? Color.interpolate(datum.fill, highlightedFill)(highlightedFillOpacity ?? 1)
                    : datum.fill;
            const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : this.stroke;
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : this.strokeWidth;

            let format: AgHeatmapSeriesFormat | undefined = undefined;
            if (formatter) {
                format = callbackCache.call(formatter, {
                    datum: datum.datum,
                    fill,
                    stroke,
                    strokeWidth,
                    highlighted: isDatumHighlighted,
                    xKey,
                    yKey,
                    colorKey,
                    labelKey,
                    seriesId,
                });
            }

            rect.crisp = crisp;
            rect.x = point.x - width / 2;
            rect.y = point.y - height / 2;
            rect.width = width;
            rect.height = height;
            rect.fill = format?.fill ?? fill;
            rect.stroke = format?.stroke ?? stroke;
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: HeatmapNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, HeatmapNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;
        const { labelKey } = this;
        const { enabled } = this.label;
        const data = enabled || labelKey ? labelData : [];

        return labelSelection.update(data);
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, HeatmapNodeDatum> }) {
        const { labelSelection } = opts;
        const { label } = this;

        labelSelection.each((text, datum) => {
            if (datum.label.width > datum.width || datum.label.height > datum.height) {
                text.visible = false;
                return;
            }
            text.visible = true;
            text.text = datum.label.text;
            text.fill = label.color;
            text.x = datum.nodeMidPoint.x;
            text.y = datum.nodeMidPoint.y;
            text.fontStyle = label.fontStyle;
            text.fontWeight = label.fontWeight;
            text.fontSize = label.fontSize;
            text.fontFamily = label.fontFamily;
            text.textAlign = 'center';
            text.textBaseline = 'middle';
        });
    }

    getTooltipHtml(nodeDatum: HeatmapNodeDatum): string {
        const { xKey, yKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const {
            formatter,
            tooltip,
            xName,
            yName,
            labelKey,
            labelName,
            id: seriesId,
            stroke,
            strokeWidth,
            colorKey,
            colorName,
            colorScale,
            ctx: { callbackCache },
        } = this;

        const {
            datum,
            xValue,
            yValue,
            colorValue,
            label: { text: labelValue },
        } = nodeDatum;
        const fill = colorScale.convert(colorValue);

        let format: AgHeatmapSeriesFormat | undefined = undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                datum: nodeDatum,
                xKey,
                yKey,
                colorKey,
                labelKey,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                seriesId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';
        const title = this.title ?? yName;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName || xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName || yKey)}</b>: ${yString}`;

        if (colorKey) {
            content = `<b>${sanitizeHtml(colorName || colorKey)}</b>: ${sanitizeHtml(colorValue)}<br>` + content;
        }

        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName || labelKey)}</b>: ${sanitizeHtml(labelValue)}<br>` + content;
        }

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            xKey,
            xValue,
            xName,
            yKey,
            yValue,
            yName,
            labelKey,
            labelName,
            title,
            color,
            seriesId,
        });
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.GradientLegendDatum[] {
        const { data, dataModel, xKey, yKey, colorKey } = this;

        if (!(data?.length && xKey && yKey && colorKey && dataModel && legendType === 'gradient')) {
            return [];
        }

        return [
            {
                legendType: 'gradient',
                enabled: this.visible,
                seriesId: this.id,
                colorName: this.colorName,
                colorDomain:
                    this.colorDomain ??
                    this.processedData!.domain.values[
                        dataModel.resolveProcessedDataIndexById(this, 'colorValue').index
                    ],
                colorRange: this.colorRange,
            },
        ];
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    override getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }
}
