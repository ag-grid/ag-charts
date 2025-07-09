import type { RequireOptional } from 'ag-charts-core';
import { isDefined } from 'ag-charts-core';
import {
    type AgErrorBoundSeriesTooltipRendererParams,
    type AgLineSeriesLabelFormatterParams,
    type AgLineSeriesOptions,
    type AgSeriesMarkerStyle,
} from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { pathMotion } from '../../../motion/pathMotion';
import { resetMotion } from '../../../motion/resetMotion';
import type { BBox } from '../../../scene/bbox';
import type { ExtendedPath2D } from '../../../scene/extendedPath2D';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/extent';
import { mergeDefaults } from '../../../util/object';
import { ChartAxisDirection } from '../../chartAxisDirection';
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
import type { Marker } from '../../marker/marker';
import { type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, SeriesNodePickMode } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { getShapeStyle } from '../shapeUtil';
import { datumStylerProperties } from '../util';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { type LineSeriesDataAggregationFilter, aggregateLineData } from './lineAggregation';
import { LineSeriesProperties } from './lineSeriesProperties';
import {
    type LineNodeDatum,
    type LinePathSpan,
    type LineSeriesNodeDataContext,
    type LineSpanPointDatum,
    interpolatePoints,
    plotLinePathStroke,
    prepareLinePathAnimation,
} from './lineUtil';
import {
    computeMarkerFocusBounds,
    markerFadeInAnimation,
    markerSwipeScaleInAnimation,
    resetMarkerFn,
    resetMarkerPositionFn,
} from './markerUtil';
import { buildResetPathFn, pathFadeInAnimation, pathSwipeInAnimation, updateClipPath } from './pathUtil';

const CROSS_FILTER_LINE_STROKE_OPACITY_FACTOR = 0.25;

type LineAnimationData = CartesianAnimationData<Group, LineNodeDatum, LineNodeDatum, LineSeriesNodeDataContext>;

type SpanPoints = Array<LineSpanPointDatum[] | { skip: number }>;

export class LineSeries extends CartesianSeries<
    Group,
    AgLineSeriesOptions,
    LineSeriesProperties,
    LineNodeDatum,
    LineNodeDatum,
    LineSeriesNodeDataContext
> {
    static readonly className = 'LineSeries';
    static readonly type = 'line' as const;

    override properties = new LineSeriesProperties();

    private dataAggregationFilters: LineSeriesDataAggregationFilter[] | undefined = undefined;

    override get pickModeAxis() {
        return this.properties.sparklineMode ? 'main' : 'main-category';
    }

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            propertyKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            propertyNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            categoryKey: 'xValue',
            hasMarkers: true,
            pickModes: [
                SeriesNodePickMode.AXIS_ALIGNED,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                path: buildResetPathFn({ getVisible: () => this.visible, getOpacity: () => this.getOpacity() }),
                label: resetLabelFn,
                marker: (node, datum) => ({ ...resetMarkerFn(node), ...resetMarkerPositionFn(node, datum) }),
            },
            clipFocusBox: false,
        });
    }

    override async processData(dataController: DataController) {
        if (this.data == null) return;

        const { data, visible, seriesGrouping: { groupIndex = this.id, stackCount = 0 } = {} } = this;
        const { xKey, yKey, yFilterKey, connectMissingData, normalizedTo } = this.properties;
        const animationEnabled = !this.ctx.animationManager.isSkipped();

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
            const ids = [
                `line-stack-${groupIndex}-yValues`,
                `line-stack-${groupIndex}-yValues-trailing`,
                `line-stack-${groupIndex}-yValues-marker`,
            ];

            props.push(
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window',
                    'current',
                    { id: `yValueEnd`, ...common, groupId: ids[0] },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'window-trailing',
                    'current',
                    { id: `yValueStart`, ...common, groupId: ids[1] },
                    yScaleType
                ),
                ...groupAccumulativeValueProperty(
                    yKey,
                    'normal',
                    'current',
                    { id: `yValueCumulative`, ...common, groupId: ids[2] },
                    yScaleType
                )
            );

            if (isDefined(normalizedTo)) {
                props.push(normaliseGroupTo([ids[0], ids[1], ids[2]], normalizedTo));
            }
        }

        if (animationEnabled) {
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

        this.dataAggregationFilters = this.aggregateData(dataModel, processedData);

        this.animationState.transition('updateData');
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

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return [];

        if (direction === ChartAxisDirection.X) {
            const xDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
            const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
                return domain;
            }

            return fixNumericExtent(extent(domain));
        }

        const yKey = this.dataModel?.hasColumnById(this, `yValueEnd`) ? 'yValueEnd' : 'yValueRaw';
        const yExtent = this.domainForClippedRange(ChartAxisDirection.Y, [yKey], 'xValue');
        return fixNumericExtent(yExtent);
    }

    override getSeriesRange(_direction: ChartAxisDirection, visibleRange: [any, any]): number[] {
        const yKey = this.dataModel?.hasColumnById(this, `yValueEnd`) ? 'yValueEnd' : 'yValueRaw';
        return this.domainForVisibleRange(ChartAxisDirection.Y, [yKey], 'xValue', visibleRange);
    }

    override getVisibleItems(
        xVisibleRange: [number, number],
        yVisibleRange: [number, number] | undefined,
        minVisibleItems: number
    ): number {
        const yKey = this.dataModel?.hasColumnById(this, `yValueEnd`) ? 'yValueEnd' : 'yValueRaw';
        return this.countVisibleItems('xValue', [yKey], xVisibleRange, yVisibleRange, minVisibleItems);
    }

    private aggregateData(dataModel: DataModel<any, any>, processedData: ProcessedData<any>) {
        if (processedData.type === 'grouped') return;
        if (processedDataIsAnimatable(processedData)) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null) return;

        const { scale } = xAxis;
        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);

        return aggregateLineData(scale, xValues, yValues, domain);
    }

    override createNodeData() {
        const { dataModel, processedData, axes, dataAggregationFilters } = this;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const {
            xKey,
            yKey,
            yFilterKey,
            xName,
            yName,
            marker,
            label,
            connectMissingData,
            interpolation,
            legendItemName,
        } = this.properties;
        const stacked = this.dataModel?.hasColumnById(this, `yValueEnd`);
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const size = marker.enabled ? marker.size : 0;

        const rawData = processedData.dataSources.get(this.id) ?? [];
        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const yEndValues = stacked ? dataModel.resolveColumnById<number>(this, `yValueEnd`, processedData) : undefined;
        const yCumulativeValues = stacked
            ? dataModel.resolveColumnById<number>(this, `yValueCumulative`, processedData)
            : yValues;
        const selectionValues =
            yFilterKey != null ? dataModel.resolveColumnById(this, `yFilterRaw`, processedData) : undefined;

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);

        const capDefaults = {
            lengthRatioMultiplier: this.properties.marker.getDiameter(),
            lengthMax: Infinity,
        };

        const nodeData: LineNodeDatum[] = [];
        let spanPoints: SpanPoints | undefined;
        const handleDatum = (datumIndex: number) => {
            const datum = rawData[datumIndex];
            const xDatum = xValues[datumIndex];
            const yDatum = yValues[datumIndex];
            const yEndDatum = yEndValues?.[datumIndex];
            const selected = selectionValues?.[datumIndex];

            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yCumulativeValues[datumIndex]) + yOffset;

            if (!Number.isFinite(x)) return;

            if (yDatum != null) {
                const labelText = label.enabled
                    ? this.getLabelText<AgLineSeriesLabelFormatterParams>(yDatum, datum, yKey, 'y', yDomain, label, {
                          value: yDatum,
                          datum,
                          xKey,
                          yKey,
                          xName,
                          yName,
                          legendItemName,
                      })
                    : undefined;

                nodeData.push({
                    series: this,
                    datum,
                    datumIndex,
                    yKey,
                    xKey,
                    point: { x, y, size },
                    midPoint: { x, y },
                    cumulativeValue: yEndDatum,
                    yValue: yDatum,
                    xValue: xDatum,
                    capDefaults,
                    labelText,
                    selected,
                });
            }

            if (spanPoints == null) return;

            const currentSpanPoints: LineSpanPointDatum[] | { skip: number } | undefined =
                spanPoints[spanPoints.length - 1];
            if (yDatum != null) {
                const spanPoint: LineSpanPointDatum = {
                    point: { x, y },
                    xDatum,
                    yDatum,
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

        const [r0, r1] = xScale.range;
        const range = Math.abs(r1 - r0);
        const dataAggregationFilter = dataAggregationFilters?.find((f) => f.maxRange > range);

        const indices = dataAggregationFilter?.indices;
        let [start, end] = this.visibleRangeIndices('xValue', xAxis.range, indices);
        start = Math.max(start - 1, 0);
        end = Math.min(end + 1, indices?.length ?? xValues.length);
        // @todo(AG-13575) Remove this if block
        if (processedData.input.count < 1e3) {
            start = 0;
            end = processedData.input.count;
        }
        if (indices == null) {
            spanPoints = [];
        }
        for (let i = start; i < end; i += 1) {
            handleDatum(indices?.[i] ?? i);
        }

        const strokeSpans = spanPoints?.flatMap((p): LinePathSpan[] => {
            return Array.isArray(p) ? interpolatePoints(p, interpolation) : [];
        });
        const strokeData = strokeSpans != null ? { itemId: yKey, spans: strokeSpans } : undefined;

        const crossFiltering =
            selectionValues?.some((selectionValue, index) => selectionValue === yValues[index]) ?? false;

        return {
            itemId: yKey,
            nodeData,
            labelData: nodeData,
            strokeData,
            scales: this.calculateScaling(),
            visible: this.visible,
            crossFiltering,
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    protected override updatePathNodes(opts: { paths: Path[]; visible: boolean; animationEnabled: boolean }) {
        const {
            paths: [lineNode],
            visible,
            animationEnabled,
        } = opts;
        const crossFiltering = this.contextNodeData?.crossFiltering === true;

        const { strokeWidth, stroke, strokeOpacity, lineDash, lineDashOffset, opacity } = mergeDefaults(
            this.getHighlightStyle(),
            this.properties
        );

        lineNode.setProperties({
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

        if (!animationEnabled) {
            lineNode.visible = visible;
        }

        updateClipPath(this, lineNode);
    }

    private getMarkerItemBaseStyle(highlighted: boolean): RequireOptional<AgSeriesMarkerStyle> {
        const { properties } = this;

        const { marker } = properties;
        const highlightStyle = this.getHighlightStyle(highlighted);
        return getShapeStyle(
            {
                size: marker.size,
                shape: marker.shape,
                fill: highlightStyle?.fill ?? marker.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? marker.fillOpacity,
                stroke: highlightStyle?.stroke ?? marker.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? marker.strokeWidth,
                strokeOpacity: highlightStyle?.strokeOpacity ?? marker.strokeOpacity,
                lineDash: highlightStyle?.lineDash ?? marker.lineDash,
                lineDashOffset: highlightStyle?.lineDashOffset ?? marker.lineDashOffset,
                opacity: highlightStyle?.opacity ?? 1,
            },
            marker.fillGradientDefaults,
            marker.fillPatternDefaults,
            marker.fillImageDefaults
        );
    }

    private getMarkerItemStyleOverrides(
        datumId: string,
        datum: any,
        xValue: any,
        yValue: any,
        format: RequireOptional<AgSeriesMarkerStyle>,
        highlighted: boolean
    ) {
        const { id: seriesId, properties } = this;

        const { xKey, yKey, marker } = properties;
        const { itemStyler } = marker;

        if (itemStyler == null) return;

        return this.cachedDatumCallback(createDatumId(datumId, highlighted ? 'highlight' : 'node'), () => {
            const xDomain = this.getSeriesDomain(ChartAxisDirection.X);
            const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
            return this.callWithContext(itemStyler, {
                seriesId,
                ...datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
                datum,
                highlighted,
                ...format,
            });
        });
    }

    protected override updateMarkerSelection(opts: {
        nodeData: LineNodeDatum[];
        markerSelection: Selection<Marker, LineNodeDatum>;
        markerGroup?: Group;
    }) {
        let { nodeData } = opts;
        const { markerSelection } = opts;
        const markersEnabled = this.properties.marker.enabled || this.contextNodeData?.crossFiltering === true;
        nodeData = markersEnabled ? nodeData : [];

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(nodeData, undefined, (datum) => createDatumId(datum.xValue));
    }

    protected override updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, LineNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight } = opts;
        const { xKey, yKey, stroke, strokeWidth, strokeOpacity, marker } = this.properties;
        const xDomain = this.getSeriesDomain(ChartAxisDirection.X);
        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);

        const applyTranslation = this.ctx.animationManager.isSkipped();
        const fillBBox = this.getShapeFillBBox();
        const markerStyle = marker.getStyle();

        markerSelection.each((node, datum) => {
            const { xValue, yValue } = datum;
            const highlightStyle = this.getHighlightStyle(isHighlight, datum.datumIndex);
            const baseStyle = mergeDefaults(highlightStyle, markerStyle, {
                stroke,
                strokeWidth,
                strokeOpacity,
            });

            this.updateMarkerStyle(
                marker,
                node,
                datum.datum,
                datum.point,
                datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
                isHighlight,
                baseStyle,
                fillBBox,
                { applyTranslation, selected: datum.selected }
            );
        });

        if (!isHighlight) {
            marker.markClean();
        }
    }

    protected override updateLabelSelection(opts: {
        labelData: LineNodeDatum[];
        labelSelection: Selection<Text, LineNodeDatum>;
    }) {
        return opts.labelSelection.update(this.isLabelEnabled() ? opts.labelData : []);
    }

    protected updateLabelNodes(opts: { labelSelection: Selection<Text, LineNodeDatum> }) {
        opts.labelSelection.each((text, datum) => {
            const style = getLabelStyles(this, datum, this.properties, this.properties.label);
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
                text.fillOpacity = this.getHighlightStyle(false, datum.datumIndex).opacity ?? 1;
                text.setBoxing(style);
            } else {
                text.visible = false;
            }
        });
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        const { id: seriesId, dataModel, processedData, axes, properties } = this;
        const { xKey, xName, yKey, yName, tooltip, legendItemName } = properties;
        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!dataModel || !processedData || !xAxis || !yAxis) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const xValue = dataModel.resolveColumnById(this, `xValue`, processedData)[datumIndex];
        const yValue = dataModel.resolveColumnById(this, `yValueRaw`, processedData)[datumIndex];

        if (xValue == null) return;

        const format = this.getMarkerItemBaseStyle(false);
        Object.assign(
            format,
            this.getMarkerItemStyleOverrides(String(datumIndex), datum, xValue, yValue, format, false)
        );

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
        const color0 = 'rgba(0, 0, 0, 0)';
        const { stroke, strokeOpacity, strokeWidth, lineDash, marker } = this.properties;

        const markerStyle = this.getMarkerStyle(marker, undefined, undefined, false, undefined, {
            fill: marker.fill ?? color0,
            stroke: marker.stroke ?? stroke ?? color0,
        });

        return {
            marker: {
                ...markerStyle,
                enabled: marker.enabled,
            },
            line: {
                stroke: stroke ?? color0,
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
                legendType: 'category',
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

    private plotNodeDataPoints(path: ExtendedPath2D, nodeData: LineNodeDatum[]) {
        if (nodeData.length === 0) return;

        const initialPoint = nodeData[0].point;
        path.moveTo(initialPoint.x, initialPoint.y);

        for (let i = 1; i < nodeData.length; i += 1) {
            const { x, y } = nodeData[i].point;
            path.lineTo(x, y);
        }
    }

    private updateLinePaths(paths: Path[], contextData: LineSeriesNodeDataContext) {
        const spans = contextData.strokeData?.spans;
        const [lineNode] = paths;

        lineNode.path.clear();
        if (spans != null) {
            plotLinePathStroke(lineNode, spans);
        } else {
            this.plotNodeDataPoints(lineNode.path, contextData.nodeData);
        }

        lineNode.markDirty('LineSeries');
    }

    protected override animateEmptyUpdateReady(animationData: LineAnimationData) {
        const { markerSelection, labelSelection, annotationSelections, contextData, paths } = animationData;
        const { animationManager } = this.ctx;

        this.updateLinePaths(paths, contextData);
        pathSwipeInAnimation(this, animationManager, ...paths);
        resetMotion([markerSelection], resetMarkerPositionFn);
        markerSwipeScaleInAnimation(this, animationManager, markerSelection);
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
            markerSelection: markerSelections,
            labelSelection: labelSelections,
            annotationSelections,
            contextData,
            paths,
            previousContextData,
        } = animationData;
        const [path] = paths;

        if (contextData.visible === false && previousContextData?.visible === false) return;

        this.resetMarkerAnimation(animationData);
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

            markerFadeInAnimation(this, animationManager, 'added', markerSelections);
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
            markerFadeInAnimation(this, animationManager, undefined, markerSelections);
            seriesLabelFadeInAnimation(this, 'labels', animationManager, labelSelections);
            seriesLabelFadeInAnimation(this, 'annotations', animationManager, ...annotationSelections);
        }
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }

    protected nodeFactory() {
        return new Group();
    }

    public getFormattedMarkerStyle(datum: LineNodeDatum) {
        const { xKey, yKey } = this.properties;
        const { xValue, yValue } = datum;
        const xDomain = this.getSeriesDomain(ChartAxisDirection.X);
        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y);
        return this.getMarkerStyle(
            this.properties.marker,
            datum.datum,
            datumStylerProperties(xValue, yValue, xKey, yKey, xDomain, yDomain),
            true
        );
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
