import type { ModuleContext } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import type { CategoryLegendDatum, ChartLegendType } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import type { CartesianAnimationData } from './cartesianSeries';
import { CartesianSeries } from './cartesianSeries';
import { markerScaleInAnimation, resetMarkerFn } from './markerUtil';
import { ScatterNodeDatum, ScatterSeriesProperties } from './scatterSeriesProperties';

type ScatterAnimationData = CartesianAnimationData<Group, ScatterNodeDatum>;

export class ScatterSeries extends CartesianSeries<Group, ScatterNodeDatum> {
    static className = 'ScatterSeries';
    static type = 'scatter' as const;

    override properties = new ScatterSeriesProperties();

    readonly colorScale = new ColorScale();

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
        if (!this.properties.isValid() || this.data == null) {
            return;
        }

        const { isContinuousX, isContinuousY } = this.isContinuous();
        const { xKey, yKey, labelKey, colorKey, colorDomain, colorRange } = this.properties;

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(this, xKey, isContinuousX, { id: 'xKey-raw' }),
                keyProperty(this, yKey, isContinuousY, { id: 'yKey-raw' }),
                ...(labelKey ? [keyProperty(this, labelKey, false, { id: `labelKey-raw` })] : []),
                valueProperty(this, xKey, isContinuousX, { id: `xValue` }),
                valueProperty(this, yKey, isContinuousY, { id: `yValue` }),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: `colorValue` })] : []),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: `labelValue` })] : []),
            ],
            dataVisible: this.visible,
        });

        if (colorKey) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`).index;
            this.colorScale.domain = colorDomain ?? processedData.domain.values[colorKeyIdx] ?? [];
            this.colorScale.range = colorRange;
            this.colorScale.update();
        }

        this.animationState.transition('updateData');
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
        const { axes, dataModel, processedData, colorScale } = this;
        const { xKey, yKey, labelKey, colorKey, xName, yName, labelName, marker, label, visible } = this.properties;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(dataModel && processedData && visible && xAxis && yAxis)) {
            return [];
        }

        const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`).index;
        const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`).index;
        const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : -1;
        const labelDataIdx = labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : -1;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: ScatterNodeDatum[] = [];

        const font = label.getFont();
        for (const { values, datum } of processedData.data ?? []) {
            const xDatum = values[xDataIdx];
            const yDatum = values[yDataIdx];
            const x = xScale.convert(xDatum) + xOffset;
            const y = yScale.convert(yDatum) + yOffset;

            const labelText = this.getLabelText(label, {
                value: labelKey ? values[labelDataIdx] : yDatum,
                datum,
                xKey,
                yKey,
                labelKey,
                xName,
                yName,
                labelName,
            });

            const size = Text.getTextSize(labelText, font);
            const fill = colorKey ? colorScale.convert(values[colorDataIdx]) : undefined;

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                xValue: xDatum,
                yValue: yDatum,
                capDefaults: { lengthRatioMultiplier: marker.getDiameter(), lengthMax: Infinity },
                point: { x, y, size: marker.size },
                midPoint: { x, y },
                fill,
                label: { text: labelText, ...size },
            });
        }

        return [
            {
                itemId: yKey,
                nodeData,
                labelData: nodeData,
                scales: super.calculateScaling(),
                visible: this.visible,
            },
        ];
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    override getLabelData(): PointLabelDatum[] {
        return this.contextNodeData?.reduce<PointLabelDatum[]>((r, n) => r.concat(n.labelData), []);
    }

    protected override markerFactory() {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected override async updateMarkerSelection(opts: {
        nodeData: ScatterNodeDatum[];
        markerSelection: Selection<Marker, ScatterNodeDatum>;
    }) {
        const { nodeData, markerSelection } = opts;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        return markerSelection.update(this.properties.marker.enabled ? nodeData : []);
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, ScatterNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, labelKey, marker, highlightStyle } = this.properties;
        const baseStyle = mergeDefaults(highlighted && highlightStyle.item, marker.getStyle());

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey, labelKey }, baseStyle);
        });

        if (!highlighted) {
            marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: ScatterNodeDatum[];
        labelSelection: Selection<Text, ScatterNodeDatum>;
    }) {
        const placedLabels = this.isLabelEnabled() ? this.chart?.placeLabels().get(this) ?? [] : [];
        return opts.labelSelection.update(
            placedLabels.map(({ datum, x, y }) => ({
                ...(datum as ScatterNodeDatum),
                point: { x, y, size: datum.point.size },
            })),
            (text) => {
                text.pointerEvents = PointerEvents.None;
            }
        );
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, ScatterNodeDatum> }) {
        const { label } = this.properties;

        opts.labelSelection.each((text, datum) => {
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
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return '';
        }

        const { xKey, yKey, labelKey, xName, yName, labelName, title = yName, marker, tooltip } = this.properties;
        const { datum, xValue, yValue, label } = nodeDatum;

        const baseStyle = mergeDefaults(
            { fill: nodeDatum.fill, strokeWidth: this.getStrokeWidth(marker.strokeWidth) },
            marker.getStyle()
        );

        const { fill: color = 'gray' } = this.getMarkerStyle(
            marker,
            { datum: nodeDatum, highlighted: false, xKey, yKey, labelKey },
            baseStyle
        );

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
                seriesId: this.id,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        const { yKey, yName, title, marker, visible } = this.properties;
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = marker;

        if (!this.data?.length || !this.properties.isValid() || legendType !== 'category') {
            return [];
        }

        return [
            {
                legendType: 'category',
                id: this.id,
                itemId: yKey,
                seriesId: this.id,
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

    override animateEmptyUpdateReady(data: ScatterAnimationData) {
        const { markerSelections, labelSelections, annotationSelections } = data;
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelections);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelections);
        seriesLabelFadeInAnimation(this, 'annotations', this.ctx.animationManager, annotationSelections);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }
}
