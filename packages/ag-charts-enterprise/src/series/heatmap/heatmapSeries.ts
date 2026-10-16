import type {
    AgHeatmapSeriesItemStylerParams,
    AgHeatmapSeriesLabelFormatterParams,
    FontStyle,
    FontWeight,
    TextAlign,
    VerticalAlign,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    type CallbackParamRules,
    ChartAxisDirection,
    ColorScale,
    type DomainWithMetadata,
    type DynamicContext,
    type InternalAgColorType,
    type Mutable,
    type NormalisedHeatmapSeriesOwnOptions,
    type NormalisedHeatmapSeriesStyle,
    type NormalisedTextOrSegments,
    type Point,
    PointerEvents,
    Rect,
    type ResolvedTextAlign,
    STROKE_STYLE_THEME_DEFAULTS,
    type SizedPoint,
    arraysEqual,
    configureColorScale,
    extent,
    findDiscreteColorBinLabel,
    formatValue,
    joinFormatted,
    mergeDefaults,
    resolveTextAlign,
    upsertNodeDatum,
} from 'ag-charts-core';
import type { BBox, QuadtreeNearest, Selection, Text } from 'ag-charts-core';

import { formatLabels } from '../util/labelFormatter';

const {
    HighlightState,
    SeriesNodePickMode,
    hasStateStyle,
    computeBarFocusBounds,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
    getMissCount,
    valueProperty,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
    createDatumId,
    addHitTestersToQuadtree,
    findQuadtreeMatch,
    getLabelStyles,
    updateLabelNode,
} = _ModuleSupport;

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
    /** Cell anchor the alignment factors are applied to, kept so a styler can re-anchor per cell. */
    anchorX: number;
    anchorY: number;
    xSpan: number;
    ySpan: number;
    style: NormalisedHeatmapSeriesStyle;
}

type ItemStyle = Pick<NormalisedHeatmapSeriesStyle, 'fill'> &
    Required<Omit<NormalisedHeatmapSeriesStyle, 'fill'>> & { opacity: number };

/** OPTIMIZATION: per-pass styling state, hoisted out of the per-cell path to keep styling O(cells). */
interface HeatmapItemStyleContext {
    readonly colorScaleValid: boolean;
    readonly baseStyle: Omit<ItemStyle, 'fill'>;
    readonly selectionEnabled: boolean;
    readonly activeHighlight: _ModuleSupport.HighlightNodeDatum | undefined;
    /** Whether the active highlight is in a state other than none for this series. */
    readonly highlightActive: boolean;
}

/** What the cell node data was built from, so a later transaction can tell whether only some cells changed. */
interface HeatmapBuildSignature {
    readonly nodes: HeatmapNodeDatum[];
    readonly processedData: object;
    readonly dataVersion: number;
    readonly nodeDataVersion: number;
    readonly colorScaleValid: boolean;
    readonly colorDomain: readonly unknown[];
    readonly layout: readonly unknown[];
}

/** Context object caching expensive lookups for createNodeData(). */
interface HeatmapSeriesNodeDatumContext extends _ModuleSupport.CartesianCreateNodeDataContext<HeatmapNodeDatum> {
    readonly yKey: string;

    readonly xOffset: number;
    readonly yOffset: number;
    readonly width: number;
    readonly height: number;
    readonly textAlignFactor: number;
    readonly verticalAlignFactor: number;

    readonly yValues: any[];
    readonly colorKey: string | undefined;
    readonly colorName: string | undefined;
    readonly colorValues: number[] | undefined;
    readonly colorDomain: number[];
    readonly itemPadding: number;

    readonly labels: HeatmapLabelDatum[];
    labelIndex: number;

    // Styling state shared across all cells in the pass
    readonly itemStyleContext: HeatmapItemStyleContext;
}

// Fractions of the padded cell span, relative to the cell centre.
const textAlignFactors: Record<ResolvedTextAlign, number> = {
    left: -0.5,
    center: 0,
    right: 0.5,
};

const verticalAlignFactors: Record<VerticalAlign, number> = {
    top: -0.5,
    middle: 0,
    bottom: 0.5,
};

const TEXT_ALIGNS: TextAlign[] = ['left', 'center', 'right', 'start', 'end'];
const VERTICAL_ALIGNS: VerticalAlign[] = ['top', 'middle', 'bottom'];

/** Appends everything about an axis that places a cell, so two layouts compare element by element. */
function pushScaleLayout(layout: unknown[], axis: _ModuleSupport.ChartAxis) {
    const { scale, visibleRange } = axis;
    // The scale may mutate its arrays in place, so a signature must hold copies.
    layout.push(
        scale.domain.slice(),
        scale.range.slice(),
        scale.bandwidth,
        scale.step,
        scale.inset,
        visibleRange[0],
        visibleRange[1]
    );
}

/**
 * Consolidated type interface for HeatmapSeries.
 * Defines all type parameters in one place for the series.
 */
interface HeatmapSeriesTypes extends _ModuleSupport.CartesianSeriesTypes {
    readonly node: Rect<HeatmapNodeDatum>;
    readonly options: NormalisedHeatmapSeriesOwnOptions;
    readonly datum: HeatmapNodeDatum;
    readonly label: HeatmapLabelDatum;
    readonly context: _ModuleSupport.CartesianSeriesNodeDataContext<HeatmapNodeDatum, HeatmapLabelDatum>;
    readonly stackContext: never;
    readonly createNodeDataContext: HeatmapSeriesNodeDatumContext;
}

export class HeatmapSeries extends _ModuleSupport.CartesianSeries<HeatmapSeriesTypes> {
    static override readonly className = 'HeatmapSeries';
    static readonly type = 'heatmap' as const;

    override createNodeParams(datum: HeatmapNodeDatum) {
        return {
            ...super.createNodeParams(datum),
            xKey: this.options.xKey,
            yKey: this.options.yKey,
            colorKey: this.options.colorKey,
        };
    }

    readonly colorScale = new ColorScale();

    /** Whether the stored cell styles were resolved under an active highlight, so they need a restyle when it ends. */
    private cellsStyledByHighlight = false;

    private buildSignature: HeatmapBuildSignature | undefined;

    /** Data indices of the cells an in-place transaction updated; every other cell is already up to date. */
    private touchedDatumIndices: number[] | undefined;

    /** Whether the current pass restyled every cell, which makes the untouched cells' scene nodes stale too. */
    private restyledEveryCell = false;

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

        const { xKey, yKey, colorKey } = this.options;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const colorScaleType = this.colorScale.type;

        const allowNullKey = this.options.allowNullKeys ?? false;
        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, this.data, {
            props: [
                valueProperty(xKey, xScaleType, { id: 'xValue', allowNullKey }),
                valueProperty(yKey, yScaleType, { id: 'yValue', allowNullKey }),
                ...(colorKey == null || colorKey === ''
                    ? []
                    : [valueProperty(colorKey, colorScaleType, { id: 'colorValue', invalidValue: undefined })]),
            ],
        });

        if (this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            const rawDomain = processedData.domain.values[colorKeyIdx].filter((v) => v != null);
            const domain = extent(rawDomain);

            if (domain != null) {
                const colorScaleProps = this.options.colorScale;
                // A degenerate single-value domain collapses to the midpoint colour, so a diverging
                // palette doesn't render with its endpoints.
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
        const { colorKey } = this.options;
        if (colorKey == null || colorKey === '') {
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
        { xAxis: _ModuleSupport.ChartAxis; yAxis: _ModuleSupport.ChartAxis } | undefined {
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
        this.restyledEveryCell = false;

        const previous = this.buildSignature;
        const signature = this.captureBuildSignature(ctx);
        const touched = this.findTouchedDatumIndices(ctx, signature);
        // An incremental pass leaves untouched cells styled as before, so `updateDatumStyles` decides whether they need a restyle.
        if (touched == null) this.cellsStyledByHighlight = ctx.itemStyleContext.highlightActive;
        this.touchedDatumIndices = touched;
        this.buildSignature = signature;

        this.resetStaleCallbackResults(previous, signature, touched);

        if (touched != null) {
            // OPTIMIZATION: a transaction that only updated cells rebuilds just those cells' datums.
            for (const datumIndex of touched) {
                this.updateNodeDatum(ctx, ctx.nodes[datumIndex], datumIndex, ctx.rawData[datumIndex]);
            }
            ctx.nodeIndex = ctx.nodes.length;
            return;
        }

        for (const [datumIndex, datum] of ctx.rawData.entries()) {
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

    /** A transaction does not clear the datum callback cache, so a styler result cached for a changed datum would outlive it. */
    private resetStaleCallbackResults(
        previous: HeatmapBuildSignature | undefined,
        next: HeatmapBuildSignature,
        touched: number[] | undefined
    ) {
        if (touched != null) {
            if (this.options.itemStyler == null) return;
            for (const datumIndex of touched) {
                this.resetDatumCallbackCache(createDatumId(datumIndex, 'node'));
                this.resetDatumCallbackCache(createDatumId(datumIndex, 'highlight'));
            }
        } else if (previous?.processedData === next.processedData && previous.dataVersion !== next.dataVersion) {
            this.resetDatumCallbackCache();
        }
    }

    private captureBuildSignature(ctx: HeatmapSeriesNodeDatumContext): HeatmapBuildSignature {
        const { processedData } = this;
        const layout: unknown[] = [];
        pushScaleLayout(layout, ctx.xAxis);
        pushScaleLayout(layout, ctx.yAxis);
        return {
            nodes: ctx.nodes,
            processedData: processedData!,
            dataVersion: processedData!.version,
            nodeDataVersion: this.nodeDataVersion,
            colorScaleValid: ctx.itemStyleContext.colorScaleValid,
            colorDomain: [...ctx.colorDomain],
            layout,
        };
    }

    /** The data indices a transaction updated in place, or `undefined` when anything else could change a cell. */
    private findTouchedDatumIndices(
        ctx: HeatmapSeriesNodeDatumContext,
        next: HeatmapBuildSignature
    ): number[] | undefined {
        const previous = this.buildSignature;
        const changes = this.processedData?.changeDescription;
        if (!ctx.canIncrementallyUpdate || previous == null || changes == null) return undefined;

        if (
            previous.processedData !== next.processedData ||
            previous.nodes !== next.nodes ||
            previous.dataVersion + 1 !== next.dataVersion ||
            previous.nodeDataVersion + 1 !== next.nodeDataVersion ||
            previous.colorScaleValid !== next.colorScaleValid ||
            !arraysEqual(previous.colorDomain, next.colorDomain) ||
            !arraysEqual(previous.layout, next.layout) ||
            this.isLabelEnabled()
        ) {
            return undefined;
        }

        const { indexMap } = changes;
        const { nodes, rawData } = ctx;
        const updateOnly =
            indexMap.removedIndices.size === 0 &&
            indexMap.totalPrependCount === 0 &&
            indexMap.totalAppendCount === 0 &&
            indexMap.originalLength === indexMap.finalLength &&
            nodes.length === rawData.length;
        if (!updateOnly) return undefined;

        const touched: number[] = [];
        for (const datumIndex of indexMap.updatedIndices) {
            if (nodes[datumIndex]?.datumIndex !== datumIndex) return undefined;
            touched.push(datumIndex);
        }
        return touched;
    }

    /**
     * Template method hook: Creates the result object shell.
     */
    protected override initializeResult(
        ctx: HeatmapSeriesNodeDatumContext
    ): _ModuleSupport.CartesianSeriesNodeDataContext<HeatmapNodeDatum, HeatmapLabelDatum> {
        return {
            itemId: this.options.yKey ?? this.id,
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

        if (!dataModel || !processedData) return undefined;

        const { xKey, xName, yKey, yName, colorKey, colorName, itemPadding } = this.options;
        // The top-level textAlign/verticalAlign are write-only forwarders, never read by the series.
        const { textAlign, verticalAlign } = this.options.label;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData, 'object');
        const yValues = dataModel.resolveColumnById(this, `yValue`, processedData, 'object');
        const colorValues =
            colorKey == null || colorKey === ''
                ? undefined
                : dataModel.resolveColumnById(this, `colorValue`, processedData, 'number');

        const colorDomain =
            colorKey == null || colorKey === ''
                ? []
                : dataModel.getDomain(this, 'colorValue', 'value', processedData).domain;

        const width = xScale.bandwidth ?? 10;
        const height = yScale.bandwidth ?? 10;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        const canIncrementallyUpdate = contextNodeData?.nodeData != null && processedData.changeDescription != null;

        return {
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

            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: (yScale.bandwidth ?? 0) / 2,
            width,
            height,
            // Plain factors — the padded cell span is applied once, at the label site.
            textAlignFactor: textAlignFactors[resolveTextAlign(textAlign, this.ctx.domManager.isRtl)],
            verticalAlignFactor: verticalAlignFactors[verticalAlign],

            yValues,
            colorKey,
            colorName,
            colorValues,
            colorDomain,
            itemPadding,

            // Labels are always rebuilt from scratch, never incrementally updated.
            labels: [],
            labelIndex: 0,

            itemStyleContext: this.createItemStyleContext(),
        };
    }

    private createItemStyleContext(): HeatmapItemStyleContext {
        const { stroke, strokeWidth, strokeOpacity } = this.options;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        return {
            colorScaleValid: this.isColorScaleValid(),
            baseStyle: { fillOpacity: 1, stroke, strokeWidth, strokeOpacity, opacity: 1 },
            selectionEnabled: this.isSelectionEnabled(),
            activeHighlight,
            highlightActive: this.getHighlightState(activeHighlight, false) !== HighlightState.None,
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

        const mutablePoint = mutableNode.point;
        mutablePoint.x = x;
        mutablePoint.y = y;
        mutablePoint.size = 0;

        mutableNode.midPoint.x = x;
        mutableNode.midPoint.y = y;

        mutableNode.style = this.getItemStyle({ datumIndex, datum, colorValue }, false, ctx.itemStyleContext);
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
        const { label } = this.options;
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
            // Preserve `ContentSegment[]` rather than flattening, so image-bearing labels keep images.
            labelText,
            this.options.label,
            undefined,
            this.options.label,
            { padding: itemPadding },
            sizeFittingHeight
        );

        if (labels?.label == null) {
            return undefined;
        }

        const { text, fontSize, lineHeight, height: labelHeight } = labels.label;
        const { fontStyle, fontFamily, fontWeight, color, textAlign, verticalAlign } = this.options.label;
        const anchorX = nodeDatum.point.x;
        const anchorY = nodeDatum.point.y - (labels.height - labelHeight) * 0.5;
        const xSpan = width - 2 * itemPadding;
        const ySpan = height - 2 * itemPadding;
        const lx = anchorX + textAlignFactor * xSpan;
        const ly = anchorY + verticalAlignFactor * ySpan;

        return {
            anchorX,
            anchorY,
            xSpan,
            ySpan,
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

    override update(params: { seriesRect?: BBox }) {
        // Animations are unsupported by heat-map, so prevent all animations.
        this.ctx.animationManager.skipCurrentBatch();

        return super.update(params);
    }

    protected override updateDatumSelection(opts: {
        nodeData: HeatmapNodeDatum[];
        datumSelection: Selection<HeatmapNodeDatum, Rect<HeatmapNodeDatum>>;
    }) {
        const { nodeData, datumSelection } = opts;
        // OPTIMIZATION: an in-place update leaves every datum bound to its scene node.
        if (this.touchedDatumIndices != null) return datumSelection;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected getItemStyle(
        { datumIndex, datum, colorValue }: Partial<HeatmapNodeDatum>,
        isHighlight: boolean,
        itemStyleContext: HeatmapItemStyleContext = this.createItemStyleContext()
    ): NormalisedHeatmapSeriesStyle {
        const { options } = this;
        const { itemStyler, colorKey } = options;
        const { missingDataFill } = options.colorScale;
        const { colorScaleValid, baseStyle, selectionEnabled, activeHighlight } = itemStyleContext;

        const highlightState = this.getHighlightState(activeHighlight, isHighlight, datumIndex);
        const highlightStyle =
            highlightState === HighlightState.None
                ? undefined
                : this.getHighlightStyle(isHighlight, datumIndex, highlightState);
        const selectionStyle = selectionEnabled ? this.getSelectionStyle(datumIndex) : undefined;
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
        // OPTIMIZATION: without a highlight or selection style the merge is just the fill over `baseStyle`.
        const style = (
            hasStateStyle(highlightStyle) || hasStateStyle(selectionStyle)
                ? mergeDefaults(selectionStyle, highlightStyle, { fill }, baseStyle)
                : { ...baseStyle, fill }
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

    private makeLabelFormatterParams() {
        const { xKey, yKey, colorKey, xName, yName, colorName } = this.options;
        return { xKey, yKey, colorKey, xName, yName, colorName };
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedHeatmapSeriesStyle>
    ) {
        const { id: seriesId, options } = this;
        const { xKey, yKey, colorKey } = options;

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
        datumSelection: Selection<HeatmapNodeDatum, Rect<HeatmapNodeDatum>>;
        isHighlight: boolean;
    }) {
        const itemStyleContext = this.createItemStyleContext();
        const { selectionEnabled, highlightActive } = itemStyleContext;

        if (!isHighlight) {
            // OPTIMIZATION: createNodeData styled every cell; only a highlight, selection or styler needs a restyle.
            // A transaction restyled the updated cells already, so a styler needs no pass over the rest.
            if (
                !selectionEnabled &&
                !highlightActive &&
                !this.cellsStyledByHighlight &&
                (this.options.itemStyler == null || this.touchedDatumIndices != null)
            ) {
                return;
            }
            this.cellsStyledByHighlight = highlightActive;
            this.restyledEveryCell = true;
        }

        datumSelection.each((_, nodeDatum) => {
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight, itemStyleContext);
        });
    }

    protected override updateDatumNodes({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: Selection<HeatmapNodeDatum, Rect<HeatmapNodeDatum>>;
        isHighlight: boolean;
    }) {
        const xAxis = this.axes[ChartAxisDirection.X];
        const [visibleMin, visibleMax] = xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;

        const { cornerRadius, shadow } = this.options;

        const updateNode = (rect: Rect<HeatmapNodeDatum>, nodeDatum: HeatmapNodeDatum) => {
            const { point, width, height, style } = nodeDatum;

            rect.setStyleProperties(style);
            rect.fillShadow = this.resolveItemShadow(shadow, isHighlight, nodeDatum.datumIndex);

            rect.crisp = crisp;
            rect.cornerRadius = cornerRadius;
            rect.x = point.x - width / 2;
            rect.y = point.y - height / 2;
            rect.width = width;
            rect.height = height;
        };

        const { touchedDatumIndices } = this;
        if (!isHighlight && touchedDatumIndices != null && !this.restyledEveryCell) {
            // OPTIMIZATION: only the updated cells' nodes differ from what the scene already holds.
            for (const datumIndex of touchedDatumIndices) {
                const rect = datumSelection.at(datumIndex);
                if (rect?.datum != null) updateNode(rect, rect.datum);
            }
            return;
        }

        datumSelection.each(updateNode);
    }

    protected override updateNodes(itemHighlighted: boolean, nodeRefresh: boolean) {
        super.updateNodes(itemHighlighted, nodeRefresh);
        this.touchedDatumIndices = undefined;
    }

    protected override updateLabelSelection(opts: {
        labelData: HeatmapLabelDatum[];
        labelSelection: Selection<HeatmapLabelDatum, Text<HeatmapLabelDatum>>;
    }) {
        const { labelData, labelSelection } = opts;
        const { enabled } = this.options.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected updateLabelNodes(opts: {
        labelSelection: Selection<HeatmapLabelDatum, Text<HeatmapLabelDatum>>;
        isHighlight?: boolean;
    }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const styledAlignment = this.options.label.itemStyler != null;
        opts.labelSelection.each((text, datum) => {
            text.pointerEvents = PointerEvents.None;
            text.text = datum.text;
            text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex)?.opacity ?? 1;
            type P = AgHeatmapSeriesLabelFormatterParams;
            type D = HeatmapLabelDatum;
            if (styledAlignment) {
                this.anchorStyledLabel(datum, isHighlight, activeHighlight);
            }
            updateLabelNode<P, D>(this, text, this.makeLabelFormatterParams(), this.options.label, datum, {
                isHighlight,
                activeHighlight,
            });
        });
    }

    /**
     * Re-anchors a cell's label to the alignment its label styler returned. The shared label update
     * reads the position off the datum, so the styled alignment has to be resolved into it first.
     */
    private anchorStyledLabel(
        datum: HeatmapLabelDatum,
        isHighlight: boolean,
        activeHighlight: _ModuleSupport.HighlightNodeDatum | undefined
    ) {
        const style: Record<string, unknown> = {
            ...getLabelStyles<AgHeatmapSeriesLabelFormatterParams>(
                this,
                datum,
                this.makeLabelFormatterParams(),
                this.options.label,
                isHighlight,
                activeHighlight
            ),
        };
        const textAlign = TEXT_ALIGNS.find((value) => value === style.textAlign);
        const verticalAlign = VERTICAL_ALIGNS.find((value) => value === style.verticalAlign);
        if (textAlign == null && verticalAlign == null) return;

        if (textAlign != null) {
            datum.textAlign = textAlign;
            const factor = textAlignFactors[resolveTextAlign(textAlign, this.ctx.domManager.isRtl)];
            datum.x = datum.anchorX + factor * datum.xSpan;
        }
        if (verticalAlign != null) {
            datum.textBaseline = verticalAlign;
            datum.y = datum.anchorY + verticalAlignFactors[verticalAlign] * datum.ySpan;
        }
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, options, colorScale, ctx } = this;
        const { formatManager } = ctx;
        const { xKey, xName, yKey, yName, colorKey, colorName, title, tooltip } = options;
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

        const allowNullKeys = this.options.allowNullKeys ?? false;
        if (xValue === undefined && !allowNullKeys) return;

        // Independent of `isColorScaleValid()` so an invalidly-configured scale doesn't take out
        // tooltips for datums whose own data is fine.
        if (colorKey != null && colorValue == null) {
            return;
        }

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        // Reachable only when colorKey is null (missing-colour datums returned above).
        let fill: InternalAgColorType;
        if (colorValue == null) {
            fill = options.colorScale.fills[0]?.color ?? 'black';
        } else {
            fill = colorScale.convert(colorValue);
            const domain = dataModel.getDomain(this, `colorValue`, 'value', processedData).domain;
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: colorValue,
                datum,
                seriesId,
                legendItemName: undefined,
                key: colorKey!,
                source: 'tooltip',
                property: 'color',
                domain,
                boundSeries: this.getFormatterContext('color'),
                fractionDigits: undefined,
                visibleDomain: undefined,
            });
            const binLabel = findDiscreteColorBinLabel(colorScale, options.colorScale.fills, colorValue, formatValue);
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
                value: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, undefined),
            },
            {
                label: yName,
                fallbackLabel: yKey,
                value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, undefined),
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
                          ...STROKE_STYLE_THEME_DEFAULTS,
                      },
                  };

        return this.formatTooltipWithContext(
            tooltip,
            { title, symbol, data },
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

        const { colorScale: colorScaleProps } = this.options;

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
        return this.options.label.enabled && Boolean(this.options.colorKey);
    }

    override getBandScalePadding() {
        return { inner: 0, outer: 0 };
    }

    protected computeFocusBounds({ datumIndex }: _ModuleSupport.PickFocusInputs): BBox | undefined {
        const datum = this.contextNodeData?.nodeData[datumIndex];
        if (datum === undefined) return undefined;
        const { width, height, midPoint } = datum;
        const focusRect = { x: midPoint.x - width / 2, y: midPoint.y - height / 2, width, height };
        return computeBarFocusBounds(this, focusRect);
    }

    protected override initQuadTree(quadtree: QuadtreeNearest<HeatmapNodeDatum>) {
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
            this.isSelectionEnabled() ||
            this.options.itemStyler != null ||
            this.options.label.itemStyler != null ||
            this.hasHighlightStateStyle()
        );
    }

    private hasHighlightStateStyle(): boolean {
        const { highlight } = this.options;
        return this.isHighlightEnabled() && hasStateStyle(highlight?.unhighlightedItem);
    }
}
