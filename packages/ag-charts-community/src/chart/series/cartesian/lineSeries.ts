import { ContinuousScale } from '../../../scale/continuousScale';
import type { Point } from '../../../scene/point';
import type { Selection } from '../../../scene/selection';
import type { SeriesNodeDatum, SeriesNodeDataContext } from '../series';
import { SeriesTooltip, SeriesNodePickMode, valueProperty, keyProperty } from '../series';
import { extent } from '../../../util/array';
import { PointerEvents } from '../../../scene/node';
import type { Path2D } from '../../../scene/path2D';
import type { Text } from '../../../scene/shape/text';
import type { ChartLegendDatum, CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { CartesianAnimationData, CartesianSeriesNodeDatum } from './cartesianSeries';
import {
    CartesianSeries,
    CartesianSeriesMarker,
    CartesianSeriesNodeClickEvent,
    CartesianSeriesNodeDoubleClickEvent,
} from './cartesianSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { getMarker } from '../../marker/util';
import { Label } from '../../label';
import { sanitizeHtml } from '../../../util/sanitize';
import { zipObject } from '../../../util/zip';
import type { Marker } from '../../marker/marker';
import { NUMBER, OPT_FUNCTION, OPT_LINE_DASH, OPT_STRING, OPT_COLOR_STRING, Validate } from '../../../util/validation';
import type {
    AgCartesianSeriesLabelFormatterParams,
    AgCartesianSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    FontStyle,
    FontWeight,
    AgCartesianSeriesMarkerFormat,
} from '../../../options/agChartOptions';
import type { DataModelOptions, UngroupedDataItem } from '../../data/dataModel';
import { createDatumId, diff } from '../../data/processors';
import type { ModuleContext } from '../../../module/moduleContext';
import type { DataController } from '../../data/dataController';
import { getMarkerConfig, updateMarker } from './markerUtil';

interface LineNodeDatum extends CartesianSeriesNodeDatum {
    readonly point: SeriesNodeDatum['point'] & {
        readonly moveTo: boolean;
    };
    readonly label?: {
        readonly text: string;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        readonly fill: string;
    };
}

class LineSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string = undefined;
}

type LineContext = SeriesNodeDataContext<LineNodeDatum>;
type LineAnimationData = CartesianAnimationData<LineContext>;

export class LineSeries extends CartesianSeries<LineContext> {
    static className = 'LineSeries';
    static type = 'line' as const;

    readonly marker = new CartesianSeriesMarker();

    readonly label = new LineSeriesLabel();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = '#874349';

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 2;

    @Validate(NUMBER(0, 1))
    strokeOpacity: number = 1;

    tooltip = new SeriesTooltip<AgCartesianSeriesTooltipRendererParams>();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            hasMarkers: true,
            pickModes: [
                SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
        });

        const { marker, label } = this;

        marker.fill = '#c16068';
        marker.stroke = '#874349';

        label.enabled = false;
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    async processData(dataController: DataController) {
        const { axes, xKey = '', yKey = '' } = this;
        const data = xKey && yKey && this.data ? this.data : [];

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        const isContinuousX = xAxis?.scale instanceof ContinuousScale;
        const isContinuousY = yAxis?.scale instanceof ContinuousScale;

        const props: DataModelOptions<any, false>['props'] = [];

        // If two or more datums share an x-value, i.e. lined up vertically, they will have the same datum id.
        // They must be identified this way when animated to ensure they can be tracked when their y-value
        // is updated. If this is a static chart, we can instead not bother with identifying datums and
        // automatically garbage collect the marker selection.
        if (this.ctx.animationManager.isSkipped()) {
            this.markerSelectionGarbageCollection = true;
        } else {
            props.push(keyProperty(this, xKey, isContinuousX, { id: 'xKey' }));
        }

        props.push(
            valueProperty(this, xKey, isContinuousX, { id: 'xValue' }),
            valueProperty(this, yKey, isContinuousY, { id: 'yValue', invalidValue: undefined })
        );

        if (!this.ctx.animationManager.isSkipped() && this.processedData) {
            props.push(diff(this.processedData));
        }

        const { dataModel, processedData } = await dataController.request<any>(this.id, data ?? [], {
            props,
            dataVisible: this.visible,
        });
        this.dataModel = dataModel;
        this.processedData = processedData;

        if (processedData.reduced?.diff?.added.length > 0 && processedData.reduced?.diff?.removed.length > 0) {
            this.animationTransitionClear();
        } else {
            this.animationState.transition('updateData');
        }
    }

    getDomain(direction: ChartAxisDirection): any[] {
        const { axes, dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const xDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        if (direction === ChartAxisDirection.X) {
            const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);
            if (xDef?.def.type === 'value' && xDef.def.valueType === 'category') {
                return domain;
            }

            return this.fixNumericExtent(extent(domain), xAxis);
        } else {
            const domain = dataModel.getDomain(this, `yValue`, 'value', processedData);
            return this.fixNumericExtent(domain as any, yAxis);
        }
    }

    async createNodeData() {
        const {
            processedData,
            dataModel,
            axes,
            marker: { enabled: markerEnabled, size: markerSize },
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!processedData || !dataModel || !xAxis || !yAxis) {
            return [];
        }

        const { label, yKey = '', xKey = '', id: seriesId } = this;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: LineNodeDatum[] = new Array(processedData.data.length);
        const size = markerEnabled ? markerSize : 0;

        const xIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;

        let moveTo = true;
        let nextPoint: UngroupedDataItem<any, any> | undefined = undefined;
        let actualLength = 0;
        for (let i = 0; i < processedData.data.length; i++) {
            const { datum, values } = nextPoint ?? processedData.data[i];
            const xDatum = values[xIdx];
            const yDatum = values[yIdx];

            if (yDatum === undefined) {
                moveTo = true;
            } else {
                const x = xScale.convert(xDatum) + xOffset;
                if (isNaN(x)) {
                    moveTo = true;
                    nextPoint = undefined;
                    continue;
                }

                nextPoint =
                    processedData.data[i + 1]?.values[yIdx] === undefined ? undefined : processedData.data[i + 1];

                const y = yScale.convert(yDatum) + yOffset;

                let labelText;
                if (label.formatter) {
                    labelText = callbackCache.call(label.formatter, { value: yDatum, seriesId });
                }

                if (labelText !== undefined) {
                    // Label retrieved from formatter successfully.
                } else if (typeof yDatum === 'number' && isFinite(yDatum)) {
                    labelText = yDatum.toFixed(2);
                } else if (yDatum) {
                    labelText = String(yDatum);
                }
                nodeData[actualLength++] = {
                    series: this,
                    datum,
                    yKey,
                    xKey,
                    point: { x, y, moveTo, size },
                    nodeMidPoint: { x, y },
                    yValue: yDatum,
                    xValue: xDatum,
                    label: labelText
                        ? {
                              text: labelText,
                              fontStyle: label.fontStyle,
                              fontWeight: label.fontWeight,
                              fontSize: label.fontSize,
                              fontFamily: label.fontFamily,
                              textAlign: 'center',
                              textBaseline: 'bottom',
                              fill: label.color,
                          }
                        : undefined,
                };
                moveTo = false;
            }
        }
        nodeData.length = actualLength;

        return [{ itemId: yKey, nodeData, labelData: nodeData }];
    }

    protected isPathOrSelectionDirty(): boolean {
        return this.marker.isDirty();
    }

    protected markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    markerSelectionGarbageCollection = false;

    protected async updateMarkerSelection(opts: {
        nodeData: LineNodeDatum[];
        markerSelection: Selection<Marker, LineNodeDatum>;
    }) {
        let { nodeData } = opts;
        const { markerSelection } = opts;
        const { shape, enabled } = this.marker;
        nodeData = shape && enabled ? nodeData : [];

        if (this.marker.isDirty()) {
            markerSelection.clear();
        }

        return markerSelection.update(
            nodeData,
            undefined,
            this.markerSelectionGarbageCollection ? undefined : (datum) => this.getDatumId(datum)
        );
    }

    protected async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, LineNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const {
            id: seriesId,
            xKey = '',
            yKey = '',
            marker,
            stroke,
            strokeWidth,
            strokeOpacity,
            highlightStyle: { item: markerHighlightStyle },
            visible,
            ctx,
        } = this;

        const customMarker = typeof marker.shape === 'function';

        markerSelection.each((node, datum) => {
            const styles = getMarkerConfig({
                datum,
                highlighted,
                formatter: marker.formatter,
                markerStyle: marker,
                seriesStyle: { stroke, strokeWidth, strokeOpacity },
                highlightStyle: markerHighlightStyle,
                seriesId,
                ctx,
                xKey,
                yKey,
                size: datum.point.size,
                strokeWidth,
            });

            const config = { ...styles, point: datum.point, visible, customMarker };
            updateMarker({ node, config });
        });

        if (!highlighted) {
            this.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: LineNodeDatum[];
        labelSelection: Selection<Text, LineNodeDatum>;
    }) {
        let { labelData } = opts;
        const { labelSelection } = opts;
        const { shape, enabled } = this.marker;
        labelData = shape && enabled ? labelData : [];

        return labelSelection.update(labelData);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, LineNodeDatum> }) {
        const { labelSelection } = opts;
        const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.label;

        labelSelection.each((text, datum) => {
            const { point, label } = datum;

            if (datum && label && labelEnabled) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = label.textAlign;
                text.textBaseline = label.textBaseline;
                text.text = label.text;
                text.x = point.x;
                text.y = point.y - 10;
                text.fill = color;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    protected getNodeClickEvent(event: MouseEvent, datum: LineNodeDatum): CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey ?? '', this.yKey ?? '', event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: LineNodeDatum
    ): CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey ?? '', this.yKey ?? '', event, datum, this);
    }

    getTooltipHtml(nodeDatum: LineNodeDatum): string {
        const { xKey, yKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, tooltip, marker, id: seriesId } = this;
        const { datum, xValue, yValue } = nodeDatum;
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(this.title ?? yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const { formatter: markerFormatter, fill: markerFill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
        const strokeWidth = markerStrokeWidth ?? this.strokeWidth;

        let format: AgCartesianSeriesMarkerFormat | undefined = undefined;
        if (markerFormatter) {
            format = markerFormatter({
                datum,
                xKey,
                yKey,
                fill: markerFill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
            });
        }

        const color = format?.fill ?? stroke ?? markerFill;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            xKey,
            xValue,
            xName,
            yKey,
            yValue,
            yName,
            title,
            color,
            seriesId,
        });
    }

    getLegendData(legendType: ChartLegendType): ChartLegendDatum[] {
        const { id, data, xKey, yKey, yName, visible, title, marker, stroke, strokeOpacity } = this;

        if (!(data?.length && xKey && yKey && legendType === 'category')) {
            return [];
        }

        const legendData: CategoryLegendDatum[] = [
            {
                legendType: 'category',
                id: id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: title ?? yName ?? yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke ?? stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: marker.fillOpacity ?? 1,
                    strokeOpacity: marker.strokeOpacity ?? strokeOpacity ?? 1,
                    strokeWidth: marker.strokeWidth ?? 0,
                },
            },
        ];
        return legendData;
    }

    animateEmptyUpdateReady(animationData: LineAnimationData) {
        const { markerSelections, labelSelections, contextData, paths } = animationData;

        contextData.forEach(({ nodeData }, contextDataIndex) => {
            const [lineNode] = paths[contextDataIndex];

            const { path: linePath } = lineNode;

            const nodeLengths: Array<number> = [0];
            const lineLength = nodeData.reduce((sum, datum, index) => {
                if (index === 0) return sum;
                const prev = nodeData[index - 1];
                if (isNaN(datum.point.x) || isNaN(datum.point.y) || isNaN(prev.point.x) || isNaN(prev.point.y)) {
                    nodeLengths.push(sum);
                    return sum;
                }
                const length = Math.sqrt(
                    Math.pow(datum.point.x - prev.point.x, 2) + Math.pow(datum.point.y - prev.point.y, 2)
                );
                nodeLengths.push(sum + length);
                return sum + length;
            }, 0);

            lineNode.fill = undefined;
            lineNode.lineJoin = 'round';
            lineNode.pointerEvents = PointerEvents.None;
            lineNode.opacity = 1;

            lineNode.stroke = this.stroke;
            lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
            lineNode.strokeOpacity = this.strokeOpacity;

            lineNode.lineDash = this.lineDash;
            lineNode.lineDashOffset = this.lineDashOffset;

            const duration = animationData.duration ?? this.ctx.animationManager.defaultDuration;
            const markerDuration = 200;

            this.ctx.animationManager.animate({
                id: `${this.id}_empty-update-ready`,
                from: 0,
                to: lineLength,
                duration,
                onUpdate(length) {
                    linePath.clear({ trackChanges: true });

                    nodeData.forEach((datum, index) => {
                        if (nodeLengths[index] <= length) {
                            // Draw/move the full segment if past the end of this segment
                            if (datum.point.moveTo) {
                                linePath.moveTo(datum.point.x, datum.point.y);
                            } else {
                                linePath.lineTo(datum.point.x, datum.point.y);
                            }
                        } else if (index > 0 && nodeLengths[index - 1] < length) {
                            // Draw/move partial line if in between the start and end of this segment
                            const start = nodeData[index - 1].point;
                            const end = datum.point;

                            const segmentLength = nodeLengths[index] - nodeLengths[index - 1];
                            const remainingLength = nodeLengths[index] - length;
                            const ratio = (segmentLength - remainingLength) / segmentLength;

                            const x = (1 - ratio) * start.x + ratio * end.x;
                            const y = (1 - ratio) * start.y + ratio * end.y;

                            if (datum.point.moveTo) {
                                linePath.moveTo(x, y);
                            } else {
                                linePath.lineTo(x, y);
                            }
                        }
                    });

                    lineNode.checkPathDirty();
                },
            });

            markerSelections[contextDataIndex].each((marker, datum, index) => {
                const delay = lineLength > 0 ? (nodeLengths[index] / lineLength) * duration : 0;
                const format = this.animateMarkerFormatter(datum);
                const size = datum.point?.size ?? 0;
                marker.opacity = 1;

                this.ctx.animationManager.animate({
                    id: `${this.id}_empty-update-ready_${marker.id}`,
                    from: 0,
                    to: format?.size ?? size,
                    delay,
                    duration: markerDuration,
                    onUpdate(size) {
                        marker.size = size;
                    },
                });
            });

            labelSelections[contextDataIndex].each((label, _, index) => {
                const delay = (nodeLengths[index] / lineLength) * duration;
                this.ctx.animationManager.animate({
                    id: `${this.id}_empty-update-ready_${label.id}`,
                    from: 0,
                    to: 1,
                    delay,
                    duration: markerDuration,
                    onUpdate: (opacity) => {
                        label.opacity = opacity;
                    },
                });
            });
        });
    }

    animateReadyUpdate(animationData: LineAnimationData) {
        this.resetMarkersAndPaths(animationData);
    }

    animateReadyResize(animationData: LineAnimationData) {
        this.resetMarkersAndPaths(animationData);
    }

    animateWaitingUpdateReady(animationData: LineAnimationData) {
        const { markerSelections, labelSelections, contextData, paths } = animationData;
        const { processedData, extendLine, findPointOnLine } = this;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            this.resetMarkersAndPaths(animationData);
            return;
        }

        // Treat undefined values as removed data points
        processedData?.data.forEach((datum, index) => {
            if (datum.values.includes(undefined)) {
                diff.removed.push(createDatumId(datum.keys));
                diff.removedIndices.push(index);
            }
        });

        contextData.forEach(({ nodeData }, contextDataIndex) => {
            const [lineNode] = paths[contextDataIndex];
            const { path: linePath } = lineNode;

            const markerNodes: { [keyof: string]: Marker } = {};
            markerSelections[contextDataIndex].each((marker, datum) => {
                markerNodes[this.getDatumId(datum)] = marker;
            });

            labelSelections[contextDataIndex].each((label) => {
                label.opacity = 0;
            });

            // Zip diff arrays into keyed objects for O(1) access
            const addedIds = zipObject(diff.added, true);
            const addedIndices = zipObject(diff.addedIndices, true);
            const removedIds = zipObject(diff.removed, true);
            const removedIndices = zipObject(diff.removedIndices, true);

            // Find the first and last nodes that already existed and were not just added, removed nodes will not
            // appear in `nodeData` so do not need to be filtered out
            let firstExistingIndex = -1;
            let lastExistingIndex = Infinity;

            if (diff.added.length > 0) {
                for (let i = 0; i < nodeData.length; i++) {
                    if (!addedIds[this.getDatumId(nodeData[i])]) {
                        firstExistingIndex = i;
                        break;
                    }
                }

                for (let i = nodeData.length - 1; i >= 0; i--) {
                    if (!addedIds[this.getDatumId(nodeData[i])]) {
                        lastExistingIndex = i;
                        break;
                    }
                }
            }

            // Find the points on the path before the changes, which points were removed and create a map of the new to
            // old indices of points that continue to exist
            const pathPoints = linePath.getPoints();
            const removedPoints: Array<{ x: number; y: number }> = [];
            const existingPointsPathMap: Map<number, number> = new Map();

            let j = 0;
            for (let i = 0; i < pathPoints.length; i++) {
                const point = pathPoints[i];
                if (removedIndices[`${i}`]) {
                    removedPoints.push(point);
                } else if (!addedIndices[`${j}`]) {
                    existingPointsPathMap.set(j++, i);
                }
            }

            j = 0;
            for (let i = 0; i < nodeData.length; i++) {
                if (!removedIndices[`${j}`] && !addedIndices[`${i}`]) {
                    existingPointsPathMap.set(i, j++);
                }
            }

            const removedMarkers: Array<Marker> = [];
            markerSelections[contextDataIndex].each((marker) => {
                if (removedIds[this.getDatumId(marker.datum)]) {
                    removedMarkers.push(marker);
                }
            });

            // Bucket the removed nodes into before and after existing nodes
            const removedBefore: Point[] = [];
            const removedAfter: Point[] = [];
            const removedBeforeMarkers: Marker[] = [];
            const removedAfterMarkers: Marker[] = [];

            const firstPathPointIndex = existingPointsPathMap.get(0);
            const firstPathPoint = firstPathPointIndex != null ? pathPoints[firstPathPointIndex] : undefined;

            const lastPathPointIndex = existingPointsPathMap.get(existingPointsPathMap.size - 1);
            const lastPathPoint = lastPathPointIndex != null ? pathPoints[lastPathPointIndex] : undefined;

            for (let i = 0; i < removedPoints.length; i++) {
                const removed = removedPoints[i];
                const removedMarker = removedMarkers[i];

                if (firstPathPoint && removed.x < firstPathPoint.x) {
                    removedBefore.push(removed);
                    removedBeforeMarkers.push(removedMarker);
                }

                if (lastPathPoint && removed.x > lastPathPoint.x) {
                    removedAfter.push(removed);
                    removedAfterMarkers.push(removedMarker);
                }
            }

            const duration = this.ctx.animationManager.defaultDuration;
            const markerFormats: Record<string, AgCartesianSeriesMarkerFormat | undefined> = {};

            // Animate all nodes using a single animation to ensure the line is drawn correctly from node to node
            this.ctx.animationManager.animate({
                id: `${this.id}_waiting-update-ready_${contextDataIndex}`,
                from: 0,
                to: 1,
                duration,
                onUpdate: (ratio) => {
                    linePath.clear({ trackChanges: true });

                    // Animate out nodes that were removed before the first node
                    const first = nodeData[0];
                    const firstDatumId = this.getDatumId(first);
                    for (let i = 0; i < removedBefore.length; i++) {
                        const removed = removedBefore[i];
                        const { x, y } = findPointOnLine(removed, first.point, ratio);
                        linePath.lineTo(x, y);
                    }

                    markerFormats[firstDatumId] ??= this.animateMarkerFormatter(markerNodes[firstDatumId].datum);
                    const firstMarkerSize = markerFormats[firstDatumId]?.size ?? first.point.size ?? 0;

                    for (const removed of removedBeforeMarkers) {
                        removed.setProperties({
                            x: ratio * (first.point.x - removed.translationX),
                            y: ratio * (first.point.y - removed.translationY),
                            size: (1 - ratio) * firstMarkerSize,
                        });
                    }

                    for (let index = 0; index < nodeData.length; index++) {
                        const datum = nodeData[index];
                        const { point } = datum;
                        const datumId = this.getDatumId(datum);
                        const prevPoint = index > 0 ? nodeData[index - 1].point : undefined;

                        const existingIndex = existingPointsPathMap.get(index);
                        const prevExistingIndex = existingPointsPathMap.get(index - 1);

                        const pathPoint = existingIndex != null ? pathPoints[existingIndex] : undefined;
                        const prevPathPoint = prevExistingIndex != null ? pathPoints[prevExistingIndex] : undefined;

                        const marker = markerNodes[datumId];
                        let markerX = point.x;
                        let markerY = point.y;

                        markerFormats[datumId] ??= this.animateMarkerFormatter(marker.datum);
                        let markerSize = markerFormats[datumId]?.size ?? datum.point?.size ?? 0;

                        // Find nodes that were removed between this point and the previous point
                        const removedBetween = [];
                        const removedBetweenMarkers = [];

                        for (let i = 0; i < removedPoints.length; i++) {
                            const removed = removedPoints[i];
                            const removedMarker = removedMarkers[i];

                            if (prevPathPoint && pathPoint && removed.x > prevPathPoint.x && removed.x < pathPoint.x) {
                                removedBetween.push(removed);
                                removedBetweenMarkers.push(removedMarker);
                            }
                        }

                        // Animate out nodes that were removed between two other nodes
                        if (prevPoint) {
                            for (let i = 0; i < removedBetween.length; i++) {
                                const removed = removedBetween[i];

                                // Flatten the line such that each 'between' point moves to an equal fraction along the
                                // final straight line between the previous and next points
                                const fraction = (i + 1) / (removedBetween.length + 1);
                                const { x, y } = findPointOnLine(
                                    removed,
                                    findPointOnLine(prevPoint, point, fraction),
                                    ratio
                                );

                                linePath.lineTo(x, y);
                            }

                            for (let i = 0; i < removedBetweenMarkers.length; i++) {
                                const removed = removedBetweenMarkers[i];

                                const fraction = (i + 1) / (removedBetweenMarkers.length + 1);

                                let { x, y } = findPointOnLine(prevPoint, point, fraction);

                                x -= removed.translationX;
                                y -= removed.translationY;

                                x *= ratio;
                                y *= ratio;

                                removed.size = (1 - ratio) * markerSize;
                                removed.x = x;
                                removed.y = y;
                            }
                        }

                        if (addedIds[datumId] && index > lastExistingIndex) {
                            // Animate in nodes that were added after the last existing node
                            const startPoint = nodeData[lastExistingIndex].point;
                            const startExistingIndex = existingPointsPathMap.get(lastExistingIndex);
                            const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;

                            const { x, y } = findPointOnLine(start, point, ratio);
                            markerX = x;
                            markerY = y;
                            markerSize *= ratio;

                            extendLine(linePath, { x, y, moveTo: point.moveTo });
                        } else if (addedIds[datumId] && index < firstExistingIndex) {
                            // Animate in nodes that were added before the first existing node
                            const startPoint = nodeData[firstExistingIndex].point;
                            const startExistingIndex = existingPointsPathMap.get(firstExistingIndex);
                            const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;

                            const { x, y } = findPointOnLine(start, point, ratio);
                            markerX = x;
                            markerY = y;
                            markerSize *= ratio;

                            extendLine(linePath, { x, y, moveTo: point.moveTo });
                        } else if (addedIds[datumId]) {
                            // Animate in nodes that were added between other nodes

                            // Find the line between the nodes that existed either side of this group of added nodes
                            let startPoint = point;
                            let endPoint = point;
                            let startIndex = index;
                            let endIndex = index;
                            let addedBetweenCount = 1;

                            for (let i = index - 1; i > 0; i--) {
                                if (!addedIds[this.getDatumId(nodeData[i])]) {
                                    startPoint = nodeData[i].point;
                                    startIndex = i;
                                    break;
                                }

                                addedBetweenCount++;
                            }

                            for (let i = index + 1; i < nodeData.length; i++) {
                                if (!addedIds[this.getDatumId(nodeData[i])]) {
                                    endPoint = nodeData[i].point;
                                    endIndex = i;
                                    break;
                                }

                                addedBetweenCount++;
                            }

                            const startExistingIndex = existingPointsPathMap.get(startIndex);
                            const endExistingIndex = existingPointsPathMap.get(endIndex);
                            const start = startExistingIndex != null ? pathPoints[startExistingIndex] : startPoint;
                            const end = endExistingIndex != null ? pathPoints[endExistingIndex] : endPoint;

                            const fraction = (index - startIndex) / (addedBetweenCount + 1);

                            const { x, y } = findPointOnLine(findPointOnLine(start, end, fraction), point, ratio);
                            markerX = x;
                            markerY = y;
                            markerSize *= ratio;

                            linePath.lineTo(x, y);
                        } else if (pathPoint) {
                            // Translate nodes that existed at other coordinates

                            const x = (markerX = (1 - ratio) * pathPoint.x + ratio * point.x);
                            const y = (markerY = (1 - ratio) * pathPoint.y + ratio * point.y);

                            const hasRemovedAllPointsBefore = index === 0 && removedBefore.length > 0;

                            if (point.moveTo && !hasRemovedAllPointsBefore) {
                                linePath.moveTo(x, y);
                            } else {
                                linePath.lineTo(x, y);
                            }
                        } else {
                            // Catch any other nodes and immediately place them at their final position
                            extendLine(linePath, point);
                        }

                        marker.translationX = markerX;
                        marker.translationY = markerY;
                        marker.size = markerSize;
                    }

                    // Animate out nodes that were removed after the last node
                    const last = nodeData[nodeData.length - 1];
                    const lastDatumId = this.getDatumId(last);
                    for (let i = 0; i < removedAfter.length; i++) {
                        const removed = removedAfter[i];
                        const { x, y } = findPointOnLine(removed, last.point, ratio);
                        linePath.lineTo(x, y);
                    }

                    markerFormats[lastDatumId] ??= this.animateMarkerFormatter(markerNodes[lastDatumId].datum);
                    const lastMarkerSize = markerFormats[lastDatumId]?.size ?? last.point.size ?? 0;

                    for (let i = 0; i < removedAfterMarkers.length; i++) {
                        const removed = removedAfterMarkers[i];

                        const x = ratio * (last.point.x - removed.translationX);
                        const y = ratio * (last.point.y - removed.translationY);

                        removed.size = (1 - ratio) * lastMarkerSize;
                        removed.x = x;
                        removed.y = y;
                    }

                    lineNode.checkPathDirty();
                },
                onComplete: () => {
                    this.resetMarkersAndPaths(animationData);
                },
                onStop: () => {
                    this.resetMarkersAndPaths(animationData);
                },
            });

            this.ctx.animationManager.animate({
                id: `${this.id}_waiting-update-ready_labels_${contextDataIndex}`,
                from: 0,
                to: 1,
                delay: duration,
                duration: 200,
                onUpdate: (opacity) => {
                    labelSelections[contextDataIndex].each((label) => {
                        label.opacity = opacity;
                    });
                },
            });
        });
    }

    protected animateClearingUpdateEmpty(animationData: LineAnimationData) {
        const { markerSelections, labelSelections, contextData, paths } = animationData;

        const updateDuration = this.ctx.animationManager.defaultDuration / 2;
        const clearDuration = 200;

        contextData.forEach((_, contextDataIndex) => {
            const [lineNode] = paths[contextDataIndex];
            const { path: linePath } = lineNode;
            const pathPoints = linePath.getPoints();

            labelSelections.forEach((labelSelection) => {
                labelSelection.each((label) => {
                    label.opacity = 0;
                });
            });

            this.ctx.animationManager.animate({
                id: `${this.id}_animate-clearing-update-empty_${contextDataIndex}`,
                from: 1,
                to: 0,
                duration: clearDuration,
                onUpdate(opacity) {
                    lineNode.opacity = opacity;
                    markerSelections.forEach((markerSelection) => {
                        markerSelection.each((marker, _, index) => {
                            marker.opacity = opacity;
                            marker.translationX = pathPoints[index]?.x;
                            marker.translationY = pathPoints[index]?.y;
                        });
                    });
                },
                onComplete: () => {
                    this.resetMarkersAndPaths(animationData);
                    this.animationState.transition('update', { ...animationData, duration: updateDuration });
                },
            });
        });
    }

    resetMarkersAndPaths({ markerSelections, contextData, paths }: LineAnimationData) {
        contextData.forEach(({ nodeData }, contextDataIndex) => {
            const [lineNode] = paths[contextDataIndex];

            const { path: linePath } = lineNode;

            lineNode.stroke = this.stroke;
            lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
            lineNode.strokeOpacity = this.strokeOpacity;

            lineNode.lineDash = this.lineDash;
            lineNode.lineDashOffset = this.lineDashOffset;

            linePath.clear({ trackChanges: true });

            nodeData.forEach((datum) => {
                if (datum.point.moveTo) {
                    linePath.moveTo(datum.point.x, datum.point.y);
                } else {
                    linePath.lineTo(datum.point.x, datum.point.y);
                }
            });

            lineNode.checkPathDirty();
        });

        markerSelections.forEach((markerSelection) => {
            markerSelection.cleanup().each((marker, datum) => {
                const format = this.animateMarkerFormatter(datum);
                const size = datum.point?.size ?? 0;
                marker.size = format?.size ?? size;
                marker.translationX = datum.point.x;
                marker.translationY = datum.point.y;
            });
        });
    }

    private animateMarkerFormatter(datum: LineNodeDatum) {
        const {
            marker,
            xKey = '',
            yKey = '',
            stroke: lineStroke,
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { size, formatter } = marker;

        const fill = marker.fill;
        const stroke = marker.stroke ?? lineStroke;
        const strokeWidth = marker.strokeWidth ?? this.strokeWidth;

        let format: AgCartesianSeriesMarkerFormat | undefined = undefined;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum: datum.datum,
                xKey,
                yKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
            });
        }

        return format;
    }

    private extendLine(linePath: Path2D, point: { x: number; y: number; moveTo: boolean }) {
        if (point.moveTo) {
            linePath.moveTo(point.x, point.y);
        } else {
            linePath.lineTo(point.x, point.y);
        }
    }

    private findPointOnLine(a: { x: number; y: number }, b: { x: number; y: number }, distance: number) {
        // Find a point a distance along the line from `a` and `b`
        const x = a.x + distance * (b.x - a.x);
        const y = a.y + distance * (b.y - a.y);
        return { x, y };
    }

    private getDatumId(datum: LineNodeDatum) {
        if (this.ctx.animationManager.isSkipped()) return '';
        return createDatumId([`${datum.xValue}`]);
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    getBandScalePadding() {
        return { inner: 1, outer: 0.1 };
    }
}
