import type {
    AgPieSeriesFormatterParams,
    AgPieSeriesTooltipRendererParams,
    AgPieSeriesFormat,
    AgTooltipRendererResult,
    AgRadarSeriesLabelFormatterParams,
    AgRadarSeriesMarkerFormat,
    AgRadarSeriesMarkerFormatterParams,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const {
    ChartAxisDirection,
    HighlightStyle,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_STRING,
    PolarAxis,
    STRING,
    SeriesNodePickMode,
    Validate,
    valueProperty,
} = _ModuleSupport;

const { BBox, Group, Path, PointerEvents, Selection, Text, getMarker } = _Scene;
const { extent, isNumberEqual, sanitizeHtml, toFixed } = _Util;

export interface RadarLinePoint {
    x: number;
    y: number;
    moveTo: boolean;
}

class RadarSeriesNodeBaseClickEvent extends _ModuleSupport.SeriesNodeBaseClickEvent<any> {
    readonly angleKey: string;
    readonly radiusKey: string;

    constructor(
        angleKey: string,
        radiusKey: string,
        nativeEvent: MouseEvent,
        datum: RadarNodeDatum,
        series: RadarSeries
    ) {
        super(nativeEvent, datum, series);
        this.angleKey = angleKey;
        this.radiusKey = radiusKey;
    }
}

class RadarSeriesNodeClickEvent extends RadarSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

class RadarSeriesNodeDoubleClickEvent extends RadarSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

interface RadarNodeDatum extends _ModuleSupport.SeriesNodeDatum {
    readonly label?: {
        text: string;
        x: number;
        y: number;
        textAlign: CanvasTextAlign;
        textBaseline: CanvasTextBaseline;
    };
    readonly angleValue: any;
    readonly radiusValue: any;
}

class RadarSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgRadarSeriesLabelFormatterParams) => string = undefined;
}

export class RadarSeriesMarker extends _ModuleSupport.SeriesMarker {
    @Validate(OPT_FUNCTION)
    @_Scene.SceneChangeDetection({ redraw: _Scene.RedrawType.MAJOR })
    formatter?: (params: AgRadarSeriesMarkerFormatterParams<any>) => AgRadarSeriesMarkerFormat = undefined;
}

type RadarAnimationState = 'empty' | 'ready';
type RadarAnimationEvent = 'update' | 'resize';
class RadarStateMachine extends _ModuleSupport.StateMachine<RadarAnimationState, RadarAnimationEvent> {}

export abstract class RadarSeries extends _ModuleSupport.PolarSeries<RadarNodeDatum> {
    static className = 'RadarSeries';

    readonly marker = new RadarSeriesMarker();

    readonly label = new RadarSeriesLabel();

    protected lineSelection: _Scene.Selection<_Scene.Path, boolean>;
    protected markerSelection: _Scene.Selection<_Scene.Marker, RadarNodeDatum>;
    protected labelSelection: _Scene.Selection<_Scene.Text, RadarNodeDatum>;
    protected highlightSelection: _Scene.Selection<_Scene.Marker, RadarNodeDatum>;

    protected animationState: RadarStateMachine;

    protected nodeData: RadarNodeDatum[] = [];

    tooltip = new _ModuleSupport.SeriesTooltip<AgPieSeriesTooltipRendererParams>();

    /**
     * The key of the numeric field to use to determine the angle (for example,
     * a pie sector angle).
     */
    @Validate(STRING)
    angleKey = '';

    @Validate(OPT_STRING)
    angleName?: string = undefined;

    /**
     * The key of the numeric field to use to determine the radii of pie sectors.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii.
     */
    @Validate(STRING)
    radiusKey: string = '';

    @Validate(OPT_STRING)
    radiusName?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    stroke?: string = 'black';

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat = undefined;

    /**
     * The series rotation in degrees.
     */
    @Validate(NUMBER(-360, 360))
    rotation = 0;

    @Validate(NUMBER(0))
    strokeWidth = 1;

    readonly highlightStyle = new HighlightStyle();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            canHaveAxes: true,
        });

        const lineGroup = new Group();
        this.contentGroup.append(lineGroup);
        this.lineSelection = Selection.select(lineGroup, Path);
        lineGroup.zIndexSubOrder = [() => this._declarationOrder, 1];

        const markerFactory = () => {
            const { shape } = this.marker;
            const MarkerShape = getMarker(shape);
            return new MarkerShape();
        };
        const markerGroup = new Group();
        markerGroup.zIndexSubOrder = [() => this._declarationOrder, 2];
        this.contentGroup.append(markerGroup);
        this.markerSelection = Selection.select(markerGroup, markerFactory);

        this.labelSelection = Selection.select(this.labelGroup!, Text);

        this.highlightSelection = Selection.select(this.highlightGroup, markerFactory);

        this.animationState = new RadarStateMachine('empty', {
            empty: {
                update: {
                    target: 'ready',
                    action: () => this.animateEmptyUpdateReady(),
                },
            },
            ready: {
                update: {
                    target: 'ready',
                    action: () => this.animateReadyUpdate(),
                },
                resize: {
                    target: 'ready',
                    action: () => this.animateReadyResize(),
                },
            },
        });
    }

    addChartEventListeners(): void {
        this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        this.ctx.chartEventManager?.addListener('legend-item-double-click', (event) =>
            this.onLegendItemDoubleClick(event)
        );
    }

    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        if (direction === ChartAxisDirection.X) {
            return dataModel.getDomain(this, `angleValue`, 'value', processedData);
        } else {
            const domain = dataModel.getDomain(this, `radiusValue`, 'value', processedData);
            const ext = extent(domain.length === 0 ? domain : [0].concat(domain));
            return this.fixNumericExtent(ext);
        }
    }

    async processData(dataController: _ModuleSupport.DataController) {
        const { data = [] } = this;
        const { angleKey, radiusKey } = this;

        if (!angleKey || !radiusKey) return;

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                valueProperty(this, angleKey, false, { id: 'angleValue' }),
                valueProperty(this, radiusKey, false, { id: 'radiusValue', invalidValue: undefined }),
            ],
        });
        this.dataModel = dataModel;
        this.processedData = processedData;
    }

    protected circleCache = { r: 0, cx: 0, cy: 0 };

    protected didCircleChange() {
        const r = this.radius;
        const cx = this.centerX;
        const cy = this.centerY;
        const cache = this.circleCache;
        if (!(r === cache.r && cx === cache.cx && cy === cache.cy)) {
            this.circleCache = { r, cx, cy };
            return true;
        }
        return false;
    }

    protected getAxisInnerRadius() {
        const radiusAxis = this.axes[ChartAxisDirection.Y];
        return radiusAxis instanceof PolarAxis ? this.radius * radiusAxis.innerRadiusRatio : 0;
    }

    maybeRefreshNodeData() {
        const didCircleChange = this.didCircleChange();
        if (!didCircleChange && !this.nodeDataRefresh) return;
        const [{ nodeData = [] } = {}] = this._createNodeData();
        this.nodeData = nodeData;
        this.nodeDataRefresh = false;
    }

    async createNodeData() {
        return this._createNodeData();
    }

    protected _createNodeData() {
        const { processedData, dataModel, angleKey, radiusKey } = this;

        if (!processedData || !dataModel || !angleKey || !radiusKey) {
            return [];
        }

        const angleScale = this.axes[ChartAxisDirection.X]?.scale;
        const radiusScale = this.axes[ChartAxisDirection.Y]?.scale;

        if (!angleScale || !radiusScale) {
            return [];
        }

        const angleIdx = dataModel.resolveProcessedDataIndexById(this, `angleValue`).index;
        const radiusIdx = dataModel.resolveProcessedDataIndexById(this, `radiusValue`).index;
        const axisInnerRadius = this.getAxisInnerRadius();

        const { label, marker, id: seriesId } = this;
        const { size: markerSize } = this.marker;

        const nodeData = processedData.data.map((group): RadarNodeDatum => {
            const { datum, values } = group;

            const angleDatum = values[angleIdx];
            const radiusDatum = values[radiusIdx];

            const angle = angleScale.convert(angleDatum);
            const radius = this.radius + axisInnerRadius - radiusScale.convert(radiusDatum);

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const x = cos * radius;
            const y = sin * radius;

            let labelNodeDatum: RadarNodeDatum['label'];
            if (label.enabled) {
                let labelText = '';
                if (label.formatter) {
                    labelText = label.formatter({ value: radiusDatum, seriesId });
                } else if (typeof radiusDatum === 'number' && isFinite(radiusDatum)) {
                    labelText = radiusDatum.toFixed(2);
                } else if (radiusDatum) {
                    labelText = String(radiusDatum);
                }
                if (labelText) {
                    const labelX = x + cos * marker.size;
                    const labelY = y + sin * marker.size;
                    labelNodeDatum = {
                        text: labelText,
                        x: labelX,
                        y: labelY,
                        textAlign: isNumberEqual(cos, 0) ? 'center' : cos > 0 ? 'left' : 'right',
                        textBaseline: isNumberEqual(sin, 0) ? 'middle' : sin > 0 ? 'top' : 'bottom',
                    };
                }
            }

            return {
                series: this,
                datum,
                point: { x, y, size: markerSize },
                nodeMidPoint: { x, y },
                label: labelNodeDatum,
                angleValue: angleDatum,
                radiusValue: radiusDatum,
            };
        });

        return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    }

    async update() {
        this.maybeRefreshNodeData();

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }

        this.updatePathSelections();
        this.updateMarkers(this.markerSelection, false);
        this.updateMarkers(this.highlightSelection, true);
        this.updateLabels();

        this.animationState.transition('update');
    }

    protected updatePathSelections() {
        const pathData = this.visible ? [true] : [];
        this.lineSelection.update(pathData);
    }

    protected getMarkerFill(highlightedStyle?: _ModuleSupport.SeriesItemHighlightStyle) {
        return highlightedStyle?.fill ?? this.marker.fill;
    }

    protected updateMarkers(selection: _Scene.Selection<_Scene.Marker, RadarNodeDatum>, highlight: boolean) {
        const { marker, visible, ctx, angleKey, radiusKey, id: seriesId } = this;
        const { shape, enabled, formatter, size } = marker;
        const { callbackCache } = ctx;
        let selectionData: RadarNodeDatum[] = [];
        if (visible && shape && enabled) {
            if (highlight) {
                const highlighted = this.ctx.highlightManager?.getActiveHighlight();
                if (highlighted?.datum) {
                    selectionData = [highlighted as RadarNodeDatum];
                }
            } else {
                selectionData = this.nodeData;
            }
        }
        const highlightedStyle = highlight ? this.highlightStyle.item : undefined;
        selection.update(selectionData).each((node, datum) => {
            const fill = this.getMarkerFill(highlightedStyle);
            const stroke = highlightedStyle?.stroke ?? marker.stroke ?? this.stroke;
            const strokeWidth = highlightedStyle?.strokeWidth ?? marker.strokeWidth ?? this.strokeWidth ?? 1;
            const format = formatter
                ? callbackCache.call(formatter, {
                      datum: datum.datum,
                      angleKey,
                      radiusKey,
                      fill,
                      stroke,
                      strokeWidth,
                      size,
                      highlighted: highlight,
                      seriesId,
                  })
                : undefined;
            node.fill = format?.fill ?? fill;
            node.stroke = format?.stroke ?? stroke;
            node.strokeWidth = format?.strokeWidth ?? strokeWidth;
            node.fillOpacity = highlightedStyle?.fillOpacity ?? marker.fillOpacity ?? 1;
            node.strokeOpacity = marker.strokeOpacity ?? this.strokeOpacity ?? 1;
            node.size = format?.size ?? marker.size;

            const { x, y } = datum.point!;
            node.translationX = x;
            node.translationY = y;
            node.visible = node.size > 0 && !isNaN(x) && !isNaN(y);
        });
    }

    protected updateLabels() {
        const { label, labelSelection } = this;
        labelSelection.update(this.nodeData).each((node, datum) => {
            if (label.enabled && datum.label) {
                node.x = datum.label.x;
                node.y = datum.label.y;

                node.fill = label.color;

                node.fontFamily = label.fontFamily;
                node.fontSize = label.fontSize;
                node.fontStyle = label.fontStyle;
                node.fontWeight = label.fontWeight;
                node.text = datum.label.text;
                node.textAlign = datum.label.textAlign;
                node.textBaseline = datum.label.textBaseline;

                node.visible = true;
            } else {
                node.visible = false;
            }
        });
    }

    protected getNodeClickEvent(event: MouseEvent, datum: RadarNodeDatum): RadarSeriesNodeClickEvent {
        return new RadarSeriesNodeClickEvent(this.angleKey, this.radiusKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(event: MouseEvent, datum: RadarNodeDatum): RadarSeriesNodeDoubleClickEvent {
        return new RadarSeriesNodeDoubleClickEvent(this.angleKey, this.radiusKey, event, datum, this);
    }

    getTooltipHtml(nodeDatum: RadarNodeDatum): string {
        const { angleKey, radiusKey } = this;

        if (!angleKey || !radiusKey) {
            return '';
        }

        const { angleName, radiusName, tooltip, marker, id: seriesId } = this;
        const { datum, angleValue, radiusValue } = nodeDatum;
        const formattedAngleValue = typeof angleValue === 'number' ? toFixed(angleValue) : String(angleValue);
        const formattedRadiusValue = typeof radiusValue === 'number' ? toFixed(radiusValue) : String(radiusValue);
        const title = sanitizeHtml(radiusName);
        const content = sanitizeHtml(`${formattedAngleValue}: ${formattedRadiusValue}`);

        const { formatter: markerFormatter, fill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
        const strokeWidth = markerStrokeWidth ?? this.strokeWidth;

        let format: AgRadarSeriesMarkerFormat | undefined = undefined;
        if (markerFormatter) {
            format = markerFormatter({
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
            });
        }

        const color = format?.fill ?? fill;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            angleKey,
            angleValue,
            angleName,
            radiusKey,
            radiusValue,
            radiusName,
            title,
            color,
            seriesId,
        });
    }

    getLegendData(legendType: string): _ModuleSupport.ChartLegendDatum[] {
        const { id, data, angleKey, radiusKey, radiusName, visible, marker, stroke, strokeOpacity } = this;

        if (!(data?.length && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [
            {
                legendType: 'category',
                id: id,
                itemId: radiusKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: radiusName ?? radiusKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: this.getMarkerFill() ?? marker.stroke ?? stroke ?? 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke ?? stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: marker.fillOpacity ?? 1,
                    strokeOpacity: marker.strokeOpacity ?? strokeOpacity ?? 1,
                },
            },
        ];
        return legendData;
    }

    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent) {
        const { enabled, itemId, series } = event;

        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent) {
        const { enabled, itemId, series, numVisibleItems } = event;

        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);

        const wasClicked = series.id === this.id;
        const newEnabled = wasClicked || (enabled && totalVisibleItems === 1);

        this.toggleSeriesItem(itemId, newEnabled);
    }

    protected pickNodeClosestDatum(point: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        const { x, y } = point;
        const { rootGroup, nodeData, centerX: cx, centerY: cy, marker } = this;
        const hitPoint = rootGroup.transformPoint(x, y);
        const radius = this.radius;

        const distanceFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (distanceFromCenter > radius + marker.size) {
            return;
        }

        let minDistance = Infinity;
        let closestDatum: RadarNodeDatum | undefined;

        for (const datum of nodeData) {
            const { point: { x: datumX = NaN, y: datumY = NaN } = {} } = datum;
            if (isNaN(datumX) || isNaN(datumY)) {
                continue;
            }

            const distance = Math.sqrt((hitPoint.x - datumX - cx) ** 2 + (hitPoint.y - datumY - cy) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                closestDatum = datum;
            }
        }

        if (closestDatum) {
            const distance = Math.max(minDistance - (closestDatum.point?.size ?? 0), 0);
            return { datum: closestDatum, distance };
        }
    }

    computeLabelsBBox() {
        const { label } = this;

        this.maybeRefreshNodeData();

        const textBoxes: _Scene.BBox[] = [];
        const tempText = new Text();
        this.nodeData.forEach((nodeDatum) => {
            if (!label.enabled || !nodeDatum.label) {
                return;
            }
            tempText.text = nodeDatum.label.text;
            tempText.x = nodeDatum.label.x;
            tempText.y = nodeDatum.label.y;
            tempText.setFont(label);
            tempText.setAlign(nodeDatum.label);
            const box = tempText.computeBBox();
            textBoxes.push(box);
        });
        if (textBoxes.length === 0) {
            return null;
        }
        return BBox.merge(textBoxes);
    }

    protected getLineNode() {
        return this.lineSelection.nodes()[0];
    }

    protected beforePathAnimation() {
        const lineNode = this.getLineNode();

        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.lineCap = 'round';
        lineNode.pointerEvents = PointerEvents.None;

        lineNode.stroke = this.stroke;
        lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
        lineNode.strokeOpacity = this.strokeOpacity;

        lineNode.lineDash = this.lineDash;
        lineNode.lineDashOffset = this.lineDashOffset;
    }

    protected abstract get breakMissingPoints(): boolean;

    protected getLinePoints(): RadarLinePoint[] {
        const { nodeData, breakMissingPoints } = this;
        if (nodeData.length === 0) {
            return [];
        }
        const points: RadarLinePoint[] = [];
        let prevPointInvalid = false;
        const invalidDatums = new Set<RadarNodeDatum>();
        nodeData.forEach((datum, index) => {
            let { x, y } = datum.point!;
            const isPointInvalid = isNaN(x) || isNaN(y);
            if (isPointInvalid) {
                prevPointInvalid = true;
                if (breakMissingPoints) {
                    invalidDatums.add(datum);
                    return;
                } else {
                    x = 0;
                    y = 0;
                }
            }
            const moveTo = index === 0 || (breakMissingPoints && prevPointInvalid);
            points.push({ x, y, moveTo });
            prevPointInvalid = false;
        });
        const isFirstInvalid = invalidDatums.has(nodeData[0]);
        const isLastInvalid = invalidDatums.has(nodeData[nodeData.length - 1]);
        const closed = !breakMissingPoints || (!isFirstInvalid && !isLastInvalid);
        if (closed) {
            points.push({ ...points[0], moveTo: false });
        }
        return points;
    }

    protected animateSinglePath(
        pathNode: _Scene.Path,
        points: RadarLinePoint[],
        totalDuration: number,
        timePassed: number
    ) {
        const { path } = pathNode;

        path.clear({ trackChanges: true });

        const axisInnerRadius = this.getAxisInnerRadius();

        points.forEach((point) => {
            const { x: x1, y: y1 } = point;
            const angle = Math.atan2(y1, x1);
            const x0 = axisInnerRadius * Math.cos(angle);
            const y0 = axisInnerRadius * Math.sin(angle);
            const t = timePassed / totalDuration;
            const x = x0 * (1 - t) + x1 * t;
            const y = y0 * (1 - t) + y1 * t;

            if (point.moveTo) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }
        });

        pathNode.checkPathDirty();
    }

    protected animatePaths(points: RadarLinePoint[], totalDuration: number, timePassed: number) {
        this.animateSinglePath(this.getLineNode(), points, totalDuration, timePassed);
    }

    animateEmptyUpdateReady() {
        if (!this.visible) {
            return;
        }

        const { markerSelection, labelSelection } = this;

        const points = this.getLinePoints();

        const duration = this.ctx.animationManager.defaultDuration();
        const markerDuration = 200;
        const markerDelay = duration;

        const animationOptions = {
            from: 0,
            to: duration,
        };

        this.beforePathAnimation();

        this.ctx.animationManager.animate<number>(`${this.id}_empty-update-ready`, {
            ...animationOptions,
            duration,
            onUpdate: (timePassed) => this.animatePaths(points, duration, timePassed),
        });

        markerSelection.each((marker, datum) => {
            const format = this.animateFormatter(datum);
            const size = datum.point?.size ?? 0;

            this.ctx.animationManager.animate<number>(`${this.id}_empty-update-ready_${marker.id}`, {
                ...animationOptions,
                to: format?.size ?? size,
                delay: markerDelay,
                duration: markerDuration,
                onUpdate(size) {
                    marker.size = size;
                },
            });
        });

        labelSelection.each((label) => {
            this.ctx.animationManager.animate(`${this.id}_empty-update-ready_${label.id}`, {
                from: 0,
                to: 1,
                delay: markerDelay,
                duration: markerDuration,
                onUpdate: (opacity) => {
                    label.opacity = opacity;
                },
            });
        });
    }

    animateReadyUpdate() {
        this.resetMarkersAndPaths();
    }

    animateReadyResize() {
        this.resetMarkersAndPaths();
    }

    protected resetMarkersAndPaths() {
        const { markerSelection } = this;
        const lineNode = this.getLineNode();

        if (lineNode) {
            const { path: linePath } = lineNode;
            const linePoints = this.getLinePoints();

            lineNode.fill = undefined;
            lineNode.stroke = this.stroke;
            lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
            lineNode.strokeOpacity = this.strokeOpacity;

            lineNode.lineDash = this.lineDash;
            lineNode.lineDashOffset = this.lineDashOffset;

            linePath.clear({ trackChanges: true });

            linePoints.forEach(({ x, y, moveTo }) => {
                if (moveTo) {
                    linePath.moveTo(x, y);
                } else {
                    linePath.lineTo(x, y);
                }
            });

            lineNode.checkPathDirty();
        }

        markerSelection.each((marker, datum) => {
            const format = this.animateFormatter(datum);
            const size = datum.point?.size ?? 0;
            marker.size = format?.size ?? size;
        });
    }

    protected animateFormatter(datum: RadarNodeDatum) {
        const {
            marker,
            angleKey = '',
            radiusKey = '',
            stroke: lineStroke,
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { size, formatter } = marker;

        const fill = marker.fill;
        const stroke = marker.stroke ?? lineStroke;
        const strokeWidth = marker.strokeWidth ?? this.strokeWidth;

        let format: AgRadarSeriesMarkerFormat | undefined = undefined;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum: datum.datum,
                angleKey,
                radiusKey,
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
}
