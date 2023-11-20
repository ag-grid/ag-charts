import type {
    AgPieSeriesFormat,
    AgPieSeriesFormatterParams,
    AgPieSeriesTooltipRendererParams,
    AgRadarSeriesLabelFormatterParams,
    AgRadialSeriesOptionsKeys,
} from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

const {
    ChartAxisDirection,
    HighlightStyle,
    NUMBER,
    OPT_COLOR_STRING,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_STRING,
    PolarAxis,
    SeriesNodePickMode,
    STRING,
    Validate,
    valueProperty,
    fixNumericExtent,
    seriesLabelFadeInAnimation,
    markerFadeInAnimation,
    resetMarkerFn,
    diff,
    animationValidation,
    ADD_PHASE,
} = _ModuleSupport;

const { BBox, Group, Path, PointerEvents, Selection, Text, getMarker } = _Scene;
const { extent, isNumber, isNumberEqual, sanitizeHtml, toFixed } = _Util;

export interface RadarLinePoint {
    x: number;
    y: number;
    moveTo: boolean;
}

class RadarSeriesNodeClickEvent<
    TEvent extends string = _ModuleSupport.SeriesNodeEventTypes,
> extends _ModuleSupport.SeriesNodeClickEvent<RadarNodeDatum, TEvent> {
    readonly angleKey?: string;
    readonly radiusKey?: string;
    constructor(type: TEvent, nativeEvent: MouseEvent, datum: RadarNodeDatum, series: RadarSeries) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.angleKey;
        this.radiusKey = series.radiusKey;
    }
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

export abstract class RadarSeries extends _ModuleSupport.PolarSeries<RadarNodeDatum, _Scene.Marker> {
    static className = 'RadarSeries';

    protected override readonly NodeClickEvent = RadarSeriesNodeClickEvent;

    readonly marker = new _ModuleSupport.SeriesMarker<AgRadialSeriesOptionsKeys, RadarNodeDatum>();
    readonly label = new _Scene.Label<AgRadarSeriesLabelFormatterParams>();

    protected lineSelection: _Scene.Selection<_Scene.Path, boolean>;

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

    override readonly highlightStyle = new HighlightStyle();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            canHaveAxes: true,
            animationResetFns: {
                item: resetMarkerFn,
            },
        });

        const lineGroup = new Group();
        this.contentGroup.append(lineGroup);
        this.lineSelection = Selection.select(lineGroup, Path);
        lineGroup.zIndexSubOrder = [() => this._declarationOrder, 1];
    }

    protected override nodeFactory(): _Scene.Marker {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    override addChartEventListeners(): void {
        this.ctx.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        this.ctx.chartEventManager?.addListener('legend-item-double-click', (event) =>
            this.onLegendItemDoubleClick(event)
        );
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        if (direction === ChartAxisDirection.X) {
            return dataModel.getDomain(this, `angleValue`, 'value', processedData);
        } else {
            const domain = dataModel.getDomain(this, `radiusValue`, 'value', processedData);
            const ext = extent(domain.length === 0 ? domain : [0].concat(domain));
            return fixNumericExtent(ext);
        }
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { data = [] } = this;
        const { angleKey, radiusKey } = this;

        if (!angleKey || !radiusKey) return;

        const animationEnabled = !this.ctx.animationManager.isSkipped();
        const extraProps = [];
        if (animationEnabled && this.processedData) {
            extraProps.push(diff(this.processedData));
        }
        if (animationEnabled) {
            extraProps.push(animationValidation(this));
        }

        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                valueProperty(this, angleKey, false, { id: 'angleValue' }),
                valueProperty(this, radiusKey, false, { id: 'radiusValue', invalidValue: undefined }),
                ...extraProps,
            ],
        });

        this.animationState.transition('updateData');
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

    async maybeRefreshNodeData() {
        const didCircleChange = this.didCircleChange();
        if (!didCircleChange && !this.nodeDataRefresh) return;
        const [{ nodeData = [] } = {}] = await this.createNodeData();
        this.nodeData = nodeData;
        this.nodeDataRefresh = false;
    }

    async createNodeData() {
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
            if (this.label.enabled) {
                const labelText = this.getLabelText(
                    this.label,
                    {
                        value: radiusDatum,
                        datum,
                        angleKey,
                        radiusKey,
                        angleName: this.angleName,
                        radiusName: this.radiusName,
                    },
                    (value) => (isNumber(value) ? value.toFixed(2) : String(value))
                );

                if (labelText) {
                    labelNodeDatum = {
                        x: x + cos * this.marker.size,
                        y: y + sin * this.marker.size,
                        text: labelText,
                        textAlign: isNumberEqual(cos, 0) ? 'center' : cos > 0 ? 'left' : 'right',
                        textBaseline: isNumberEqual(sin, 0) ? 'middle' : sin > 0 ? 'top' : 'bottom',
                    };
                }
            }

            return {
                series: this,
                datum,
                point: { x, y, size: this.marker.size },
                midPoint: { x, y },
                label: labelNodeDatum,
                angleValue: angleDatum,
                radiusValue: radiusDatum,
            };
        });

        return [{ itemId: radiusKey, nodeData, labelData: nodeData }];
    }

    async update() {
        await this.maybeRefreshNodeData();

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }

        this.updatePathSelections();
        this.updateMarkers(this.itemSelection, false);
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
            node.visible = visible && node.size > 0 && !isNaN(x) && !isNaN(y);
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

        const { fill: color } = (markerFormatter &&
            this.ctx.callbackCache.call(markerFormatter, {
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
            })) ?? { fill };

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            { datum, angleKey, angleName, radiusKey, radiusName, title, color, seriesId }
        );
    }

    getLegendData(legendType: _ModuleSupport.ChartLegendType): _ModuleSupport.CategoryLegendDatum[] {
        const { id, data, angleKey, radiusKey, radiusName, visible, marker, stroke, strokeOpacity } = this;

        if (!(data?.length && angleKey && radiusKey && legendType === 'category')) {
            return [];
        }

        return [
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
                    strokeWidth: marker.strokeWidth ?? 0,
                },
            },
        ];
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

    protected override pickNodeClosestDatum(point: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
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

    override async computeLabelsBBox() {
        const { label } = this;

        await this.maybeRefreshNodeData();

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

    protected getLinePoints(options: { breakMissingPoints: boolean }): RadarLinePoint[] {
        const { nodeData } = this;
        const { breakMissingPoints } = options;
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

    protected animateSinglePath(pathNode: _Scene.Path, points: RadarLinePoint[], ratio: number) {
        const { path } = pathNode;

        path.clear({ trackChanges: true });

        const axisInnerRadius = this.getAxisInnerRadius();

        points.forEach((point) => {
            const { x: x1, y: y1 } = point;
            const angle = Math.atan2(y1, x1);
            const x0 = axisInnerRadius * Math.cos(angle);
            const y0 = axisInnerRadius * Math.sin(angle);
            const t = ratio;
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

    protected animatePaths(ratio: number) {
        const linePoints = this.getLinePoints({ breakMissingPoints: true });
        this.animateSinglePath(this.getLineNode(), linePoints, ratio);
    }

    override animateEmptyUpdateReady() {
        const { itemSelection, labelSelection } = this;
        const { animationManager } = this.ctx;

        const duration = animationManager.defaultDuration * (1 - ADD_PHASE.animationDuration);
        const animationOptions = { from: 0, to: 1 };

        this.beforePathAnimation();

        animationManager.animate({
            id: `${this.id}_'path`,
            groupId: this.id,
            ...animationOptions,
            duration,
            onUpdate: (ratio) => this.animatePaths(ratio),
            onStop: () => this.animatePaths(1),
        });

        markerFadeInAnimation(this, animationManager, [itemSelection], 'added');
        seriesLabelFadeInAnimation(this, 'labels', animationManager, [labelSelection]);
    }

    override animateWaitingUpdateReady() {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetPaths();
    }

    override animateReadyResize() {
        this.resetPaths();
    }

    protected resetPaths() {
        const lineNode = this.getLineNode();

        if (lineNode) {
            const { path: linePath } = lineNode;
            const linePoints = this.getLinePoints({ breakMissingPoints: true });

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
    }
}
