import type { ModuleContext } from '../../../module/moduleContext';
import type {
    AgScatterSeriesLabelFormatterParams,
    AgScatterSeriesOptionsKeys,
    AgScatterSeriesTooltipRendererParams,
} from '../../../options/agChartOptions';
import { ColorScale } from '../../../scale/colorScale';
import { HdpiCanvas } from '../../../scene/canvas/hdpiCanvas';
import { Group } from '../../../scene/group';
import type { Selection } from '../../../scene/selection';
import type { Text } from '../../../scene/shape/text';
import { extent } from '../../../util/array';
import type { MeasuredLabel, PointLabelDatum } from '../../../util/labelPlacement';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { COLOR_STRING_ARRAY, OPT_NUMBER_ARRAY, OPT_STRING, Validate } from '../../../util/validation';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import { diff } from '../../data/processors';
import { Label } from '../../label';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { SeriesMarker } from '../seriesMarker';
import { SeriesTooltip } from '../seriesTooltip';
import type { CartesianAnimationData, CartesianSeriesNodeDatum, ErrorBoundSeriesNodeDatum } from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';
import { markerScaleInAnimation, resetMarkerFn } from './markerUtil';

interface ScatterNodeDatum extends Required<CartesianSeriesNodeDatum>, ErrorBoundSeriesNodeDatum {
    readonly label: MeasuredLabel;
    readonly fill: string | undefined;
}

type ScatterAnimationData = CartesianAnimationData<Group, ScatterNodeDatum>;

export class ScatterSeries extends CartesianSeries<Group, ScatterNodeDatum> {
    static className = 'ScatterSeries';
    static type = 'scatter' as const;

    readonly marker = new SeriesMarker<AgScatterSeriesOptionsKeys, ScatterNodeDatum>();

    readonly label = new Label<AgScatterSeriesLabelFormatterParams>();

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
    colorDomain?: number[];

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
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                marker: resetMarkerFn,
                label: resetLabelFn,
            },
        });
    }

    override async processData(dataController: DataController) {
        const {
            xKey = '',
            yKey = '',
            labelKey,
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
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: `colorValue` })] : []),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: `labelValue` })] : []),
                ...(!animationManager.isSkipped() && this.processedData ? [diff(this.processedData)] : []),
            ],
            dataVisible: this.visible,
        });

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

    async createNodeData() {
        const { visible, axes, yKey = '', xKey = '', label, labelKey, dataModel, processedData } = this;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(dataModel && processedData && visible && xAxis && yAxis)) return [];

        const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
        const colorDataIdx = this.colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;
        const labelDataIdx = this.labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : -1;

        const { colorScale, colorKey } = this;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const { marker } = this;
        const nodeData: ScatterNodeDatum[] = [];

        const font = label.getFont();
        for (const { values, datum } of processedData.data ?? []) {
            const xDatum = values[xDataIdx];
            const yDatum = values[yDataIdx];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            const labelText = this.getLabelText(this.label, {
                value: labelKey ? values[labelDataIdx] : yDatum,
                datum,
                xKey,
                yKey,
                labelKey,
                xName: this.xName,
                yName: this.yName,
                labelName: this.labelName,
            });

            const size = HdpiCanvas.getTextSize(labelText, font);
            const fill = colorKey ? colorScale.convert(values[colorDataIdx]) : undefined;

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                xValue: xDatum,
                yValue: yDatum,
                capDefaults: { lengthRatioMultiplier: marker.size, lengthMax: Infinity },
                point: { x, y, size: marker.size },
                midPoint: { x, y },
                fill,
                label: { text: labelText, ...size },
            });
        }

        return [{ itemId: this.yKey ?? this.id, nodeData, labelData: nodeData, scales: super.calculateScaling() }];
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

    protected override async updateMarkerSelection(opts: {
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

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, ScatterNodeDatum>;
        isHighlight: boolean;
    }) {
        const { xKey = '', yKey = '', labelKey, marker } = this;
        const { markerSelection, isHighlight: highlighted } = opts;
        const baseStyle = mergeDefaults(highlighted && this.highlightStyle.item, marker.getStyle());

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey, labelKey }, baseStyle);
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

        const { marker, tooltip, xName, yName, labelKey, labelName, id: seriesId, title = yName } = this;

        const baseStyle = mergeDefaults(
            { fill: nodeDatum.fill, strokeWidth: this.getStrokeWidth(marker.strokeWidth) },
            marker.getStyle()
        );

        const { fill: color = 'gray' } = this.getMarkerStyle(
            marker,
            { datum: nodeDatum, highlighted: false, xKey, yKey, labelKey },
            baseStyle
        );

        const { datum, xValue, yValue, label } = nodeDatum;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName ?? yKey)}</b>: ${yString}`;

        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName ?? labelKey)}</b>: ${sanitizeHtml(label.text)}<br>` + content;
        }

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                datum,
                xKey,
                xName,
                yKey,
                yName,
                labelKey,
                labelName,
                title,
                color,
                seriesId,
                ...this.getModuleTooltipParams(datum),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { id, data, xKey, yKey, yName, title, visible, marker } = this;
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = marker;

        if (!(data?.length && xKey && yKey && legendType === 'category')) {
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

    override animateEmptyUpdateReady({ markerSelections, labelSelections }: ScatterAnimationData) {
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }
}
