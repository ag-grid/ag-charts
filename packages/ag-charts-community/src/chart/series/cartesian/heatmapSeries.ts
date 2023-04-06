import { Selection } from '../../../scene/selection';
import { SeriesTooltip, SeriesNodeDataContext, SeriesNodePickMode } from '../series';
import { extent } from '../../../util/array';
import { LegendDatum } from '../../legendDatum';
import { CartesianSeries, CartesianSeriesNodeBaseClickEvent, CartesianSeriesNodeDatum } from './cartesianSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { toTooltipHtml } from '../../tooltip/tooltip';
import { ColorScale } from '../../../scale/colorScale';
import { ContinuousScale } from '../../../scale/continuousScale';
import { sanitizeHtml } from '../../../util/sanitize';
import { Label } from '../../label';
import { Rect } from '../../../scene/shape/rect';
import { Text } from '../../../scene/shape/text';
import { HdpiCanvas } from '../../../canvas/hdpiCanvas';
import { MeasuredLabel, PointLabelDatum } from '../../../util/labelPlacement';
import { checkDatum } from '../../../util/value';
import {
    OPT_FUNCTION,
    OPT_STRING,
    STRING,
    COLOR_STRING_ARRAY,
    OPT_NUMBER_ARRAY,
    OPT_COLOR_STRING,
    OPT_NUMBER,
    Validate,
} from '../../../util/validation';
import {
    AgHeatmapSeriesFormat,
    AgHeatmapSeriesFormatterParams,
    AgHeatmapSeriesTooltipRendererParams,
    AgTooltipRendererResult,
} from '../../agChartOptions';

interface HeatmapNodeDatum extends Required<CartesianSeriesNodeDatum> {
    readonly label: MeasuredLabel;
    readonly width: number;
    readonly height: number;
    readonly fill: string;
}

class HeatmapSeriesNodeBaseClickEvent extends CartesianSeriesNodeBaseClickEvent<any> {
    readonly labelKey?: string;

    constructor(
        labelKey: string | undefined,
        xKey: string,
        yKey: string,
        nativeEvent: MouseEvent,
        datum: HeatmapNodeDatum,
        series: HeatmapSeries
    ) {
        super(xKey, yKey, nativeEvent, datum, series);
        this.labelKey = labelKey;
    }
}

export class HeatmapSeriesNodeClickEvent extends HeatmapSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

export class HeatmapSeriesNodeDoubleClickEvent extends HeatmapSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

class HeatmapSeriesTooltip extends SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgHeatmapSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

export class HeatmapSeries extends CartesianSeries<SeriesNodeDataContext<HeatmapNodeDatum>, Rect> {
    static className = 'HeatmapSeries';
    static type = 'heatmap' as const;

    private xDomain: number[] = [];
    private yDomain: number[] = [];
    private xData: any[] = [];
    private yData: any[] = [];
    private validData: any[] = [];

    readonly label = new Label();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_STRING)
    labelKey?: string = undefined;

    @Validate(STRING)
    xName: string = '';

    @Validate(STRING)
    yName: string = '';

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

    colorScale: ColorScale;

    @Validate(STRING)
    protected _xKey: string = '';
    set xKey(value: string) {
        this._xKey = value;
        this.xData = [];
    }
    get xKey(): string {
        return this._xKey;
    }

    @Validate(STRING)
    protected _yKey: string = '';
    set yKey(value: string) {
        this._yKey = value;
        this.yData = [];
    }
    get yKey(): string {
        return this._yKey;
    }

    @Validate(OPT_COLOR_STRING)
    stroke: string = 'black';

    @Validate(OPT_NUMBER(0))
    strokeWidth: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgHeatmapSeriesFormatterParams<any>) => AgHeatmapSeriesFormat = undefined;

    readonly tooltip: HeatmapSeriesTooltip = new HeatmapSeriesTooltip();

    constructor() {
        super({
            pickModes: [
                SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: 0,
            hasMarkers: false,
        });

        const { label } = this;

        label.enabled = false;

        this.colorScale = new ColorScale();
    }

    async processData() {
        const { xKey, yKey, xAxis, yAxis } = this;

        if (!xAxis || !yAxis) {
            return;
        }

        const data = xKey && yKey && this.data ? this.data : [];
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const isContinuousX = xScale instanceof ContinuousScale;
        const isContinuousY = yScale instanceof ContinuousScale;

        this.validData = data.filter(
            (d) => checkDatum(d[xKey], isContinuousX) !== undefined && checkDatum(d[yKey], isContinuousY) !== undefined
        );
        this.xData = this.validData.map((d) => d[xKey]);
        this.yData = this.validData.map((d) => d[yKey]);
        this.validateXYData(this.xKey, this.yKey, data, xAxis, yAxis, this.xData, this.yData, 1);

        if (xAxis.scale instanceof ContinuousScale) {
            this.xDomain = this.fixNumericExtent(extent(this.xData), xAxis);
        } else {
            this.xDomain = this.xData;
        }
        if (yAxis.scale instanceof ContinuousScale) {
            this.yDomain = this.fixNumericExtent(extent(this.yData), yAxis);
        } else {
            this.yDomain = this.yData;
        }

        const { colorScale, colorDomain, colorRange, colorKey } = this;
        const colorValues: number[] = (
            colorKey ? this.validData.filter((datum) => datum[colorKey] != null).map((datum) => datum[colorKey]) : []
        ).filter((v) => Number.isFinite(v));
        if (colorValues.length === 0) {
            colorValues.push(0);
        }
        colorScale.domain = colorDomain ?? (extent(colorValues) as [number, number]);
        colorScale.range = colorRange;
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.xDomain;
        } else {
            return this.yDomain;
        }
    }

    protected getNodeClickEvent(event: MouseEvent, datum: HeatmapNodeDatum): HeatmapSeriesNodeClickEvent {
        return new HeatmapSeriesNodeClickEvent(this.labelKey, this.xKey, this.yKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(event: MouseEvent, datum: HeatmapNodeDatum): HeatmapSeriesNodeDoubleClickEvent {
        return new HeatmapSeriesNodeDoubleClickEvent(this.labelKey, this.xKey, this.yKey, event, datum, this);
    }

    async createNodeData() {
        const { data, visible, xAxis, yAxis } = this;

        if (!(data && visible && xAxis && yAxis)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const isContinuousX = xScale instanceof ContinuousScale;
        const isContinuousY = yScale instanceof ContinuousScale;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;
        const { xData, yData, validData, label, labelKey, colorKey, colorScale, xKey, yKey } = this;
        const nodeData: HeatmapNodeDatum[] = new Array(xData.length);

        const width = xScale.bandwidth || 10;
        const height = yScale.bandwidth || 10;

        const font = label.getFont();
        let actualLength = 0;
        for (let i = 0; i < xData.length; i++) {
            const xy = this.checkDomainXY(xData[i], yData[i], isContinuousX, isContinuousY);

            if (!xy) {
                continue;
            }

            const x = xScale.convert(xy[0]) + xOffset;
            const y = yScale.convert(xy[1]) + yOffset;

            if (!this.checkRangeXY(x, y, xAxis, yAxis)) {
                continue;
            }

            const text = labelKey ? String(validData[i][labelKey]) : '';
            const size = HdpiCanvas.getTextSize(text, font);

            const colorValue = colorKey ? validData[i][colorKey] ?? 0 : 0;
            const fill = colorScale.convert(colorValue);

            nodeData[actualLength++] = {
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum: validData[i],
                point: { x, y, size: 0 },
                width,
                height,
                fill,
                label: {
                    text,
                    ...size,
                },
            };
        }

        nodeData.length = actualLength;

        return [{ itemId: this.yKey, nodeData, labelData: nodeData }];
    }

    getLabelData(): PointLabelDatum[] {
        return this.contextNodeData?.reduce((r, n) => r.concat(n.labelData), [] as PointLabelDatum[]);
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected async updateDatumSelection(opts: {
        nodeData: HeatmapNodeDatum[];
        datumSelection: Selection<Rect, HeatmapNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData || [];
        return datumSelection.update(data);
    }

    protected async updateDatumNodes(opts: {
        datumSelection: Selection<Rect, HeatmapNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight: isDatumHighlighted } = opts;

        const {
            xKey,
            yKey,
            labelKey,
            colorKey,
            formatter,
            highlightStyle: {
                item: { fill: highlightedFill, stroke: highlightedStroke, strokeWidth: highlightedDatumStrokeWidth },
            },
            id: seriesId,
        } = this;

        const [visibleMin, visibleMax] = this.xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;
        datumSelection.each((rect, datum) => {
            const { point, width, height } = datum;

            const fill = isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : datum.fill;
            const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : this.stroke;
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : this.strokeWidth;

            let format: AgHeatmapSeriesFormat | undefined = undefined;
            if (formatter) {
                format = formatter({
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
            rect.fill = format?.fill || fill;
            rect.stroke = format?.stroke || stroke;
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: HeatmapNodeDatum[];
        labelSelection: Selection<Text, HeatmapNodeDatum>;
    }) {
        const { labelSelection } = opts;
        const {
            label: { enabled },
        } = this;

        const placedLabels = enabled ? this.chart?.placeLabels().get(this) ?? [] : [];

        const placedNodeDatum = placedLabels.map(
            (v): HeatmapNodeDatum => ({
                ...(v.datum as HeatmapNodeDatum),
                point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                },
            })
        );
        return labelSelection.update(placedNodeDatum);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, HeatmapNodeDatum> }) {
        const { labelSelection } = opts;
        const { label } = this;

        labelSelection.each((text, datum) => {
            text.text = datum.label.text;
            text.fill = label.color;
            text.x = datum.point?.x ?? 0;
            text.y = datum.point?.y ?? 0;
            text.fontStyle = label.fontStyle;
            text.fontWeight = label.fontWeight;
            text.fontSize = label.fontSize;
            text.fontFamily = label.fontFamily;
            text.textAlign = 'left';
            text.textBaseline = 'top';
        });
    }

    getTooltipHtml(nodeDatum: HeatmapNodeDatum): string {
        const { xKey, yKey, xAxis, yAxis } = this;

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
        } = this;

        const colorValue = colorKey ? nodeDatum.datum[colorKey] ?? 0 : 0;
        const fill = colorScale.convert(colorValue);

        let format: AgHeatmapSeriesFormat | undefined = undefined;

        if (formatter) {
            format = formatter({
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

        const color = (format && format.fill) || fill || 'gray';
        const title = this.title || yName;
        const datum = nodeDatum.datum;
        const xValue = datum[xKey];
        const yValue = datum[yKey];
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName || xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName || yKey)}</b>: ${yString}`;

        if (colorKey) {
            content = `<b>${sanitizeHtml(colorName || colorKey)}</b>: ${sanitizeHtml(colorValue)}<br>` + content;
        }

        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName || labelKey)}</b>: ${sanitizeHtml(datum[labelKey])}<br>` + content;
        }

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        const { renderer: tooltipRenderer } = tooltip;

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
                    labelKey,
                    labelName,
                    title,
                    color,
                    seriesId,
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): LegendDatum[] {
        // Hide the current legend implementation
        return [];
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
