import {
    type AgRangeAreaSeriesItemStylerParams,
    type AgRangeAreaSeriesItemType,
    type AgRangeAreaSeriesLabelFormatterParams,
    type AgRangeAreaSeriesOptions,
    type AgRangeAreaSeriesStyle,
    type AgRangeAreaSeriesStylerParams,
    type AgSeriesMarkerStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { DeepRequired, Point, RequireOptional } from 'ag-charts-core';

import { type RangeAreaSeriesDataAggregationFilter, aggregateRangeAreaData } from './rangeAreaAggregation';
import { calculateIntersectionSegments, findRangeAreaIntersections } from './rangeAreaIntersection';
import { type RangeAreaMarkerDatum, RangeAreaProperties } from './rangeAreaProperties';
import { type RangeAreaContext, type RangeAreaLabelDatum, prepareRangeAreaPathAnimation } from './rangeAreaUtil';

const {
    valueProperty,
    keyProperty,
    ChartAxisDirection,
    mergeDefaults,
    updateLabelNode,
    fixNumericExtent,
    buildResetPathFn,
    resetLabelFn,
    resetMarkerFn,
    resetMarkerPositionFn,
    pathSwipeInAnimation,
    resetMotion,
    markerSwipeScaleInAnimation,
    seriesLabelFadeInAnimation,
    animationValidation,
    diff,
    updateClipPath,
    computeMarkerFocusBounds,
    plotAreaPathFill,
    plotLinePathStroke,
    interpolatePoints,
    pathFadeInAnimation,
    markerFadeInAnimation,
    fromToMotion,
    pathMotion,
    extent,
    applyShapeFillBBox,
    PointerEvents,
    Marker,
    BBox,
    findMinMax,
    applyShapeStyle,
    processedDataIsAnimatable,
    simpleMemorize2,
    markerEnabled,
    getMarkerStyles,
    calculateSegments,
    toHighlightString,
    HighlightState,
} = _ModuleSupport;

const memoizedAggregateRangeAreaData = simpleMemorize2(aggregateRangeAreaData);

const DEFAULT_ITEM = 'low';

type ResolvedLineStyleMixin = {
    marker?: {
        enabled?: boolean;
    };
};
type ResolvedStyleMixin = {
    item?: {
        low?: ResolvedLineStyleMixin;
        high?: ResolvedLineStyleMixin;
    };
};
type PartialStylerResult = AgRangeAreaSeriesStyle & ResolvedStyleMixin & { opacity?: number };
type StylerResult = DeepRequired<PartialStylerResult, 'fill'>;

class RangeAreaSeriesNodeEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeEvent<RangeAreaMarkerDatum, TEvent> {
    readonly xKey?: string;
    readonly yLowKey?: string;
    readonly yHighKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: RangeAreaMarkerDatum, series: RangeAreaSeries) {
        super(type, nativeEvent, datum, series);
        this.xKey = series.properties.xKey;
        this.yLowKey = series.properties.yLowKey;
        this.yHighKey = series.properties.yHighKey;
    }
}

interface RangeAreaSpanPointDatum {
    high: _ModuleSupport.LineSpanPointDatum;
    low: _ModuleSupport.LineSpanPointDatum;
}

export class RangeAreaSeries extends _ModuleSupport.CartesianSeries<
    _ModuleSupport.Marker,
    AgRangeAreaSeriesOptions,
    RangeAreaProperties,
    RangeAreaMarkerDatum,
    RangeAreaLabelDatum,
    RangeAreaContext
> {
    static readonly className = 'RangeAreaSeries';
    static readonly type = 'range-area' as const;

    override properties = new RangeAreaProperties();

    protected override readonly NodeEvent = RangeAreaSeriesNodeEvent;

    private dataAggregationFilters: RangeAreaSeriesDataAggregationFilter[] | undefined = undefined;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pathsPerSeries: ['fill', 'stroke'],
            pickModes: [_ModuleSupport.SeriesNodePickMode.AXIS_ALIGNED],
            propertyKeys: {
                [ChartAxisDirection.X]: ['xKey'],
                [ChartAxisDirection.Y]: ['yLowKey', 'yHighKey'],
            },
            propertyNames: {
                [ChartAxisDirection.X]: ['xName'],
                [ChartAxisDirection.Y]: ['yLowName', 'yHighName', 'yName'],
            },
            categoryKey: 'xValue',
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                datum: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
            clipFocusBox: false,
        });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yLowKey, yHighKey } = this.properties;
        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });

        const extraProps = [];
        const animationEnabled = !this.ctx.animationManager.isSkipped();
        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            extraProps.push(diff(this.id, this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation());
        }

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(yLowKey, yScaleType, { id: `yLowValue` }),
                valueProperty(yHighKey, yScaleType, { id: `yHighValue` }),
                ...extraProps,
            ],
        });

        this.dataAggregationFilters = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
    }

    private aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, any>,
        processedData: _ModuleSupport.ProcessedData<any>
    ) {
        if (processedData.type !== 'ungrouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yHighValues = dataModel.resolveColumnById(this, `yHighValue`, processedData);
        const yLowValues = dataModel.resolveColumnById(this, `yLowValue`, processedData);

        const { index } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const domain = processedData.domain.keys[index];

        return memoizedAggregateRangeAreaData(xAxis.scale.type, xValues, yHighValues, yLowValues, domain);
    }

    override xCoordinateRange(xValue: any): [number, number] {
        const x = this.axes[ChartAxisDirection.X]!.scale.convert(xValue);
        return [x, x];
    }

    override yCoordinateRange(yValues: any[]): [number, number] {
        const y = this.axes[ChartAxisDirection.Y]!.scale.convert(yValues[0]);
        return [y, y];
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel } = this;
        if (!(processedData && dataModel)) return [];

        const {
            domain: {
                keys: [keys],
            },
        } = processedData;

        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }
            return fixNumericExtent(extent(keys));
        } else {
            const yExtent = this.domainForClippedRange(ChartAxisDirection.Y, ['yHighValue', 'yLowValue'], 'xValue');
            const fixedYExtent = findMinMax(yExtent);
            return fixNumericExtent(fixedYExtent);
        }
    }

    override getSeriesRange(_direction: _ModuleSupport.ChartAxisDirection, visibleRange: [any, any]): any[] {
        return this.domainForVisibleRange(ChartAxisDirection.Y, ['yHighValue', 'yLowValue'], 'xValue', visibleRange);
    }

    override createNodeData() {
        const { data, dataModel, processedData, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && xAxis && yAxis && dataModel && processedData && this.chart?.seriesRect)) return;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const {
            xKey,
            yLowKey,
            yHighKey,
            connectMissingData,
            interpolation,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
        } = this.properties;
        const marker = this.properties.item[DEFAULT_ITEM].marker;
        const rawData = processedData.dataSources.get(this.id) ?? [];

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const xValues = dataModel.resolveKeysById(this, 'xValue', processedData);
        const yHighValues = dataModel.resolveColumnById(this, 'yHighValue', processedData);
        const yLowValues = dataModel.resolveColumnById(this, 'yLowValue', processedData);

        const xPosition = (index: number) => xScale.convert(xValues[index]) + xOffset;

        const labelData: RangeAreaLabelDatum[] = [];
        const markerData: RangeAreaMarkerDatum[] = [];
        const spanPoints: Array<RangeAreaSpanPointDatum[] | { skip: number }> = [];

        const handleDatumPoint = (datumIndex: number, yHighValue: number, yLowValue: number) => {
            const datum = rawData[datumIndex];
            const xValue = xValues[datumIndex];
            if (xValue == null) return;

            const currentSpanPoints: RangeAreaSpanPointDatum[] | { skip: number } | undefined =
                spanPoints[spanPoints.length - 1];
            if (Number.isFinite(yHighValue) && Number.isFinite(yLowValue)) {
                const appendMarker = (id: 'high' | 'low', yValue: any, y: number) => {
                    markerData.push({
                        index: datumIndex,
                        series: this,
                        itemId: id,
                        datum,
                        datumIndex,
                        midPoint: { x, y },
                        yHighValue,
                        yLowValue,
                        xValue,
                        xKey,
                        yLowKey,
                        yHighKey,
                        point: { x, y, size },
                        enabled: true,
                    });
                    const highLabelDatum: RangeAreaLabelDatum = this.createLabelData({
                        datumIndex,
                        point: { x, y },
                        value: yValue,
                        yLowValue,
                        yHighValue,
                        itemId: id,
                        inverted,
                        datum,
                        series: this,
                    });
                    labelData.push(highLabelDatum);
                };

                const inverted = yLowValue > yHighValue;
                const x = xPosition(datumIndex);
                const yHighCoordinate = yScale.convert(yHighValue);
                const yLowCoordinate = yScale.convert(yLowValue);
                const { size } = marker;

                appendMarker('high', yHighValue, yHighCoordinate);
                appendMarker('low', yLowValue, yLowCoordinate);

                const spanPoint: RangeAreaSpanPointDatum = {
                    high: {
                        point: { x, y: yHighCoordinate },
                        xDatum: xValue,
                        yDatum: yHighValue,
                    },
                    low: {
                        point: { x, y: yLowCoordinate },
                        xDatum: xValue,
                        yDatum: yLowValue,
                    },
                };

                if (Array.isArray(currentSpanPoints)) {
                    currentSpanPoints.push(spanPoint);
                } else if (currentSpanPoints != null) {
                    currentSpanPoints.skip += 1;
                    spanPoints.push([spanPoint]);
                } else {
                    spanPoints.push([spanPoint]);
                }
            } else if (!connectMissingData) {
                if (Array.isArray(currentSpanPoints) || currentSpanPoints == null) {
                    spanPoints.push({ skip: 0 });
                } else {
                    currentSpanPoints.skip += 1;
                }
            }
        };

        const { dataAggregationFilters } = this;
        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);

        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);
        const topIndices = dataAggregationFilter?.topIndices;
        const bottomIndices = dataAggregationFilter?.bottomIndices;

        let [start, end] = this.visibleRangeIndices('xValue', xAxis.range, topIndices);
        start = Math.max(start - 1, 0);
        end = Math.min(end + 1, topIndices?.length ?? xValues.length);
        // @todo(AG-13575) Remove this if block
        if (processedData.input.count < 1e3) {
            start = 0;
            end = processedData.input.count;
        }
        for (let i = start; i < end; i += 1) {
            const topDatumIndex = topIndices?.[i] ?? i;
            const bottomDatumIndex = bottomIndices?.[i] ?? i;
            handleDatumPoint(topDatumIndex, yHighValues[topDatumIndex], yLowValues[bottomDatumIndex]);
        }

        const highSpans = spanPoints.flatMap((p): _ModuleSupport.LinePathSpan[] => {
            if (!Array.isArray(p)) return [];
            const highPoints = p.map((d) => d.high);
            return interpolatePoints(highPoints, interpolation);
        });
        const lowSpans = spanPoints.flatMap((p): _ModuleSupport.LinePathSpan[] => {
            if (!Array.isArray(p)) return [];
            const lowPoints = p.map((d) => d.low);
            return interpolatePoints(lowPoints, interpolation);
        });

        const segments = calculateSegments(
            this.properties.segmentation,
            xAxis,
            yAxis,
            this.chart.seriesRect,
            this.ctx.scene,
            false
        );

        let intersectionSegments: _ModuleSupport.Segment[] | undefined = undefined;
        if (this.properties.invertedStyle.enabled) {
            const startsInverted = yHighValues[0] < yLowValues[0];
            const intersectionXValues = findRangeAreaIntersections(
                highSpans,
                lowSpans,
                xScale.range[0],
                xScale.range[1],
                startsInverted
            );
            intersectionSegments = calculateIntersectionSegments(
                intersectionXValues,
                this.chart.seriesRect,
                this.ctx.scene,
                startsInverted,
                this.properties.invertedStyle
            );
        }

        const context: RangeAreaContext = {
            itemId: `${yLowKey}-${yHighKey}`,
            labelData,
            nodeData: markerData,
            fillData: { itemId: 'high', spans: highSpans, phantomSpans: lowSpans },
            highStrokeData: { itemId: 'high', spans: highSpans },
            lowStrokeData: { itemId: 'low', spans: lowSpans },
            scales: this.calculateScaling(),
            visible: this.visible,
            styles: getMarkerStyles(this, marker, {
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
            }),
            segments,
            intersectionSegments,
        };

        return context;
    }

    private createLabelData({
        datumIndex,
        point,
        value,
        itemId,
        inverted,
        datum,
        series,
    }: {
        datumIndex: number;
        point: Point;
        value: any;
        yLowValue: any;
        yHighValue: any;
        itemId: AgRangeAreaSeriesItemType;
        inverted: boolean;
        datum: any;
        series: RangeAreaSeries;
    }): RangeAreaLabelDatum {
        const { xKey, yLowKey, yHighKey, xName, yName, yLowName, yHighName, label } = this.properties;
        const { placement } = label;
        const spacing = label.spacing + (typeof label.padding === 'number' ? label.padding : 0);

        let actualItemId = itemId;
        if (inverted) {
            actualItemId = itemId === 'low' ? 'high' : 'low';
        }
        const direction =
            (placement === 'outside' && actualItemId === 'high') || (placement === 'inside' && actualItemId === 'low')
                ? -1
                : 1;

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);

        return {
            x: point.x,
            y: point.y + spacing * direction,
            series,
            itemId,
            datum,
            datumIndex,
            text: this.getLabelText<AgRangeAreaSeriesLabelFormatterParams>(
                value,
                datum,
                itemId === 'high' ? yHighKey : yLowKey,
                'y',
                yDomain,
                label,
                { value, datum, itemId, xKey, yLowKey, yHighKey, xName, yLowName, yHighName, yName }
            ),
            textAlign: 'center',
            textBaseline: direction === -1 ? 'bottom' : 'top',
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        const { low, high } = this.properties.item;
        return low.marker.isDirty() || high.marker.isDirty();
    }

    protected override updatePathNodes(opts: {
        paths: _ModuleSupport.SegmentedPath[];
        visible: boolean;
        animationEnabled: boolean;
    }) {
        const { visible } = opts;
        const [fill, stroke] = opts.paths;

        const segments = this.contextNodeData?.segments;

        const highlightDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightState(highlightDatum, false);
        const highlightStyle = this.getHighlightStyle();

        const {
            strokeWidth,
            stroke: strokeColor,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            fill: seriesFill,
            fillOpacity,
            opacity,
        } = mergeDefaults(highlightStyle, this.getStyle(false, highlightState));

        stroke.setProperties({
            segments,
            fill: undefined,
            lineCap: 'round',
            lineJoin: 'round',
            pointerEvents: PointerEvents.None,
            stroke: strokeColor,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            opacity,
            visible,
        });

        stroke.datum = segments;

        const fillBBox = this.getShapeFillBBox();

        applyShapeFillBBox(fill, seriesFill, fillBBox);

        applyShapeStyle(
            fill,
            {
                stroke: undefined,
                fill: seriesFill,
                fillOpacity,
                lineDash,
                lineDashOffset,
                strokeOpacity,
                strokeWidth,
                opacity,
            },
            fillBBox
        );

        const fillSegments = this.contextNodeData?.intersectionSegments ?? segments;
        fill.setProperties({
            segments: fillSegments,
            pointerEvents: PointerEvents.None,
            lineJoin: 'round',
            fillShadow: this.properties.shadow,
            opacity,
            visible,
        });

        fill.datum = fillSegments;

        updateClipPath(this, stroke);
        updateClipPath(this, fill);
    }

    protected override updatePaths(opts: { contextData: RangeAreaContext; paths: _ModuleSupport.Path[] }) {
        this.updateAreaPaths(opts.paths, opts.contextData);
    }

    private updateAreaPaths(paths: _ModuleSupport.Path[], contextData: RangeAreaContext) {
        for (const path of paths) {
            path.visible = contextData.visible;
        }

        if (contextData.visible) {
            this.updateFillPath(paths, contextData);
            this.updateStrokePath(paths, contextData);
        } else {
            for (const path of paths) {
                path.path.clear();
                path.markDirty('RangeArea');
            }
        }
    }

    private updateFillPath(paths: _ModuleSupport.Path[], contextData: RangeAreaContext) {
        const [fill] = paths;
        fill.path.clear();
        plotAreaPathFill(fill, contextData.fillData);
        fill.markDirty('RangeArea');
    }

    private updateStrokePath(paths: _ModuleSupport.Path[], contextData: RangeAreaContext) {
        const [, stroke] = paths;
        stroke.path.clear();
        plotLinePathStroke(stroke, contextData.highStrokeData.spans);
        plotLinePathStroke(stroke, contextData.lowStrokeData.spans);
        stroke.markDirty('RangeArea');
    }

    protected override updateDatumSelection(opts: {
        nodeData: RangeAreaMarkerDatum[];
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RangeAreaMarkerDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const { processedData, axes, properties } = this;

        type LowHighRules = { [K in 'low' | 'high']: { marker: { enabled: boolean } } };
        const { low, high }: LowHighRules = properties.styler ? this.getStyle(false).item : properties.item;

        const markersEnabled = markerEnabled(processedData!.input.count, axes[ChartAxisDirection.X]!.scale, {
            enabled: low.marker.enabled || high.marker.enabled,
        });

        if (properties.item.low.marker.isDirty() || properties.item.high.marker.isDirty()) {
            datumSelection.clear();
            datumSelection.cleanup();
        }
        return datumSelection.update(markersEnabled ? nodeData : []);
    }

    protected override updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
    }) {
        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();
        datumSelection.each((_, datum) => {
            const highlightState = this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex);
            const stylerStyle = this.getStyle(isHighlight, highlightState);
            const { fill, fillOpacity, item } = stylerStyle;
            const { stroke, strokeWidth, strokeOpacity } = item[datum.itemId];
            const { marker } = this.properties.item[datum.itemId];

            const params = this.makeItemStylerParams(datum.itemId);
            datum.style = this.getMarkerStyle(
                marker,
                datum,
                params,
                { isHighlight, highlightState },
                stylerStyle.item[datum.itemId].marker,
                {
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                }
            );
        });
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
    }) {
        const { contextNodeData } = this;
        if (!contextNodeData) {
            return;
        }

        const { datumSelection, isHighlight } = opts;
        const fillBBox = this.getShapeFillBBox();

        const highlightedDatum = this.ctx.highlightManager.getActiveHighlight();

        datumSelection.each((node, datum) => {
            const style =
                datum.style ??
                contextNodeData.styles[this.getHighlightState(highlightedDatum, isHighlight, datum.datumIndex)];
            this.applyMarkerStyle(style, node, datum.point, fillBBox);
        });

        if (!isHighlight) {
            this.properties.item.low.marker.markClean();
            this.properties.item.high.marker.markClean();
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: RangeAreaLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RangeAreaLabelDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, RangeAreaLabelDatum>;
    }) {
        const params: RequireOptional<AgRangeAreaSeriesLabelFormatterParams> = {
            xKey: this.properties.xKey,
            xName: this.properties.xName ?? this.properties.xKey,
            yName: this.properties.yName,
            yLowKey: this.properties.yLowKey,
            yLowName: this.properties.yLowName ?? this.properties.yLowKey,
            yHighKey: this.properties.yHighKey,
            yHighName: this.properties.yHighName ?? this.properties.yHighKey,
        };
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        opts.labelSelection.each((textNode, datum) => {
            textNode.fillOpacity = this.getHighlightStyle(false, datum.datumIndex).opacity ?? 1;
            updateLabelNode(this, textNode, params, this.properties.label, datum, false, activeHighlight);
        });
    }

    protected override getHighlightData(
        nodeData: RangeAreaMarkerDatum[],
        highlightedItem: RangeAreaMarkerDatum
    ): RangeAreaMarkerDatum[] | undefined {
        const highlightItems = nodeData.filter((nodeDatum) => nodeDatum.datum === highlightedItem.datum);
        return highlightItems.length > 0 ? highlightItems : undefined;
    }

    private getStyle(highlighted: boolean, highlightState?: _ModuleSupport.HighlightState): StylerResult {
        const { fill, fillOpacity, item, styler } = this.properties;

        let stylerResult: AgRangeAreaSeriesStyle & ResolvedStyleMixin = {};
        if (styler) {
            const stylerParams = this.makeStylerParams(highlighted, highlightState);
            stylerResult =
                this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.cachedCallWithContext(styler, stylerParams) ?? {},
                    { pick: false }
                ) ?? {};
        }

        const makeItemResult = (lowOrHigh: 'low' | 'high'): StylerResult['item'][typeof lowOrHigh] => {
            const stylerItem = stylerResult.item?.[lowOrHigh];
            const { lineDash, lineDashOffset, marker, stroke, strokeOpacity, strokeWidth } = item[lowOrHigh];
            return {
                marker: {
                    enabled: stylerItem?.marker?.enabled ?? marker.enabled,
                    fill: stylerItem?.marker?.fill ?? marker.fill ?? fill,
                    fillOpacity: stylerItem?.marker?.fillOpacity ?? marker.fillOpacity,
                    shape: stylerItem?.marker?.shape ?? marker.shape,
                    size: stylerItem?.marker?.size ?? marker.size,
                    lineDash: stylerItem?.marker?.lineDash ?? marker.lineDash,
                    lineDashOffset: stylerItem?.marker?.lineDashOffset ?? marker.lineDashOffset,
                    stroke: stylerItem?.marker?.stroke ?? marker.stroke ?? stroke,
                    strokeOpacity: stylerItem?.marker?.strokeOpacity ?? marker.strokeOpacity,
                    strokeWidth: stylerItem?.marker?.strokeWidth ?? marker.strokeWidth,
                },
                lineDash: stylerItem?.lineDash ?? lineDash,
                lineDashOffset: stylerItem?.lineDashOffset ?? lineDashOffset,
                stroke: stylerItem?.stroke ?? stroke,
                strokeOpacity: stylerItem?.strokeOpacity ?? strokeOpacity,
                strokeWidth: stylerItem?.strokeWidth ?? strokeWidth,
            };
        };
        return {
            fill: stylerResult.fill ?? fill,
            fillOpacity: stylerResult.fillOpacity ?? fillOpacity,
            opacity: 1,
            item: {
                low: makeItemResult('low'),
                high: makeItemResult('high'),
            },
        };
    }

    private makeStylerParams(
        highlighted: boolean,
        highlightStateEnum?: _ModuleSupport.HighlightState
    ): AgRangeAreaSeriesStylerParams<unknown, unknown> {
        const { id: seriesId } = this;
        const { fill, fillOpacity, item, xKey, yHighKey, yLowKey } = this.properties;
        const highlightState = toHighlightString(highlightStateEnum ?? HighlightState.None);

        type ParamsRules = DeepRequired<AgRangeAreaSeriesStylerParams<unknown, unknown>, 'fill'>;
        type ResultRules = _ModuleSupport.CallbackParamRules<ParamsRules>;

        const makeItemParam = (lowOrHigh: 'low' | 'high'): ResultRules['item'][typeof lowOrHigh] => {
            const { lineDash, lineDashOffset, marker, stroke, strokeOpacity, strokeWidth } = item[lowOrHigh];
            return {
                marker: {
                    fill: marker.fill ?? fill,
                    fillOpacity: marker.fillOpacity,
                    size: marker.size,
                    shape: marker.shape,
                    stroke: marker.stroke ?? stroke,
                    strokeOpacity: marker.strokeOpacity,
                    strokeWidth: marker.strokeWidth,
                    lineDash: marker.lineDash,
                    lineDashOffset: marker.lineDashOffset,
                },
                lineDash,
                lineDashOffset,
                stroke,
                strokeOpacity,
                strokeWidth,
            };
        };
        return {
            item: {
                low: makeItemParam('low'),
                high: makeItemParam('high'),
            },
            fill,
            fillOpacity,
            highlightState,
            highlighted,
            seriesId,
            xKey,
            yLowKey,
            yHighKey,
        } satisfies ResultRules;
    }

    private makeItemStylerParams(itemId: AgRangeAreaSeriesItemType): AgRangeAreaSeriesItemStylerParams<unknown> {
        const { xKey, yLowKey, yHighKey } = this.properties;
        return { xKey, yLowKey, yHighKey, itemId };
    }

    override getTooltipContent(
        datumIndex: number,
        removeThisDatum: RangeAreaMarkerDatum | undefined
    ): _ModuleSupport.TooltipContent | undefined {
        const itemId: AgRangeAreaSeriesItemType = removeThisDatum?.itemId ?? 'high';

        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xName, yName, yLowKey, yLowName, xKey, yHighKey, yHighName, tooltip, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveKeysById(this, `xValue`, processedData)[datumIndex];
        const yHighValue = dataModel.resolveColumnById(this, `yHighValue`, processedData)[datumIndex];
        const yLowValue = dataModel.resolveColumnById(this, `yLowValue`, processedData)[datumIndex];

        if (xValue == null) return;

        const stylerStyle = this.getStyle(false);
        const params = this.makeItemStylerParams(itemId);
        const format = this.getMarkerStyle(
            this.properties.item[itemId].marker,
            { datumIndex, datum },
            params,
            { isHighlight: false },
            stylerStyle.item[itemId].marker
        ) as RequireOptional<AgSeriesMarkerStyle>;

        const value = `${this.getAxisValueText(yAxis, 'tooltip', yLowValue, datum, yLowKey, legendItemName)} - ${this.getAxisValueText(yAxis, 'tooltip', yHighValue, datum, yHighKey, legendItemName)}`;
        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: this.getAxisValueText(xAxis, 'tooltip', xValue, datum, xKey, legendItemName),
                symbol: this.legendItemSymbol(),
                data: [{ label: yName, fallbackLabel: `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`, value }],
            },
            {
                seriesId,
                datum,
                title: yName,
                itemId,
                xName,
                yName,
                yLowKey,
                yLowName,
                xKey,
                yHighKey,
                yHighName,
                ...format,
            }
        );
    }

    private legendItemSymbol(): _ModuleSupport.LegendSymbolOptions {
        const { fill, item } = this.getStyle(false);
        const { stroke, strokeWidth, strokeOpacity, lineDash, marker } = item[DEFAULT_ITEM];

        const markerStyle = {
            shape: marker.shape,
            fill: marker.fill ?? fill,
            stroke: marker.stroke ?? stroke,
            fillOpacity: marker.fillOpacity,
            strokeOpacity: marker.strokeOpacity,
            strokeWidth: marker.strokeWidth,
            lineDash: marker.lineDash,
            lineDashOffset: marker.lineDashOffset,
        };

        return {
            marker: markerStyle,
            line: {
                stroke,
                strokeOpacity,
                strokeWidth,
                lineDash,
            },
        };
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        if (legendType !== 'category') {
            return [];
        }

        const { id: seriesId, visible } = this;

        const { yLowKey, yHighKey, yName, yLowName, yHighName, showInLegend } = this.properties;
        const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
        const itemId = `${yLowKey}-${yHighKey}`;
        return [
            {
                legendType: 'category',
                id: seriesId,
                itemId,
                seriesId,
                enabled: visible,
                label: { text: `${legendItemText}` },
                symbol: this.legendItemSymbol(),
                hideInLegend: !showInLegend,
            },
        ];
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    override onDataChange() {}

    protected nodeFactory() {
        return new Marker();
    }

    override animateEmptyUpdateReady(
        animationData: _ModuleSupport.CartesianAnimationData<
            _ModuleSupport.Marker,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ) {
        const { datumSelection, labelSelection, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateAreaPaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([datumSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, datumSelection);
        seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
    }

    protected override animateReadyResize(
        animationData: _ModuleSupport.CartesianAnimationData<
            _ModuleSupport.Marker,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ): void {
        const { contextData, paths } = animationData;
        this.updateAreaPaths(paths, contextData);

        super.animateReadyResize(animationData);
    }

    override animateWaitingUpdateReady(
        animationData: _ModuleSupport.CartesianAnimationData<
            _ModuleSupport.Marker,
            RangeAreaMarkerDatum,
            RangeAreaLabelDatum,
            RangeAreaContext
        >
    ) {
        const { animationManager } = this.ctx;
        const { datumSelection, labelSelection, contextData, paths, previousContextData } = animationData;
        const [fill, stroke] = paths;

        // Handling initially hidden series case gracefully.
        if (fill == null && stroke == null) return;

        this.resetDatumAnimation(animationData);
        this.resetLabelAnimation(animationData);

        const update = () => {
            this.resetPathAnimation(animationData);
            this.updateAreaPaths(paths, contextData);
        };
        const skip = () => {
            animationManager.skipCurrentBatch();
            update();
        };

        if (contextData == null || previousContextData == null) {
            // Added series to existing chart case - fade in series.
            update();

            markerFadeInAnimation(this, animationManager, 'added', datumSelection);
            pathFadeInAnimation(this, 'fill_path_properties', animationManager, 'add', fill);
            pathFadeInAnimation(this, 'stroke_path_properties', animationManager, 'add', stroke);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
            return;
        }

        const fns = prepareRangeAreaPathAnimation(
            contextData,
            previousContextData,
            this.processedData?.reduced?.diff?.[this.id]
        );
        if (fns === undefined) {
            // Un-animatable - skip all animations.
            skip();
            return;
        } else if (fns.status === 'no-op') {
            return;
        }

        fromToMotion(this.id, 'fill_path_properties', animationManager, [fill], fns.fill.pathProperties);
        fromToMotion(this.id, 'stroke_path_properties', animationManager, [stroke], fns.stroke.pathProperties);

        if (fns.status === 'added') {
            this.updateAreaPaths(paths, contextData);
        } else if (fns.status === 'removed') {
            this.updateAreaPaths(paths, previousContextData);
        } else {
            pathMotion(this.id, 'fill_path_update', animationManager, [fill], fns.fill.path);
            pathMotion(this.id, 'stroke_path_update', animationManager, [stroke], fns.stroke.path);
        }

        if (fns.hasMotion) {
            markerFadeInAnimation(this, animationManager, undefined, datumSelection);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelection);
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
            onComplete: () => this.updateAreaPaths(paths, contextData),
        });
    }

    public getFormattedMarkerStyle(datum: RangeAreaMarkerDatum) {
        const stylerStyle = this.getStyle(false);
        const params = this.makeItemStylerParams(datum.itemId);

        return this.getMarkerStyle(
            this.properties.item[datum.itemId].marker,
            datum,
            params,
            { isHighlight: true },
            undefined,
            stylerStyle
        );
    }

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        const hiBox = computeMarkerFocusBounds(this, opts);
        const loBox = computeMarkerFocusBounds(this, { ...opts, datumIndex: opts.datumIndex + 1 });
        if (hiBox && loBox) {
            return BBox.merge([hiBox, loBox]);
        }
        return undefined;
    }

    protected override isDatumEnabled(nodeData: RangeAreaMarkerDatum[], datumIndex: number): boolean {
        return datumIndex % 2 === 0 && super.isDatumEnabled(nodeData, datumIndex);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.styler != null ||
            this.properties.marker.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
