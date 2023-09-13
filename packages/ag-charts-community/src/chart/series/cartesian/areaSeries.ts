import type { Selection } from '../../../scene/selection';
import type { DropShadow } from '../../../scene/dropShadow';
import type { CategoryLegendDatum } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import type { SeriesNodeDataContext } from '../series';
import { SeriesTooltip, keyProperty, valueProperty, groupAccumulativeValueProperty } from '../series';
import type { CartesianAnimationData, CartesianSeriesNodeDatum } from './cartesianSeries';
import {
    CartesianSeries,
    CartesianSeriesMarker,
    CartesianSeriesNodeClickEvent,
    CartesianSeriesNodeDoubleClickEvent,
} from './cartesianSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { getMarker } from '../../marker/util';
import { extent } from '../../../util/array';
import type { Text } from '../../../scene/shape/text';
import { Label } from '../../label';
import { sanitizeHtml } from '../../../util/sanitize';
import { isContinuous, isNumber } from '../../../util/value';
import { ContinuousScale } from '../../../scale/continuousScale';
import type { Point, SizedPoint } from '../../../scene/point';
import {
    NUMBER,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_STRING,
    Validate,
    OPT_NUMBER,
    COLOR_STRING,
} from '../../../util/validation';
import type {
    AgCartesianSeriesTooltipRendererParams,
    AgCartesianSeriesLabelFormatterParams,
    FontStyle,
    FontWeight,
    AgTooltipRendererResult,
    AgCartesianSeriesMarkerFormat,
    AgCartesianSeriesMarkerFormatterParams,
} from '../../agChartOptions';
import { LogAxis } from '../../axis/logAxis';
import { TimeAxis } from '../../axis/timeAxis';
import { normaliseGroupTo } from '../../data/processors';
import type { ModuleContext } from '../../../util/moduleContext';
import type { DataController } from '../../data/dataController';
import {
    type AreaPathPoint,
    type AreaPathDatum,
    AreaSeriesTag,
    areaAnimateEmptyUpdateReady,
    areaAnimateReadyUpdate,
    areaResetMarkersAndPaths,
} from './areaUtil';
import { getMarkerConfig, updateMarker } from './markerUtil';

interface MarkerSelectionDatum extends Required<CartesianSeriesNodeDatum> {
    readonly index: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly cumulativeValue: number;
}

interface LabelSelectionDatum extends Readonly<Point> {
    readonly index: number;
    readonly itemId: any;
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

class AreaSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string = undefined;
}

type AreaSeriesNodeDataContext = SeriesNodeDataContext<MarkerSelectionDatum, LabelSelectionDatum> & {
    fillData: AreaPathDatum;
    strokeData: AreaPathDatum;
};

type AreaAnimationData = CartesianAnimationData<AreaSeriesNodeDataContext>;

export class AreaSeries extends CartesianSeries<AreaSeriesNodeDataContext> {
    static className = 'AreaSeries';
    static type = 'area' as const;

    tooltip = new SeriesTooltip<AgCartesianSeriesTooltipRendererParams>();

    readonly marker = new CartesianSeriesMarker();

    readonly label = new AreaSeriesLabel();

    @Validate(COLOR_STRING)
    fill: string = '#c16068';

    @Validate(COLOR_STRING)
    stroke: string = '#874349';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            pathsPerSeries: 2,
            pathsZIndexSubOrderOffset: [0, 1000],
            hasMarkers: true,
        });

        const { marker, label } = this;

        marker.enabled = false;

        label.enabled = false;
    }

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string;

    @Validate(OPT_STRING)
    yName?: string;

    @Validate(OPT_NUMBER(0))
    normalizedTo?: number;

    @Validate(NUMBER(0))
    strokeWidth = 2;

    shadow?: DropShadow = undefined;

    protected highlightedDatum?: MarkerSelectionDatum;

    async processData(dataController: DataController) {
        const { xKey, yKey, axes, normalizedTo, data, visible, seriesGrouping: { groupIndex = this.id } = {} } = this;

        if (!xKey || !yKey || !data) return;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const isContinuousX = xAxis?.scale instanceof ContinuousScale;
        const isContinuousY = yAxis?.scale instanceof ContinuousScale;
        const ids = [
            `area-stack-${groupIndex}-yValues`,
            `area-stack-${groupIndex}-yValues-trailing`,
            `area-stack-${groupIndex}-yValues-prev`,
            `area-stack-${groupIndex}-yValues-trailing-prev`,
            `area-stack-${groupIndex}-yValues-marker`,
        ];

        const extraProps = [];
        const normaliseTo = normalizedTo && isFinite(normalizedTo) ? normalizedTo : undefined;
        if (normaliseTo) {
            extraProps.push(normaliseGroupTo(this, [ids[0], ids[1], ids[4]], normaliseTo, 'range'));
            extraProps.push(normaliseGroupTo(this, [ids[2], ids[3]], normaliseTo, 'range'));
        }

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, yKey, isContinuousY, { id: `yValue-raw`, invalidValue: null }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window', 'current', {
                    id: `yValue-end`,
                    invalidValue: null,
                    groupId: ids[0],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window-trailing', 'current', {
                    id: `yValue-start`,
                    invalidValue: null,
                    groupId: ids[1],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window', 'last', {
                    id: `yValue-previous-end`,
                    invalidValue: null,
                    groupId: ids[2],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'window-trailing', 'last', {
                    id: `yValue-previous-start`,
                    invalidValue: null,
                    groupId: ids[3],
                }),
                ...groupAccumulativeValueProperty(this, yKey, isContinuousY, 'normal', 'current', {
                    id: `yValue-cumulative`,
                    invalidValue: null,
                    groupId: ids[4],
                }),
                ...extraProps,
            ],
            groupByKeys: true,
            dataVisible: visible,
        });

        this.dataModel = dataModel;
        this.processedData = processedData;
    }

    getDomain(direction: ChartAxisDirection): any[] {
        const { processedData, dataModel, axes } = this;
        if (!processedData || !dataModel) return [];

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        const keyDef = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const keys = dataModel.getDomain(this, `xValue`, 'key', processedData);
        const yExtent = dataModel.getDomain(this, /yValue-(previous-)?end/, 'value', processedData);

        if (direction === ChartAxisDirection.X) {
            if (keyDef?.def.type === 'key' && keyDef.def.valueType === 'category') {
                return keys;
            }

            return this.fixNumericExtent(extent(keys), xAxis);
        } else if (yAxis instanceof LogAxis || yAxis instanceof TimeAxis) {
            return this.fixNumericExtent(yExtent as any, yAxis);
        } else {
            const fixedYExtent = [yExtent[0] > 0 ? 0 : yExtent[0], yExtent[1] < 0 ? 0 : yExtent[1]];
            return this.fixNumericExtent(fixedYExtent as any, yAxis);
        }
    }

    async createNodeData() {
        const {
            axes,
            data,
            processedData: { data: groupedData } = {},
            dataModel,
            ctx: { callbackCache },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xAxis || !yAxis || !data || !dataModel) {
            return [];
        }

        const { yKey = '', xKey = '', marker, label, fill: seriesFill, stroke: seriesStroke, id: seriesId } = this;
        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;

        const continuousY = yScale instanceof ContinuousScale;

        const xOffset = (xScale.bandwidth ?? 0) / 2;

        const yStartIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-start`).index;
        const yEndIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-end`).index;
        const yRawIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-raw`).index;
        const yPreviousStartIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-previous-start`).index;
        const yPreviousEndIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-previous-end`).index;
        const yCumulativeIndex = dataModel.resolveProcessedDataIndexById(this, `yValue-cumulative`).index;

        const createPathCoordinates = (xDatum: any, lastYEnd: number, yEnd: number): [AreaPathPoint, AreaPathPoint] => {
            const x = xScale.convert(xDatum) + xOffset;

            const prevYCoordinate = yScale.convert(lastYEnd);
            const currYCoordinate = yScale.convert(yEnd);

            return [
                { x, y: currYCoordinate, yValue: yEnd },
                { x, y: prevYCoordinate, yValue: lastYEnd },
            ];
        };

        const createMarkerCoordinate = (xDatum: any, yEnd: number, rawYDatum: any): SizedPoint => {
            let currY;

            // if not normalized, the invalid data points will be processed as `undefined` in processData()
            // if normalized, the invalid data points will be processed as 0 rather than `undefined`
            // check if unprocessed datum is valid as we only want to show markers for valid points
            const normalized = this.normalizedTo && isFinite(this.normalizedTo);
            const normalizedAndValid = normalized && continuousY && isContinuous(rawYDatum);

            const valid = (!normalized && !isNaN(rawYDatum)) || normalizedAndValid;

            if (valid) {
                currY = yEnd;
            }

            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(currY);

            return { x, y, size: marker.size };
        };

        const itemId = yKey;
        const labelData: LabelSelectionDatum[] = [];
        const markerData: MarkerSelectionDatum[] = [];
        const fillData: AreaPathDatum = { itemId, points: [] };
        const strokeData: AreaPathDatum = { itemId, points: [] };
        const context: AreaSeriesNodeDataContext = {
            itemId,
            fillData,
            strokeData,
            labelData,
            nodeData: markerData,
        };

        const fillPoints = fillData.points;
        const fillPhantomPoints: AreaPathPoint[] = [];

        const strokePoints = strokeData.points;

        let datumIdx = -1;
        let lastXDatum: any;
        groupedData?.forEach((datumGroup) => {
            const {
                keys: [xDatum],
                datum: datumArray,
                values: valuesArray,
            } = datumGroup;

            valuesArray.forEach((values, valueIdx) => {
                datumIdx++;

                const seriesDatum = datumArray[valueIdx];
                const yRawDatum = values[yRawIndex];
                const yStart = values[yStartIndex];
                const yEnd = values[yEndIndex];
                const yPreviousStart = values[yPreviousStartIndex];
                const yPreviousEnd = values[yPreviousEndIndex];
                const yCumulative = values[yCumulativeIndex];

                const validPoint = yRawDatum != null;

                // marker data
                const point = createMarkerCoordinate(xDatum, +yCumulative, yRawDatum);

                if (validPoint && marker) {
                    markerData.push({
                        index: datumIdx,
                        series: this,
                        itemId,
                        datum: seriesDatum,
                        nodeMidPoint: { x: point.x, y: point.y },
                        cumulativeValue: yEnd,
                        yValue: yRawDatum,
                        xValue: xDatum,
                        yKey,
                        xKey,
                        point,
                        fill: marker.fill ?? seriesFill,
                        stroke: marker.stroke ?? seriesStroke,
                        strokeWidth: marker.strokeWidth ?? this.getStrokeWidth(this.strokeWidth),
                    });
                }

                // label data
                if (validPoint && label) {
                    let labelText;
                    if (label.formatter) {
                        labelText = callbackCache.call(label.formatter, { value: yRawDatum, seriesId }) ?? '';
                    } else {
                        labelText = isNumber(yRawDatum) ? Number(yRawDatum).toFixed(2) : String(yRawDatum);
                    }

                    labelData.push({
                        index: datumIdx,
                        itemId: yKey,
                        x: point.x,
                        y: point.y,
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
                    });
                }

                // fill data
                // Handle data in pairs of current and next x and y values
                const windowX = [lastXDatum, xDatum];
                const windowYStart = [yPreviousStart, yStart];
                const windowYEnd = [yPreviousEnd, yEnd];

                if (windowX.some((v) => v == undefined)) {
                    lastXDatum = xDatum;
                    return;
                }
                if (windowYStart.some((v) => v == undefined)) {
                    windowYStart[0] = 0;
                    windowYStart[1] = 0;
                }
                if (windowYEnd.some((v) => v == undefined)) {
                    windowYEnd[0] = 0;
                    windowYEnd[1] = 0;
                }

                const prevCoordinates = createPathCoordinates(lastXDatum, +windowYStart[0], +windowYEnd[0]!);
                fillPoints.push(prevCoordinates[0]);
                fillPhantomPoints.push(prevCoordinates[1]);

                const nextCoordinates = createPathCoordinates(xDatum, +windowYStart[1], +windowYEnd[1]!);
                fillPoints.push(nextCoordinates[0]);
                fillPhantomPoints.push(nextCoordinates[1]);

                // stroke data
                strokePoints.push({ x: NaN, y: NaN, yValue: undefined }); // moveTo

                if (yPreviousEnd != null) {
                    strokePoints.push(prevCoordinates[0]);
                }

                if (yEnd != undefined) {
                    strokePoints.push(nextCoordinates[0]);
                }

                lastXDatum = xDatum;
            });
        });

        for (let i = fillPhantomPoints.length - 1; i >= 0; i--) {
            fillPoints.push(fillPhantomPoints[i]);
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
        nodeData: MarkerSelectionDatum[];
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
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
            marker.tag = AreaSeriesTag.Marker;
        });
    }

    protected async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, MarkerSelectionDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const {
            id: seriesId,
            xKey = '',
            yKey = '',
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
        labelData: LabelSelectionDatum[];
        labelSelection: Selection<Text, LabelSelectionDatum>;
    }) {
        const { labelData, labelSelection } = opts;

        return labelSelection.update(labelData, (text) => {
            text.tag = AreaSeriesTag.Label;
        });
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, LabelSelectionDatum> }) {
        const { labelSelection } = opts;
        const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.label;
        labelSelection.each((text, datum) => {
            const { x, y, label } = datum;

            if (label && labelEnabled) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = label.textAlign;
                text.textBaseline = label.textBaseline;
                text.text = label.text;
                text.x = x;
                text.y = y - 10;
                text.fill = color;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    protected getNodeClickEvent(event: MouseEvent, datum: MarkerSelectionDatum): CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: MarkerSelectionDatum
    ): CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    getTooltipHtml(nodeDatum: MarkerSelectionDatum): string {
        const {
            xKey,
            id: seriesId,
            axes,
            xName,
            yName,
            fill: seriesFill,
            stroke: seriesStroke,
            tooltip,
            marker,
            dataModel,
        } = this;
        const { yKey, xValue, yValue, datum } = nodeDatum;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(xKey && yKey) || !(xAxis && yAxis && isNumber(yValue)) || !dataModel) {
            return '';
        }

        const {
            size,
            formatter: markerFormatter,
            strokeWidth: markerStrokeWidth,
            fill: markerFill,
            stroke: markerStroke,
        } = marker;

        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const strokeWidth = markerStrokeWidth ?? this.strokeWidth;
        const fill = markerFill ?? seriesFill;
        const stroke = markerStroke ?? seriesStroke;

        let format: AgCartesianSeriesMarkerFormat | undefined = undefined;

        if (markerFormatter) {
            format = markerFormatter({
                datum,
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

        const color = format?.fill ?? fill;

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        return tooltip.toTooltipHtml(defaults, {
            datum,
            xKey,
            xName,
            xValue,
            yKey,
            yValue,
            yName,
            color,
            title,
            seriesId,
        });
    }

    getLegendData(): CategoryLegendDatum[] {
        const { data, id, xKey, yKey, yName, marker, fill, stroke, fillOpacity, strokeOpacity, visible } = this;

        if (!data?.length || !xKey || !yKey) {
            return [];
        }

        // Area stacks should be listed in the legend in reverse order, for symmetry with the
        // vertical stack display order.
        return [
            {
                legendType: 'category',
                id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: yName ?? yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill ?? fill,
                    stroke: marker.stroke ?? stroke,
                    fillOpacity: marker.fillOpacity ?? fillOpacity,
                    strokeOpacity: marker.strokeOpacity ?? strokeOpacity,
                },
            },
        ];
    }

    animateEmptyUpdateReady({ markerSelections, labelSelections, contextData, paths, seriesRect }: AreaAnimationData) {
        const { seriesId, styles, ctx, formatter, getFormatterParams } = this.getAnimationOptions();
        areaAnimateEmptyUpdateReady({
            markerSelections,
            labelSelections,
            contextData,
            paths,
            seriesRect,
            styles,
            seriesId,
            ctx,
            formatter,
            getFormatterParams,
        });
    }

    animateReadyUpdate({ contextData, paths }: AreaAnimationData) {
        const { styles } = this.getAnimationOptions();
        areaAnimateReadyUpdate({ contextData, paths, styles });
    }

    animateReadyResize({ contextData, markerSelections, labelSelections, paths }: AreaAnimationData) {
        const { styles, ctx, formatter, getFormatterParams } = this.getAnimationOptions();

        areaResetMarkersAndPaths({
            contextData,
            markerSelections,
            labelSelections,
            paths,
            styles,
            ctx,
            formatter,
            getFormatterParams,
        });
    }

    getAnimationOptions() {
        const { id: seriesId, ctx, xKey = '', yKey = '', marker } = this;
        const styles = {
            stroke: this.stroke,
            fill: this.fill,
            fillOpacity: this.fillOpacity,
            lineDash: this.lineDash,
            lineDashOffset: this.lineDashOffset,
            strokeOpacity: this.strokeOpacity,
            shadow: this.shadow,
            strokeWidth: this.getStrokeWidth(this.strokeWidth),
        };

        const { size, formatter } = marker;
        const fill = marker.fill ?? styles.fill;
        const stroke = marker.stroke ?? styles.stroke;
        const strokeWidth = marker.strokeWidth ?? this.strokeWidth;
        const getFormatterParams = (
            nodeDatum: MarkerSelectionDatum
        ): AgCartesianSeriesMarkerFormatterParams<MarkerSelectionDatum> => {
            return {
                datum: nodeDatum.datum,
                xKey,
                yKey,
                seriesId,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false,
            };
        };

        return { seriesId, styles, ctx, formatter, getFormatterParams };
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
