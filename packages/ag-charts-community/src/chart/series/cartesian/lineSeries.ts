import type { CallbackParamRules, DomainWithMetadata, RequireOptional } from 'ag-charts-core';
import { ChartAxisDirection, DebugMetrics, extent, isDefined, mergeDefaults } from 'ag-charts-core';
import {
    type AgDrawingMode,
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgLineSeriesLabelFormatterParams,
    type AgLineSeriesMarkerItemStylerParams,
    type AgLineSeriesOptions,
    type AgLineSeriesStylerParams,
    type AgLineSeriesStylerResult,
    type AgSeriesMarkerStyle,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type { BBox } from '../../../scene/bbox';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';
import type { Text } from '../../../scene/shape/text';
import { LogAxis } from '../../axis/logAxis';
import { NumberAxis } from '../../axis/numberAxis';
import type { DataController } from '../../data/dataController';
import type { DataModel, DataModelOptions, DatumPropertyDefinition, ProcessedData } from '../../data/dataModel';
import { fixNumericExtent } from '../../data/dataModel';
import {
    animationValidation,
    createDatumId,
    diff,
    groupAccumulativeValueProperty,
    keyProperty,
    normaliseGroupTo,
    processedDataIsAnimatable,
    valueProperty,
} from '../../data/processors';
import { getLabelStyles } from '../../labelUtil';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import { type LegendSymbolOptions } from '../../legend/legendSymbol';
import { Marker } from '../../marker/marker';
import { type TooltipContent, isTooltipValueMissing } from '../../tooltip/tooltip';
import { AggregationManager } from '../aggregationManager';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { HighlightState, toHighlightString } from '../seriesProperties';
import { datumStylerProperties } from '../util';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import {
    type LineSeriesDataAggregationFilter,
    aggregateLineDataFromDataModel,
    aggregateLineDataFromDataModelPartial,
} from './lineAggregation';
import { LineSeriesProperties } from './lineSeriesProperties';
import {
    type LineNodeDatum,
    type LineNodeDatumScratch,
    type LinePathSpan,
    type LineSeriesDatumContext,
    type LineSeriesNodeDataContext,
    type LineSpanPointDatum,
    interpolatePoints,
    plotLinePathStroke,
    prepareLinePathAnimation,
} from './lineUtil';
import {
    computeMarkerFocusBounds,
    getMarkerStyles,
    markerEnabled,
    markerFadeInAnimation,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
    resetMarkerSelectionsDirect,
} from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';
import { calculateSegments } from './util';

const CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR = 0.25;

type LineAnimationData = CartesianAnimationData<Marker, LineNodeDatum, LineNodeDatum, LineSeriesNodeDataContext>;

export class LineSeries extends CartesianSeries<
    Marker,
    AgLineSeriesOptions,
    LineSeriesProperties,
    LineNodeDatum,
    LineNodeDatum,
    LineSeriesNodeDataContext
> {
    static readonly className = 'LineSeries';
    static readonly type = 'line' as const;

    override properties = new LineSeriesProperties();

    private readonly aggregationManager = new AggregationManager<LineSeriesDataAggregationFilter>();

    override get pickModeAxis() {
        return this.properties.sparklineMode ? 'main' : 'main-category';
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: 'xValue',
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            datumSelectionGarbageCollection: false,
            segmentedDataNodes: false,
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                datum: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
            clipFocusBox: false,
        });
    }

    private isNormalized() {
        return this.properties.normalizedTo != null;
    }

    override async processData(dataController: DataController) {
        if (this.data == null) return;

        const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 0 } = {} } = this;
        const { xKey, yKey, yFilterKey, connectMissingData, normalizedTo } = this.properties;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { isContinuousX, xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const stacked = stackCount > 1 || normalizedTo != null;

        const common: Partial<DatumPropertyDefinition<unknown>> = { invalidValue: null };
        if (connectMissingData && stacked) {
            common.invalidValue = 0;
        }
        if (stacked && !visible) {
            common.forceValue = 0;
        }

        const idMap = {
            value: `area-stack-${groupIndex}-yValue`,
            marker: `area-stack-${groupIndex}-yValues-marker`,
        };

        const props: DataModelOptions<any, false, false>['props'] = [];

        // If two or more datum share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datum and
        // automatically garbage collect the marker selection.
        if (!isContinuousX || stacked) {
            props.push(keyProperty(xKey, xScaleType, { id: 'xKey' }));
        }

        props.push(
            valueProperty(xKey, xScaleType, { id: 'xValue' }),
            valueProperty(yKey, yScaleType, {
                id: `yValueRaw`,
                ...common,
                invalidValue: undefined,
            })
        );

        if (yFilterKey != null) {
            props.push(valueProperty(yFilterKey, yScaleType, { id: 'yFilterRaw' }));
        }

        if (stacked) {
            props.push(
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    { id: `yValueCumulative`, ...common, groupId: idMap.marker },
                    yScaleType
                )
            );
        }

        if (isDefined(normalizedTo)) {
            props.push(
                valueProperty(yKey, yScaleType, { id: `yValue`, ...common, groupId: idMap.value }),
                normaliseGroupTo(Object.values(idMap), normalizedTo)
            );
        }

        if (this.needsDataModelDiff()) {
            props.push(animationValidation(isContinuousX ? ['xValue'] : undefined));
            if (this.processedData) {
                props.push(diff(this.id, this.processedData));
            }
        }

        const { dataModel, processedData } = await this.requestDataModel<any>(dataController, data, {
            props,
            groupByKeys: stacked,
            groupByData: !stacked,
        });

        this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    private yValueKey() {
        return this.isNormalized() ? 'yValue' : 'yValueRaw';
    }

    private yCumulativeKey(processData: ProcessedData<any>) {
        return processData.type === 'grouped' ? 'yValueCumulative' : this.yValueKey();
    }

    override xCoordinateRange(xValue: any, pixelSize: number): [number, number] {
        const { marker } = this.properties;
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        const r = marker.enabled ? 0.5 * marker.size * pixelSize : 0;
        return [x - r, x + r];
    }

    override yCoordinateRange(yValues: any[], pixelSize: number): [number, number] {
        const { marker } = this.properties;
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        const r = marker.enabled ? 0.5 * marker.size * pixelSize : 0;
        return [y - r, y + r];
    }

    override getSeriesDomain(direction: ChartAxisDirection): DomainWithMetadata<any> {
        const { dataModel, processedData, axes } = this;
        if (!dataModel || !processedData) return { domain: [] };

        const yAxis = axes[ChartAxisDirection.Y];

        if (direction === ChartAxisDirection.X) {
            const xDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const xDomain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
                // Attach sort metadata for discrete domains to enable scale optimization
                const sortMetadata = dataModel.getKeySortMetadata(this, 'xValue', processedData);
                return { domain: xDomain.domain, sortMetadata };
            }

            return { domain: fixNumericExtent(extent(xDomain.domain)) };
        }

        const yExtent = this.domainForClippedRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(processedData)],
            'xValue'
        );

        if (this.isNormalized() && yAxis instanceof NumberAxis && !(yAxis instanceof LogAxis)) {
            const fixedYExtent = Number.isFinite(yExtent[1] - yExtent[0])
                ? [Math.min(yExtent[0], 0), Math.max(yExtent[1], 0)]
                : [];
            return { domain: fixNumericExtent(fixedYExtent) };
        } else {
            return { domain: fixNumericExtent(yExtent) };
        }
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): number[] {
        return this.domainForVisibleRange(
            ChartAxisDirection.Y,
            [this.yCumulativeKey(this.processedData!)],
            'xValue',
            visibleRange
        );
    }

    override getZoomRangeFittingItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): { x: [number, number]; y: [number, number] | undefined } | undefined {
        return this.zoomFittingVisibleItems(
            'xValue',
            [this.yCumulativeKey(this.processedData!)],
            xVisibleRange,
            yVisibleRange,
            minVisibleItems
        );
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        return this.countVisibleItems(
            'xValue',
            [this.yCumulativeKey(this.processedData!)],
            xVisibleRange,
            yVisibleRange,
            minVisibleItems
        );
    }

    private aggregateData(dataModel: DataModel<any, any>, processedData: ProcessedData<any>): void {
        this.aggregationManager.markStale();

        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const targetRange = this.estimateTargetRange();

        this.aggregationManager.aggregate({
            computePartial: (existingFilters) =>
                aggregateLineDataFromDataModelPartial(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this.yCumulativeKey(processedData),
                    this,
                    targetRange,
                    existingFilters
                ),
            computeFull: (existingFilters) =>
                aggregateLineDataFromDataModel(
                    xAxis.scale.type,
                    dataModel,
                    processedData,
                    this.yCumulativeKey(processedData),
                    this,
                    existingFilters
                ),
            targetRange,
        });

        const filters = this.aggregationManager.filters;
        if (filters && filters.length > 0) {
            DebugMetrics.record(
                `${this.type}:aggregation`,
                filters.map((f) => f.maxRange)
            );
        }
    }

    private estimateTargetRange(): number {
        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis?.scale?.range) {
            const [r0, r1] = xAxis.scale.range;
            return Math.abs(r1 - r0);
        }
        return this.ctx.scene?.canvas?.width ?? 800;
    }

    /**
     * Creates the context object for efficient node datum creation.
     * Caches expensive-to-compute values that are reused across all datum iterations
     * to minimize memory allocations. Only caches values that are expensive to
     * compute - cheap property lookups use `this` directly.
     */
    private createNodeDatumContext(
        xScale: { convert: (v: any) => number; bandwidth?: number; range: number[] },
        yScale: { convert: (v: any) => number; bandwidth?: number }
    ): LineSeriesDatumContext | undefined {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return undefined;

        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        // Ensure we have the aggregation level needed for the current range
        this.aggregationManager.ensureLevelForRange(range);

        const dataAggregationFilter = this.aggregationManager.getFilterForRange(range);
        const canIncrementallyUpdate =
            this.contextNodeData?.nodeData != null &&
            (processedData.changeDescription != null ||
                !processedDataIsAnimatable(processedData) ||
                dataAggregationFilter != null);

        return {
            rawData,
            xValues: dataModel.resolveColumnById(this, 'xValue', processedData),
            yRawValues: dataModel.resolveColumnById(this, 'yValueRaw', processedData),
            yCumulativeValues: dataModel.resolveColumnById(this, this.yCumulativeKey(processedData), processedData),
            selectionValues: this.properties.yFilterKey
                ? dataModel.resolveColumnById(this, 'yFilterRaw', processedData)
                : undefined,
            xScale,
            yScale,
            xOffset: (xScale.bandwidth ?? 0) / 2,
            yOffset: (yScale.bandwidth ?? 0) / 2,
            size: this.properties.marker.enabled ? this.properties.marker.size : 0,
            yDomain: this.getSeriesDomain(ChartAxisDirection.Y).domain,
            labelsEnabled: this.properties.label.enabled,
            animationEnabled: !this.ctx.animationManager.isSkipped(),
            canIncrementallyUpdate,
            dataAggregationFilter,
            range,
            xKey: this.properties.xKey,
            yKey: this.properties.yKey,
            xName: this.properties.xName,
            yName: this.properties.yName,
            legendItemName: this.properties.legendItemName,
            connectMissingData: this.properties.connectMissingData,
            capDefaults: {
                lengthRatioMultiplier: this.properties.marker.getDiameter(),
                lengthMax: Infinity,
            },
            nodeData: canIncrementallyUpdate ? this.contextNodeData.nodeData : [],
            spanPoints: [],
            nodeIndex: 0,
        };
    }

    /**
     * Processes a single datum and updates the context's nodeData and spanPoints arrays.
     * Uses the scratch object to avoid per-iteration allocations.
     */
    private handleDatum(ctx: LineSeriesDatumContext, scratch: LineNodeDatumScratch, datumIndex: number): void {
        // Populate scratch from context arrays
        scratch.datum = ctx.rawData[datumIndex];
        scratch.xDatum = ctx.xValues[datumIndex];
        scratch.yDatum = ctx.yRawValues[datumIndex];
        scratch.yCumulative = ctx.yCumulativeValues[datumIndex];
        scratch.selected = ctx.selectionValues?.[datumIndex];

        scratch.x = ctx.xScale.convert(scratch.xDatum) + ctx.xOffset;
        scratch.y = ctx.yScale.convert(scratch.yCumulative) + ctx.yOffset;

        if (!Number.isFinite(scratch.x)) return;

        if (scratch.yDatum != null) {
            const labelText = ctx.labelsEnabled
                ? this.getLabelText<AgLineSeriesLabelFormatterParams>(
                      scratch.yDatum,
                      scratch.datum,
                      ctx.yKey,
                      'y',
                      ctx.yDomain,
                      this.properties.label,
                      {
                          value: scratch.yDatum,
                          datum: scratch.datum,
                          xKey: ctx.xKey,
                          yKey: ctx.yKey,
                          xName: ctx.xName,
                          yName: ctx.yName,
                          legendItemName: ctx.legendItemName,
                      }
                  )
                : undefined;

            const canReuseNode = ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodeData.length;

            if (canReuseNode) {
                // Update existing node datum in place
                const existingNode = ctx.nodeData[ctx.nodeIndex];
                (existingNode as any).datum = scratch.datum;
                (existingNode as any).datumIndex = datumIndex;
                (existingNode as any).point = { x: scratch.x, y: scratch.y, size: ctx.size };
                (existingNode as any).midPoint = { x: scratch.x, y: scratch.y };
                (existingNode as any).cumulativeValue = scratch.yCumulative;
                (existingNode as any).yValue = scratch.yDatum;
                (existingNode as any).xValue = scratch.xDatum;
                (existingNode as any).labelText = labelText;
                (existingNode as any).selected = scratch.selected;
            } else {
                ctx.nodeData.push({
                    series: this,
                    datum: scratch.datum,
                    datumIndex,
                    yKey: ctx.yKey,
                    xKey: ctx.xKey,
                    point: { x: scratch.x, y: scratch.y, size: ctx.size },
                    midPoint: { x: scratch.x, y: scratch.y },
                    cumulativeValue: scratch.yCumulative,
                    yValue: scratch.yDatum,
                    xValue: scratch.xDatum,
                    capDefaults: ctx.capDefaults,
                    labelText,
                    selected: scratch.selected,
                });
            }
            ctx.nodeIndex++;
        }

        // Update span points for path rendering
        this.updateSpanPoints(ctx, scratch);
    }

    /**
     * Updates span points array based on current scratch values.
     */
    private updateSpanPoints(ctx: LineSeriesDatumContext, scratch: LineNodeDatumScratch): void {
        const currentSpanPoints: LineSpanPointDatum[] | { skip: number } | undefined = ctx.spanPoints.at(-1);

        if (scratch.yDatum != null) {
            const spanPoint: LineSpanPointDatum = {
                point: { x: scratch.x, y: scratch.y },
                xDatum: scratch.xDatum,
                yDatum: scratch.yDatum,
            };

            if (Array.isArray(currentSpanPoints)) {
                currentSpanPoints.push(spanPoint);
            } else if (currentSpanPoints == null) {
                ctx.spanPoints.push([spanPoint]);
            } else {
                currentSpanPoints.skip += 1;
                ctx.spanPoints.push([spanPoint]);
            }
        } else if (!ctx.connectMissingData) {
            if (Array.isArray(currentSpanPoints) || currentSpanPoints == null) {
                ctx.spanPoints.push({ skip: 0 });
            } else {
                currentSpanPoints.skip += 1;
            }
        }
    }

    override createNodeData() {
        const { processedData, axes } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!processedData || !xAxis || !yAxis) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        // Create context with all cached values
        const ctx = this.createNodeDatumContext(xScale, yScale);
        if (!ctx) return;

        // Reusable scratch object to avoid per-datum allocations
        const scratch: LineNodeDatumScratch = {
            datum: undefined,
            xDatum: undefined,
            yDatum: undefined,
            yCumulative: 0,
            selected: undefined,
            x: 0,
            y: 0,
        };

        // Compute visible range and iterate
        const indices = ctx.dataAggregationFilter?.indices;
        let [start, end] = this.visibleRangeIndices('xValue', xAxis.range, indices);
        start = Math.max(start - 1, 0);
        end = Math.min(end + 1, indices?.length ?? ctx.xValues.length);

        // @todo(AG-13575) Remove this if block
        if (processedData.input.count < 1e3) {
            start = 0;
            end = processedData.input.count;
        }

        for (let i = start; i < end; i += 1) {
            this.handleDatum(ctx, scratch, indices?.[i] ?? i);
        }

        // Cleanup incremental updates - trim nodeData if fewer nodes than before
        if (ctx.canIncrementallyUpdate && ctx.nodeIndex < ctx.nodeData.length) {
            ctx.nodeData.length = ctx.nodeIndex;
        }

        // Build stroke data from span points
        const strokeSpans = ctx.spanPoints.flatMap((p): LinePathSpan[] => {
            return Array.isArray(p) ? interpolatePoints(p, this.properties.interpolation) : [];
        });
        const strokeData = { itemId: ctx.yKey, spans: strokeSpans };

        const crossFiltering =
            ctx.selectionValues?.some((selectionValue, index) => selectionValue === ctx.yRawValues[index]) ?? false;

        const segments = calculateSegments(
            this.properties.segmentation,
            xAxis,
            yAxis,
            this.chart!.seriesRect!,
            this.ctx.scene,
            false
        );

        return {
            itemId: ctx.yKey,
            nodeData: ctx.nodeData,
            labelData: ctx.nodeData,
            strokeData,
            scales: this.calculateScaling(),
            visible: this.visible,
            crossFiltering,
            styles: getMarkerStyles(this, this.properties, this.properties.marker),
            segments,
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    protected override updatePathNodes(opts: { paths: SegmentedPath[]; visible: boolean; animationEnabled: boolean }) {
        const {
            paths: [lineNode],
            visible,
            animationEnabled,
        } = opts;
        const crossFiltering = this.contextNodeData?.crossFiltering === true;

        const merged = mergeDefaults(this.getHighlightStyle(), this.getStyle());
        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = merged;

        const segments = this.contextNodeData?.segments;

        lineNode.setProperties({
            segments,
            fill: undefined,
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            opacity,
            stroke,
            strokeWidth,
            strokeOpacity: strokeOpacity * (crossFiltering ? CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR : 1),
            lineDash,
            lineDashOffset,
        });

        lineNode.datum = segments;

        if (!animationEnabled) {
            lineNode.visible = visible;
        }

        updateClipPath(this, lineNode);
    }

    protected override updateDatumSelection(opts: {
        nodeData: LineNodeDatum[];
        datumSelection: Selection<Marker, LineNodeDatum>;
    }) {
        let { nodeData } = opts;
        const { datumSelection } = opts;
        const { contextNodeData, processedData, axes, properties } = this;
        const { marker } = properties;

        const markersEnabled =
            contextNodeData?.crossFiltering === true ||
            markerEnabled(processedData!.input.count, axes[ChartAxisDirection.X]!.scale, marker);

        nodeData = markersEnabled ? nodeData : [];

        if (marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }

        if (!processedDataIsAnimatable(this.processedData!)) {
            // Optimised update path, no need to match nodes by id
            return datumSelection.update(nodeData);
        }
        return datumSelection.update(nodeData, undefined, (datum) => createDatumId(datum.xValue));
    }

    protected override updateDatumStyles(opts: {
        datumSelection: Selection<Marker, LineNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { marker } = this.properties;

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        datumSelection.each((node, datum) => {
            if (!datumSelection.isGarbage(node)) {
                const highlightState = this.getHighlightState(highlightedDatum, opts.isHighlight, datum.datumIndex);
                const stylerStyle = this.getStyle(highlightState);
                const { stroke, strokeWidth, strokeOpacity } = stylerStyle;

                const params = this.makeItemStylerParams(
                    this.dataModel!,
                    this.processedData!,
                    datum.datumIndex,
                    stylerStyle.marker
                );
                datum.style = this.getMarkerStyle(
                    marker,
                    datum,
                    params,
                    { isHighlight, highlightState },
                    stylerStyle.marker,
                    {
                        stroke,
                        strokeWidth,
                        strokeOpacity,
                    }
                );
            }
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: Selection<Marker, LineNodeDatum>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }

        const { datumSelection, isHighlight, drawingMode } = opts;

        const applyTranslation = this.ctx.animationManager.isSkipped();
        const fillBBox = this.getShapeFillBBox();

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        datumSelection.each((node, datum) => {
            const state = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const style = datum.style ?? contextNodeData.styles[state];
            this.applyMarkerStyle(style, node, datum.point, fillBBox, {
                applyTranslation,
                selected: datum.selected,
            });
            node.drawingMode = drawingMode;
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: LineNodeDatum[];
        labelSelection: Selection<Text, LineNodeDatum>;
    }) {
        return opts.labelSelection.update(this.isLabelEnabled() ? opts.labelData : []);
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, LineNodeDatum>; isHighlight?: boolean }) {
        const { isHighlight = false } = opts;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const params: AgLineSeriesLabelFormatterParams = this.makeLabelFormatterParams();

        opts.labelSelection.each((text, datum) => {
            const style = getLabelStyles(this, datum, params, this.properties.label, isHighlight, activeHighlight);
            const { enabled, fontStyle, fontWeight, fontSize, fontFamily, color } = style;
            if (enabled && datum?.labelText) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = 'center';
                text.textBaseline = 'bottom';
                text.text = datum.labelText;
                text.x = datum.point.x;
                text.y = datum.point.y - 10;
                text.fill = color;
                text.visible = true;
                text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
                text.setBoxing(style);
            } else {
                text.visible = false;
            }
        });
    }

    makeStylerParams(highlightStateEnum?: HighlightState): AgLineSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { marker, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth, xKey, yKey } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type MarkerRules = { marker: RequireOptional<AgSeriesMarkerStyle> };
        type ResultRules = CallbackParamRules<AgLineSeriesStylerParams<unknown, unknown> & MarkerRules>;
        return {
            marker: {
                fill: marker.fill,
                fillOpacity: marker.fillOpacity,
                size: marker.size,
                shape: marker.shape,
                stroke: marker.stroke,
                strokeOpacity: marker.strokeOpacity,
                strokeWidth: marker.strokeWidth,
                lineDash: marker.lineDash,
                lineDashOffset: marker.lineDashOffset,
            },
            highlightState,
            lineDash,
            lineDashOffset,
            seriesId,
            stroke,
            strokeOpacity,
            strokeWidth,
            xKey,
            yKey,
        } satisfies ResultRules;
    }

    private makeItemStylerParams(
        dataModel: NonNullable<typeof this.dataModel>,
        processedData: NonNullable<typeof this.processedData>,
        datumIndex: number,
        style: Required<AgSeriesMarkerStyle>
    ): AgLineSeriesMarkerItemStylerParams<unknown, unknown> {
        const { xKey, yKey } = this.properties;

        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData)[datumIndex];
        const xDomain = dataModel.getDomain(this, `xValue`, 'key', processedData).domain;
        const yDomain = dataModel.getDomain(this, this.yCumulativeKey(processedData), 'value', processedData).domain;
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            ...datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
            xValue,
            yValue,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgLineSeriesMarkerItemStylerParams<unknown, unknown>>;
    }

    private makeLabelFormatterParams(): AgLineSeriesLabelFormatterParams {
        const { xKey, xName, yKey, yName, legendItemName } = this.properties;
        return { xKey, xName, yKey, yName, legendItemName } satisfies RequireOptional<AgLineSeriesLabelFormatterParams>;
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.data?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData)[datumIndex];

        if (xValue == null) return;

        const stylerStyle = this.getStyle();
        const params = this.makeItemStylerParams(dataModel, processedData, datumIndex, stylerStyle.marker);

        const format = this.getMarkerStyle(
            this.properties.marker,
            { datumIndex, datum },
            params,
            { isHighlight: false },
            stylerStyle.marker
        ) as RequireOptional<AgSeriesMarkerStyle>;

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                symbol: this.legendItemSymbol(),
                data: [
                    {
                        label: yName,
                        fallbackLabel: yKey,
                        value: this.getAxisValueText(yAxis, 'tooltip', yValue, datum, yKey, legendItemName),
                        missing: isTooltipValueMissing(yValue),
                    },
                ],
            },
            {
                seriesId,
                datum,
                title: yName,
                xKey,
                xName,
                yKey,
                yName,
                ...format,
                ...(this.getModuleTooltipParams() as RequireOptional<AgErrorBoundSeriesTooltipRendererParams>),
            }
        );
    }

    private legendItemSymbol(): LegendSymbolOptions {
        const { stroke, strokeOpacity, strokeWidth, lineDash, marker } = this.getStyle();

        const markerStyle = this.getMarkerStyle(
            this.properties.marker,
            {},
            undefined,
            {
                isHighlight: false,
                checkForHighlight: false,
            },
            {
                size: marker.size,
                shape: marker.shape,
                fill: marker.fill,
                fillOpacity: marker.fillOpacity,
                stroke: marker.stroke,
                strokeOpacity: marker.strokeOpacity,
                strokeWidth: marker.strokeWidth,
                lineDash: marker.lineDash,
                lineDashOffset: marker.lineDashOffset,
            } satisfies RequireOptional<AgSeriesMarkerStyle>
        );

        return {
            marker: {
                ...markerStyle,
                enabled: this.properties.marker.enabled,
            },
            line: {
                enabled: true,
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
            },
        };
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const {
            id: seriesId,
            ctx: { legendManager },
            visible,
        } = this;

        const { yKey: itemId, yName, title, legendItemName, showInLegend } = this.properties;

        return [
            {
                legendType,
                id: seriesId,
                itemId,
                legendItemName,
                seriesId,
                enabled: visible && legendManager.getItemEnabled({ seriesId, itemId }),
                label: {
                    text: legendItemName ?? title ?? yName ?? itemId,
                },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    protected override updatePaths(opts: { contextData: LineSeriesNodeDataContext; paths: Path[] }) {
        this.updateLinePaths(opts.paths, opts.contextData);
    }

    private updateLinePaths(paths: Path[], contextData: LineSeriesNodeDataContext) {
        const spans = contextData.strokeData.spans;
        const [lineNode] = paths;

        lineNode.path.clear();
        plotLinePathStroke(lineNode, spans);
        lineNode.markDirty('LineSeries');
    }

    protected override resetDatumAnimation(data: LineAnimationData): void {
        // Use direct reset for datum selection to bypass resetMotion callback overhead
        resetMarkerSelectionsDirect([data.datumSelection]);
    }

    protected override animateEmptyUpdateReady(animationData: LineAnimationData) {
        const { datumSelection, labelSelection, annotationSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateLinePaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([datumSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, datumSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
        seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
    }

    protected override animateReadyResize(animationData: LineAnimationData): void {
        const { contextData, paths } = animationData;
        this.updateLinePaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    protected override animateWaitingUpdateReady(animationData: LineAnimationData) {
        const { animationManager } = this.ctx;
        const {
            datumSelection,
            labelSelection: labelSelections,
            annotationSelections,
            contextData,
            paths,
            previousContextData,
        } = animationData;
        const [path] = paths;

        if (contextData.visible === false && previousContextData?.visible === false) return;

        this.resetDatumAnimation(animationData);
        this.resetLabelAnimation(animationData);

        const update = () => {
            this.resetPathAnimation(animationData);
            this.updateLinePaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', datumSelection);
            pathFadeInAnimation(this, 'path_properties', animationManager, 'add', path);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
            return;
        }

        if (contextData.crossFiltering !== previousContextData.crossFiltering) {
            skip();
            return;
        }

        const fns = prepareLinePathAnimation(
            contextData,
            previousContextData,
            this.processedData?.reduced?.diff?.[this.id]
        );

        if (fns === undefined) {
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        fromToMotion(this.id, 'path_properties', animationManager, [path], fns.stroke.pathProperties);

        if (fns.status === 'added') {
            this.updateLinePaths(paths, contextData);
        } else if (fns.status === 'removed') {
            this.updateLinePaths(paths, previousContextData);
        } else {
            pathMotion(this.id, 'path_update', animationManager, [path], fns.stroke.path);
        }

        if (fns.hasMotion) {
            markerFadeInAnimation(this, animationManager, undefined, datumSelection);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
        }

        // The animation may clip spans
        // When using smooth interpolation, the bezier spans are clipped using an approximation
        // This can result in artefacting, which may be present on the final frame
        // To remove this on the final frame, re-draw the series without animations
        this.ctx.animationManager.animate({
            id: this.id,
            groupId: 'reset_after_animation',
            phase: 'trailing',
            from: {},
            to: {},
            onComplete: () => this.updateLinePaths(paths, contextData),
        });
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }

    protected nodeFactory() {
        return new Marker();
    }

    public getStyle(
        highlightState?: HighlightState
    ): Required<AgLineSeriesStylerResult> & { marker: Required<AgSeriesMarkerStyle> } {
        const { styler, marker, lineDash, lineDashOffset, stroke, strokeOpacity, strokeWidth } = this.properties;
        const { size, shape, fill = 'transparent', fillOpacity } = marker;
        let stylerResult: AgLineSeriesStylerResult = {};
        if (styler) {
            const stylerParams = this.makeStylerParams(highlightState);
            const cbResult = this.cachedCallWithContext(styler, stylerParams) ?? {};
            const resolved = this.ctx.optionsGraphService.resolvePartial(
                ['series', `${this.declarationOrder}`],
                cbResult,
                { pick: false }
            );
            stylerResult = resolved ?? {};
        }
        stylerResult.marker ??= {};
        return {
            lineDash: stylerResult.lineDash ?? lineDash,
            lineDashOffset: stylerResult.lineDashOffset ?? lineDashOffset,
            stroke: stylerResult.stroke ?? stroke,
            strokeOpacity: stylerResult.strokeOpacity ?? strokeOpacity,
            strokeWidth: stylerResult.strokeWidth ?? strokeWidth,
            marker: {
                fill: stylerResult.marker.fill ?? fill,
                fillOpacity: stylerResult.marker.fillOpacity ?? fillOpacity,
                shape: stylerResult.marker.shape ?? shape,
                size: stylerResult.marker.size ?? size,
                lineDash: stylerResult.marker.lineDash ?? marker.lineDash ?? lineDash,
                lineDashOffset: stylerResult.marker.lineDashOffset ?? marker.lineDashOffset ?? lineDashOffset,
                stroke: stylerResult.marker.stroke ?? marker.stroke ?? stroke,
                strokeOpacity: stylerResult.marker.strokeOpacity ?? marker.strokeOpacity ?? strokeOpacity,
                strokeWidth: stylerResult.marker.strokeWidth ?? marker.strokeWidth ?? strokeWidth,
            } satisfies RequireOptional<AgSeriesMarkerStyle>,
        } satisfies RequireOptional<AgLineSeriesStylerResult>;
    }

    public getFormattedMarkerStyle(datum: LineNodeDatum) {
        const stylerStyle = this.getStyle();
        const params = this.makeItemStylerParams(
            this.dataModel!,
            this.processedData!,
            datum.datumIndex,
            stylerStyle.marker
        );

        return this.getMarkerStyle(
            this.properties.marker,
            datum,
            params,
            { isHighlight: true },
            undefined,
            stylerStyle
        );
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.styler != null ||
            this.properties.marker.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
