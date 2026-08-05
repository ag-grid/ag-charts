import type {
    AgHeatmapSeriesItemStylerParams,
    AgHeatmapSeriesLabelFormatterParams,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesStyle,
    FontStyle,
    FontWeight,
    TextAlign,
    VerticalAlign,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    type CallbackParamRules,
    ChartAxisDirection,
    type DomainWithMetadata,
    type DynamicContext,
    type FillStrokeMorph,
    type InternalAgColorType,
    type Mutable,
    type Normalised,
    type NormalisedTextOrSegments,
    type Point,
    type SizedPoint,
    extent,
    findDiscreteColorBinLabel,
    formatValue,
    joinFormatted,
    mergeDefaults,
} from 'ag-charts-core';

import { formatLabels } from '../util/labelFormatter';
import { HeatmapSeriesProperties } from './heatmapSeriesProperties';

const {
    SeriesNodePickMode,
    computeBarFocusBounds,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
    configureColorScale,
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

type NormalisedHeatmapSeriesStyle = Normalised<AgHeatmapSeriesStyle, never, FillStrokeMorph>;

interface HeatmapNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly point: Readonly<SizedPoint>;
    midPoint: Readonly<Point>;
    readonly width: number;
    readonly height: number;
    readonly colorValue: any;
    style: NormalisedHeatmapSeriesStyle;
}

interface HeatmapLabelDatum extends Point {
    datumIndex: number;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
    datum: any;
    itemId?: never;
    text: NormalisedTextOrSegments;
    fontSize: number;
    lineHeight: number;
    fontStyle: FontStyle | undefined;
    fontFamily: string;
    fontWeight: FontWeight | undefined;
    color: string | undefined;
    textAlign: TextAlign;
    textBaseline: VerticalAlign;
    style: NormalisedHeatmapSeriesStyle;
}

type ItemStyle = Pick<NormalisedHeatmapSeriesStyle, 'fill'> &
    Required<Omit<NormalisedHeatmapSeriesStyle, 'fill'>> & { opacity: number };

/** OPTIMIZATION: per-pass styling state, hoisted out of the per-cell path to keep styling O(cells). */
interface HeatmapItemStyleContext {
    readonly colorScaleValid: boolean;
    readonly baseStyle: Omit<ItemStyle, 'fill'>;
}

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

    // Styling state shared across all cells in the pass
    readonly itemStyleContext: HeatmapItemStyleContext;
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
    readonly node: _ModuleSupport.Rect<HeatmapNodeDatum>;
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

    protected override createNodeParams(datum: HeatmapNodeDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
            colorKey: this.properties.colorKey,
        };
    }

    readonly colorScale = new ColorScale();

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
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

        const { xKey, yKey, colorKey } = this.properties;

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

            if (domain != null) {
                const colorScaleProps = this.properties.colorScale;
                // Collapse to the midpoint colour for a degenerate single-value domain so the
                // diverging palette doesn't render with its endpoints.
                if (domain[0] === domain[1] && colorScaleProps.fills.length > 0) {
                    const midIndex = Math.floor(colorScaleProps.fills.length / 2);
                    const mid = colorScaleProps.fills[midIndex];
                    configureColorScale(
                        this.colorScale,
                        { fills: [mid, mid], domain: colorScaleProps.domain, mode: colorScaleProps.mode },
                        domain,
                        this.ctx.logger
                    );
                } else {
                    configureColorScale(this.colorScale, colorScaleProps, domain, this.ctx.logger);
                }
            }
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

        const supportedAxisTypes = ['category', 'grouped-category'];
        if (!supportedAxisTypes.includes(xAxis.type) || !supportedAxisTypes.includes(yAxis.type)) {
            this.ctx.logger.warnOnce(
                `Heatmap series expected axes to have ${joinFormatted(supportedAxisTypes, 'or', JSON.stringify)} type, but received "${xAxis.type}" and "${yAxis.type}" instead.`
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

        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData, 'object');
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData, 'object');
        const colorValues = colorKey
            ? dataModel.resolveColumnById(this, `colorValue`, processedData, 'number')
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

            itemStyleContext: this.createItemStyleContext(),
        };
    }

    private createItemStyleContext(): HeatmapItemStyleContext {
        const { stroke, strokeWidth, strokeOpacity } = this.properties;
        return {
            colorScaleValid: this.isColorScaleValid(),
            baseStyle: { fillOpacity: 1, stroke, strokeWidth, strokeOpacity, opacity: 1 },
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
            style: {},
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
        mutableNode.yKey = yKey;
        mutableNode.xKey = xKey;
        mutableNode.xValue = xDatum;
        mutableNode.yValue = yDatum;
        mutableNode.colorValue = colorValue;
        mutableNode.width = width;
        mutableNode.height = height;
        mutableNode.missing = colorValues != null && colorValue == null;

        // Update point in place
        const mutablePoint = mutableNode.point;
        mutablePoint.x = x;
        mutablePoint.y = y;
        mutablePoint.size = 0;

        // Update midPoint in place
        mutableNode.midPoint.x = x;
        mutableNode.midPoint.y = y;

        // Update style
        mutableNode.style = this.getItemStyle(
            { datumIndex, datum, colorValue },
            false,
            undefined,
            ctx.itemStyleContext
        );
    }

    /**
     * Creates a HeatmapNodeDatum for a single data point.
     * Returns undefined for invalid data points (e.g., null/undefined keys when not allowed).
     */
    private createNodeDatum(
        ctx: HeatmapSeriesNodeDatumContext,
        datumIndex: number,
        datum: unknown
    ): HeatmapNodeDatum | undefined {
        const { xScale, yScale, xOffset, yOffset } = ctx;
        const xDatum = ctx.xValues[datumIndex];
        const yDatum = ctx.yValues[datumIndex];
        const x = xScale.convert(xDatum) + xOffset;
        const y = yScale.convert(yDatum) + yOffset;

        // Skip creating nodes for data with invalid keys (not in domain)
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return undefined;
        }

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
            // Preserve `ContentSegment[]` (including image segments) instead of flattening to plain
            // text, so image-bearing labels render like treemap rather than dropping the image.
            labelText,
            this.properties.label,
            undefined,
            this.properties.label,
            { padding: itemPadding },
            sizeFittingHeight,
            this.ctx.logger
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
        return new Rect<HeatmapNodeDatum>();
    }

    override update(params: { seriesRect?: _ModuleSupport.BBox }) {
        // Animations are unsupported by heat-map, so prevent all animations.
        this.ctx.animationManager.skipCurrentBatch();

        return super.update(params);
    }

    protected override updateDatumSelection(opts: {
        nodeData: HeatmapNodeDatum[];
        datumSelection: _ModuleSupport.Selection<HeatmapNodeDatum, _ModuleSupport.Rect<HeatmapNodeDatum>>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected getItemStyle(
        { datumIndex, datum, colorValue }: Partial<HeatmapNodeDatum>,
        isHighlight: boolean,
        highlightState?: _ModuleSupport.HighlightState,
        itemStyleContext: HeatmapItemStyleContext = this.createItemStyleContext()
    ): NormalisedHeatmapSeriesStyle {
        const { properties } = this;
        const { itemStyler, colorKey } = properties;
        const { missingDataFill } = properties.colorScale;
        const { colorScaleValid, baseStyle } = itemStyleContext;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const selectionStyle = this.getSelectionStyle(datumIndex);
        let fill: string;
        if (colorScaleValid && colorValue != null) {
            fill = this.colorScale.convert(colorValue);
        } else if (colorKey != null && missingDataFill != null) {
            fill = missingDataFill;
        } else {
            fill = 'transparent';
        }
        // Colour refs are resolved during theme-merge before reaching scene nodes.
        // `baseStyle` is shared across cells — do not mutate it.
        const style = mergeDefaults(
            selectionStyle,
            highlightStyle,
            { fill },
            baseStyle
        ) as Required<NormalisedHeatmapSeriesStyle>;

        let overrides;
        if (itemStyler != null && datumIndex != null) {
            overrides = this.cachedDatumCallback(createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'), () => {
                const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                return this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.callWithContext(itemStyler, params)
                );
            });
        }

        return overrides ? mergeDefaults(overrides, style) : style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedHeatmapSeriesStyle>
    ) {
        const { id: seriesId, properties } = this;
        const { xKey, yKey, colorKey } = properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionState = this.getSelectionStateString(datumIndex);
        const candidateState = this.getCandidateStateString(datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            xKey,
            yKey,
            colorKey,
            highlightState,
            selectionState,
            candidateState,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgHeatmapSeriesItemStylerParams>;
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<HeatmapNodeDatum, _ModuleSupport.Rect<HeatmapNodeDatum>>;
        isHighlight: boolean;
    }) {
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const itemStyleContext = this.createItemStyleContext();
        datumSelection.each((_, nodeDatum) => {
            const highlightState = this.getHighlightState(activeHighlight, isHighlight, nodeDatum.datumIndex);
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight, highlightState, itemStyleContext);
        });
    }

    protected override updateDatumNodes({
        datumSelection,
    }: {
        datumSelection: _ModuleSupport.Selection<HeatmapNodeDatum, _ModuleSupport.Rect<HeatmapNodeDatum>>;
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
            rect.cornerRadius = this.properties.cornerRadius;
            rect.x = point.x - width / 2;
            rect.y = point.y - height / 2;
            rect.width = width;
            rect.height = height;
        });
    }

    protected override updateLabelSelection(opts: {
        labelData: HeatmapLabelDatum[];
        labelSelection: _ModuleSupport.Selection<HeatmapLabelDatum, _ModuleSupport.Text<HeatmapLabelDatum>>;
    }) {
        const { labelData, labelSelection } = opts;
        const { enabled } = this.properties.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<HeatmapLabelDatum, _ModuleSupport.Text<HeatmapLabelDatum>>;
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
            updateLabelNode<P, D>(this, text, this.properties, this.properties.label, datum, {
                isHighlight,
                activeHighlight,
            });
        });
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties, colorScale, ctx } = this;
        const { formatManager } = ctx;
        const { xKey, xName, yKey, yName, colorKey, colorName, title, legendItemName, tooltip } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData, 'object')[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValue`, processedData, 'object')[datumIndex];
        const colorValue =
            colorKey == null
                ? undefined
                : dataModel.resolveColumnById(this, `colorValue`, processedData, 'number')[datumIndex];

        const allowNullKeys = this.properties.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return;

        // Per-datum suppression: only datums with a missing colour value are non-tooltip-bearing.
        // Independent of `isColorScaleValid()` so an invalidly-configured scale doesn't take out
        // tooltips for datums whose own data is fine.
        if (colorKey != null && colorValue == null) {
            return;
        }

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        // Reachable only when colorKey is null (missing-colour datums returned above).
        let fill: InternalAgColorType;
        if (colorValue == null) {
            fill = properties.colorScale.fills[0]?.color ?? 'black';
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
            const binLabel = findDiscreteColorBinLabel(
                colorScale,
                properties.colorScale.fills,
                colorValue,
                formatValue
            );
            data.push({
                label: colorName,
                fallbackLabel: colorKey!,
                value: content ?? binLabel ?? formatValue(colorValue),
            });
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

    getLegendData(
        legendType: _ModuleSupport.ChartLegendType
    ): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[] {
        if (!this.isColorScaleValid() || !this.dataModel) {
            return [];
        }

        const { colorScale: colorScaleProps } = this.properties;

        if (legendType === 'category' && colorScaleProps.mode === 'discrete' && colorScaleProps.fills.length > 0) {
            return buildColorCategoryLegendData(
                this.colorScale,
                colorScaleProps.fills,
                this.id,
                this.visible,
                colorScaleLegendFormatterContext(this)
            );
        }

        if (legendType === 'gradient') {
            return [
                buildGradientLegendDatum(
                    this.colorScale,
                    colorScaleProps.fills,
                    this.id,
                    this.visible,
                    this.getFormatterContext('color')
                ),
            ];
        }

        return [];
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
        addHitTestersToQuadtree(quadtree, this.datumNodesIter(), this.ctx.logger);
    }

    protected override pickNodesExactShape(point: Point): _ModuleSupport.SeriesNodePickMatch[] {
        const item = findQuadtreeMatch(this, point);
        return item != null && item.distance <= 0 ? [item] : [];
    }

    protected override pickNodeClosestDatum(point: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        return findQuadtreeMatch(this, point);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null ||
            this.isColorScaleValid()
        );
    }
}
