import { Selection } from "../../../scene/selection";
import { Group } from "../../../scene/group";
import { SeriesNodeDatum, CartesianTooltipRendererParams, SeriesTooltip } from "../series";
import { extent } from "../../../util/array";
import { LegendDatum } from "../../legend";
import { LinearScale } from "../../../scale/linearScale";
import { reactive, TypedEvent } from "../../../util/observable";
import { CartesianSeries, CartesianSeriesMarker, CartesianSeriesMarkerFormat } from "./cartesianSeries";
import { ChartAxisDirection } from "../../chartAxis";
import { getMarker } from "../../marker/util";
import { TooltipRendererResult, toTooltipHtml } from "../../chart";
import ContinuousScale from "../../../scale/continuousScale";
import { sanitizeHtml } from "../../../util/sanitize";
import { Label } from "../../label";
import { Text } from "../../../scene/shape/text";
import { HdpiCanvas } from "../../../canvas/hdpiCanvas";
import { Marker } from "../../marker/marker";
import { MeasuredLabel, PlacedLabel, PointLabelDatum } from "../../../util/labelPlacement";
import { isContinuous } from "../../../util/value";

interface ScatterNodeDatum extends SeriesNodeDatum {
    readonly point: {
        readonly x: number;
        readonly y: number;
    };
    readonly size: number;
    readonly label: MeasuredLabel;
}

export interface ScatterSeriesNodeClickEvent extends TypedEvent {
    readonly type: 'nodeClick';
    readonly event: MouseEvent;
    readonly series: ScatterSeries;
    readonly datum: any;
    readonly xKey: string;
    readonly yKey: string;
    readonly sizeKey?: string;
}

export interface ScatterTooltipRendererParams extends CartesianTooltipRendererParams {
    readonly sizeKey?: string;
    readonly sizeName?: string;

    readonly labelKey?: string;
    readonly labelName?: string;
}

export class ScatterSeriesTooltip extends SeriesTooltip {
    @reactive('change') renderer?: (params: ScatterTooltipRendererParams) => string | TooltipRendererResult;
}

export class ScatterSeries extends CartesianSeries {

    static className = 'ScatterSeries';
    static type = 'scatter';

    private xDomain: number[] = [];
    private yDomain: number[] = [];
    private xData: any[] = [];
    private yData: any[] = [];
    private sizeData: number[] = [];
    private sizeScale = new LinearScale();

    private nodeData: ScatterNodeDatum[] = [];
    private markerSelection: Selection<Marker, Group, ScatterNodeDatum, any> = Selection.select(this.pickGroup).selectAll<Marker>();

    private labelData: MeasuredLabel[] = [];
    private labelSelection: Selection<Text, Group, PlacedLabel, any> = Selection.select(this.group).selectAll<Text>();

    readonly marker = new CartesianSeriesMarker();

    readonly label = new Label();

    private _fill: string | undefined = '#c16068';
    set fill(value: string | undefined) {
        if (this._fill !== value) {
            this._fill = value;
            this.scheduleData();
        }
    }

    get fill(): string | undefined {
        return this._fill;
    }

    private _stroke: string | undefined = '#874349';
    set stroke(value: string | undefined) {
        if (this._stroke !== value) {
            this._stroke = value;
            this.scheduleData();
        }
    }

    get stroke(): string | undefined {
        return this._stroke;
    }

    private _strokeWidth: number = 2;
    set strokeWidth(value: number) {
        if (this._strokeWidth !== value) {
            this._strokeWidth = value;
            this.update();
        }
    }

    get strokeWidth(): number {
        return this._strokeWidth;
    }

    private _fillOpacity: number = 1;
    set fillOpacity(value: number) {
        if (this._fillOpacity !== value) {
            this._fillOpacity = value;
            this.scheduleLayout();
        }
    }

    get fillOpacity(): number {
        return this._fillOpacity;
    }

    private _strokeOpacity: number = 1;
    set strokeOpacity(value: number) {
        if (this._strokeOpacity !== value) {
            this._strokeOpacity = value;
            this.scheduleLayout();
        }
    }
    get strokeOpacity(): number {
        return this._strokeOpacity;
    }

    onHighlightChange() {
        this.updateMarkerNodes();
    }

    @reactive('layoutChange') title?: string;
    @reactive('dataChange') xKey: string = '';
    @reactive('dataChange') yKey: string = '';
    @reactive('dataChange') sizeKey?: string;
    @reactive('dataChange') labelKey?: string;

    xName: string = '';
    yName: string = '';
    sizeName?: string = 'Size';
    labelName?: string = 'Label';

    readonly tooltip: ScatterSeriesTooltip = new ScatterSeriesTooltip();

    constructor() {
        super();

        const { marker, label } = this;

        marker.addPropertyListener('shape', this.onMarkerShapeChange, this);
        marker.addEventListener('change', this.scheduleUpdate, this);

        this.addPropertyListener('xKey', () => this.xData = []);
        this.addPropertyListener('yKey', () => this.yData = []);
        this.addPropertyListener('sizeKey', () => this.sizeData = []);

        label.enabled = false;
        label.addEventListener('change', this.scheduleUpdate, this);
        label.addEventListener('dataChange', this.scheduleData, this);
        label.addPropertyListener('fontSize', this.scheduleData, this);
    }

    onMarkerShapeChange() {
        this.markerSelection = this.markerSelection.setData([]);
        this.markerSelection.exit.remove();
        this.update();

        this.fireEvent({ type: 'legendChange' });
    }

    setColors(fills: string[], strokes: string[]) {
        this.fill = fills[0];
        this.stroke = strokes[0];
        this.marker.fill = fills[0];
        this.marker.stroke = strokes[0];
    }

    processData(): boolean {
        const { xKey, yKey, sizeKey, labelKey, xAxis, yAxis, marker, label } = this;

        if (!xAxis || !yAxis) {
            return false;
        }

        const data = xKey && yKey && this.data ? this.data : [];

        this.xData = data.map(d => d[xKey]);
        this.yData = data.map(d => d[yKey]);

        this.sizeData = sizeKey ? data.map(d => d[sizeKey]) : [];

        const font = label.getFont();
        this.labelData = labelKey ? data.map(d => {
            const text = String(d[labelKey]);
            const size = HdpiCanvas.getTextSize(text, font);
            return {
                text,
                ...size
            };
        }) : [];

        this.sizeScale.domain = marker.domain ? marker.domain : extent(this.sizeData, isContinuous) || [1, 1];
        if (xAxis.scale instanceof ContinuousScale) {
            this.xDomain = this.fixNumericExtent(extent(this.xData, isContinuous), 'x');
        } else {
            this.xDomain = this.xData;
        }
        if (yAxis.scale instanceof ContinuousScale) {
            this.yDomain = this.fixNumericExtent(extent(this.yData, isContinuous), 'y');
        } else {
            this.yDomain = this.yData;
        }

        return true;
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.xDomain;
        } else {
            return this.yDomain;
        }
    }

    getNodeData(): readonly ScatterNodeDatum[] {
        return this.nodeData;
    }

    getLabelData(): readonly PointLabelDatum[] {
        return this.nodeData;
    }

    fireNodeClickEvent(event: MouseEvent, datum: ScatterNodeDatum): void {
        this.fireEvent<ScatterSeriesNodeClickEvent>({
            type: 'nodeClick',
            event,
            series: this,
            datum: datum.seriesDatum,
            xKey: this.xKey,
            yKey: this.yKey,
            sizeKey: this.sizeKey
        });
    }

    createNodeData(): ScatterNodeDatum[] {
        const { data, xAxis, yAxis } = this;

        if (!data || !xAxis || !yAxis) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const isContinuousX = xScale instanceof ContinuousScale;
        const isContinuousY = yScale instanceof ContinuousScale;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;
        const { xData, yData, sizeData, sizeScale, marker } = this;
        const nodeData: ScatterNodeDatum[] = [];

        sizeScale.range = [marker.size, marker.maxSize];

        for (let i = 0; i < xData.length; i++) {
            const xDatum = xData[i];
            const yDatum = yData[i];
            const noDatum =
                yDatum == null || (isContinuousY && (isNaN(yDatum) || !isFinite(yDatum))) ||
                xDatum == null || (isContinuousX && (isNaN(xDatum) || !isFinite(xDatum)));
            if (noDatum) {
                continue;
            }

            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;
            if (!(xAxis.inRange(x) && yAxis.inRange(y))) {
                continue;
            }

            nodeData.push({
                series: this,
                seriesDatum: data[i],
                point: { x, y },
                size: sizeData.length ? sizeScale.convert(sizeData[i]) : marker.size,
                label: this.labelData[i]
            });
        }

        return this.nodeData = nodeData;
    }

    update(): void {
        const { visible, chart, xAxis, yAxis } = this;

        this.group.visible = visible;

        if (!visible || !chart || chart.layoutPending || chart.dataPending || !xAxis || !yAxis) {
            return;
        }

        this.createNodeData();

        this.updateMarkerSelection(this.nodeData);
        this.updateLabelSelection();

        this.updateMarkerNodes();
        this.updateLabelNodes();
    }

    private updateLabelSelection(): void {
        const placedLabels: PlacedLabel[] = this.chart && this.chart.placeLabels().get(this) || [];
        const updateLabels = this.labelSelection.setData(placedLabels);
        updateLabels.exit.remove();
        const enterLabels = updateLabels.enter.append(Text);
        this.labelSelection = updateLabels.merge(enterLabels);
    }

    private updateMarkerSelection(nodeData: ScatterNodeDatum[]): void {
        const MarkerShape = getMarker(this.marker.shape);
        const updateMarkers = this.markerSelection.setData(nodeData);
        updateMarkers.exit.remove();
        const enterMarkers = updateMarkers.enter.append(MarkerShape);
        this.markerSelection = updateMarkers.merge(enterMarkers);
    }

    private updateLabelNodes() {
        const { label } = this;
        this.labelSelection.each((text, datum) => {
            text.text = datum.text;
            text.fill = label.color;
            text.x = datum.x;
            text.y = datum.y;
            text.fontStyle = label.fontStyle;
            text.fontWeight = label.fontWeight;
            text.fontSize = label.fontSize;
            text.fontFamily = label.fontFamily;
            text.textAlign = 'left';
            text.textBaseline = 'top';
        });
    }

    private updateMarkerNodes(): void {
        if (!this.chart) {
            return;
        }

        const { highlightedDatum } = this.chart;
        const { marker, xKey, yKey, fill, stroke, strokeWidth, fillOpacity, strokeOpacity } = this;
        const { fill: highlightFill, stroke: highlightStroke } = this.highlightStyle;
        const markerStrokeWidth = marker.strokeWidth !== undefined ? marker.strokeWidth : strokeWidth;
        const markerFormatter = marker.formatter;

        this.markerSelection.each((node, datum) => {
            const highlighted = datum === highlightedDatum;
            const markerFill = highlighted && highlightFill !== undefined ? highlightFill : marker.fill || fill;
            const markerStroke = highlighted && highlightStroke !== undefined ? highlightStroke : marker.stroke || stroke;
            let markerFormat: CartesianSeriesMarkerFormat | undefined = undefined;

            if (markerFormatter) {
                markerFormat = markerFormatter({
                    datum: datum.seriesDatum,
                    xKey,
                    yKey,
                    fill: markerFill,
                    stroke: markerStroke,
                    strokeWidth: markerStrokeWidth,
                    size: datum.size,
                    highlighted
                });
            }

            node.fill = markerFormat && markerFormat.fill || markerFill;
            node.stroke = markerFormat && markerFormat.stroke || markerStroke;
            node.strokeWidth = markerFormat && markerFormat.strokeWidth !== undefined
                ? markerFormat.strokeWidth
                : markerStrokeWidth;
            node.size = markerFormat && markerFormat.size !== undefined
                ? markerFormat.size
                : datum.size;
            node.fillOpacity = fillOpacity;
            node.strokeOpacity = strokeOpacity;
            node.translationX = datum.point.x;
            node.translationY = datum.point.y;
            node.visible = marker.enabled && node.size > 0;
        });
    }

    getTooltipHtml(nodeDatum: ScatterNodeDatum): string {
        const { xKey, yKey, xAxis, yAxis } = this;

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const {
            tooltip,
            xName,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName
        } = this;

        const { renderer: tooltipRenderer } = tooltip;
        const color = this.marker.fill || this.fill || 'gray';
        const title = this.title || yName;
        const datum = nodeDatum.seriesDatum;
        const xValue = datum[xKey];
        const yValue = datum[yKey];
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content = `<b>${sanitizeHtml(xName || xKey)}</b>: ${xString}`
            + `<br><b>${sanitizeHtml(yName || yKey)}</b>: ${yString}`;

        if (sizeKey) {
            content += `<br><b>${sanitizeHtml(sizeName || sizeKey)}</b>: ${sanitizeHtml(datum[sizeKey])}`;
        }

        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName || labelKey)}</b>: ${sanitizeHtml(datum[labelKey])}<br>` + content;
        }

        const defaults: TooltipRendererResult = {
            title,
            backgroundColor: color,
            content
        };

        if (tooltipRenderer) {
            return toTooltipHtml(tooltipRenderer({
                datum,
                xKey,
                xValue,
                xName,
                yKey,
                yValue,
                yName,
                sizeKey,
                sizeName,
                labelKey,
                labelName,
                title,
                color
            }), defaults);
        }

        return toTooltipHtml(defaults);
    }

    listSeriesItems(legendData: LegendDatum[]): void {
        const {
            id, data, xKey, yKey, yName,
            title, visible, marker, fill, stroke, fillOpacity, strokeOpacity
        } = this;

    if (data && data.length && xKey && yKey) {
            legendData.push({
                id,
                itemId: undefined,
                enabled: visible,
                label: {
                    text: title || yName || yKey
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill || fill || 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke || stroke || 'rgba(0, 0, 0, 0)',
                    fillOpacity,
                    strokeOpacity
                }
            });
        }
    }
}