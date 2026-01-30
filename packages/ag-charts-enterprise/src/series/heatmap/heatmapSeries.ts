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
    upsertNodeDatum,
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

/** Context object caching expensive lookups for createNodeData(). */
interface HeatmapSeriesNodeDatumContext extends _ModuleSupport.CartesianCreateNodeDataContext<HeatmapNodeDatum> {
    // Override yKey to be required for heatmap
    readonly yKey: string;

    // Heatmap-specific positioning
    readonly xOffset: number;
    readonly yOffset: number;
    readonly width: number;
    readonly height: number;
    readonly textAlignFactor: number;
    readonly verticalAlignFactor: number;

    // Heatmap-specific data
    readonly yValues: any[];
    readonly colorKey: string | undefined;
    readonly colorName: string | undefined;
    readonly colorValues: number[] | undefined;
    readonly colorDomain: number[];
    readonly itemPadding: number;

    // Label support
    readonly labels: HeatmapLabelDatum[];
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

/**
 * Consolidated type interface for HeatmapSeries.
 * Defines all type parameters in one place for the series.
 */
interface HeatmapSeriesTypes extends _ModuleSupport.CartesianSeriesTypes {
    readonly node: _ModuleSupport.Rect;
    readonly options: AgHeatmapSeriesOptions;
    readonly properties: HeatmapSeriesProperties;
    readonly datum: HeatmapNodeDatum;
    readonly label: HeatmapLabelDatum;
    readonly context: _ModuleSupport.CartesianSeriesNodeDataContext<HeatmapNodeDatum, HeatmapLabelDatum>;
    readonly stackContext: never;
    readonly createNodeDataContext: HeatmapSeriesNodeDatumContext;
}

export class HeatmapSeries extends _ModuleSupport.CartesianSeries<HeatmapSeriesTypes> {
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

        const allowNullKey = this.properties.allowNullKeys ?? false;
        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: 'xValue', allowNullKey }),
                valueProperty(yKey, yScaleType, { id: 'yValue', allowNullKey }),
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

    /**
     * Template method hook: Validates preconditions for createNodeData.
     * Overrides base to add heatmap-specific category axis validation.
     */
    protected override validateCreateNodeDataPreconditions():
        | { xAxis: _ModuleSupport.ChartAxis; yAxis: _ModuleSupport.ChartAxis }
        | undefined {
        const result = super.validateCreateNodeDataPreconditions();
        if (!result) return undefined;

        const { xAxis, yAxis } = result;

        if (xAxis.type !== 'category' || yAxis.type !== 'category') {
            Logger.warnOnce(
                `Heatmap series expected axes to have "category" type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
            );
            return undefined;
        }

        return result;
    }

    /**
     * Template method hook: Iterates over data and creates/updates node datums.
     */
    protected override populateNodeData(ctx: HeatmapSeriesNodeDatumContext): void {
        for (const [datumIndex, datum] of ctx.rawData.entries()) {
            // Use shared utility for create/update logic
            const nodeDatum = upsertNodeDatum(
                ctx,
                { datumIndex, datum },
                (c, p) => this.createNodeDatum(c, p.datumIndex, p.datum),
                (c, n, p) => this.updateNodeDatum(c, n, p.datumIndex, p.datum)
            );

            if (nodeDatum) {
                const labelDatum = this.createLabelDatum(ctx, datumIndex, datum, nodeDatum);
                if (labelDatum) {
                    ctx.labels.push(labelDatum);
                }
            }
        }
    }

    /**
     * Template method hook: Creates the result object shell.
     */
    protected override initializeResult(
        ctx: HeatmapSeriesNodeDatumContext
    ): _ModuleSupport.CartesianSeriesNodeDataContext<HeatmapNodeDatum, HeatmapLabelDatum> {
        return {
            itemId: this.properties.yKey ?? this.id,
            nodeData: ctx.nodes,
            labelData: ctx.labels,
            scales: this.calculateScaling(),
            visible: this.visible,
        };
    }

    /**
     * Template method hook: Creates the shared context for datum creation.
     * Caches expensive lookups and computations that are constant across all datums.
     */
    protected override createNodeDatumContext(
        xAxis: _ModuleSupport.ChartAxis,
        yAxis: _ModuleSupport.ChartAxis
    ): HeatmapSeriesNodeDatumContext | undefined {
        const { dataModel, processedData, contextNodeData } = this;

        // Need dataModel and processedData for data resolution
        if (!dataModel || !processedData) return undefined;

        const { xKey, xName, yKey, yName, colorKey, colorName, textAlign, verticalAlign, itemPadding } =
            this.properties;

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
            // Base context fields
            xAxis,
            yAxis,
            xScale,
            yScale,
            rawData,
            xValues,
            xKey,
            yKey,
            xName,
            yName,
            animationEnabled: !this.ctx.animationManager.isSkipped(),
            canIncrementallyUpdate,
            nodes: canIncrementallyUpdate ? contextNodeData.nodeData : [],
            nodeIndex: 0,

            // Heatmap-specific positioning
            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: (yScale.bandwidth ?? 0) / 2,
            width,
            height,
            textAlignFactor: (width - 2 * itemPadding) * textAlignFactors[textAlign],
            verticalAlignFactor: (height - 2 * itemPadding) * verticalAlignFactors[verticalAlign],

            // Heatmap-specific data
            yValues,
            colorKey,
            colorName,
            colorValues,
            colorDomain,
            itemPadding,

            // Label support - labels are always rebuilt from scratch (not incrementally updated)
            labels: [],
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

        if (!Number.isFinite(x) || !Number.isFinite(y)) return;

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

        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return;

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
                visibleDomain: undefined,
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
