import type { AgHeatmapSeriesFormat, FontStyle, FontWeight, TextAlign, VerticalAlign } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { formatLabels } from '../util/labelFormatter';
import { HeatmapSeriesProperties } from './heatmapSeriesProperties';

const {
    SeriesNodePickMode,
    computeBarFocusBounds,
    getMissCount,
    valueProperty,
    ChartAxisDirection,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} = _ModuleSupport;
const { Rect, PointerEvents } = _Scene;
const { ColorScale } = _Scale;
const { sanitizeHtml, Color, Logger } = _Util;

interface HeatmapNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly point: Readonly<_Scene.SizedPoint>;
    midPoint: Readonly<_Scene.Point>;
    readonly width: number;
    readonly height: number;
    readonly fill: string;
    readonly colorValue: any;
}

interface HeatmapLabelDatum extends _Scene.Point {
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    datum: any;
    itemId?: string;
    text: string;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle | undefined;
    fontFamily: string;
    fontWeight: FontWeight | undefined;
    color: string | undefined;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
}

class HeatmapSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.CartesianSeriesNodeEvent<TEvent> {
    readonly colorKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: HeatmapNodeDatum, series: HeatmapSeries) {
        super(type, nativeEvent, datum, series);
        this.colorKey = series.properties.colorKey;
    }
}

const textAlignFactors: Record<TextAlign, number> = {
    left: -0.5,
    center: 0,
    right: -0.5,
};

const verticalAlignFactors: Record<VerticalAlign, number> = {
    top: -0.5,
    middle: 0,
    bottom: -0.5,
};

export class HeatmapSeries extends _ModuleSupport.CartesianSeries<
    _Scene.Rect,
    HeatmapSeriesProperties,
    HeatmapNodeDatum,
    HeatmapLabelDatum
> {
    static readonly className = 'HeatmapSeries';
    static readonly type = 'heatmap' as const;

    override properties = new HeatmapSeriesProperties();

    protected override readonly NodeEvent = HeatmapSeriesNodeEvent;

    readonly colorScale = new ColorScale();

    private seriesItemEnabled: boolean[] = [];

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            hasMarkers: false,
            hasHighlightedLabels: true,
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !this.properties.isValid() || !this.data?.length) {
            return;
        }

        const { xKey, yKey, colorRange, colorKey } = this.properties;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const colorScaleType = this.colorScale.type;

        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: 'xValue' }),
                valueProperty(yKey, yScaleType, { id: 'yValue' }),
                ...(colorKey ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue' })] : []),
            ],
        });

        if (this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            this.colorScale.domain = processedData.domain.values[colorKeyIdx];
            this.colorScale.range = colorRange;
            this.colorScale.update();
        }
    }

    private isColorScaleValid() {
        const { colorKey } = this.properties;
        if (!colorKey) {
            return false;
        }

        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return false;
        }

        const colorDataIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
        const dataCount = processedData.data.length;
        const missCount = getMissCount(this, processedData.defs.values[colorDataIdx].missing);
        const colorDataMissing = dataCount === 0 || dataCount === missCount;
        return !colorDataMissing;
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

    async createNodeData() {
        const { data, visible, axes, dataModel } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && dataModel && visible && xAxis && yAxis)) {
            return;
        }

        if (xAxis.type !== 'category' || yAxis.type !== 'category') {
            Logger.warnOnce(
                `Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
            );
            return;
        }

        const {
            xKey,
            xName,
            yKey,
            yName,
            colorKey,
            colorName,
            textAlign,
            verticalAlign,
            itemPadding,
            colorRange,
            label,
        } = this.properties;

        const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`);
        const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`) : undefined;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const colorScaleValid = this.isColorScaleValid();
        const nodeData: HeatmapNodeDatum[] = [];
        const labelData: HeatmapLabelDatum[] = [];

        const width = xScale.bandwidth ?? 10;
        const height = yScale.bandwidth ?? 10;

        const textAlignFactor = (width - 2 * itemPadding) * textAlignFactors[textAlign];
        const verticalAlignFactor = (height - 2 * itemPadding) * verticalAlignFactors[verticalAlign];

        const sizeFittingHeight = () => ({ width, height, meta: null });
        const { seriesItemEnabled } = this;
        seriesItemEnabled.length = 0;

        for (const { values, datum } of this.processedData?.data ?? []) {
            const xDatum = values[xDataIdx];
            const yDatum = values[yDataIdx];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            const colorValue = values[colorDataIdx ?? -1];
            const fill = colorScaleValid && colorValue != null ? this.colorScale.convert(colorValue) : colorRange[0];
            seriesItemEnabled.push(colorValue != null);

            const labelText =
                colorValue == null
                    ? undefined
                    : this.getLabelText(label, {
                          value: colorValue,
                          datum,
                          colorKey,
                          colorName,
                          xKey,
                          yKey,
                          xName,
                          yName,
                      });

            const labels = formatLabels(
                labelText,
                this.properties.label,
                undefined,
                this.properties.label,
                { padding: itemPadding },
                sizeFittingHeight
            );

            const point = { x, y, size: 0 };

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                xValue: xDatum,
                yValue: yDatum,
                colorValue,
                datum,
                point,
                width,
                height,
                fill,
                midPoint: { x, y },
            });

            if (labels?.label != null) {
                const { text, fontSize, lineHeight, height: labelHeight } = labels.label;
                const { fontStyle, fontFamily, fontWeight, color } = this.properties.label;
                const lx = point.x + textAlignFactor * (width - 2 * itemPadding);
                const ly =
                    point.y + verticalAlignFactor * (height - 2 * itemPadding) - (labels.height - labelHeight) * 0.5;

                labelData.push({
                    series: this,
                    itemId: yKey,
                    datum,
                    text,
                    fontSize,
                    lineHeight,
                    fontStyle,
                    fontFamily,
                    fontWeight,
                    color,
                    textAlign,
                    verticalAlign,
                    x: lx,
                    y: ly,
                });
            }
        }

        return {
            itemId: this.properties.yKey ?? this.id,
            nodeData,
            labelData,
            scales: this.calculateScaling(),
            visible: this.visible,
        };
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
        const { isHighlight: isDatumHighlighted } = opts;
        const {
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const {
            xKey,
            yKey,
            colorKey,
            formatter,
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                    strokeOpacity: highlightedDatumStrokeOpacity,
                    fillOpacity: highlightedFillOpacity,
                },
            },
        } = this.properties;

        const xAxis = this.axes[ChartAxisDirection.X];
        const [visibleMin, visibleMax] = xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;

        opts.datumSelection.each((rect, datum) => {
            const { point, width, height } = datum;

            const fill =
                isDatumHighlighted && highlightedFill !== undefined
                    ? Color.interpolate(datum.fill, highlightedFill)(highlightedFillOpacity ?? 1)
                    : datum.fill;
            const stroke =
                isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : this.properties.stroke;
            const strokeOpacity =
                isDatumHighlighted && highlightedDatumStrokeOpacity !== undefined
                    ? highlightedDatumStrokeOpacity
                    : this.properties.strokeOpacity;
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : this.properties.strokeWidth;

            let format: AgHeatmapSeriesFormat | undefined;
            if (formatter) {
                format = callbackCache.call(formatter, {
                    datum: datum.datum,
                    fill,
                    stroke,
                    strokeOpacity,
                    strokeWidth,
                    highlighted: isDatumHighlighted,
                    xKey,
                    yKey,
                    colorKey,
                    seriesId,
                });
            }

            rect.crisp = crisp;
            rect.x = Math.floor(point.x - width / 2);
            rect.y = Math.floor(point.y - height / 2);
            rect.width = Math.ceil(width);
            rect.height = Math.ceil(height);
            rect.fill = format?.fill ?? fill;
            rect.stroke = format?.stroke ?? stroke;
            rect.strokeOpacity = format?.strokeOpacity ?? strokeOpacity ?? 1;
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: HeatmapLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, HeatmapLabelDatum>;
    }) {
        const { labelData, labelSelection } = opts;
        const { enabled } = this.properties.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, HeatmapLabelDatum> }) {
        opts.labelSelection.each((text, datum) => {
            text.text = datum.text;
            text.fontSize = datum.fontSize;
            text.lineHeight = datum.lineHeight;

            text.fontStyle = datum.fontStyle;
            text.fontFamily = datum.fontFamily;
            text.fontWeight = datum.fontWeight;
            text.fill = datum.color;

            text.textAlign = datum.textAlign;
            text.textBaseline = datum.verticalAlign;

            text.x = datum.x;
            text.y = datum.y;

            text.pointerEvents = PointerEvents.None;
        });
    }

    getTooltipHtml(nodeDatum: HeatmapNodeDatum): _ModuleSupport.TooltipContent {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;
        }

        const { xKey, yKey, colorKey, xName, yName, colorName, stroke, strokeWidth, colorRange, formatter, tooltip } =
            this.properties;
        const {
            colorScale,
            id: seriesId,
            ctx: { callbackCache },
        } = this;

        const { datum, xValue, yValue, colorValue, itemId } = nodeDatum;
        const fill = this.isColorScaleValid() ? colorScale.convert(colorValue) : colorRange[0];

        let format: AgHeatmapSeriesFormat | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                datum: nodeDatum,
                xKey,
                yKey,
                colorKey,
                fill,
                stroke,
                strokeWidth,
                highlighted: false,
                seriesId,
            });
        }

        const color = format?.fill ?? fill ?? 'gray';
        const title = this.properties.title ?? yName;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName ?? yKey)}</b>: ${yString}`;

        if (colorKey) {
            content = `<b>${sanitizeHtml(colorName ?? colorKey)}</b>: ${sanitizeHtml(colorValue)}<br>` + content;
        }

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                xKey,
                yKey,
                xName,
                yName,
                title,
                color,
                colorKey,
                colorName,
                itemId,
            }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.GradientLegendDatum[] {
        if (
            legendType !== 'gradient' ||
            !this.data?.length ||
            !this.properties.isValid() ||
            !this.isColorScaleValid() ||
            !this.dataModel
        ) {
            return [];
        }

        return [
            {
                legendType: 'gradient',
                enabled: this.visible,
                seriesId: this.id,
                colorName: this.properties.colorName,
                colorDomain:
                    this.processedData!.domain.values[this.dataModel.resolveProcessedDataIndexById(this, 'colorValue')],
                colorRange: this.properties.colorRange,
            },
        ];
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled && Boolean(this.properties.colorKey);
    }

    override getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }

    protected computeFocusBounds({ datumIndex, seriesRect }: _ModuleSupport.PickFocusInputs): _Scene.BBox | undefined {
        const datum = this.contextNodeData?.nodeData[datumIndex];
        if (datum === undefined) return undefined;
        const { width, height, midPoint } = datum;
        const focusRect = { x: midPoint.x - width / 2, y: midPoint.y - height / 2, width, height };
        return computeBarFocusBounds(focusRect, this.contentGroup, seriesRect);
    }
}
