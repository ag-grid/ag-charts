import type {
    AgCartesianSeriesLabelFormatterParams,
    AgTooltipRendererResult,
    AgCartesianSeriesMarkerFormat,
} from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';
import type {
    AgRangeAreaSeriesTooltipRendererParams,
    AgRangeAreaSeriesLabelPlacement,
    AgRangeAreaSeriesMarkerFormatterParams,
} from './typings';

const {
    Validate,
    SeriesNodePickMode,
    valueProperty,
    trailingValueProperty,
    keyProperty,
    ChartAxisDirection,
    OPTIONAL,
    NUMBER,
    OPT_NUMBER,
    OPT_STRING,
    OPT_FUNCTION,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
    getMarkerConfig,
    updateMarker,
    updateLabel,
} = _ModuleSupport;
const { getMarker, toTooltipHtml, ContinuousScale, PointerEvents, SceneChangeDetection } = _Scene;
const { sanitizeHtml, extent, isNumber } = _Util;

const RANGE_AREA_LABEL_PLACEMENTS: AgRangeAreaSeriesLabelPlacement[] = ['inside', 'outside'];
const OPT_RANGE_AREA_LABEL_PLACEMENT: _ModuleSupport.ValidatePredicate = (v: any, ctx) =>
    OPTIONAL(v, ctx, (v: any) => RANGE_AREA_LABEL_PLACEMENTS.includes(v));

enum RangeAreaTag {
    Fill,
    Stroke,
    Marker,
    Label,
}

interface PathPoint {
    x: number;
    y: number;
    yValue: any;
    itemId: string;
}

interface SizedPathPoint extends PathPoint {
    size: number;
}

interface RangeAreaPathDatum {
    readonly itemId: string;
    readonly points: PathPoint[];
}

type RangeAreaLabelDatum = Readonly<_Scene.Point> & {
    text: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    datum: any;
    itemId: string;
    series: _ModuleSupport.CartesianSeriesNodeDatum['series'];
};

interface RangeAreaMarkerDatum extends Required<Omit<_ModuleSupport.CartesianSeriesNodeDatum, 'yKey' | 'yValue'>> {
    readonly index: number;
    readonly itemId: string;
    readonly yLowKey: string;
    readonly yHighKey: string;
    readonly yLowValue: number;
    readonly yHighValue: number;
}

type RangeAreaContext = _ModuleSupport.SeriesNodeDataContext<RangeAreaMarkerDatum, RangeAreaLabelDatum> & {
    fillData: RangeAreaPathDatum;
    strokeData: RangeAreaPathDatum;
};

class RangeAreaSeriesNodeBaseClickEvent extends _ModuleSupport.SeriesNodeBaseClickEvent<RangeAreaMarkerDatum> {
    readonly xKey: string;
    readonly yLowKey: string;
    readonly yHighKey: string;

    constructor(
        xKey: string,
        yLowKey: string,
        yHighKey: string,
        nativeEvent: MouseEvent,
        datum: RangeAreaMarkerDatum,
        series: RangeAreaSeries
    ) {
        super(nativeEvent, datum, series);
        this.xKey = xKey;
        this.yLowKey = yLowKey;
        this.yHighKey = yHighKey;
    }
}

export class RangeAreaSeriesNodeClickEvent extends RangeAreaSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

export class RangeAreaSeriesNodeDoubleClickEvent extends RangeAreaSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

class RangeAreaSeriesTooltip extends _ModuleSupport.SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgRangeAreaSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

class RangeAreaSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams & { itemId: string }) => string = undefined;

    @Validate(OPT_RANGE_AREA_LABEL_PLACEMENT)
    placement: AgRangeAreaSeriesLabelPlacement = 'inside';

    @Validate(OPT_NUMBER(0))
    padding: number = 6;
}

class RangeAreaSeriesMarker extends _ModuleSupport.SeriesMarker {
    @Validate(OPT_FUNCTION)
    @SceneChangeDetection({ redraw: _Scene.RedrawType.MAJOR })
    formatter?: (params: AgRangeAreaSeriesMarkerFormatterParams<any>) => AgCartesianSeriesMarkerFormat = undefined;
}

export class RangeAreaSeries extends _ModuleSupport.CartesianSeries<RangeAreaContext> {
    static className = 'RangeAreaSeries';
    static type: 'range-area' = 'range-area' as const;

    readonly marker = new RangeAreaSeriesMarker();
    readonly label = new RangeAreaSeriesLabel();

    tooltip: RangeAreaSeriesTooltip = new RangeAreaSeriesTooltip();

    shadow?: _Scene.DropShadow = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#99CCFF';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#99CCFF';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;

    set data(input: any[] | undefined) {
        this._data = input;
    }
    get data() {
        return this._data;
    }

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
            hasMarkers: true,
            pathsPerSeries: 2,
        });
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yLowKey?: string = undefined;

    @Validate(OPT_STRING)
    yLowName?: string = undefined;

    @Validate(OPT_STRING)
    yHighKey?: string = undefined;

    @Validate(OPT_STRING)
    yHighName?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    async processData(dataController: _ModuleSupport.DataController) {
        const { xKey, yLowKey, yHighKey, data = [] } = this;

        if (!yLowKey || !yHighKey) return;

        const isContinuousX = this.axes[ChartAxisDirection.X]?.scale instanceof ContinuousScale;
        const isContinuousY = this.axes[ChartAxisDirection.Y]?.scale instanceof ContinuousScale;

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, yLowKey, isContinuousY, { id: `yLowValue`, invalidValue: undefined }),
                valueProperty(this, yHighKey, isContinuousY, { id: `yHighValue`, invalidValue: undefined }),
                trailingValueProperty(this, yLowKey, isContinuousY, {
                    id: `yLowTrailingValue`,
                    invalidValue: undefined,
                }),
                trailingValueProperty(this, yHighKey, isContinuousY, {
                    id: `yHighTrailingValue`,
                    invalidValue: undefined,
                }),
            ],
            dataVisible: this.visible,
        });
        this.dataModel = dataModel;
        this.processedData = processedData;
    }

    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData, dataModel, axes } = this;
        if (!(processedData && dataModel)) return [];

        const {
            domain: {
                keys: [keys],
                values,
            },
        } = processedData;

        if (direction === ChartAxisDirection.X) {
            const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);

            const xAxis = axes[ChartAxisDirection.X];
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return this.fixNumericExtent(extent(keys), xAxis);
        } else {
            const yLowIndex = dataModel.resolveProcessedDataIndexById(this, 'yLowValue').index;
            const yLowExtent = values[yLowIndex];
            const yHighIndex = dataModel.resolveProcessedDataIndexById(this, 'yHighValue').index;
            const yHighExtent = values[yHighIndex];
            const fixedYExtent = [
                yLowExtent[0] > yHighExtent[0] ? yHighExtent[0] : yLowExtent[0],
                yHighExtent[1] < yLowExtent[1] ? yLowExtent[1] : yHighExtent[1],
            ];
            return this.fixNumericExtent(fixedYExtent as any);
        }
    }

    protected getNodeClickEvent(event: MouseEvent, datum: RangeAreaMarkerDatum): RangeAreaSeriesNodeClickEvent {
        return new RangeAreaSeriesNodeClickEvent(datum.xKey, datum.yLowKey, datum.yHighKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: RangeAreaMarkerDatum
    ): RangeAreaSeriesNodeDoubleClickEvent {
        return new RangeAreaSeriesNodeDoubleClickEvent(datum.xKey, datum.yLowKey, datum.yHighKey, event, datum, this);
    }

    async createNodeData() {
        const { data, dataModel, axes, visible } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(data && visible && xAxis && yAxis && dataModel)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const {
            yLowKey = '',
            yHighKey = '',
            xKey = '',
            processedData,
            label,
            ctx: { callbackCache },
        } = this;

        const itemId = `${yLowKey}-${yHighKey}`;
        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const xIndex = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yHighIndex = dataModel.resolveProcessedDataIndexById(this, `yHighValue`).index;
        const yLowIndex = dataModel.resolveProcessedDataIndexById(this, `yLowValue`).index;
        const yHighTrailingIndex = dataModel.resolveProcessedDataIndexById(this, `yHighTrailingValue`).index;
        const yLowTrailingIndex = dataModel.resolveProcessedDataIndexById(this, `yLowTrailingValue`).index;

        const createCoordinates = (xValue: any, yHigh: number, yLow: number): [SizedPathPoint, SizedPathPoint] => {
            const x = xScale.convert(xValue) + xOffset;
            const yHighValue = Math.max(yHigh, yLow);
            const yLowValue = Math.min(yLow, yHigh);
            const yHighCoordinate = yScale.convert(yHighValue, { strict: false });
            const yLowCoordinate = yScale.convert(yLowValue, { strict: false });

            return [
                { x, y: yHighCoordinate, size: this.marker.size, itemId: `high`, yValue: yHighValue },
                { x, y: yLowCoordinate, size: this.marker.size, itemId: `low`, yValue: yLowValue },
            ];
        };

        const labelData: RangeAreaLabelDatum[] = [];
        const markerData: RangeAreaMarkerDatum[] = [];
        const strokeData: RangeAreaPathDatum = { itemId, points: [] };
        const fillData: RangeAreaPathDatum = { itemId, points: [] };
        const context: RangeAreaContext = {
            itemId,
            labelData,
            nodeData: markerData,
            fillData,
            strokeData,
        };

        const fillHighPoints = fillData.points;
        const fillLowPoints: PathPoint[] = [];

        const strokeHighPoints = strokeData.points;
        const strokeLowPoints: PathPoint[] = [];

        const moveTo: PathPoint = { x: NaN, y: NaN, yValue: undefined, itemId: 'moveTo' };

        let lastXValue: any;
        processedData?.data.forEach(({ keys, datum, values }, datumIdx) => {
            const xValue = keys[xIndex];
            const yHighValue = values[yHighIndex];
            const yLowValue = values[yLowIndex];
            const yHighTrailingValue = values[yHighTrailingIndex];
            const yLowTrailingValue = values[yLowTrailingIndex];

            const points = createCoordinates(xValue, yHighValue, yLowValue);
            points.forEach(({ x, y, size, itemId, yValue }) => {
                // marker data
                markerData.push({
                    index: datumIdx,
                    series: this,
                    itemId,
                    datum,
                    nodeMidPoint: { x, y },
                    yHighValue,
                    yLowValue,
                    xValue,
                    xKey,
                    yLowKey,
                    yHighKey,
                    point: { x, y, size },
                });

                // label data
                let labelText;
                if (label.formatter) {
                    labelText = callbackCache.call(label.formatter, { value: yValue, seriesId: this.id, itemId }) ?? '';
                } else {
                    labelText = isNumber(yValue) ? Number(yValue).toFixed(2) : String(yValue);
                }
                labelData.push({
                    series: this,
                    itemId,
                    datum,
                    x,
                    y: y + (itemId === 'low' ? +10 : -10),
                    text: labelText,
                    textAlign: 'center',
                    textBaseline: itemId === 'low' ? 'top' : 'bottom',
                });
            });

            // Handle data in pairs of current and next x and y values
            const windowX = [lastXValue, xValue];
            const windowYHigh = [yHighTrailingValue, yHighValue];
            const windowYLow = [yLowTrailingValue, yLowValue];

            if (windowX.some((v) => v == null)) {
                lastXValue = xValue;
                return;
            }
            if (windowYHigh.some((v) => v == null) || windowYLow.some((v) => v == null)) {
                windowYHigh[0] = null;
                windowYHigh[1] = null;
                windowYLow[0] = null;
                windowYLow[1] = null;
            }

            const trailingCoordinates = createCoordinates(lastXValue, +windowYHigh[0], +windowYLow[0]!);
            const currentCoordinates = createCoordinates(xValue, +windowYHigh[1], +windowYLow[1]!);

            const highPoints = [trailingCoordinates[0], currentCoordinates[0]];
            const lowPoints = [trailingCoordinates[1], currentCoordinates[1]];

            // fill data
            fillHighPoints.push(...highPoints);
            fillLowPoints.push(...lowPoints);

            // stroke data
            if (yHighTrailingValue == null || yHighValue == null || yLowTrailingValue == null || yLowValue == null) {
                strokeHighPoints.push(moveTo);
                strokeLowPoints.push(moveTo);
            } else {
                strokeHighPoints.push(...highPoints);
                strokeLowPoints.push(...lowPoints);
            }

            lastXValue = xValue;
        });

        for (let i = fillLowPoints.length - 1; i >= 0; i--) {
            fillHighPoints.push(fillLowPoints[i]);
        }

        strokeHighPoints.push(moveTo);
        for (let i = strokeLowPoints.length - 1; i >= 0; i--) {
            strokeHighPoints.push(strokeLowPoints[i]);
        }

        return [context];
    }

    protected isPathOrSelectionDirty(): boolean {
        return this.marker.isDirty();
    }

    protected markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected async updateMarkerSelection(opts: {
        nodeData: RangeAreaMarkerDatum[];
        markerSelection: _Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>;
    }) {
        const { nodeData, markerSelection } = opts;
        const {
            marker: { enabled },
        } = this;
        const data = enabled && nodeData ? nodeData : [];

        if (this.marker.isDirty()) {
            markerSelection.clear();
        }

        return markerSelection.update(data, (marker) => {
            marker.tag = RangeAreaTag.Marker;
        });
    }

    protected async updateMarkerNodes(opts: {
        markerSelection: _Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const {
            id: seriesId,
            xKey = '',
            yLowKey = '',
            yHighKey = '',
            marker,
            fill,
            stroke,
            strokeWidth,
            fillOpacity,
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
                seriesStyle: { fill, stroke, strokeWidth, fillOpacity, strokeOpacity },
                highlightStyle: markerHighlightStyle,
                seriesId,
                ctx,
                xKey,
                yHighKey,
                yLowKey,
                highValue: datum.yHighValue,
                lowValue: datum.yLowValue,
                itemId: datum.itemId,
                size: datum.point.size,
            });

            const config = { ...styles, point: datum.point, visible, customMarker };
            updateMarker({ node, config });
        });

        if (!highlighted) {
            this.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: RangeAreaLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, RangeAreaLabelDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.tag = RangeAreaTag.Label;
            text.pointerEvents = PointerEvents.None;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, RangeAreaLabelDatum> }) {
        const { labelSelection } = opts;
        labelSelection.each((node, datum) => {
            const { label } = this;
            updateLabel({ labelNode: node, labelDatum: datum, config: label, visible: true });
        });
    }

    protected getHighlightLabelData(
        labelData: RangeAreaLabelDatum[],
        highlightedItem: RangeAreaMarkerDatum
    ): RangeAreaLabelDatum[] | undefined {
        const labelItems = labelData.filter((ld) => ld.datum === highlightedItem.datum);
        return labelItems.length > 0 ? labelItems : undefined;
    }

    getTooltipHtml(nodeDatum: RangeAreaMarkerDatum): string {
        const { xKey, yLowKey, yHighKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yLowKey || !yHighKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yLowName, yHighName, yName, id: seriesId } = this;

        const { datum, itemId, xValue, yLowValue, yHighValue } = nodeDatum;

        const { fill, tooltip: itemTooltip } = this;

        const tooltipRenderer = itemTooltip.renderer ?? this.tooltip.renderer;

        const color = fill ?? 'gray';

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yLowString = sanitizeHtml(yAxis.formatDatum(yLowValue));
        const yHighString = sanitizeHtml(yAxis.formatDatum(yHighValue));

        const xSubheading = xName ?? xKey;
        const yLowSubheading = yLowName ?? yLowKey;
        const yHighSubheading = yHighName ?? yHighKey;

        const title = sanitizeHtml(yName);

        const content = yName
            ? `<b>${sanitizeHtml(xSubheading)}</b>: ${xString}<br>` +
              `<b>${sanitizeHtml(yLowSubheading)}</b>: ${yLowString}<br>` +
              `<b>${sanitizeHtml(yHighSubheading)}</b>: ${yHighString}<br>`
            : `${xString}: ${yLowString} - ${yHighString}`;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
                    datum,
                    xKey,
                    xValue,
                    xName,
                    yLowKey,
                    yLowValue,
                    yLowName,
                    yHighKey,
                    yHighValue,
                    yHighName,
                    yName,
                    color,
                    seriesId,
                    itemId,
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): _ModuleSupport.CategoryLegendDatum[] {
        const { id, visible } = this;

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];

        const { fill, stroke, fillOpacity, strokeOpacity, yName, yLowName, yHighName, yLowKey, yHighKey } = this;
        const legendItemText = yName ?? `${yLowName ?? yLowKey} - ${yHighName ?? yHighKey}`;
        legendData.push({
            legendType: 'category',
            id,
            itemId: `${yLowKey}-${yHighKey}`,
            seriesId: id,
            enabled: visible,
            label: {
                text: `${legendItemText}`,
            },
            marker: {
                fill,
                stroke,
                fillOpacity,
                strokeOpacity,
            },
        });

        return legendData;
    }

    animateEmptyUpdateReady({
        markerSelections,
        labelSelections,
        contextData,
        paths,
        seriesRect,
    }: {
        markerSelections: Array<_Scene.Selection<_Scene.Marker, RangeAreaMarkerDatum>>;
        labelSelections: Array<_Scene.Selection<_Scene.Text, RangeAreaLabelDatum>>;
        contextData: Array<RangeAreaContext>;
        paths: Array<Array<_Scene.Path>>;
        seriesRect?: _Scene.BBox;
    }) {
        const {
            stroke: seriesStroke,
            fill: seriesFill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            strokeOpacity,
            strokeWidth,
            shadow,
        } = this;

        contextData.forEach(({ fillData, strokeData, itemId }, seriesIdx) => {
            const [fill, stroke] = paths[seriesIdx];

            const duration = this.ctx.animationManager?.defaultOptions.duration ?? 1000;
            const markerDuration = 200;

            const animationOptions = {
                from: 0,
                to: seriesRect?.width ?? 0,
                duration,
            };

            // Stroke
            {
                const { points } = strokeData;

                stroke.tag = RangeAreaTag.Stroke;
                stroke.fill = undefined;
                stroke.lineJoin = stroke.lineCap = 'round';
                stroke.pointerEvents = PointerEvents.None;

                stroke.stroke = seriesStroke;
                stroke.strokeWidth = this.getStrokeWidth(this.strokeWidth, { itemId });
                stroke.strokeOpacity = strokeOpacity;
                stroke.lineDash = lineDash;
                stroke.lineDashOffset = lineDashOffset;

                this.ctx.animationManager?.animate<number>(`${this.id}_empty-update-ready_stroke_${seriesIdx}`, {
                    ...animationOptions,
                    onUpdate(xValue) {
                        stroke.path.clear({ trackChanges: true });

                        let moveTo = true;
                        points.forEach((point, index) => {
                            // Draw/move the full segment if past the end of this segment
                            if (point.yValue === undefined || isNaN(point.x) || isNaN(point.y)) {
                                moveTo = true;
                            } else if (point.x <= xValue) {
                                if (moveTo) {
                                    stroke.path.moveTo(point.x, point.y);
                                    moveTo = false;
                                } else {
                                    stroke.path.lineTo(point.x, point.y);
                                }
                            } else if (
                                index > 0 &&
                                point.yValue !== undefined &&
                                points[index - 1].yValue !== undefined &&
                                points[index - 1].x <= xValue
                            ) {
                                // Draw/move partial line if in between the start and end of this segment
                                const start = points[index - 1];
                                const end = point;

                                const x = xValue;
                                const y = start.y + ((x - start.x) * (end.y - start.y)) / (end.x - start.x);

                                stroke.path.lineTo(x, y);
                            }
                        });

                        stroke.checkPathDirty();
                    },
                });
            }

            // Fill
            {
                const { points: allPoints } = fillData;
                const points = allPoints.slice(0, allPoints.length / 2);
                const bottomPoints = allPoints.slice(allPoints.length / 2);

                fill.tag = RangeAreaTag.Fill;
                fill.stroke = undefined;
                fill.lineJoin = 'round';
                fill.pointerEvents = PointerEvents.None;

                fill.fill = seriesFill;
                fill.fillOpacity = fillOpacity;
                fill.strokeOpacity = strokeOpacity;
                fill.strokeWidth = strokeWidth;
                fill.lineDash = lineDash;
                fill.lineDashOffset = lineDashOffset;
                fill.fillShadow = shadow;

                this.ctx.animationManager?.animate<number>(`${this.id}_empty-update-ready_fill_${seriesIdx}`, {
                    ...animationOptions,
                    onUpdate(xValue) {
                        fill.path.clear({ trackChanges: true });

                        let x = 0;
                        let y = 0;

                        points.forEach((point, index) => {
                            if (point.x <= xValue) {
                                // Draw/move the full segment if past the end of this segment
                                x = point.x;
                                y = point.y;

                                fill.path.lineTo(point.x, point.y);
                            } else if (index > 0 && points[index - 1].x < xValue) {
                                // Draw/move partial line if in between the start and end of this segment
                                const start = points[index - 1];
                                const end = point;

                                x = xValue;
                                y = start.y + ((x - start.x) * (end.y - start.y)) / (end.x - start.x);

                                fill.path.lineTo(x, y);
                            }
                        });

                        bottomPoints.forEach((point, index) => {
                            const reverseIndex = bottomPoints.length - index - 1;

                            if (point.x <= xValue) {
                                fill.path.lineTo(point.x, point.y);
                            } else if (reverseIndex > 0 && points[reverseIndex - 1].x < xValue) {
                                const start = point;
                                const end = bottomPoints[index + 1];

                                const bottomY = start.y + ((x - start.x) * (end.y - start.y)) / (end.x - start.x);

                                fill.path.lineTo(x, bottomY);
                            }
                        });

                        if (bottomPoints.length > 0) {
                            fill.path.lineTo(
                                bottomPoints[bottomPoints.length - 1].x,
                                bottomPoints[bottomPoints.length - 1].y
                            );
                        }

                        fill.path.closePath();
                        fill.checkPathDirty();
                    },
                });
            }

            markerSelections[seriesIdx].each((marker, datum) => {
                const delay = seriesRect?.width ? (datum.point.x / seriesRect.width) * duration : 0;
                const format = this.animateFormatter(datum);
                const size = datum.point?.size ?? 0;

                this.ctx.animationManager?.animate<number>(`${this.id}_empty-update-ready_${marker.id}`, {
                    ...animationOptions,
                    to: format?.size ?? size,
                    delay,
                    duration: markerDuration,
                    onUpdate(size) {
                        marker.size = size;
                    },
                });
            });

            labelSelections[seriesIdx].each((label, datum) => {
                const delay = seriesRect?.width ? (datum.x / seriesRect.width) * duration : 0;
                this.ctx.animationManager?.animate(`${this.id}_empty-update-ready_${label.id}`, {
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

    animateReadyUpdate({
        contextData,
        paths,
    }: {
        contextData: Array<RangeAreaContext>;
        paths: Array<Array<_Scene.Path>>;
    }) {
        const {
            stroke: seriesStroke,
            fill: seriesFill,
            fillOpacity,
            lineDash,
            lineDashOffset,
            strokeOpacity,
            strokeWidth,
            shadow,
        } = this;

        contextData.forEach(({ strokeData, fillData, itemId }, seriesIdx) => {
            const [fill, stroke] = paths[seriesIdx];

            // Stroke
            stroke.stroke = seriesStroke;
            stroke.strokeWidth = this.getStrokeWidth(this.strokeWidth, { itemId });
            stroke.strokeOpacity = strokeOpacity;
            stroke.lineDash = lineDash;
            stroke.lineDashOffset = lineDashOffset;

            stroke.path.clear({ trackChanges: true });

            let moveTo = true;
            strokeData.points.forEach(({ x, y, yValue }) => {
                if (yValue === undefined || isNaN(x) || isNaN(y)) {
                    moveTo = true;
                } else if (moveTo) {
                    stroke.path.moveTo(x, y);
                    moveTo = false;
                } else {
                    stroke.path.lineTo(x, y);
                }
            });

            stroke.checkPathDirty();

            // Fill

            fill.fill = seriesFill;
            fill.fillOpacity = fillOpacity;
            fill.strokeOpacity = strokeOpacity;
            fill.strokeWidth = strokeWidth;
            fill.lineDash = lineDash;
            fill.lineDashOffset = lineDashOffset;
            fill.fillShadow = shadow;

            fill.path.clear({ trackChanges: true });

            fillData.points.forEach((point) => {
                fill.path.lineTo(point.x, point.y);
            });

            fill.path.closePath();
            fill.checkPathDirty();
        });
    }

    private animateFormatter(nodeDatum: RangeAreaMarkerDatum) {
        const {
            marker,
            fill: seriesFill,
            stroke: seriesStroke,
            xKey = '',
            yLowKey = '',
            yHighKey = '',
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { size, formatter } = marker;

        const fill = marker.fill ?? seriesFill;
        const stroke = marker.stroke ?? seriesStroke;
        const strokeWidth = marker.strokeWidth ?? this.strokeWidth;

        const { datum, itemId, yLowValue, yHighValue } = nodeDatum;
        let format: AgCartesianSeriesMarkerFormat | undefined = undefined;
        if (formatter) {
            format = callbackCache.call(formatter, {
                datum,
                lowValue: yLowValue,
                highValue: yHighValue,
                xKey,
                yLowKey,
                yHighKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
                seriesId,
                itemId,
            });
        }

        return format;
    }
    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
