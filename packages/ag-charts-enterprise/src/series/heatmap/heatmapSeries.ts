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
    ChartAxisDirection,
    type DomainWithMetadata,
    type InternalAgColorType,
    Logger,
    type Mutable,
    type Point,
    type Scale,
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

/** Internal context for createNodeData() - caches expensive lookups */
interface HeatmapSeriesNodeDatumContext {
    readonly xScale: Scale<any, any>;
    readonly yScale: Scale<any, any>;
    readonly xOffset: number;
    readonly yOffset: number;
    readonly width: number;
    readonly height: number;
    readonly textAlignFactor: number;
    readonly verticalAlignFactor: number;
    readonly xKey: string;
    readonly yKey: string;
    readonly xName: string | undefined;
    readonly yName: string | undefined;
    readonly colorKey: string | undefined;
    readonly colorName: string | undefined;
    readonly colorDomain: number[];
    readonly itemPadding: number;
    // Data arrays
    readonly xValues: any[];
    readonly yValues: any[];
    readonly colorValues: number[] | undefined;
    readonly rawData: unknown[];
    // Incremental update support
    readonly canIncrementallyUpdate: boolean;
    readonly nodes: HeatmapNodeDatum[];
    readonly labels: HeatmapLabelDatum[];
    nodeIndex: number;
    labelIndex: number;
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
    _ModuleSupport.Rect,
    AgHeatmapSeriesOptions,
    HeatmapSeriesProperties,
    HeatmapNodeDatum,
    HeatmapLabelDatum
> {
    static override readonly className = 'HeatmapSeries';
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

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { dataModel, processedData } = this;

        if (!dataModel || !processedData) return { domain: [] };

        if (direction === ChartAxisDirection.X) {
            const domain = dataModel.getDomain(this, `xValue`, 'value', processedData).domain;
            return { domain };
        } else {
            const domain = dataModel.getDomain(this, `yValue`, 'value', processedData).domain;
            return { domain };
        }
    }

    override getSeriesRange(): [number, number] {
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

        // Create shared context for datum creation (must be done early to access datumCtx.nodes)
        const datumCtx = this.createNodeDatumContext(xAxis, yAxis, dataModel, processedData);
        if (!datumCtx) return;

        // Labels are rebuilt from scratch each time (due to formatLabels complexity)
        const labelData: HeatmapLabelDatum[] = [];

        for (const [datumIndex, datum] of datumCtx.rawData.entries()) {
            const nodeDatum = this.upsertNodeDatum(datumCtx, datumIndex, datum);

            const labelDatum = this.createLabelDatum(datumCtx, datumIndex, datum, nodeDatum);
            if (labelDatum) {
                labelData.push(labelDatum);
            }
        }

        // Trim excess nodes if the data shrunk
        if (datumCtx.nodeIndex < datumCtx.nodes.length) {
            datumCtx.nodes.length = datumCtx.nodeIndex;
        }

        return {
            itemId: this.properties.yKey ?? this.id,
            nodeData: datumCtx.nodes,
            labelData,
            scales: this.calculateScaling(),
            visible: this.visible,
        };
    }

    private createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis,
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.ProcessedData<any>
    ): HeatmapSeriesNodeDatumContext | undefined {
        const { xKey, xName, yKey, yName, colorKey, colorName, textAlign, verticalAlign, itemPadding } =
            this.properties;
        const { contextNodeData } = this;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData);
        const colorValues = colorKey
            ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData)
            : undefined;

        const colorDomain = colorKey ? dataModel.getDomain(this, 'colorValue', 'value', processedData).domain : [];

        const width = xScale.bandwidth ?? 10;
        const height = yScale.bandwidth ?? 10;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        const canIncrementallyUpdate = contextNodeData?.nodeData != null && processedData.changeDescription != null;

        return {
            xScale,
            yScale,
            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: (yScale.bandwidth ?? 0) / 2,
            width,
            height,
            textAlignFactor: (width - 2 * itemPadding) * textAlignFactors[textAlign],
            verticalAlignFactor: (height - 2 * itemPadding) * verticalAlignFactors[verticalAlign],
            xKey,
            yKey,
            xName,
            yName,
            colorKey,
            colorName,
            colorDomain,
            itemPadding,
            xValues,
            yValues,
            colorValues,
            rawData,
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? contextNodeData.nodeData : [],
            labels: canIncrementallyUpdate ? contextNodeData.labelData : [],
            nodeIndex: 0,
            labelIndex: 0,
        };
    }

    /**
     * Creates a skeleton HeatmapNodeDatum with minimal required fields.
     * The node will be populated by updateNodeDatum.
     */
    private createSkeletonNodeDatum(
        ctx: HeatmapSeriesNodeDatumContext,
        datumIndex: number,
        datum: unknown
    ): HeatmapNodeDatum {
        const { xKey, yKey, width, height, colorValues } = ctx;
        const xDatum = ctx.xValues[datumIndex];
        const yDatum = ctx.yValues[datumIndex];
        const colorValue = colorValues?.[datumIndex];

        return {
            series: this,
            itemId: yKey,
            datumIndex,
            yKey,
            xKey,
            xValue: xDatum,
            yValue: yDatum,
            colorValue,
            datum,
            point: { x: 0, y: 0, size: 0 },
            width,
            height,
            midPoint: { x: 0, y: 0 },
            missing: colorValues != null && colorValue == null,
            style: {} as AgHeatmapSeriesStyle,
        };
    }

    /**
     * Updates an existing HeatmapNodeDatum in-place.
     */
    private updateNodeDatum(
        ctx: HeatmapSeriesNodeDatumContext,
        node: HeatmapNodeDatum,
        datumIndex: number,
        datum: unknown
    ): void {
        const { xScale, yScale, xOffset, yOffset, width, height, xKey, yKey, colorValues } = ctx;
        const mutableNode = node as Mutable<HeatmapNodeDatum>;

        const xDatum = ctx.xValues[datumIndex];
        const yDatum = ctx.yValues[datumIndex];
        const x = xScale.convert(xDatum) + xOffset;
        const y = yScale.convert(yDatum) + yOffset;
        const colorValue = colorValues?.[datumIndex];

        // Update properties
        mutableNode.datumIndex = datumIndex;
        mutableNode.datum = datum;
        mutableNode.itemId = yKey;
        mutableNode.yKey = yKey;
        mutableNode.xKey = xKey;
        mutableNode.xValue = xDatum;
        mutableNode.yValue = yDatum;
        mutableNode.colorValue = colorValue;
        mutableNode.width = width;
        mutableNode.height = height;
        mutableNode.missing = colorValues != null && colorValue == null;

        // Update point in place
        const mutablePoint = mutableNode.point as Mutable<SizedPoint>;
        mutablePoint.x = x;
        mutablePoint.y = y;
        mutablePoint.size = 0;

        // Update midPoint in place
        mutableNode.midPoint.x = x;
        mutableNode.midPoint.y = y;

        // Update style
        mutableNode.style = this.getItemStyle({ datumIndex, datum, colorValue }, false);
    }

    /**
     * Creates a HeatmapNodeDatum for a single data point.
     */
    private createNodeDatum(ctx: HeatmapSeriesNodeDatumContext, datumIndex: number, datum: unknown): HeatmapNodeDatum {
        const node = this.createSkeletonNodeDatum(ctx, datumIndex, datum);
        this.updateNodeDatum(ctx, node, datumIndex, datum);
        return node;
    }

    /**
     * Handles node creation/update - reuses existing nodes when possible.
     */
    private upsertNodeDatum(ctx: HeatmapSeriesNodeDatumContext, datumIndex: number, datum: unknown): HeatmapNodeDatum {
        const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodes.length;

        let nodeData: HeatmapNodeDatum;
        if (canReuseNode) {
            nodeData = ctx.nodes[ctx.nodeIndex];
            this.updateNodeDatum(ctx, nodeData, datumIndex, datum);
        } else {
            nodeData = this.createNodeDatum(ctx, datumIndex, datum);
            ctx.nodes.push(nodeData);
        }
        ctx.nodeIndex++;

        return nodeData;
    }

    private createLabelDatum(
        ctx: HeatmapSeriesNodeDatumContext,
        datumIndex: number,
        datum: unknown,
        nodeDatum: HeatmapNodeDatum
    ): HeatmapLabelDatum | undefined {
        const { label } = this.properties;
        const {
            width,
            height,
            textAlignFactor,
            verticalAlignFactor,
            itemPadding,
            colorKey,
            colorName,
            colorDomain,
            xKey,
            yKey,
            xName,
            yName,
        } = ctx;

        const colorValue = ctx.colorValues?.[datumIndex];

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

        const sizeFittingHeight = () => ({ width, height, meta: null });
        const labels = formatLabels(
            toPlainText(labelText),
            this.properties.label,
            undefined,
            this.properties.label,
            { padding: itemPadding },
            sizeFittingHeight
        );

        if (labels?.label == null) {
            return undefined;
        }

        const { text, fontSize, lineHeight, height: labelHeight } = labels.label;
        const { fontStyle, fontFamily, fontWeight, color } = this.properties.label;
        const { textAlign, verticalAlign } = this.properties;
        const lx = nodeDatum.point.x + textAlignFactor * (width - 2 * itemPadding);
        const ly =
            nodeDatum.point.y + verticalAlignFactor * (height - 2 * itemPadding) - (labels.height - labelHeight) * 0.5;

        return {
            series: this,
            itemId: ctx.yKey,
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
            style: nodeDatum.style,
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
            const domain = dataModel.getDomain(this, `colorValue`, 'value', processedData).domain;
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
