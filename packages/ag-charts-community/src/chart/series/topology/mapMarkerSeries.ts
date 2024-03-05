import type { Geometry } from 'geojson';

import type { ModuleContext } from '../../../module/moduleContext';
import { fromToMotion } from '../../../motion/fromToMotion';
import { StateMachine } from '../../../motion/states';
import type { AgMapSeriesStyle } from '../../../options/series/topology/mapOptions';
import { ColorScale } from '../../../scale/colorScale';
import { LinearScale } from '../../../scale/linearScale';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PlacedLabel, PointLabelDatum } from '../../../scene/util/labelPlacement';
import { sanitizeHtml } from '../../../util/sanitize';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { DataController } from '../../data/dataController';
import { getMissCount } from '../../data/dataModel';
import { createDatumId } from '../../data/processors';
import type { LegendItemClickChartEvent, LegendItemDoubleClickChartEvent } from '../../interaction/chartEventManager';
import type { CategoryLegendDatum, ChartLegendType, GradientLegendDatum } from '../../legendDatum';
import type { Marker } from '../../marker/marker';
import { getMarker } from '../../marker/util';
import { DataModelSeries } from '../dataModelSeries';
import type { SeriesNodeDataContext } from '../series';
import { SeriesNodePickMode, valueProperty } from '../series';
import type { LatLongBBox } from './LatLongBBox';
import { extendBbox } from './bboxUtil';
import { GeoGeometry } from './geoGeometry';
import { geometryBbox, projectGeometry } from './geometryUtil';
import { MapMarkerNodeDatum, MapMarkerNodeLabelDatum, MapMarkerSeriesProperties } from './mapMarkerSeriesProperties';
import { prepareMapMarkerAnimationFunctions } from './mapUtil';
import type { MercatorScale } from './mercatorScale';

export interface MapMarkerNodeDataContext extends SeriesNodeDataContext<MapMarkerNodeDatum, MapMarkerNodeLabelDatum> {
    projectedBackgroundGeometry: Geometry | undefined;
    visible: boolean;
}

type MapMarkerAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type MapMarkerAnimationEvent = 'update' | 'updateData' | 'highlight' | 'resize' | 'clear' | 'reset' | 'skip';

export class MapMarkerSeries extends DataModelSeries<
    MapMarkerNodeDatum,
    MapMarkerSeriesProperties,
    MapMarkerNodeLabelDatum,
    MapMarkerNodeDataContext
> {
    scale: MercatorScale | undefined;

    public topologyBounds: LatLongBBox | undefined;

    override properties = new MapMarkerSeriesProperties();

    private readonly colorScale = new ColorScale();
    private readonly sizeScale = new LinearScale();

    private backgroundNode = this.contentGroup.appendChild(new GeoGeometry());

    private markerGroup = this.contentGroup.appendChild(new Group({ name: 'markerGroup' }));
    private highlightMarkerGroup = this.contentGroup.appendChild(new Group({ name: 'highlightMarkerGroup' }));

    private labelSelection: Selection<Text, PlacedLabel<PointLabelDatum>> = Selection.select(
        this.labelGroup,
        Text,
        false
    );
    private markerSelection: Selection<Marker, MapMarkerNodeDatum> = Selection.select(
        this.markerGroup,
        () => this.markerFactory(),
        false
    );
    private highlightMarkerSelection: Selection<Marker, MapMarkerNodeDatum> = Selection.select(
        this.highlightMarkerGroup,
        () => this.markerFactory()
    );

    private contextNodeData: MapMarkerNodeDataContext[] = [];

    private animationState: StateMachine<MapMarkerAnimationState, MapMarkerAnimationEvent>;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });

        this.animationState = new StateMachine<MapMarkerAnimationState, MapMarkerAnimationEvent>(
            'empty',
            {
                empty: {
                    update: {
                        target: 'ready',
                        action: () => this.animateMarkers(),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
                ready: {
                    updateData: 'waiting',
                    clear: 'clearing',
                    resize: () => this.resetAllAnimation(),
                    reset: 'empty',
                    skip: 'ready',
                },
                waiting: {
                    update: {
                        target: 'ready',
                        action: () => this.animateMarkers(),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
                clearing: {
                    update: {
                        target: 'empty',
                        action: () => this.resetAllAnimation(),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
            },
            () => this.checkProcessedDataAnimatable()
        );
    }

    override addChartEventListeners(): void {
        this.destroyFns.push(
            this.ctx.chartEventManager.addListener('legend-item-click', (event) => {
                this.onLegendItemClick(event);
            }),
            this.ctx.chartEventManager.addListener('legend-item-double-click', (event) => {
                this.onLegendItemDoubleClick(event);
            })
        );
    }

    private isLabelEnabled() {
        return this.properties.labelKey != null && this.properties.label.enabled;
    }

    private isMarkerEnabled() {
        return this.properties.marker.enabled;
    }

    private markerFactory(): Marker {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    override async processData(dataController: DataController): Promise<void> {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const { data } = this;
        const { latKey, lonKey, sizeKey, colorKey, labelKey, colorRange, marker, background } = this.properties;

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                valueProperty(this, latKey, false, { id: 'latValue' }),
                valueProperty(this, lonKey, false, { id: 'lonValue' }),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: 'labelValue' })] : []),
                ...(sizeKey ? [valueProperty(this, sizeKey, true, { id: 'sizeValue' })] : []),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
            ],
        });

        const latIdx = dataModel.resolveProcessedDataIndexById(this, `latValue`).index;
        const lonIdx = dataModel.resolveProcessedDataIndexById(this, `lonValue`).index;
        let bbox = (processedData.data as any[]).reduce<LatLongBBox | undefined>((current, { values }) => {
            const lon = values[lonIdx];
            const lat = values[latIdx];
            return extendBbox(current, lon, lat, lon, lat);
        }, undefined);

        const { id: backgroundId } = background;
        const backgroundTopology = background.topology;
        const backgroundGeometry =
            backgroundId != null
                ? backgroundTopology.features.find((feature) => feature.properties?.name === backgroundId)?.geometry
                : undefined;

        if (backgroundGeometry != null) {
            bbox = geometryBbox(backgroundGeometry, bbox);
        }

        this.topologyBounds = bbox;

        if (sizeKey != null) {
            const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index;
            const processedSize = processedData.domain.values[sizeIdx] ?? [];
            this.sizeScale.domain = marker.domain ?? processedSize;
        }

        if (colorRange != null && this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
            this.colorScale.domain = processedData.domain.values[colorKeyIdx];
            this.colorScale.range = colorRange;
            this.colorScale.update();
        }

        this.animationState.transition('updateData');
    }

    private isColorScaleValid() {
        const { colorKey } = this.properties;
        if (!colorKey) {
            return false;
        }

        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) {
            return false;
        }

        const colorIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
        const dataCount = processedData.data.length;
        const missCount = getMissCount(this, processedData.defs.values[colorIdx].missing);
        const colorDataMissing = dataCount === 0 || dataCount === missCount;
        return !colorDataMissing;
    }

    override async createNodeData(): Promise<MapMarkerNodeDataContext[]> {
        const { id: seriesId, dataModel, processedData, colorScale, sizeScale, properties, scale } = this;
        const { lonKey, latKey, sizeKey, sizeName, colorKey, colorName, labelKey, label, marker, background } =
            properties;

        if (dataModel == null || processedData == null || scale == null) return [];

        const colorScaleValid = this.isColorScaleValid();

        const latIdx = dataModel.resolveProcessedDataIndexById(this, `latValue`).index;
        const lonIdx = dataModel.resolveProcessedDataIndexById(this, `lonValue`).index;
        const labelIdx = labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : undefined;
        const sizeIdx = sizeKey ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index : undefined;
        const colorIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : undefined;

        sizeScale.range = [marker.size, marker.maxSize ?? marker.size];
        const font = label.getFont();

        const nodeData: MapMarkerNodeDatum[] = [];
        const labelData: MapMarkerNodeLabelDatum[] = [];
        processedData.data.forEach(({ datum, values }) => {
            const lonValue = values[lonIdx];
            const latValue = values[latIdx];
            const [x, y] = scale.convert([lonValue, latValue]);
            const colorValue: number | undefined = colorIdx != null ? values[colorIdx] : undefined;
            const sizeValue: number | undefined = sizeIdx != null ? values[sizeIdx] : undefined;
            const size = sizeValue != null ? sizeScale.convert(sizeValue) : 0;
            const color: string | undefined =
                colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : undefined;

            const labelValue = labelIdx != null ? values[labelIdx] : undefined;
            const labelText =
                labelValue != null
                    ? this.getLabelText(this.properties.label, {
                          value: labelValue,
                          datum,
                          latKey,
                          lonKey,
                          sizeKey,
                          sizeName,
                          colorKey,
                          colorName,
                      })
                    : undefined;
            let labelDatum: MapMarkerNodeLabelDatum | undefined;
            if (labelText != null) {
                const { width, height } = Text.getTextSize(String(labelText), font);
                labelDatum = {
                    point: { x, y, size: 0 },
                    label: { width, height, text: labelText },
                };
                labelData.push(labelDatum);
            }

            nodeData.push({
                series: this,
                itemId: latKey,
                datum,
                label: labelDatum,
                fill: color,
                lonValue,
                latValue,
                sizeValue,
                colorValue,
                point: { x, y, size },
            });
        });

        const { id: backgroundId } = background;
        const backgroundTopology = background.topology;
        const backgroundGeometry =
            backgroundId != null
                ? backgroundTopology.features.find((feature) => feature.properties?.name === backgroundId)?.geometry
                : undefined;
        const projectedBackgroundGeometry =
            backgroundGeometry != null && scale != null ? projectGeometry(backgroundGeometry, scale) : undefined;

        return [
            {
                itemId: seriesId,
                nodeData,
                labelData,
                projectedBackgroundGeometry,
                visible: true,
            },
        ];
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update({ seriesRect }: { seriesRect?: BBox }): Promise<void> {
        const { labelSelection, markerSelection, highlightMarkerSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;

        let highlightedDatum: MapMarkerNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && highlightedDatum.series !== this) {
            highlightedDatum = undefined;
        }

        const { nodeData, projectedBackgroundGeometry } = this.contextNodeData[0];

        this.updateBackground(projectedBackgroundGeometry);

        this.labelSelection = await this.updateLabelSelection({ labelSelection });
        await this.updateLabelNodes({ labelSelection });

        this.markerSelection = await this.updateMarkerSelection({ markerData: nodeData, markerSelection });
        await this.updateMarkerNodes({ markerSelection, isHighlight: false });

        this.highlightMarkerSelection = await this.updateMarkerSelection({
            markerData: highlightedDatum != null ? [highlightedDatum] : [],
            markerSelection: highlightMarkerSelection,
        });
        await this.updateMarkerNodes({ markerSelection: highlightMarkerSelection, isHighlight: true });

        const resize = this.checkResize(seriesRect);
        if (resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    private updateBackground(projectedGeometry: Geometry | undefined) {
        const { backgroundNode, properties } = this;
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } =
            properties.background;

        if (projectedGeometry == null) {
            backgroundNode.projectedGeometry = undefined;
            backgroundNode.visible = false;
            return;
        }

        backgroundNode.visible = true;
        backgroundNode.projectedGeometry = projectedGeometry;
        backgroundNode.fill = fill;
        backgroundNode.fillOpacity = fillOpacity;
        backgroundNode.stroke = stroke;
        backgroundNode.strokeWidth = strokeWidth;
        backgroundNode.strokeOpacity = strokeOpacity;
        backgroundNode.lineDash = lineDash;
        backgroundNode.lineDashOffset = lineDashOffset;
    }

    private async updateLabelSelection(opts: { labelSelection: Selection<Text, PlacedLabel<PointLabelDatum>> }) {
        const placedLabels = (this.isLabelEnabled() ? this.chart?.placeLabels().get(this) : undefined) ?? [];
        return opts.labelSelection.update(placedLabels);
    }

    private async updateLabelNodes(opts: { labelSelection: Selection<Text, PlacedLabel<PointLabelDatum>> }) {
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;

        labelSelection.each((label, { x, y, width, height, text }) => {
            label.visible = true;
            label.x = x + width / 2;
            label.y = y + height / 2;
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.fontFamily = fontFamily;
            label.textAlign = 'center';
            label.textBaseline = 'middle';
        });
    }

    private async updateMarkerSelection(opts: {
        markerData: MapMarkerNodeDatum[];
        markerSelection: Selection<Marker, MapMarkerNodeDatum>;
    }) {
        const { markerData, markerSelection } = opts;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        const data = this.isMarkerEnabled() ? markerData : [];
        return markerSelection.update(data, undefined, (datum) =>
            createDatumId([datum.lonValue, datum.latValue, datum.label?.label.text ?? ''])
        );
    }

    private async updateMarkerNodes(opts: {
        markerSelection: Selection<Marker, MapMarkerNodeDatum>;
        isHighlight: boolean;
    }) {
        const { markerSelection, isHighlight } = opts;
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, size } = this.properties.marker;
        const highlightStyle = isHighlight ? this.properties.highlightStyle.item : undefined;

        markerSelection.each((marker, markerDatum) => {
            const { point } = markerDatum;

            marker.size = point.size > 0 ? point.size : size;
            marker.fill = highlightStyle?.fill ?? markerDatum.fill ?? fill;
            marker.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            marker.stroke = highlightStyle?.stroke ?? stroke;
            marker.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            marker.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            marker.translationX = point.x;
            marker.translationY = point.y;
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    onLegendItemClick(event: LegendItemClickChartEvent) {
        const { legendItemName } = this.properties;
        const { enabled, itemId, series } = event;

        const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
        if (series.id === this.id || matchedLegendItemName) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: LegendItemDoubleClickChartEvent) {
        const { enabled, itemId, series, numVisibleItems } = event;
        const { legendItemName } = this.properties;

        const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
        if (series.id === this.id || matchedLegendItemName) {
            // Double-clicked item should always become visible.
            this.toggleSeriesItem(itemId, true);
        } else if (enabled && numVisibleItems === 1) {
            // Other items should become visible if there is only one existing visible item.
            this.toggleSeriesItem(itemId, true);
        } else {
            // Disable other items if not exactly one enabled.
            this.toggleSeriesItem(itemId, false);
        }
    }

    override isProcessedDataAnimatable() {
        return true;
    }

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    private resetAllAnimation() {
        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);
        this.ctx.animationManager.skipCurrentBatch();

        this.labelSelection.cleanup();
        this.markerSelection.cleanup();
        this.highlightMarkerSelection.cleanup();
    }

    private animateMarkers() {
        const { animationManager } = this.ctx;
        const fns = prepareMapMarkerAnimationFunctions();
        fromToMotion(this.id, 'markers', animationManager, [this.markerSelection, this.highlightMarkerSelection], fns);
    }

    override getLabelData(): PointLabelDatum[] {
        return this.contextNodeData.flatMap(({ labelData }) => labelData);
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] | GradientLegendDatum[] {
        const { processedData, dataModel } = this;
        if (processedData == null || dataModel == null) return [];
        const { legendItemName, latKey, colorKey, colorName, colorRange, visible, marker } = this.properties;

        if (legendType === 'gradient' && colorKey != null && colorRange != null) {
            const colorDomain =
                processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, 'colorValue').index];
            const legendDatum: GradientLegendDatum = {
                legendType: 'gradient',
                enabled: visible,
                seriesId: this.id,
                colorName,
                colorRange,
                colorDomain,
            };
            return [legendDatum];
        } else if (legendType === 'category') {
            const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth } = marker;

            const legendDatum: CategoryLegendDatum = {
                legendType: 'category',
                id: this.id,
                itemId: legendItemName ?? latKey,
                seriesId: this.id,
                enabled: visible,
                label: { text: legendItemName ?? latKey },
                marker: {
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                },
                legendItemName,
            };
            return [legendDatum];
        } else {
            return [];
        }
    }

    override getTooltipHtml(nodeDatum: MapMarkerNodeDatum): string {
        const {
            id: seriesId,
            processedData,
            ctx: { callbackCache },
        } = this;

        if (!processedData || !this.properties.isValid()) {
            return '';
        }

        const { latKey, lonKey, sizeKey, sizeName, colorKey, colorName, formatter, marker, tooltip } = this.properties;
        const { datum, fill, latValue, lonValue, sizeValue, colorValue } = nodeDatum;

        const title = sanitizeHtml(`${latValue} ${lonValue}`);
        const contentLines: string[] = [];
        if (sizeValue != null) {
            contentLines.push(sanitizeHtml((sizeName ?? sizeKey) + ': ' + sizeValue));
        }
        if (colorValue != null) {
            contentLines.push(sanitizeHtml((colorName ?? colorKey) + ': ' + colorValue));
        }
        const content = contentLines.join('<br>');

        let format: AgMapSeriesStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum,
                latKey,
                lonKey,
                fill,
                highlighted: false,
            });
        }

        const color = format?.fill ?? fill ?? marker.fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                latKey,
                lonKey,
                title,
                color,
                ...this.getModuleTooltipParams(),
            }
        );
    }
}
