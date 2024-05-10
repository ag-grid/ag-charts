import type { ModuleContext } from '../../../module/moduleContext';
import { ColorScale } from '../../../scale/colorScale';
import { LinearScale } from '../../../scale/linearScale';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import type { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { extent } from '../../../util/array';
import { mergeDefaults } from '../../../util/object';
import { sanitizeHtml } from '../../../util/sanitize';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { fixNumericExtent } from '../../data/dataModel';
import { createDatumId } from '../../data/processors';
import type { CategoryLegendDatum } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import type { PickFocusInputs, SeriesNodeEventTypes } from '../series';
import { SeriesNodePickMode, keyProperty, valueProperty } from '../series';
import { resetLabelFn, seriesLabelFadeInAnimation } from '../seriesLabelUtil';
import { type BubbleNodeDatum, BubbleSeriesProperties } from './bubbleSeriesProperties';
import type { CartesianAnimationData } from './cartesianSeries';
import {
    CartesianSeries,
    CartesianSeriesNodeEvent,
    DEFAULT_CARTESIAN_DIRECTION_KEYS,
    DEFAULT_CARTESIAN_DIRECTION_NAMES,
} from './cartesianSeries';
import { computeMarkerFocusBounds, markerScaleInAnimation, resetMarkerFn } from './markerUtil';

type BubbleAnimationData = CartesianAnimationData<Group, BubbleNodeDatum>;

class BubbleSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends CartesianSeriesNodeEvent<TEvent> {
    readonly sizeKey?: string;

    constructor(type: TEvent, nativeEvent: Event, datum: BubbleNodeDatum, series: BubbleSeries) {
        super(type, nativeEvent, datum, series);
        this.sizeKey = series.properties.sizeKey;
    }
}

export class BubbleSeries extends CartesianSeries<Group, BubbleSeriesProperties, BubbleNodeDatum> {
    static readonly className = 'BubbleSeries';
    static readonly type = 'bubble' as const;

    protected override readonly NodeEvent = BubbleSeriesNodeEvent;

    override properties = new BubbleSeriesProperties();

    private readonly sizeScale = new LinearScale();

    private readonly colorScale = new ColorScale();

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            directionKeys: DEFAULT_CARTESIAN_DIRECTION_KEYS,
            directionNames: DEFAULT_CARTESIAN_DIRECTION_NAMES,
            pickModes: [
                SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
                SeriesNodePickMode.NEAREST_NODE,
                SeriesNodePickMode.EXACT_SHAPE_MATCH,
            ],
            pathsPerSeries: 0,
            hasMarkers: true,
            markerSelectionGarbageCollection: false,
            animationResetFns: {
                label: resetLabelFn,
                marker: resetMarkerFn,
            },
        });
    }

    override async processData(dataController: DataController) {
        if (!this.properties.isValid() || this.data == null || !this.visible) return;

        const xScale = this.axes[ChartAxisDirection.X]?.scale;
        const yScale = this.axes[ChartAxisDirection.Y]?.scale;
        const { xScaleType, yScaleType } = this.getScaleInformation({ xScale, yScale });
        const colorScaleType = this.colorScale.type;
        const sizeScaleType = this.sizeScale.type;
        const { xKey, yKey, sizeKey, labelKey, colorDomain, colorRange, colorKey, marker } = this.properties;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, this.data, {
            props: [
                keyProperty(xKey, xScaleType, { id: 'xKey-raw' }),
                keyProperty(yKey, yScaleType, { id: 'yKey-raw' }),
                ...(labelKey ? [keyProperty(labelKey, 'band', { id: `labelKey-raw` })] : []),
                valueProperty(xKey, xScaleType, { id: `xValue` }),
                valueProperty(yKey, yScaleType, { id: `yValue` }),
                valueProperty(sizeKey, sizeScaleType, { id: `sizeValue` }),
                ...(colorKey ? [valueProperty(colorKey, colorScaleType, { id: `colorValue` })] : []),
                ...(labelKey ? [valueProperty(labelKey, 'band', { id: `labelValue` })] : []),
            ],
        });

        const sizeKeyIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
        const processedSize = processedData.domain.values[sizeKeyIdx] ?? [];
        this.sizeScale.domain = marker.domain ? marker.domain : processedSize;

        if (colorKey) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, `colorValue`);
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
        const { axes, dataModel, processedData, colorScale, sizeScale } = this;
        const { xKey, yKey, sizeKey, labelKey, xName, yName, sizeName, labelName, label, colorKey, marker, visible } =
            this.properties;
        const markerShape = getMarker(marker.shape);
        const { placement } = label;

        const xAxis = axes[ChartAxisDirection.X];
        const yAxis = axes[ChartAxisDirection.Y];

        if (!(dataModel && processedData && visible && xAxis && yAxis)) {
            return;
        }

        const xDataIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const yDataIdx = dataModel.resolveProcessedDataIndexById(this, `yValue`);
        const sizeDataIdx = sizeKey ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`) : -1;
        const colorDataIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`) : -1;
        const labelDataIdx = labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`) : -1;

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;
        const xOffset = (xScale.bandwidth ?? 0) / 2;
        const yOffset = (yScale.bandwidth ?? 0) / 2;
        const nodeData: BubbleNodeDatum[] = [];

        sizeScale.range = [marker.size, marker.maxSize];

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
                sizeKey,
                labelKey,
                xName,
                yName,
                sizeName,
                labelName,
            });

            const size = Text.getTextSize(String(labelText), font);
            const markerSize = sizeKey ? sizeScale.convert(values[sizeDataIdx]) : marker.size;
            const fill = colorKey ? colorScale.convert(values[colorDataIdx]) : undefined;

            nodeData.push({
                series: this,
                itemId: yKey,
                yKey,
                xKey,
                datum,
                xValue: xDatum,
                yValue: yDatum,
                sizeValue: values[sizeDataIdx],
                point: { x, y, size: markerSize },
                midPoint: { x, y },
                fill,
                label: { text: labelText, ...size },
                marker: markerShape,
                placement,
            });
        }

        return {
            itemId: yKey,
            nodeData,
            labelData: nodeData,
            scales: this.calculateScaling(),
            visible: this.visible,
        };
    }

    protected override isPathOrSelectionDirty(): boolean {
        return this.properties.marker.isDirty();
    }

    override getLabelData(): PointLabelDatum[] {
        return this.contextNodeData?.labelData ?? [];
    }

    protected override markerFactory() {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    protected override async updateMarkerSelection(opts: {
        nodeData: BubbleNodeDatum[];
        markerSelection: Selection<Marker, BubbleNodeDatum>;
    }) {
        const { nodeData, markerSelection } = opts;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        const data = this.properties.marker.enabled ? nodeData : [];
        return markerSelection.update(data, undefined, (datum) =>
            createDatumId([datum.xValue, datum.yValue, datum.label.text])
        );
    }

    protected override async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, BubbleNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight: highlighted } = opts;
        const { xKey, yKey, sizeKey, labelKey, marker } = this.properties;
        const baseStyle = mergeDefaults(highlighted && this.properties.highlightStyle.item, marker.getStyle());

        this.sizeScale.range = [marker.size, marker.maxSize];

        markerSelection.each((node, datum) => {
            this.updateMarkerStyle(node, marker, { datum, highlighted, xKey, yKey, sizeKey, labelKey }, baseStyle);
        });

        if (!highlighted) {
            this.properties.marker.markClean();
        }
    }

    protected async updateLabelSelection(opts: {
        labelData: BubbleNodeDatum[];
        labelSelection: Selection<Text, BubbleNodeDatum>;
    }) {
        const placedLabels = this.properties.label.enabled ? this.chart?.placeLabels().get(this) ?? [] : [];
        return opts.labelSelection.update(
            placedLabels.map((v) => ({
                ...(v.datum as BubbleNodeDatum),
                point: {
                    x: v.x,
                    y: v.y,
                    size: v.datum.point.size,
                },
            }))
        );
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, BubbleNodeDatum> }) {
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

    getTooltipHtml(nodeDatum: BubbleNodeDatum): TooltipContent {
        const xAxis = this.axes[ChartAxisDirection.X];
        const yAxis = this.axes[ChartAxisDirection.Y];

        if (!this.properties.isValid() || !xAxis || !yAxis) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { xKey, yKey, sizeKey, labelKey, xName, yName, sizeName, labelName, marker, tooltip } = this.properties;
        const title = this.properties.title ?? yName;

        const baseStyle = mergeDefaults(
            { fill: nodeDatum.fill, strokeWidth: this.getStrokeWidth(marker.strokeWidth) },
            marker.getStyle()
        );

        const { fill: color = 'gray' } = this.getMarkerStyle(
            marker,
            { datum: nodeDatum, highlighted: false, xKey, yKey, sizeKey, labelKey },
            baseStyle
        );

        const {
            datum,
            xValue,
            yValue,
            sizeValue,
            label: { text: labelText },
            itemId,
        } = nodeDatum;
        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        let content =
            `<b>${sanitizeHtml(xName ?? xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(yName ?? yKey)}</b>: ${yString}`;

        if (sizeKey) {
            content += `<br><b>${sanitizeHtml(sizeName ?? sizeKey)}</b>: ${sanitizeHtml(String(sizeValue))}`;
        }

        if (labelKey) {
            content = `<b>${sanitizeHtml(labelName ?? labelKey)}</b>: ${sanitizeHtml(labelText)}<br>` + content;
        }

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                datum,
                itemId,
                xKey,
                xName,
                yKey,
                yName,
                sizeKey,
                sizeName,
                labelKey,
                labelName,
                title,
                color,
                seriesId: this.id,
            }
        );
    }

    getLegendData(): CategoryLegendDatum[] {
        if (!this.data?.length || !this.properties.isValid()) {
            return [];
        }

        const { yKey, yName, title, marker, visible } = this.properties;
        const { shape, fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = marker;

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
                symbols: [
                    {
                        marker: {
                            shape,
                            fill: fill ?? 'rgba(0, 0, 0, 0)',
                            stroke: stroke ?? 'rgba(0, 0, 0, 0)',
                            fillOpacity: fillOpacity ?? 1,
                            strokeOpacity: strokeOpacity ?? 1,
                            strokeWidth: strokeWidth ?? 0,
                        },
                    },
                ],
            },
        ];
    }

    override animateEmptyUpdateReady({ markerSelection, labelSelection }: BubbleAnimationData) {
        markerScaleInAnimation(this, this.ctx.animationManager, markerSelection);
        seriesLabelFadeInAnimation(this, 'labels', this.ctx.animationManager, labelSelection);
    }

    protected isLabelEnabled() {
        return this.properties.label.enabled;
    }

    protected nodeFactory() {
        return new Group();
    }

    public getFormattedMarkerStyle(datum: BubbleNodeDatum) {
        const { xKey, yKey, sizeKey, labelKey } = this.properties;
        return this.getMarkerStyle(this.properties.marker, {
            datum,
            xKey,
            yKey,
            sizeKey,
            labelKey,
            highlighted: false,
        });
    }

    protected computeFocusBounds(opts: PickFocusInputs): BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
