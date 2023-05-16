import { Selection } from '../../../scene/selection';
import { SeriesTooltip, SeriesNodeDataContext, SeriesNodePickMode, valueProperty } from '../series';
import { ChartLegendDatum, CategoryLegendDatum } from '../../legendDatum';
import { ColorScale } from '../../../scale/colorScale';
import { LinearScale } from '../../../scale/linearScale';
import {
    CartesianSeries,
    CartesianSeriesMarker,
    CartesianSeriesNodeBaseClickEvent,
    CartesianSeriesNodeDatum,
} from './cartesianSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { getMarker } from '../../marker/util';
import { toTooltipHtml } from '../../tooltip/tooltip';
import { ContinuousScale } from '../../../scale/continuousScale';
import { extent } from '../../../util/array';
import { sanitizeHtml } from '../../../util/sanitize';
import { Label } from '../../label';
import { Text } from '../../../scene/shape/text';
import { HdpiCanvas } from '../../../canvas/hdpiCanvas';
import { Marker } from '../../marker/marker';
import { MeasuredLabel, PointLabelDatum } from '../../../util/labelPlacement';
import {
    OPT_FUNCTION,
    OPT_STRING,
    STRING,
    OPT_NUMBER_ARRAY,
    COLOR_STRING_ARRAY,
    Validate,
} from '../../../util/validation';
import {
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    AgCartesianSeriesMarkerFormat,
} from '../../agChartOptions';
import { DataModel } from '../../data/dataModel';

interface ScatterNodeDatum extends Required<CartesianSeriesNodeDatum> {
    readonly label: MeasuredLabel;
    readonly fill: string | undefined;
}

class ScatterSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgScatterSeriesLabelFormatterParams<any>) => string = undefined;
}

class ScatterSeriesNodeBaseClickEvent extends CartesianSeriesNodeBaseClickEvent<any> {
    readonly sizeKey?: string;

    constructor(
        sizeKey: string | undefined,
        xKey: string,
        yKey: string,
        nativeEvent: MouseEvent,
        datum: ScatterNodeDatum,
        series: ScatterSeries
    ) {
        super(xKey, yKey, nativeEvent, datum, series);
        this.sizeKey = sizeKey;
    }
}

export class ScatterSeriesNodeClickEvent extends ScatterSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

export class ScatterSeriesNodeDoubleClickEvent extends ScatterSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

class ScatterSeriesTooltip extends SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgScatterSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

export class ScatterSeries extends CartesianSeries<SeriesNodeDataContext<ScatterNodeDatum>> {
    static className = 'ScatterSeries';
    static type = 'scatter' as const;

    private sizeScale = new LinearScale();

    readonly marker = new CartesianSeriesMarker();

    readonly label = new ScatterSeriesLabel();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_STRING)
    labelKey?: string = undefined;

    @Validate(STRING)
    xName: string = '';

    @Validate(STRING)
    yName: string = '';

    @Validate(OPT_STRING)
    sizeName?: string = 'Size';

    @Validate(OPT_STRING)
    labelName?: string = 'Label';

    @Validate(STRING)
    protected _xKey: string = '';
    set xKey(value: string) {
        this._xKey = value;
        this.processedData = undefined;
    }
    get xKey(): string {
        return this._xKey;
    }

    @Validate(STRING)
    protected _yKey: string = '';
    set yKey(value: string) {
        this._yKey = value;
        this.processedData = undefined;
    }
    get yKey(): string {
        return this._yKey;
    }

    @Validate(OPT_STRING)
    protected _sizeKey?: string = undefined;
    set sizeKey(value: string | undefined) {
        this._sizeKey = value;
        this.processedData = undefined;
    }
    get sizeKey(): string | undefined {
        return this._sizeKey;
    }

    @Validate(OPT_STRING)
    colorKey?: string = undefined;

    @Validate(OPT_STRING)
    colorName?: string = 'Color';

    @Validate(OPT_NUMBER_ARRAY)
    colorDomain: number[] | undefined = undefined;

    @Validate(COLOR_STRING_ARRAY)
    colorRange: string[] = ['#ffff00', '#00ff00', '#0000ff'];

    colorScale = new ColorScale();

    readonly tooltip: ScatterSeriesTooltip = new ScatterSeriesTooltip();

    constructor() {
        super({
            pickModes: [
                SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: 0,
            hasMarkers: true,
        });

        const { label } = this;

        label.enabled = false;
    }

    async processData() {
        const { xKey, yKey, sizeKey, xAxis, yAxis, marker, data } = this;

        const isContinuousX = xAxis?.scale instanceof ContinuousScale;
        const isContinuousY = yAxis?.scale instanceof ContinuousScale;

        const { colorScale, colorDomain, colorRange, colorKey } = this;

        this.dataModel = new DataModel<any>({
            props: [
                valueProperty(xKey, isContinuousX, { id: `xValue` }),
                valueProperty(yKey, isContinuousY, { id: `yValue` }),
                ...(sizeKey ? [valueProperty(sizeKey, true, { id: `sizeValue` })] : []),
                ...(colorKey ? [valueProperty(colorKey, true, { id: `colorValue` })] : []),
            ],
            dataVisible: this.visible,
        });
        this.processedData = this.dataModel.processData(data ?? []);

        if (sizeKey) {
            const sizeKeyIdx = this.dataModel.resolveProcessedDataIndexById(`sizeValue`)?.index ?? -1;
            const processedSize = this.processedData?.domain.values[sizeKeyIdx] ?? [];
            this.sizeScale.domain = marker.domain ? marker.domain : processedSize;
        }

        if (colorKey) {
            const colorKeyIdx = this.dataModel.resolveProcessedDataIndexById(`colorValue`)?.index ?? -1;
            colorScale.domain = colorDomain ?? this.processedData!.domain.values[colorKeyIdx];
            colorScale.range = colorRange;
        }
    }

    getDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const id = direction === ChartAxisDirection.X ? `xValue` : `yValue`;
        const dataDef = dataModel.resolveProcessedDataDefById(id);
        const domain = dataModel.getDomain(id, processedData);
        if (dataDef?.valueType === 'category') {
            return domain;
        }
        const axis = direction === ChartAxisDirection.X ? this.xAxis : this.yAxis;
        return this.fixNumericExtent(extent(domain), axis);
    }

    protected getNodeClickEvent(event: MouseEvent, datum: ScatterNodeDatum): ScatterSeriesNodeClickEvent {
        return new ScatterSeriesNodeClickEvent(this.sizeKey, this.xKey, this.yKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(event: MouseEvent, datum: ScatterNodeDatum): ScatterSeriesNodeDoubleClickEvent {
        return new ScatterSeriesNodeDoubleClickEvent(this.sizeKey, this.xKey, this.yKey, event, datum, this);
    }

    async createNodeData() {
        const { visible, xAxis, yAxis, yKey, xKey, label, labelKey } = this;

        const xDataIdx = this.dataModel?.resolveProcessedDataIndexById(`xValue`);
        const yDataIdx = this.dataModel?.resolveProcessedDataIndexById(`yValue`);

        if (!(xDataIdx && yDataIdx && visible && xAxis && yAxis)) {
            return [];
        }

        const { colorScale, sizeKey, colorKey, id: seriesId } = this;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth || 0) / 2;
        const yOffset = (yScale.bandwidth || 0) / 2;
        const { sizeScale, marker } = this;
        const nodeData: ScatterNodeDatum[] = new Array(this.processedData?.data.length ?? 0);

        sizeScale.range = [marker.size, marker.maxSize];

        const font = label.getFont();
        let actualLength = 0;
        for (const { values, datum } of this.processedData?.data ?? []) {
            const xDatum = values[xDataIdx.index];
            const yDatum = values[yDataIdx.index];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            if (!this.checkRangeXY(x, y, xAxis, yAxis)) {
                continue;
            }

            let text: string;
            if (label.formatter) {
                text = label.formatter({ value: yDatum, seriesId, datum });
            } else {
                text = labelKey ? String(datum[labelKey]) : '';
            }

            const size = HdpiCanvas.getTextSize(text, font);
            const markerSize = sizeKey ? sizeScale.convert(values[2]) : marker.size;
            const fill = colorKey ? colorScale.convert(values[sizeKey ? 3 : 2]) : undefined;

            nodeData[actualLength++] = {
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                point: { x, y, size: markerSize },
                nodeMidPoint: { x, y },
                fill,
                label: {
                    text,
                    ...size,
                },
            };
        }

        nodeData.length = actualLength;

        return [{ itemId: this.yKey, nodeData, labelData: nodeData }];
    }

    protected isPathOrSelectionDirty(): boolean {
        return this.marker.isDirty();
    }

    getLabelData(): PointLabelDatum[] {
        return this.contextNodeData?.reduce((r, n) => r.concat(n.labelData), [] as PointLabelDatum[]);
    }

    protected markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected async updateMarkerSelection(opts: {
        nodeData: ScatterNodeDatum[];
        markerSelection: Selection<Marker, ScatterNodeDatum>;
    }) {
        const { nodeData, markerSelection } = opts;
        const {
            marker: { enabled },
        } = this;

        if (this.marker.isDirty()) {
            markerSelection.clear();
        }

        const data = enabled ? nodeData : [];
        return markerSelection.update(data);
    }

    protected async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, ScatterNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: isDatumHighlighted } = opts;
        const {
            marker,
            xKey,
            yKey,
            sizeScale,
            marker: {
                fillOpacity: markerFillOpacity,
                strokeOpacity: markerStrokeOpacity,
                strokeWidth: markerStrokeWidth,
            },
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    fillOpacity: highlightFillOpacity = markerFillOpacity,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                },
            },
            id: seriesId,
        } = this;
        const { formatter } = marker;

        sizeScale.range = [marker.size, marker.maxSize];

        const customMarker = typeof marker.shape === 'function';

        markerSelection.each((node, datum) => {
            const fill =
                isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : datum.fill ?? marker.fill;
            const fillOpacity = isDatumHighlighted ? highlightFillOpacity : markerFillOpacity;
            const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : marker.stroke;
            const strokeOpacity = markerStrokeOpacity;
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : markerStrokeWidth ?? 1;
            const size = datum.point?.size ?? 0;

            let format: AgCartesianSeriesMarkerFormat | undefined = undefined;
            if (formatter) {
                format = formatter({
                    datum: datum.datum,
                    xKey,
                    yKey,
                    fill,
                    stroke,
                    strokeWidth,
                    size,
                    highlighted: isDatumHighlighted,
                    seriesId,
                });
            }

            node.fill = (format && format.fill) || fill;
            node.stroke = (format && format.stroke) || stroke;
            node.strokeWidth = format?.strokeWidth ?? strokeWidth;
            node.size = format && format.size !== undefined ? format.size : size;
            node.fillOpacity = fillOpacity ?? 1;
            node.strokeOpacity = strokeOpacity ?? 1;
            node.translationX = datum.point?.x ?? 0;
            node.translationY = datum.point?.y ?? 0;
            node.visible = node.size > 0;

            if (!customMarker || node.dirtyPath) {
                return;
            }

            // Only for cutom marker shapes
            node.path.clear({ trackChanges: true });
            node.updatePath();
            node.checkPathDirty();
        });

        if (!isDatumHighlighted) {
            this.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: ScatterNodeDatum[];
        labelSelection: Selection<Text, ScatterNodeDatum>;
    }) {
        const { labelSelection } = opts;
        const {
            label: { enabled },
        } = this;

        const placedLabels = enabled ? this.chart?.placeLabels().get(this) ?? [] : [];

        const placedNodeDatum = placedLabels.map(
            (v): ScatterNodeDatum => ({
                ...(v.datum as ScatterNodeDatum),
                point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                },
            })
        );
        return labelSelection.update(placedNodeDatum);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, ScatterNodeDatum> }) {
        const { labelSelection } = opts;
        const { label } = this;

        labelSelection.each((text, datum) => {
            text.text = datum.label.text;
            text.fill = label.color;
            text.x = datum.point?.x ?? 0;
            text.y = datum.point?.y ?? 0;
            text.fontStyle = label.fontStyle;
            text.fontWeight = label.fontWeight;
            text.fontSize = label.fontSize;
            text.fontFamily = label.fontFamily;
            text.textAlign = 'left';
            text.textBaseline = 'top';
        });
    }

    getTooltipHtml(nodeDatum: ScatterNodeDatum): string {
        const { xKey, yKey, xAxis, yAxis } = this;

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { marker, tooltip, xName, yName, sizeKey, sizeName, labelKey, labelName, id: seriesId } = this;

        const { stroke } = marker;
        const fill = nodeDatum.fill ?? marker.fill;
        const strokeWidth = this.getStrokeWidth(marker.strokeWidth ?? 1);

        const { formatter } = this.marker;
        let format: AgCartesianSeriesMarkerFormat | undefined = undefined;

        if (formatter) {
            format = formatter({
                datum: nodeDatum,
                xKey,
                yKey,
                fill,
                stroke,
                strokeWidth,
                size: nodeDatum.point?.size ?? 0,
                highlighted: false,
                seriesId,
            });
        }

        const color = (format && format.fill) || fill || 'gray';
        const title = this.title || yName;
        const datum = nodeDatum.datum;
        const xValue = datum[xKey];
        const yValue = datum[yKey];
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName || xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName || yKey)}</b>: ${yString}`;

        if (sizeKey) {
            content += `<br><b>${sanitizeHtml(sizeName || sizeKey)}</b>: ${sanitizeHtml(datum[sizeKey])}`;
        }

        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName || labelKey)}</b>: ${sanitizeHtml(datum[labelKey])}<br>` + content;
        }

        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        const { renderer: tooltipRenderer } = tooltip;

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
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
                    color,
                    seriesId,
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): ChartLegendDatum[] {
        const { id, data, xKey, yKey, yName, title, visible, marker } = this;
        const { fill, stroke, fillOpacity, strokeOpacity } = marker;

        if (!(data && data.length && xKey && yKey)) {
            return [];
        }

        const legendData: CategoryLegendDatum[] = [
            {
                legendType: 'category',
                id,
                itemId: yKey,
                seriesId: id,
                enabled: visible,
                label: {
                    text: title || yName || yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill || fill || 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke || stroke || 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity ?? 1,
                    strokeOpacity: strokeOpacity ?? 1,
                },
            },
        ];
        return legendData;
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
