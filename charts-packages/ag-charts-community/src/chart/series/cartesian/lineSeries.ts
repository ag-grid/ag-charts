import { Path } from "../../../scene/shape/path";
import { ContinuousScale } from "../../../scale/continuousScale";
import { Selection } from "../../../scene/selection";
import { Group } from "../../../scene/group";
import {
    SeriesNodeDatum,
    CartesianTooltipRendererParams as LineTooltipRendererParams,
    SeriesTooltip
} from "../series";
import { extent } from "../../../util/array";
import { PointerEvents } from "../../../scene/node";
import { Text } from "../../../scene/shape/text";
import { LegendDatum } from "../../legend";
import { CartesianSeries, CartesianSeriesMarker, CartesianSeriesMarkerFormat } from "./cartesianSeries";
import { ChartAxisDirection } from "../../chartAxis";
import { getMarker } from "../../marker/util";
import { TypedEvent } from "../../../util/observable";
import { TooltipRendererResult, toTooltipHtml } from "../../chart";
import { interpolate } from "../../../util/string";
import { FontStyle, FontWeight } from "../../../scene/shape/text";
import { Label } from "../../label";
import { sanitizeHtml } from "../../../util/sanitize";
import { isContinuous } from "../../../util/value";
import { Marker } from "../../marker/marker";

interface LineNodeDatum extends SeriesNodeDatum {
    readonly point: {
        readonly x: number;
        readonly y: number;
    }
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

export interface LineSeriesNodeClickEvent extends TypedEvent {
    readonly type: 'nodeClick';
    readonly event: MouseEvent;
    readonly series: LineSeries;
    readonly datum: any;
    readonly xKey: string;
    readonly yKey: string;
}

export { LineTooltipRendererParams };

class LineSeriesLabel extends Label {
    formatter?: (params: { value: any }) => string = undefined;
}

export class LineSeriesTooltip extends SeriesTooltip {
    renderer?: (params: LineTooltipRendererParams) => string | TooltipRendererResult = undefined;
    format?: string = undefined;
}

export class LineSeries extends CartesianSeries {

    static className = 'LineSeries';
    static type = 'line' as const;

    private xDomain: any[] = [];
    private yDomain: any[] = [];
    private xData: any[] = [];
    private yData: any[] = [];

    private lineNode = new Path();

    // We use groups for this selection even though each group only contains a marker ATM
    // because in the future we might want to add label support as well.
    private nodeSelection: Selection<Group, Group, LineNodeDatum, any> = Selection.select(this.seriesGroup).selectAll<Group>();
    private highlightSelection: Selection<Marker, Group, LineNodeDatum, any> = Selection.select(this.highlightGroup).selectAll<Marker>();
    private nodeData: LineNodeDatum[] = [];

    readonly marker = new CartesianSeriesMarker();

    readonly label = new LineSeriesLabel();

    title?: string = undefined;

    stroke?: string = '#874349';
    lineDash?: number[] = [0];
    lineDashOffset: number = 0;
    strokeWidth: number = 2;
    strokeOpacity: number = 1;

    tooltip: LineSeriesTooltip = new LineSeriesTooltip();

    constructor() {
        super();

        const lineNode = this.lineNode;
        lineNode.fill = undefined;
        lineNode.lineJoin = 'round';
        lineNode.pointerEvents = PointerEvents.None;
        // Make line render before markers in the pick group.
        this.seriesGroup.insertBefore(lineNode, this.pickGroup);

        const { marker, label } = this;

        marker.fill = '#c16068';
        marker.stroke = '#874349';

        label.enabled = false;
    }

    setColors(fills: string[], strokes: string[]) {
        this.stroke = fills[0];
        this.marker.stroke = strokes[0];
        this.marker.fill = fills[0];
    }

    protected _xKey: string = '';
    set xKey(value: string) {
        this._xKey = value;
        this.xData = [];
    }
    get xKey(): string {
        return this._xKey;
    }

    xName: string = '';

    protected _yKey: string = '';
    set yKey(value: string) {
        this._yKey = value;
        this.yData = [];
    }
    get yKey(): string {
        return this._yKey;
    }

    yName: string = '';

    processData(): boolean {
        const { xAxis, yAxis, xKey, yKey, xData, yData } = this;
        const data = xKey && yKey && this.data ? this.data : [];

        if (!xAxis || !yAxis) {
            return false;
        }

        const isContinuousX = xAxis.scale instanceof ContinuousScale;
        const isContinuousY = yAxis.scale instanceof ContinuousScale;

        xData.length = 0;
        yData.length = 0;

        for (let i = 0, n = data.length; i < n; i++) {
            const datum = data[i];
            const x = datum[xKey];
            const y = datum[yKey];

            const xDatum = this.checkDatum(x, isContinuousX);

            if (isContinuousX && xDatum === undefined) {
                continue;
            } else {
                xData.push(xDatum);
            }

            const yDatum = this.checkDatum(y, isContinuousY);
            yData.push(yDatum);
        }

        this.xDomain = isContinuousX ? this.fixNumericExtent(extent(xData, isContinuous), xAxis) : xData;
        this.yDomain = isContinuousY ? this.fixNumericExtent(extent(yData, isContinuous), yAxis) : yData;

        return true;
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.xDomain;
        }
        return this.yDomain;
    }

    resetHighlight() {
        this.lineNode.strokeWidth = this.strokeWidth;
    }

    update(): void {
        this.updateSelections();
        this.updateHighlightSelection();
        this.updateNodes();
    }

    private updateSelections() {
        if (!this.nodeDataRefresh) {
            return;
        }
        this.nodeDataRefresh = false;

        this.updateLinePath(); // this will create node data too
        this.updateNodeSelection();
    }

    private updateLinePath() {
        const { data, xAxis, yAxis } = this;

        if (!data || !xAxis || !yAxis) {
            return;
        }

        const { xData, yData, lineNode, label, xKey, yKey } = this;
        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;
        const linePath = lineNode.path;
        const nodeData: LineNodeDatum[] = [];

        linePath.clear({ trackChanges: true });
        let moveTo = true;
        let prevXInRange: undefined | -1 | 0 | 1 = undefined;
        let nextXYDatums: [number, number] | undefined = undefined;
        for (let i = 0; i < xData.length; i++) {
            const xyDatums = nextXYDatums || [xData[i], yData[i]];

            if (xyDatums[1] === undefined) {
                prevXInRange = undefined;
                moveTo = true;
            } else {
                const [xDatum, yDatum] = xyDatums;
                const x = xScale.convert(xDatum) + xOffset;
                if (isNaN(x)) {
                    prevXInRange = undefined;
                    moveTo = true;
                    continue;
                }
                const tolerance = (xScale.bandwidth || (this.marker.size * 0.5 + (this.marker.strokeWidth || 0))) + 1;

                nextXYDatums = yData[i + 1] === undefined ? undefined : [xData[i + 1], yData[i + 1]];
                const xInRange = xAxis.inRangeEx(x, 0, tolerance);
                const nextXInRange = nextXYDatums && xAxis.inRangeEx(xScale.convert(nextXYDatums[0]) + xOffset, 0, tolerance);
                if (xInRange === -1 && nextXInRange === -1) {
                    moveTo = true;
                    continue;
                }
                if (xInRange === 1 && prevXInRange === 1) {
                    moveTo = true;
                    continue;
                }
                prevXInRange = xInRange;

                const y = yScale.convert(yDatum) + yOffset;

                if (moveTo) {
                    linePath.moveTo(x, y);
                    moveTo = false;
                } else {
                    linePath.lineTo(x, y);
                }

                let labelText: string;

                if (label.formatter) {
                    labelText = label.formatter({ value: yDatum });
                } else {
                    labelText = typeof yDatum === 'number' && isFinite(yDatum) ? yDatum.toFixed(2) : yDatum ? String(yDatum) : '';
                }

                const seriesDatum = { [xKey]: xDatum, [yKey]: yDatum };

                nodeData.push({
                    series: this,
                    datum: seriesDatum,
                    point: { x, y },
                    label: labelText ? {
                        text: labelText,
                        fontStyle: label.fontStyle,
                        fontWeight: label.fontWeight,
                        fontSize: label.fontSize,
                        fontFamily: label.fontFamily,
                        textAlign: 'center',
                        textBaseline: 'bottom',
                        fill: label.color
                    } : undefined
                });
            }

            lineNode.checkPathDirty();
        }

        // Used by marker nodes and for hit-testing even when not using markers
        // when `chart.tooltip.tracking` is true.
        this.nodeData = nodeData;
    }

    private updateNodeSelection() {
        const { marker: { shape, enabled } } = this;
        const nodeData = shape && enabled ? this.nodeData : [];
        const MarkerShape = getMarker(shape);

        const { nodeSelection, highlightSelection } = this;

        const updateSelection = nodeSelection.setData(nodeData);
        updateSelection.exit.remove();
        const enterSelection = updateSelection.enter.append(Group);
        enterSelection.append(MarkerShape);
        enterSelection.append(Text);
        this.nodeSelection = updateSelection.merge(enterSelection);
    }

    private updateHighlightSelection() {
        const {
            marker: { shape, enabled },
            chart: { highlightedDatum: { datum = undefined, series = undefined } = {}, highlightedDatum = undefined } = {},
            highlightSelection,
        } = this;
        const highlightData = shape && enabled && series === this && highlightedDatum && datum ? [highlightedDatum as LineNodeDatum] : [];
        const MarkerShape = getMarker(shape);

        const updateHighlightSelection = highlightSelection.setData(highlightData);
        updateHighlightSelection.exit.remove();
        const enterHighlightSelection = updateHighlightSelection.enter.append(MarkerShape);
        this.highlightSelection = updateHighlightSelection.merge(enterHighlightSelection);
    }
    
    private updateNodes() {
        this.group.visible = this.visible;
        this.seriesGroup.visible = this.visible;
        this.highlightGroup.visible = this.visible && this.chart?.highlightedDatum?.series === this;

        this.seriesGroup.opacity = this.getOpacity();

        this.updateLineNode();
        this.updateMarkerNodes();
        this.updateTextNodes();
    }

    private updateLineNode() {
        const { lineNode } = this;

        lineNode.stroke = this.stroke;
        lineNode.strokeWidth = this.getStrokeWidth(this.strokeWidth);
        lineNode.strokeOpacity = this.strokeOpacity;

        lineNode.lineDash = this.lineDash;
        lineNode.lineDashOffset = this.lineDashOffset;
    }

    private updateMarkerNodes() {
        if (!this.chart) {
            return;
        }

        const {
            marker, xKey, yKey,
            stroke: lineStroke,
            chart: { highlightedDatum },
            highlightStyle: {
                fill: deprecatedFill,
                stroke: deprecatedStroke,
                strokeWidth: deprecatedStrokeWidth,
                item: {
                    fill: highlightedFill = deprecatedFill,
                    stroke: highlightedStroke = deprecatedStroke,
                    strokeWidth: highlightedDatumStrokeWidth = deprecatedStrokeWidth,
                }
            }
        } = this;
        const { size, formatter } = marker;
        const markerStrokeWidth = marker.strokeWidth !== undefined ? marker.strokeWidth : this.strokeWidth;
        const MarkerShape = getMarker(marker.shape);

        const updateMarkerFn = (node: Marker, datum: LineNodeDatum, isDatumHighlighted: boolean) => {
            const fill = isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : marker.fill;
            const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : marker.stroke || lineStroke;
            const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                ? highlightedDatumStrokeWidth
                : markerStrokeWidth;

            let format: CartesianSeriesMarkerFormat | undefined = undefined;
            if (formatter) {
                format = formatter({
                    datum: datum.datum,
                    xKey,
                    yKey,
                    fill,
                    stroke,
                    strokeWidth,
                    size,
                    highlighted: isDatumHighlighted
                });
            }

            node.fill = format && format.fill || fill;
            node.stroke = format && format.stroke || stroke;
            node.strokeWidth = format && format.strokeWidth !== undefined
                ? format.strokeWidth
                : strokeWidth;
            node.size = format && format.size !== undefined
                ? format.size
                : size;

            node.translationX = datum.point.x;
            node.translationY = datum.point.y;
            node.visible = node.size > 0;
        };

        this.nodeSelection.selectByClass(MarkerShape)
            .each((node, datum) => updateMarkerFn(node, datum, false));
        this.highlightSelection
            .each((node, datum) => {
                const isDatumHighlighted = datum === highlightedDatum;

                node.visible = isDatumHighlighted;
                if (node.visible) {
                    updateMarkerFn(node, datum, isDatumHighlighted);
                }
            });
    }

    private updateTextNodes() {
        const updateTextFn = (text: Text, datum: LineNodeDatum) => {
            const { point, label } = datum;
    
            const { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color } = this.label;
    
            if (label && labelEnabled) {
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
        };

        this.nodeSelection.selectByClass(Text)
            .each(updateTextFn);
        this.highlightSelection.selectByClass(Text)
            .each(updateTextFn);
    }

    getNodeData(): readonly LineNodeDatum[] {
        return this.nodeData;
    }

    fireNodeClickEvent(event: MouseEvent, datum: LineNodeDatum): void {
        this.fireEvent<LineSeriesNodeClickEvent>({
            type: 'nodeClick',
            event,
            series: this,
            datum: datum.datum,
            xKey: this.xKey,
            yKey: this.yKey
        });
    }

    getTooltipHtml(nodeDatum: LineNodeDatum): string {
        const { xKey, yKey, xAxis, yAxis } = this;

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, tooltip, marker } = this;
        const {
            renderer: tooltipRenderer,
            format: tooltipFormat
        } = tooltip;
        const datum = nodeDatum.datum;
        const xValue = datum[xKey];
        const yValue = datum[yKey];
        const xString = xAxis.formatDatum(xValue);
        const yString = yAxis.formatDatum(yValue);
        const title = sanitizeHtml(this.title || yName);
        const content = sanitizeHtml(xString + ': ' + yString);

        const { formatter: markerFormatter, fill, stroke, strokeWidth: markerStrokeWidth, size } = marker;
        const strokeWidth = markerStrokeWidth !== undefined ? markerStrokeWidth : this.strokeWidth;

        let format: CartesianSeriesMarkerFormat | undefined = undefined;
        if (markerFormatter) {
            format = markerFormatter({
                datum,
                xKey,
                yKey,
                fill,
                stroke,
                strokeWidth,
                size,
                highlighted: false
            });
        }

        const color = format && format.fill || fill;

        const defaults: TooltipRendererResult = {
            title,
            backgroundColor: color,
            content
        };

        if (tooltipFormat || tooltipRenderer) {
            const params = {
                datum,
                xKey,
                xValue,
                xName,
                yKey,
                yValue,
                yName,
                title,
                color
            };
            if (tooltipFormat) {
                return toTooltipHtml({
                    content: interpolate(tooltipFormat, params)
                }, defaults);
            }
            if (tooltipRenderer) {
                return toTooltipHtml(tooltipRenderer(params), defaults);
            }
        }

        return toTooltipHtml(defaults);
    }

    listSeriesItems(legendData: LegendDatum[]): void {
        const {
            id, data, xKey, yKey, yName, visible,
            title, marker, stroke, strokeOpacity
        } = this;

        if (data && data.length && xKey && yKey) {
            legendData.push({
                id: id,
                itemId: undefined,
                enabled: visible,
                label: {
                    text: title || yName || yKey
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill || 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke || stroke || 'rgba(0, 0, 0, 0)',
                    fillOpacity: 1,
                    strokeOpacity
                }
            });
        }
    }
}
