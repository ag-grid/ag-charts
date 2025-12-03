import type {
    AgHeatmapSeriesLabelFormatterParams,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesStyle,
    FontStyle,
    FontWeight,
    TextAlign,
    TextOrSegments,
    VerticalAlign,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    type DomainInput,
    type InternalAgColorType,
    Logger,
    type Point,
    type SizedPoint,
    extent,
    formatValue,
    mergeDefaults,
    toPlainText,
} from 'ag-charts-core';

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
    addHitTestersToQuadtree,
    findQuadtreeMatch,
    updateLabelNode,
} = _ModuleSupport;

interface HeatmapNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    readonly itemId: string;
    midPoint: Readonly<Point>;
    readonly width: number;
    readonly height: number;
    readonly colorValue: any;
    style: AgHeatmapSeriesStyle;
}

interface HeatmapLabelDatum extends Point {
    datumIndex: number;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    datum: any;
    itemId: string;
    text: TextOrSegments;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle | undefined;
    fontFamily: string;
    fontWeight: FontWeight | undefined;
    color: string | undefined;
    textAlign: TextAlign;
    textBaseline: VerticalAlign;
    style: AgHeatmapSeriesStyle;
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
    AgHeatmapSeriesOptions,
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
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis) {
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
                    ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue', invalidValue: undefined })]
                    : []),
            ],
        });

        if (this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            const rawDomain = processedData.domain.values[colorKeyIdx].filter((v) => v != null);
            const domain = extent(rawDomain);
            this.colorScale.domain = domain ?? [];
            if (domain?.length && domain[0] === domain[1]) {
                const midIndex = Math.floor(colorRange.length / 2);
                this.colorScale.range = [colorRange[midIndex], colorRange[midIndex]];
            } else {
                this.colorScale.range = colorRange;
            }
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
        const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
        const actualCount = processedData.domain.values[colorKeyIdx].filter((v) => v != null).length;
        const colorDataMissing = dataCount === 0 || dataCount === missCount || actualCount === 0;
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

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): DomainInput<any> {
        const { dataModel, processedData } = this;

        if (!dataModel || !processedData) return { domain: [] };

        if (direction === ChartAxisDirection.X) {
            const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            return { domain };
        } else {
            const domain = dataModel.getDomain(this, `yValue`, 'value', processedData);
            return { domain };
        }
    }

    override getSeriesRange(
        _direction: _ModuleSupport.ChartAxisDirection,
        _visibleRange: [any, any]
    ): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    override createNodeData() {
        const { data, visible, axes, dataModel, processedData } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && visible && xAxis && yAxis)) return;

        // Return empty structure when no data model or processed data
        if (!dataModel || !processedData) {
            return {
                itemId: this.properties.yKey ?? this.id,
                nodeData: [],
                labelData: [],
                scales: this.calculateScaling(),
                visible: this.visible,
            };
        }

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

        const colorDomain = colorKey ? dataModel.getDomain(this, 'colorValue', 'value', processedData) : [];

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

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];
        for (const [datumIndex, datum] of rawData.entries()) {
            const xDatum = xValues[datumIndex];
            const yDatum = yValues[datumIndex];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            const colorValue = colorValues?.[datumIndex];

            const labelText =
                label.enabled && colorValue != null
                    ? this.getLabelText<AgHeatmapSeriesLabelFormatterParams>(
                          colorValue,
                          datum,
                          colorKey!,
                          'color',
                          colorDomain,
                          label,
                          { value: colorValue, datum, colorKey, colorName, xKey, yKey, xName, yName }
                      )
                    : undefined;

            const labels = formatLabels(
                toPlainText(labelText),
                this.properties.label,
                undefined,
                this.properties.label,
                { padding: itemPadding },
                sizeFittingHeight
            );

            const point = { x, y, size: 0 };

            const style = this.getItemStyle({ datumIndex, datum, colorValue }, false);

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
                style,
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
                    textBaseline: verticalAlign,
                    x: lx,
                    y: ly,
                    style,
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

    protected getItemStyle(
        { datumIndex, datum, colorValue }: Partial<HeatmapNodeDatum>,
        isHighlight: boolean,
        highlightState?: _ModuleSupport.HighlightState
    ) {
        const { properties } = this;
        const { itemStyler, stroke, strokeWidth, strokeOpacity } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const style = mergeDefaults(highlightStyle, {
            fill: this.isColorScaleValid() && colorValue != null ? this.colorScale.convert(colorValue) : 'transparent',
            fillOpacity: 1,
            stroke,
            strokeWidth,
            strokeOpacity,
            opacity: 1,
        });

        let overrides;
        if (itemStyler != null && datumIndex != null) {
            overrides = this.cachedDatumCallback(createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'), () => {
                const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                return this.callWithContext(itemStyler, params);
            });
        }

        return overrides ? mergeDefaults(overrides, style) : style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<AgHeatmapSeriesStyle>
    ) {
        const { id: seriesId, properties } = this;
        const { xKey, yKey } = properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            xKey,
            yKey,
            highlightState,
            ...style,
            fill,
        };
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, HeatmapNodeDatum>;
        isHighlight: boolean;
    }) {
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        datumSelection.each((_, nodeDatum) => {
            const highlightState = this.getHighlightState(activeHighlight, isHighlight, nodeDatum.datumIndex);
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight, highlightState);
        });
    }

    protected override updateDatumNodes({
        datumSelection,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Rect, HeatmapNodeDatum>;
        isHighlight: boolean;
    }) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const [visibleMin, visibleMax] = xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;

        datumSelection.each((rect, nodeDatum) => {
            const { point, width, height, style } = nodeDatum;

            rect.setStyleProperties(style);

            rect.crisp = crisp;
            rect.x = Math.floor(point.x - width / 2);
            rect.y = Math.floor(point.y - height / 2);
            rect.width = Math.ceil(width);
            rect.height = Math.ceil(height);
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
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        opts.labelSelection.each((text, datum) => {
            text.pointerEvents = PointerEvents.None;
            text.text = datum.text;
            text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex)?.opacity ?? 1;
            type P = AgHeatmapSeriesLabelFormatterParams;
            type D = HeatmapLabelDatum;
            updateLabelNode<P, D>(
                this,
                text,
                this.properties,
                this.properties.label,
                datum,
                isHighlight,
                activeHighlight
            );
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

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
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
                value: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
            },
            {
                label: yName,
                fallbackLabel: yKey,
                value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, legendItemName),
            }
        );

        const format = this.getItemStyle({ datumIndex, datum, colorValue }, false);
        if (format.fill != null) {
            fill = format.fill;
        }

        const symbol: _ModuleSupport.LegendSymbolOptions | undefined =
            fill == null
                ? undefined
                : {
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
                  };

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
                colorDomain: this.colorScale.domain,
                colorRange: this.colorScale.range,
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

    protected override initQuadTree(quadtree: _ModuleSupport.QuadtreeNearest<HeatmapNodeDatum>) {
        addHitTestersToQuadtree(quadtree, this.datumNodesIter());
    }

    protected override pickNodesExactShape(
        point: Point
    ): _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType>[] {
        const item = findQuadtreeMatch(this, point);
        return item != null && item.distance <= 0 ? [item.datum] : [];
    }

    protected override pickNodeClosestDatum(point: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.itemStyler != null || this.properties.label.itemStyler != null || this.isColorScaleValid()
        );
    }
}
