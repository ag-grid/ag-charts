import type { AgHeatmapSeriesStyle, FontStyle, FontWeight, TextAlign, VerticalAlign } from 'ag-charts-community';
import { type AgHeatmapSeriesLabelFormatterParams, _ModuleSupport } from 'ag-charts-community';
import { type InternalAgColorType, Logger } from 'ag-charts-core';

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
    createDatumId,
    ColorScale,
    Rect,
    PointerEvents,
    applyShapeStyle,
    formatValue,
} = _ModuleSupport;

interface HeatmapNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly point: Readonly<_ModuleSupport.SizedPoint>;
    midPoint: Readonly<_ModuleSupport.Point>;
    readonly width: number;
    readonly height: number;
    readonly colorValue: any;
}

interface HeatmapLabelDatum extends _ModuleSupport.Point {
    datumIndex: number;
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

type ItemStyle = Pick<AgHeatmapSeriesStyle, 'fill'> &
    Required<Omit<AgHeatmapSeriesStyle, 'fill'>> & { opacity: number };

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
    _ModuleSupport.Rect,
    HeatmapSeriesProperties,
    HeatmapNodeDatum,
    HeatmapLabelDatum
> {
    static readonly className = 'HeatmapSeries';
    static readonly type = 'heatmap' as const;

    override properties = new HeatmapSeriesProperties();

    protected override readonly NodeEvent = HeatmapSeriesNodeEvent;

    readonly colorScale = new ColorScale();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: {
                ...DEFAULT_CARTESIAN_DIRECTION_KEYS,
                color: ['colorKey'],
            },
            propertyNames: {
                ...DEFAULT_CARTESIAN_DIRECTION_NAMES,
                color: ['colorName'],
            },
            categoryKey: undefined,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: [],
            hasMarkers: false,
            hasHighlightedLabels: true,
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !this.data?.length) {
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
                ...(colorKey
                    ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue', invalidValue: null })]
                    : []),
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
        const dataCount = processedData.input.count;
        const missCount = getMissCount(this, processedData.defs.values[colorDataIdx].missing);
        const colorDataMissing = dataCount === 0 || dataCount === missCount;
        return !colorDataMissing;
    }

    override xCoordinateRange(xValue: any, pixelSize: number): [number, number] {
        const xScale = this.axes[ChartAxisDirection.X]!.scale;
        const xOffset = (pixelSize * (xScale.bandwidth ?? 0)) / 2;
        const x = xScale.convert(xValue) + xOffset;
        const width = pixelSize * (xScale.bandwidth ?? 10);
        return [x, x + width];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number): [number, number] {
        const yScale = this.axes[ChartAxisDirection.Y]!.scale;
        const yOffset = (pixelSize * (yScale.bandwidth ?? 0)) / 2;
        const y = yScale.convert(yValues[0]) + yOffset;
        const height = pixelSize * (yScale.bandwidth ?? 10);
        return [y, y + height];
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

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [NaN, NaN];
    }

    override createNodeData() {
        const { data, visible, axes, dataModel, processedData } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && dataModel && processedData && visible && xAxis && yAxis)) return;

        if (xAxis.type !== 'category' || yAxis.type !== 'category') {
            Logger.warnOnce(
                `Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
            );
            return;
        }

        const { xKey, xName, yKey, yName, colorKey, colorName, textAlign, verticalAlign, itemPadding, label } =
            this.properties;

        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData);
        const colorValues = colorKey
            ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData)
            : undefined;

        const colorDomain = dataModel.getDomain(this, 'colorValue', 'value', processedData);

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: HeatmapNodeDatum[] = [];
        const labelData: HeatmapLabelDatum[] = [];

        const width = xScale.bandwidth ?? 10;
        const height = yScale.bandwidth ?? 10;

        const textAlignFactor = (width - 2 * itemPadding) * textAlignFactors[textAlign];
        const verticalAlignFactor = (height - 2 * itemPadding) * verticalAlignFactors[verticalAlign];

        const sizeFittingHeight = () => ({ width, height, meta: null });

        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((datum, datumIndex) => {
            const xDatum = xValues[datumIndex];
            const yDatum = yValues[datumIndex];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            const colorValue = colorValues?.[datumIndex];

            const labelText =
                colorValue == null
                    ? undefined
                    : this.getLabelText<AgHeatmapSeriesLabelFormatterParams>(
                          colorValue,
                          datum,
                          colorKey!,
                          'color',
                          colorDomain,
                          label,
                          { value: colorValue, datum, colorKey, colorName, xKey, yKey, xName, yName }
                      );

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
                datumIndex,
                yKey,
                xKey,
                xValue: xDatum,
                yValue: yDatum,
                colorValue,
                datum,
                point,
                width,
                height,
                midPoint: { x, y },
                missing: colorValues != null && colorValue == null,
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
                    datumIndex,
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
        });

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

    override update(params: { seriesRect?: _ModuleSupport.BBox }) {
        // Animations are unsupported by heat-map, so prevent all animations.
        this.ctx.animationManager.skipCurrentBatch();

        return super.update(params);
    }

    protected override updateDatumSelection(opts: {
        nodeData: HeatmapNodeDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, HeatmapNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    private getItemBaseStyle(isHighlight: boolean, datum?: HeatmapNodeDatum): ItemStyle {
        const { properties } = this;
        const highlightStyle = this.getHighlightStyle(isHighlight, datum?.datumIndex);
        return {
            fill: highlightStyle?.fill,
            fillOpacity: highlightStyle?.fillOpacity ?? 1,
            stroke: highlightStyle?.stroke ?? properties.stroke,
            strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
            strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
            opacity: highlightStyle.opacity ?? 1,
        };
    }

    protected getItemStyleOverrides(
        datumId: string,
        datum: any,
        colorValue: number | undefined,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;
        const { xKey, yKey, itemStyler } = properties;

        const fill =
            this.isColorScaleValid() && colorValue != null ? this.colorScale.convert(colorValue) : 'transparent';
        let overrides: Partial<ItemStyle> | undefined = format.fill == null ? { fill } : undefined;

        if (itemStyler != null) {
            overrides ??= {};

            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        xKey,
                        yKey,
                        highlighted,
                        ...format,
                        fill,
                    });
                }
            );

            Object.assign(overrides, itemStyle);
        }

        return overrides;
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, HeatmapNodeDatum>;
        isHighlight: boolean;
    }) {
        const { isHighlight } = opts;

        const xAxis = this.axes[ChartAxisDirection.X];
        const [visibleMin, visibleMax] = xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;

        opts.datumSelection.each((rect, nodeDatum) => {
            const { datumIndex, colorValue, datum, point, width, height } = nodeDatum;
            const style = this.getItemBaseStyle(isHighlight, nodeDatum);

            const overrides = this.getItemStyleOverrides(String(datumIndex), datum, colorValue, style, isHighlight);

            rect.crisp = crisp;
            rect.x = Math.floor(point.x - width / 2);
            rect.y = Math.floor(point.y - height / 2);
            rect.width = Math.ceil(width);
            rect.height = Math.ceil(height);

            applyShapeStyle(rect, style, overrides);
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: HeatmapLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, HeatmapLabelDatum>;
    }) {
        const { labelData, labelSelection } = opts;
        const { enabled } = this.properties.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, HeatmapLabelDatum>;
    }) {
        opts.labelSelection.each((text, datum) => {
            text.text = datum.text;
            text.fontSize = datum.fontSize;
            text.lineHeight = datum.lineHeight;

            text.fontStyle = datum.fontStyle;
            text.fontFamily = datum.fontFamily;
            text.fontWeight = datum.fontWeight;
            text.fill = datum.color;
            text.fillOpacity = this.getHighlightStyle(false, datum.datumIndex)?.opacity ?? 1;

            text.textAlign = datum.textAlign;
            text.textBaseline = datum.verticalAlign;

            text.x = datum.x;
            text.y = datum.y;

            text.pointerEvents = PointerEvents.None;
        });
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties, colorScale, ctx } = this;
        const { formatManager } = ctx;
        const { xKey, xName, yKey, yName, colorKey, colorName, colorRange, title, legendItemName, tooltip } =
            properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData)[datumIndex];
        const colorValue =
            colorKey != null && this.isColorScaleValid()
                ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData)[datumIndex]
                : undefined;

        if (xValue == null) return;

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        let fill: InternalAgColorType;
        if (colorValue == null) {
            fill = colorRange[0];
        } else {
            fill = colorScale.convert(colorValue);
            const domain = dataModel.getDomain(this, `colorValue`, 'value', processedData);
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: colorValue,
                datum,
                seriesId,
                legendItemName,
                key: colorKey!,
                source: 'tooltip',
                property: 'color',
                domain,
                boundSeries: this.getFormatterContext('color'),
                fractionDigits: undefined,
            });
            data.push({ label: colorName, fallbackLabel: colorKey!, value: content ?? formatValue(colorValue) });
        }

        data.push(
            {
                label: xName,
                fallbackLabel: xKey,
                value: xAxis.formatDatum(xValue, 'tooltip', seriesId, legendItemName, datum, xKey),
            },
            {
                label: yName,
                fallbackLabel: yKey,
                value: yAxis.formatDatum(yValue, 'tooltip', seriesId, legendItemName, datum, yKey),
            }
        );

        const format = this.getItemBaseStyle(false);
        Object.assign(format, this.getItemStyleOverrides(String(datumIndex), datum, colorValue, format, false));

        if (format.fill != null) {
            fill = format.fill;
        }

        const symbol: _ModuleSupport.LegendSymbolOptions | undefined =
            fill != null
                ? {
                      marker: {
                          shape: 'square',
                          fill: fill,
                          fillOpacity: 1,
                          stroke: undefined,
                          strokeWidth: 0,
                          strokeOpacity: 1,
                          lineDash: [0],
                          lineDashOffset: 0,
                      },
                  }
                : undefined;

        return this.formatTooltipWithContext(
            tooltip,
            { title: title ?? legendItemName, symbol, data },
            {
                seriesId,
                datum,
                title,
                xKey,
                xName,
                yKey,
                yName,
                colorKey,
                colorName,
                ...(format as any as Required<ItemStyle>),
            }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.GradientLegendDatum[] {
        if (legendType !== 'gradient' || !this.isColorScaleValid() || !this.dataModel) {
            return [];
        }

        return [
            {
                legendType: 'gradient',
                enabled: this.visible,
                seriesId: this.id,
                series: this.getFormatterContext('color'),
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

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        const datum = this.contextNodeData?.nodeData[datumIndex];
        if (datum === undefined) return undefined;
        const { width, height, midPoint } = datum;
        const focusRect = { x: midPoint.x - width / 2, y: midPoint.y - height / 2, width, height };
        return computeBarFocusBounds(this, focusRect);
    }
}
