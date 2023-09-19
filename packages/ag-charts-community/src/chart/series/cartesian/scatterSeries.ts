import type { Selection } from '../../../scene/selection';
import type { SeriesNodeDataContext } from '../series';
import { SeriesTooltip, SeriesNodePickMode, valueProperty, keyProperty } from '../series';
import type { ChartLegendDatum, CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import { ColorScale } from '../../../scale/colorScale';
import type { CartesianAnimationData, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesMarker } from './cartesianSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { getMarker } from '../../marker/util';
import { ContinuousScale } from '../../../scale/continuousScale';
import { extent } from '../../../util/array';
import { sanitizeHtml } from '../../../util/sanitize';
import { Label } from '../../label';
import type { Text } from '../../../scene/shape/text';
import { HdpiCanvas } from '../../../canvas/hdpiCanvas';
import type { Marker } from '../../marker/marker';
import type { MeasuredLabel, PointLabelDatum } from '../../../util/labelPlacement';
import { OPT_FUNCTION, OPT_STRING, OPT_NUMBER_ARRAY, COLOR_STRING_ARRAY, Validate } from '../../../util/validation';
import { zipObject } from '../../../util/zip';
import type {
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    AgCartesianSeriesMarkerFormat,
} from '../../../options/agChartOptions';
import type { ModuleContext } from '../../../util/moduleContext';
import type { DataController } from '../../data/dataController';
import { createDatumId, diff } from '../../data/processors';
import * as easing from '../../../motion/easing';
import { getMarkerConfig, updateMarker } from './markerUtil';

interface ScatterNodeDatum extends Required<CartesianSeriesNodeDatum> {
    readonly label: MeasuredLabel;
    readonly fill: string | undefined;
}

type ScatterAnimationData = CartesianAnimationData<SeriesNodeDataContext<ScatterNodeDatum>, any>;

class ScatterSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgScatterSeriesLabelFormatterParams<any>) => string = undefined;
}

export class ScatterSeries extends CartesianSeries<SeriesNodeDataContext<ScatterNodeDatum>> {
    static className = 'ScatterSeries';
    static type = 'scatter' as const;

    readonly marker = new CartesianSeriesMarker();

    readonly label = new ScatterSeriesLabel();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_STRING)
    labelKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(OPT_STRING)
    labelName?: string = 'Label';

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    colorKey?: string = undefined;

    @Validate(OPT_STRING)
    colorName?: string = 'Color';

    @Validate(OPT_NUMBER_ARRAY)
    colorDomain: number[] | undefined = undefined;

    @Validate(COLOR_STRING_ARRAY)
    colorRange: string[] = ['#ffff00', '#00ff00', '#0000ff'];

    colorScale = new ColorScale();

    readonly tooltip = new SeriesTooltip<AgScatterSeriesTooltipRendererParams>();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
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

    async processData(dataController: DataController) {
        const {
            xKey = '',
            yKey = '',
            labelKey,
            axes,
            data,
            ctx: { animationManager },
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];
        const isContinuousX = xAxis?.scale instanceof ContinuousScale;
        const isContinuousY = yAxis?.scale instanceof ContinuousScale;

        const { colorScale, colorDomain, colorRange, colorKey } = this;

        const { dataModel, processedData } = await dataController.request<any, any, true>(this.id, data ?? [], {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xKey-raw' }),
                keyProperty(this, yKey, isContinuousY, { id: 'yKey-raw' }),
                ...(labelKey ? [keyProperty(this, labelKey, false, { id: `labelKey-raw` })] : []),
                valueProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, yKey, isContinuousY, { id: `yValue` }),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: `colorValue` })] : []),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: `labelValue` })] : []),
                ...(!animationManager.isSkipped() && this.processedData ? [diff(this.processedData)] : []),
            ],
            dataVisible: this.visible,
        });
        this.dataModel = dataModel;
        this.processedData = processedData;

        if (colorKey) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`).index;
            colorScale.domain = colorDomain ?? processedData.domain.values[colorKeyIdx] ?? [];
            colorScale.range = colorRange;
            colorScale.update();
        }

        this.animationState.transition('updateData');
    }

    getDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const id = direction === ChartAxisDirection.X ? `xValue` : `yValue`;
        const dataDef = dataModel.resolveProcessedDataDefById(this, id);
        const domain = dataModel.getDomain(this, id, 'value', processedData);
        if (dataDef?.def.type === 'value' && dataDef?.def.valueType === 'category') {
            return domain;
        }
        const axis = this.axes[direction];
        return this.fixNumericExtent(extent(domain), axis);
    }

    async createNodeData() {
        const {
            visible,
            axes,
            yKey = '',
            xKey = '',
            label,
            labelKey,
            ctx: { callbackCache },
            dataModel,
            processedData,
        } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(dataModel && processedData && visible && xAxis && yAxis)) return [];

        const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
        const colorDataIdx = this.colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;
        const labelDataIdx = this.labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : -1;

        const { colorScale, colorKey, id: seriesId } = this;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const { marker } = this;
        const nodeData: ScatterNodeDatum[] = new Array(this.processedData?.data.length ?? 0);

        const font = label.getFont();
        let actualLength = 0;
        for (const { values, datum } of processedData.data ?? []) {
            const xDatum = values[xDataIdx];
            const yDatum = values[yDataIdx];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            let text = String(labelKey ? values[labelDataIdx] : yDatum);
            if (label.formatter) {
                text = callbackCache.call(label.formatter, { value: text, seriesId, datum }) ?? '';
            }

            const size = HdpiCanvas.getTextSize(text, font);
            const fill = colorKey ? colorScale.convert(values[colorDataIdx]) : undefined;

            nodeData[actualLength++] = {
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                xValue: xDatum,
                yValue: yDatum,
                point: { x, y, size: marker.size },
                nodeMidPoint: { x, y },
                fill,
                label: {
                    text,
                    ...size,
                },
            };
        }

        nodeData.length = actualLength;

        return [{ itemId: this.yKey ?? this.id, nodeData, labelData: nodeData }];
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

    markerSelectionGarbageCollection = false;

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
        return markerSelection.update(data, undefined, (datum) => this.getDatumId(datum));
    }

    protected async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, ScatterNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const {
            id: seriesId,
            xKey = '',
            yKey = '',
            marker,
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
                seriesStyle: {},
                highlightStyle: markerHighlightStyle,
                seriesId,
                ctx,
                xKey,
                yKey,
                size: datum.point.size,
                strokeWidth: marker.strokeWidth ?? 1,
            });

            const config = { ...styles, point: datum.point, visible, customMarker };
            updateMarker({ node, config });
        });

        if (!highlighted) {
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
        const { xKey, yKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const {
            marker,
            tooltip,
            xName,
            yName,
            labelKey,
            labelName,
            id: seriesId,
            ctx: { callbackCache },
        } = this;

        const { stroke } = marker;
        const fill = nodeDatum.fill ?? marker.fill;
        const strokeWidth = this.getStrokeWidth(marker.strokeWidth ?? 1);

        const { formatter } = this.marker;
        let format: AgCartesianSeriesMarkerFormat | undefined = undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
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

        const color = format?.fill ?? fill ?? 'gray';
        const title = this.title ?? yName;
        const {
            datum,
            xValue,
            yValue,
            label: { text: labelText },
        } = nodeDatum;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName ?? yKey)}</b>: ${yString}`;

        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName ?? labelKey)}</b>: ${sanitizeHtml(labelText)}<br>` + content;
        }

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
            labelKey,
            labelName,
            title,
            color,
            seriesId,
        });
    }

    getLegendData(legendType: ChartLegendType): ChartLegendDatum[] {
        const { id, data, xKey, yKey, yName, title, visible, marker } = this;
        const { fill, stroke, fillOpacity, strokeOpacity } = marker;

        if (!(data?.length && xKey && yKey && legendType === 'category')) {
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
                    text: title ?? yName ?? yKey,
                },
                marker: {
                    shape: marker.shape,
                    fill: marker.fill ?? fill ?? 'rgba(0, 0, 0, 0)',
                    stroke: marker.stroke ?? stroke ?? 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity ?? 1,
                    strokeOpacity: strokeOpacity ?? 1,
                },
            },
        ];
        return legendData;
    }

    animateEmptyUpdateReady({ markerSelections, labelSelections }: ScatterAnimationData) {
        const duration = this.ctx.animationManager.defaultDuration();
        const labelDuration = 200;

        markerSelections.forEach((markerSelection) => {
            markerSelection.each((marker, datum) => {
                const format = this.animateFormatter(marker, datum);
                const to = format?.size ?? datum.point.size;

                marker.translationX = datum.point.x;
                marker.translationY = datum.point.y;

                this.ctx.animationManager.animate(`${this.id}_empty-update-ready_${marker.id}`, {
                    from: 0,
                    to,
                    duration,
                    onUpdate(size) {
                        marker.size = size;
                    },
                });
            });
        });

        labelSelections.forEach((labelSelection) => {
            labelSelection.each((label) => {
                this.ctx.animationManager.animate(`${this.id}_empty-update-ready_${label.id}`, {
                    from: 0,
                    to: 1,
                    delay: duration,
                    duration: labelDuration,
                    onUpdate: (opacity) => {
                        label.opacity = opacity;
                    },
                });
            });
        });
    }

    animateReadyResize({ markerSelections }: ScatterAnimationData) {
        this.ctx.animationManager.reset();
        markerSelections.forEach((markerSelection) => {
            this.resetMarkers(markerSelection);
        });
    }

    animateWaitingUpdateReady({ markerSelections, labelSelections }: ScatterAnimationData) {
        const { processedData } = this;
        const diff = processedData?.reduced?.diff;

        if (!diff?.changed) {
            markerSelections.forEach((markerSelection) => {
                this.resetMarkers(markerSelection);
            });
            return;
        }

        const addedIds = zipObject(diff.added, true);
        const removedIds = zipObject(diff.removed, true);

        const duration = this.ctx.animationManager.defaultDuration();
        const labelDuration = 200;

        markerSelections.forEach((markerSelection) => {
            markerSelection.each((marker, datum, index) => {
                const datumId = this.getDatumId(datum);
                const cleanup = index === markerSelection.nodes().length - 1;

                const markerFormat = this.animateFormatter(marker, datum);
                const size = markerFormat?.size ?? datum.point.size ?? 0;

                if (removedIds[datumId] || addedIds[datumId]) {
                    let from = 0;
                    let to = 0;

                    if (removedIds[datumId]) {
                        from = size;
                    } else if (addedIds[datumId]) {
                        to = size;
                        marker.translationX = datum.point.x;
                        marker.translationY = datum.point.y;
                    }

                    this.ctx.animationManager.animate(`${this.id}_waiting-update-ready_${marker.id}`, {
                        from,
                        to,
                        duration,
                        ease: easing.easeOut,
                        onUpdate(size) {
                            marker.size = size;
                        },
                        onStop: () => {
                            if (cleanup) this.resetMarkers(markerSelection);
                        },
                        onComplete: () => {
                            if (cleanup) this.resetMarkers(markerSelection);
                        },
                    });
                } else {
                    this.ctx.animationManager.animateMany(
                        `${this.id}_waiting-update-ready_${marker.id}`,
                        [
                            { from: marker.size, to: size },
                            { from: marker.translationX, to: datum.point.x },
                            { from: marker.translationY, to: datum.point.y },
                        ],
                        {
                            duration,
                            ease: easing.easeOut,
                            onUpdate([size, x, y]) {
                                marker.size = size;
                                marker.translationX = x;
                                marker.translationY = y;
                            },
                            onStop: () => {
                                if (cleanup) this.resetMarkers(markerSelection);
                            },
                            onComplete: () => {
                                if (cleanup) this.resetMarkers(markerSelection);
                            },
                        }
                    );
                }
            });
        });

        labelSelections.forEach((labelSelection) => {
            labelSelection.each((label, datum) => {
                const datumId = this.getDatumId(datum);

                if (addedIds[datumId]) {
                    this.ctx.animationManager.animate(`${this.id}_waiting-update-ready_${label.id}`, {
                        from: 0,
                        to: 1,
                        delay: duration,
                        duration: labelDuration,
                        onUpdate: (opacity) => {
                            label.opacity = opacity;
                        },
                    });
                } else if (removedIds[datumId]) {
                    this.ctx.animationManager.animate(`${this.id}_waiting-update-ready_${label.id}`, {
                        from: 1,
                        to: 0,
                        duration: labelDuration,
                        onUpdate: (opacity) => {
                            label.opacity = opacity;
                        },
                    });
                }
            });
        });
    }

    resetMarkers(markerSelection: Selection<Marker, ScatterNodeDatum>) {
        markerSelection.cleanup().each((marker, datum) => {
            const format = this.animateFormatter(marker, datum);
            marker.size = format?.size ?? datum.point?.size ?? 0;
            marker.translationX = datum.point.x;
            marker.translationY = datum.point.y;
        });
    }

    animateFormatter(marker: Marker, datum: ScatterNodeDatum) {
        const {
            xKey = '',
            yKey = '',
            marker: { strokeWidth: markerStrokeWidth },
            id: seriesId,
            ctx: { callbackCache },
        } = this;
        const { formatter } = this.marker;

        const fill = datum.fill ?? marker.fill;
        const stroke = marker.stroke;
        const strokeWidth = markerStrokeWidth ?? 1;
        const size = datum.point?.size ?? 0;

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

    getDatumId(datum: ScatterNodeDatum) {
        return createDatumId([`${datum.xValue}`, `${datum.yValue}`, datum.label.text]);
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }
}
