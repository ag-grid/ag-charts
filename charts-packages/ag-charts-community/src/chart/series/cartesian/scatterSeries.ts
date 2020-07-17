import { Selection } from "../../../scene/selection";
import { Group } from "../../../scene/group";
import { SeriesNodeDatum, CartesianTooltipRendererParams, HighlightStyle } from "../series";
import { finiteExtent } from "../../../util/array";
import { toFixed } from "../../../util/number";
import { LegendDatum } from "../../legend";
import { LinearScale } from "../../../scale/linearScale";
import { reactive, TypedEvent } from "../../../util/observable";
import { CartesianSeries, CartesianSeriesMarker, CartesianSeriesMarkerFormat } from "./cartesianSeries";
import { ChartAxisDirection } from "../../chartAxis";
import { getMarker } from "../../marker/util";
import { Chart } from "../../chart";
import ContinuousScale from "../../../scale/continuousScale";

interface ScatterNodeDatum extends SeriesNodeDatum {
    point: {
        x: number;
        y: number;
    };
    size: number;
}

export interface ScatterSeriesNodeClickEvent extends TypedEvent {
    type: 'nodeClick';
    series: ScatterSeries;
    datum: any;
    xKey: string;
    yKey: string;
    sizeKey?: string;
}

export interface ScatterTooltipRendererParams extends CartesianTooltipRendererParams {
    sizeKey?: string;
    sizeName?: string;

    labelKey?: string;
    labelName?: string;
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

    private nodeSelection: Selection<Group, Group, ScatterNodeDatum, any> = Selection.select(this.group).selectAll<Group>();
    private nodeData: ScatterNodeDatum[] = [];

    readonly marker = new CartesianSeriesMarker();

    private _fill: string | undefined = undefined;
    set fill(value: string | undefined) {
        if (this._fill !== value) {
            this._fill = value;
            this.scheduleData();
        }
    }
    get fill(): string | undefined {
        return this._fill;
    }

    private _stroke: string | undefined = undefined;
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

    highlightStyle: HighlightStyle = { fill: 'yellow' };

    onHighlightChange() {
        this.updateNodes();
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

    tooltipRenderer?: (params: ScatterTooltipRendererParams) => string;

    constructor() {
        super();

        const { marker } = this;
        marker.addPropertyListener('shape', this.onMarkerShapeChange, this);
        marker.addEventListener('change', this.update, this);

        this.addPropertyListener('xKey', () => this.xData = []);
        this.addPropertyListener('yKey', () => this.yData = []);
        this.addPropertyListener('sizeKey', () => this.sizeData = []);
    }

    onMarkerShapeChange() {
        this.nodeSelection = this.nodeSelection.setData([]);
        this.nodeSelection.exit.remove();
        this.update();

        this.fireEvent({ type: 'legendChange' });
    }

    setColors(fills: string[], strokes: string[]) {
        this.fill = fills[0];
        this.stroke = strokes[0];
    }

    processData(): boolean {
        const { xKey, yKey, sizeKey, xAxis, yAxis } = this;

        const data = xKey && yKey && this.data ? this.data : [];

        this.xData = data.map(d => d[xKey]);
        this.yData = data.map(d => d[yKey]);

        if (sizeKey) {
            this.sizeData = data.map(d => d[sizeKey]);
        } else {
            this.sizeData = [];
        }

        this.sizeScale.domain = finiteExtent(this.sizeData) || [1, 1];
        if (xAxis.scale instanceof ContinuousScale) {
            this.xDomain = this.fixNumericExtent(finiteExtent(this.xData), 'x');
        } else {
            this.xDomain = this.xData;
        }
        if (yAxis.scale instanceof ContinuousScale) {
            this.yDomain = this.fixNumericExtent(finiteExtent(this.yData), 'y');
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

    getNodeData(): ScatterNodeDatum[] {
        return this.nodeData;
    }

    fireNodeClickEvent(datum: ScatterNodeDatum): void {
        this.fireEvent<ScatterSeriesNodeClickEvent>({
            type: 'nodeClick',
            series: this,
            datum: datum.seriesDatum,
            xKey: this.xKey,
            yKey: this.yKey,
            sizeKey: this.sizeKey
        });
    }

    private generateNodeData(): ScatterNodeDatum[] {
        const xScale = this.xAxis.scale;
        const yScale = this.yAxis.scale;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;

        const { data, xData, yData, sizeData, sizeScale, marker } = this;

        sizeScale.range = [marker.minSize, marker.size];

        return xData.map((xDatum, i) => ({
            series: this,
            seriesDatum: data[i],
            point: {
                x: xScale.convert(xDatum) + xOffset,
                y: yScale.convert(yData[i]) + yOffset
            },
            size: sizeData.length ? sizeScale.convert(sizeData[i]) : marker.size
        }));
    }

    update(): void {
        const { visible, chart, xAxis, yAxis } = this;

        this.group.visible = visible;

        if (!visible || !chart || chart.layoutPending || chart.dataPending || !xAxis || !yAxis) {
            return;
        }

        const nodeData = this.nodeData = this.generateNodeData();

        this.updateNodeSelection(nodeData);
        this.updateNodes();
    }

    private updateNodeSelection(nodeData: ScatterNodeDatum[]): void {
        const MarkerShape = getMarker(this.marker.shape);

        const updateSelection = this.nodeSelection.setData(nodeData);
        updateSelection.exit.remove();

        const enterSelection = updateSelection.enter.append(Group);
        enterSelection.append(MarkerShape);

        this.nodeSelection = updateSelection.merge(enterSelection);
    }

    private updateNodes(): void {
        const { highlightedDatum } = this.chart;
        const { marker, xKey, yKey, fill, stroke, strokeWidth, fillOpacity, strokeOpacity } = this;
        const { fill: highlightFill, stroke: highlightStroke } = this.highlightStyle;
        const markerStrokeWidth = marker.strokeWidth !== undefined ? marker.strokeWidth : strokeWidth;
        const MarkerShape = getMarker(marker.shape);
        const markerFormatter = marker.formatter;

        this.nodeSelection.selectByClass(MarkerShape)
            .each((node, datum) => {
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
        const { xKey, yKey } = this;

        if (!xKey || !yKey) {
            return '';
        }

        const {
            tooltipRenderer,
            xName,
            yName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            fill
        } = this;

        const color = fill || 'gray';

        if (tooltipRenderer) {
            return tooltipRenderer({
                datum: nodeDatum.seriesDatum,
                xKey,
                yKey,
                sizeKey,
                labelKey,
                xName,
                yName,
                sizeName,
                labelName,
                title: this.title,
                color
            });
        } else {
            const title = this.title || yName;
            const titleStyle = `style="color: white; background-color: ${color}"`;
            const titleHtml = title ? `<div class="${Chart.defaultTooltipClass}-title" ${titleStyle}>${title}</div>` : '';
            const seriesDatum = nodeDatum.seriesDatum;
            const xValue = seriesDatum[xKey];
            const yValue = seriesDatum[yKey];
            let contentHtml = `<b>${xName || xKey}</b>: ${typeof xValue === 'number' ? toFixed(xValue) : xValue}`
                + `<br><b>${yName || yKey}</b>: ${typeof yValue === 'number' ? toFixed(yValue) : yValue}`;

            if (sizeKey) {
                contentHtml += `<br><b>${sizeName}</b>: ${seriesDatum[sizeKey]}`;
            }

            if (labelKey) {
                contentHtml = `<b>${labelName}</b>: ${seriesDatum[labelKey]}<br>` + contentHtml;
            }

            return `${titleHtml}<div class="${Chart.defaultTooltipClass}-content">${contentHtml}</div>`;
        }
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
                    fill: marker.fill || fill,
                    stroke: marker.stroke || stroke,
                    fillOpacity,
                    strokeOpacity
                }
            });
        }
    }
}
