import type { ModuleContext } from '../../../module/moduleContext';
import type {
    AgBubbleSeriesLabelFormatterParams,
    AgBubbleSeriesTooltipRendererParams,
    AgCartesianSeriesMarkerFormat,
    AgTooltipRendererResult,
} from '../../../options/agChartOptions';
import { ColorScale } from '../../../scale/colorScale';
import { LinearScale } from '../../../scale/linearScale';
import { HdpiCanvas } from '../../../scene/canvas/hdpiCanvas';
import { RedrawType, SceneChangeDetection } from '../../../scene/changeDetectable';
import { Group } from '../../../scene/group';
import type { Selection } from '../../../scene/selection';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import type { MeasuredLabel, PointLabelDatum } from '../../../util/labelPlacement';
import { sanitizeHtml } from '../../../util/sanitize';
import {
    COLOR_STRING_ARRAY,
    NUMBER,
    OPT_FUNCTION,
    OPT_NUMBER_ARRAY,
    OPT_STRING,
    Validate,
} from '../../../util/validation';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import { createDatumId, diff } from '../../data/processors';
import { Label } from '../../label';
import type { CategoryLegendDatum } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import type { SeriesNodeEventTypes } from '../series';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesTooltip } from '../seriesTooltip';
import type { CartesianAnimationData, CartesianSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries, CartesianSeriesMarker, CartesianSeriesNodeClickEvent } from './cartesianSeries';
import { getMarkerConfig, markerScaleInAnimation, resetMarkerFn, updateMarker } from './markerUtil';

interface BubbleNodeDatum extends Required<CartesianSeriesNodeDatum> {
    readonly sizeValue: any;
    readonly label: MeasuredLabel;
    readonly fill: string | undefined;
}

type BubbleAnimationData = CartesianAnimationData<Group, BubbleNodeDatum>;

class BubbleSeriesLabel extends Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgBubbleSeriesLabelFormatterParams<any>) => string = undefined;
}

class BubbleSeriesNodeClickEvent<TEvent extends string = SeriesNodeEventTypes> extends CartesianSeriesNodeClickEvent<
    BubbleNodeDatum,
    BubbleSeries,
    TEvent
> {
    readonly sizeKey?: string;

    constructor(type: TEvent, nativeEvent: MouseEvent, datum: BubbleNodeDatum, series: BubbleSeries) {
        super(type, nativeEvent, datum, series);
        this.sizeKey = series.sizeKey;
    }
}

class BubbleSeriesMarker extends CartesianSeriesMarker {
    /**
     * The series `sizeKey` values along with the `size` and `maxSize` configs will be used to
     * determine the size of the marker. All values will be mapped to a marker size within the
     * `[size, maxSize]` range, where the largest values will correspond to the `maxSize` and the
     * lowest to the `size`.
     */
    @Validate(NUMBER(0))
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    maxSize = 30;

    @Validate(OPT_NUMBER_ARRAY)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    domain?: [number, number] = undefined;
}

export class BubbleSeries extends CartesianSeries<Group, BubbleNodeDatum> {
    static className = 'BubbleSeries';
    static type = 'bubble' as const;

    private sizeScale = new LinearScale();

    readonly marker = new BubbleSeriesMarker();

    readonly label = new BubbleSeriesLabel();

    @Validate(OPT_STRING)
    title?: string = undefined;

    @Validate(OPT_STRING)
    labelKey?: string = undefined;

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    yName?: string = undefined;

    @Validate(OPT_STRING)
    sizeName?: string = 'Size';

    @Validate(OPT_STRING)
    labelName?: string = 'Label';

    @Validate(OPT_STRING)
    xKey?: string = undefined;

    @Validate(OPT_STRING)
    yKey?: string = undefined;

    @Validate(OPT_STRING)
    sizeKey?: string = undefined;

    @Validate(OPT_STRING)
    colorKey?: string = undefined;

    @Validate(OPT_STRING)
    colorName?: string = 'Color';

    @Validate(OPT_NUMBER_ARRAY)
    colorDomain: number[] | undefined = undefined;

    @Validate(COLOR_STRING_ARRAY)
    colorRange: string[] = ['#ffff00', '#00ff00', '#0000ff'];

    colorScale = new ColorScale();

    readonly tooltip = new SeriesTooltip<AgBubbleSeriesTooltipRendererParams>();

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
            animationResetFns: {
                label: resetLabelFn,
                marker: resetMarkerFn,
            },
        });

        const { label } = this;

        label.enabled = false;
    }

    override async processData(dataController: DataController) {
        const {
            xKey = '',
            yKey = '',
            sizeKey = '',
            labelKey,
            marker,
            data,
            ctx: { animationManager },
        } = this;

        const { isContinuousX, isContinuousY } = this.isContinuous();

        const { colorScale, colorDomain, colorRange, colorKey } = this;

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xKey-raw' }),
                keyProperty(this, yKey, isContinuousY, { id: 'yKey-raw' }),
                ...(labelKey ? [keyProperty(this, labelKey, false, { id: `labelKey-raw` })] : []),
                valueProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, yKey, isContinuousY, { id: `yValue` }),
                valueProperty(this, sizeKey, true, { id: `sizeValue` }),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: `colorValue` })] : []),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: `labelValue` })] : []),
                ...(!animationManager.isSkipped() && this.processedData ? [diff(this.processedData)] : []),
            ],
            dataVisible: this.visible,
        });

        const sizeKeyIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index;
        const processedSize = processedData.domain.values[sizeKeyIdx] ?? [];
        this.sizeScale.domain = marker.domain ? marker.domain : processedSize;

        if (colorKey) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`).index;
            colorScale.domain = colorDomain ?? processedData.domain.values[colorKeyIdx] ?? [];
            colorScale.range = colorRange;
            colorScale.update();
        }
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        const { dataModel, processedData } = this;
        if (!processedData || !dataModel) return [];

        const id = direction === ChartAxisDirection.X ? `xValue` : `yValue`;
        const dataDef = dataModel.resolveProcessedDataDefById(this, id);
        const domain = dataModel.getDomain(this, id, 'value', processedData);
        if (dataDef?.def.type === 'value' && dataDef?.def.valueType === 'category') {
            return domain;
        }
        const axis = this.axes[direction];
        return fixNumericExtent(extent(domain), axis);
    }

    protected override getNodeClickEvent(
        event: MouseEvent,
        datum: BubbleNodeDatum
    ): BubbleSeriesNodeClickEvent<'nodeClick'> {
        return new BubbleSeriesNodeClickEvent('nodeClick', event, datum, this);
    }

    protected override getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: BubbleNodeDatum
    ): BubbleSeriesNodeClickEvent<'nodeDoubleClick'> {
        return new BubbleSeriesNodeClickEvent('nodeDoubleClick', event, datum, this);
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
        const sizeDataIdx = this.sizeKey ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index : -1;
        const colorDataIdx = this.colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;
        const labelDataIdx = this.labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : -1;

        const { colorScale, sizeKey, colorKey, id: seriesId } = this;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const { sizeScale, marker } = this;
        const nodeData: BubbleNodeDatum[] = new Array(this.processedData?.data.length ?? 0);

        sizeScale.range = [marker.size, marker.maxSize];

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
            const markerSize = sizeKey ? sizeScale.convert(values[sizeDataIdx]) : marker.size;
            const fill = colorKey ? colorScale.convert(values[colorDataIdx]) : undefined;

            nodeData[actualLength++] = {
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                xValue: xDatum,
                yValue: yDatum,
                sizeValue: values[sizeDataIdx],
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

        return [{ itemId: this.yKey ?? this.id, nodeData, labelData: nodeData }];
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.marker.isDirty();
    }

    override getLabelData(): PointLabelDatum[] {
        return this.contextNodeData?.reduce<PointLabelDatum[]>((r, n) => r.concat(n.labelData), []);
    }

    protected override markerFactory() {
        const { shape } = this.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    override markerSelectionGarbageCollection = false;

    protected override async updateMarkerSelection(opts: {
        nodeData: BubbleNodeDatum[];
        markerSelection: Selection<Marker, BubbleNodeDatum>;
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

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, BubbleNodeDatum>;
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

        this.sizeScale.range = [marker.size, marker.maxSize];
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
        labelData: BubbleNodeDatum[];
        labelSelection: Selection<Text, BubbleNodeDatum>;
    }) {
        const { labelSelection } = opts;
        const {
            label: { enabled },
        } = this;

        const placedLabels = enabled ? this.chart?.placeLabels().get(this) ?? [] : [];

        const placedNodeDatum = placedLabels.map(
            (v): BubbleNodeDatum => ({
                ...(v.datum as BubbleNodeDatum),
                point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                },
            })
        );
        return labelSelection.update(placedNodeDatum);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, BubbleNodeDatum> }) {
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

    getTooltipHtml(nodeDatum: BubbleNodeDatum): string {
        const { xKey, yKey, sizeKey, axes } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!xKey || !yKey || !xAxis || !yAxis || !sizeKey) {
            return '';
        }

        const {
            marker,
            tooltip,
            xName,
            yName,
            sizeName,
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
            sizeValue,
            label: { text: labelText },
        } = nodeDatum;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName ?? yKey)}</b>: ${yString}`;

        if (sizeKey) {
            content += `<br><b>${sanitizeHtml(sizeName ?? sizeKey)}</b>: ${sanitizeHtml(sizeValue)}`;
        }

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
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            title,
            color,
            seriesId,
        });
    }

    getLegendData(): CategoryLegendDatum[] {
        const { id, data, xKey, yKey, yName, title, visible, marker } = this;
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = marker;

        if (!(data?.length && xKey && yKey)) {
            return [];
        }

        return [
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
                    strokeWidth: strokeWidth ?? 0,
                },
            },
        ];
    }

    override animateEmptyUpdateReady({ markerSelections, labelSelections }: BubbleAnimationData) {
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, this.ctx.animationManager, labelSelections);
    }

    animateFormatter(marker: Marker, datum: BubbleNodeDatum) {
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

    getDatumId(datum: BubbleNodeDatum) {
        return createDatumId([`${datum.xValue}`, `${datum.yValue}`, datum.label.text]);
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }
}
