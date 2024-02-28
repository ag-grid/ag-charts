import type { Feature } from 'geojson';

import type { ModuleContext } from '../../../module/moduleContext';
import type { AnimationValue } from '../../../motion/animation';
import { resetMotion } from '../../../motion/resetMotion';
import { StateMachine } from '../../../motion/states';
import type { AgMapSeriesStyle } from '../../../options/series/topology/mapOptions';
import { ColorScale } from '../../../scale/colorScale';
import type { BBox } from '../../../scene/bbox';
import { Group } from '../../../scene/group';
import { Selection } from '../../../scene/selection';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { sanitizeHtml } from '../../../util/sanitize';
import type { ChartAnimationPhase } from '../../chartAnimationPhase';
import type { DataController } from '../../data/dataController';
import { getMissCount } from '../../data/dataModel';
import { createDatumId } from '../../data/processors';
import type { LegendItemClickChartEvent, LegendItemDoubleClickChartEvent } from '../../interaction/chartEventManager';
import type { CategoryLegendDatum, ChartLegendType, GradientLegendDatum } from '../../legendDatum';
import { DataModelSeries } from '../dataModelSeries';
import type { SeriesNodeDataContext } from '../series';
import { SeriesNodePickMode, valueProperty } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import type { LatLongBBox } from './LatLongBBox';
import { GeoGeometry } from './geoGeometry';
import { MapSeriesProperties } from './mapSeriesProperties';
import { geometryBox, geometryCentroid } from './mapUtil';
import type { MercatorScale } from './mercatorScale';

interface MapNodeDatum extends SeriesNodeDatum {
    readonly fill: string;
    readonly colorValue: number | undefined;
    readonly feature: Feature | undefined;
    readonly label: MapNodeLabelDatum | undefined;
}

interface MapNodeLabelDatum {
    lon: number;
    lat: number;
    text: string;
}

export interface MapNodeDataContext extends SeriesNodeDataContext<MapNodeDatum, MapNodeLabelDatum> {
    bbox: LatLongBBox | undefined;
    animationValid?: boolean;
    visible: boolean;
}

export interface MapAnimationData {
    datumSelections: Selection<GeoGeometry, MapNodeDatum>[];
    contextData: MapNodeDataContext[];
    previousContextData?: MapNodeDataContext[];
    seriesRect?: BBox;
    duration?: number;
}

type MapAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type MapAnimationEvent = 'update' | 'updateData' | 'highlight' | 'resize' | 'clear' | 'reset' | 'skip';

export class MapSeries extends DataModelSeries<MapNodeDatum, MapNodeLabelDatum, MapNodeDataContext> {
    scale: MercatorScale | undefined;

    override properties = new MapSeriesProperties();

    readonly colorScale = new ColorScale();

    private itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));

    private itemSelection: Selection<GeoGeometry, MapNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory(),
        false
    );
    private labelSelection: Selection<Text, MapNodeLabelDatum> = Selection.select(this.labelGroup, Text, false);
    private highlightSelection: Selection<GeoGeometry, MapNodeDatum> = Selection.select(this.highlightNode, () =>
        this.nodeFactory()
    );
    // private highlightLabelSelection = Selection.select<Text, TLabel>(this.highlightLabel, Text);

    private contextNodeData: MapNodeDataContext[] = [];

    private animationState: StateMachine<MapAnimationState, MapAnimationEvent>;

    private animationResetFns?: {
        item?: (node: GeoGeometry, datum: MapNodeDatum) => AnimationValue & Partial<GeoGeometry>;
        label?: (node: Text, datum: MapNodeDatum) => AnimationValue & Partial<Text>;
    };

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
            useSeriesGroupLayer: true,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });

        this.animationResetFns = undefined;

        this.animationState = new StateMachine<MapAnimationState, MapAnimationEvent>(
            'empty',
            {
                empty: {
                    update: {
                        target: 'ready',
                        action: (data) => this.animateEmptyUpdateReady(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
                ready: {
                    updateData: 'waiting',
                    clear: 'clearing',
                    highlight: (data) => this.animateReadyHighlight(data),
                    resize: (data) => this.animateReadyResize(data),
                    reset: 'empty',
                    skip: 'ready',
                },
                waiting: {
                    update: {
                        target: 'ready',
                        action: (data) => this.animateWaitingUpdateReady(data),
                    },
                    reset: 'empty',
                    skip: 'ready',
                },
                clearing: {
                    update: {
                        target: 'empty',
                        action: (data) => this.animateClearingUpdateEmpty(data),
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
            this.ctx.chartEventManager.addListener('legend-item-click', (event) => this.onLegendItemClick(event)),
            this.ctx.chartEventManager.addListener('legend-item-double-click', (event) =>
                this.onLegendItemDoubleClick(event)
            )
        );
    }

    private isLabelEnabled() {
        return this.properties.labelKey != null && this.properties.label.enabled;
    }

    private nodeFactory(): GeoGeometry {
        return new GeoGeometry();
    }

    override async processData(dataController: DataController): Promise<void> {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const { data } = this;
        const { idKey, colorKey, labelKey, colorRange, topology } = this.properties;

        const featureById = new Map<string, Feature>();
        topology.features.forEach((feature) => {
            const name = feature.properties?.name;
            if (name == null) return;
            featureById.set(name, feature);
        });

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                valueProperty(this, idKey, false, { id: 'idValue' }),
                valueProperty(this, idKey, false, {
                    id: 'featureValue',
                    processor: () => (datum) => featureById.get(datum),
                }),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: 'labelValue' })] : []),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
            ],
        });

        if (colorRange != null && this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
            this.colorScale.domain = processedData.domain.values[colorKeyIdx];
            this.colorScale.range = colorRange;
            this.colorScale.update();
        }
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

    override async createNodeData(): Promise<MapNodeDataContext[]> {
        const { id: seriesId, dataModel, processedData } = this;
        const { fill: fillProperty, colorKey, labelKey } = this.properties;

        if (dataModel == null || processedData == null) return [];

        const colorScaleValid = this.isColorScaleValid();

        const idIdx = dataModel.resolveProcessedDataIndexById(this, `idValue`).index;
        const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
        const labelIdx = labelKey ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : undefined;
        const colorIdx = colorKey ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : undefined;

        let bbox: LatLongBBox | undefined;
        const nodeData: MapNodeDatum[] = [];
        const labelData: MapNodeLabelDatum[] = [];
        processedData.data.forEach(({ datum, values }) => {
            const colorValue = colorIdx != null ? values[colorIdx] : undefined;
            const fill = colorScaleValid && colorValue != null ? this.colorScale.convert(colorValue) : fillProperty;

            const feature: Feature | undefined = values[featureIdx];
            if (feature != null) {
                bbox = geometryBox(feature.geometry, bbox);
            }

            const labelValue = labelIdx != null ? values[labelIdx] : undefined;
            let label: MapNodeLabelDatum | undefined;
            const centroid = feature != null && labelValue != null ? geometryCentroid(feature.geometry) : undefined;
            if (centroid != null) {
                const [lon, lat] = centroid;
                const text = labelValue!;
                label = { lon, lat, text };
            }

            nodeData.push({
                series: this,
                itemId: values[idIdx],
                datum,
                fill,
                colorValue,
                feature,
                label,
            });

            if (label != null) {
                labelData.push(label);
            }
        });

        return [
            {
                itemId: seriesId,
                nodeData,
                labelData,
                bbox,
                animationValid: true,
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

    computeLatLngBox(): LatLongBBox | undefined {
        return this.contextNodeData.reduce<LatLongBBox | undefined>((combined, { bbox }) => {
            if (bbox == null) return combined;
            if (combined == null) return bbox;
            combined.merge(bbox);
            return combined;
        }, undefined);
    }

    override async update(): Promise<void> {
        const { itemSelection, labelSelection, highlightSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;

        const highligtedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const seriesHighlighted = highligtedDatum != null && highligtedDatum.series === this;

        await Promise.all(
            this.contextNodeData.map(async ({ nodeData, labelData }) => {
                await this.updateDatumSelection({
                    nodeData,
                    datumSelection: itemSelection,
                });

                await this.updateDatumNodes({
                    datumSelection: itemSelection,
                    isHighlight: false,
                });

                await this.updateLabelSelection({ labelData, labelSelection });

                await this.updateLabelNodes({
                    labelSelection,
                    // isHighlight: false,
                });
            })
        );

        await this.updateDatumSelection({
            nodeData: seriesHighlighted ? [highligtedDatum as any] : [],
            datumSelection: highlightSelection,
            // seriesIdx: -1,
        });

        await this.updateDatumNodes({
            datumSelection: highlightSelection,
            isHighlight: true,
        });
    }

    private async updateDatumSelection(opts: {
        nodeData: MapNodeDatum[];
        datumSelection: Selection<GeoGeometry, MapNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.itemId));
    }

    private async updateDatumNodes(opts: {
        datumSelection: Selection<GeoGeometry, MapNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;
        const { scale } = this;
        const { fillOpacity, stroke, strokeWidth, strokeOpacity } = this.properties;
        const highlightStyle = isHighlight ? this.properties.highlightStyle.item : undefined;

        datumSelection.each((geoGeometry, datum) => {
            geoGeometry.geometry = datum.feature?.geometry;
            geoGeometry.scale = scale;
            geoGeometry.fill = highlightStyle?.fill ?? datum.fill;
            geoGeometry.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            geoGeometry.stroke = highlightStyle?.stroke ?? stroke;
            geoGeometry.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            geoGeometry.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity ?? 1;
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: MapNodeLabelDatum[];
        labelSelection: Selection<Text, MapNodeLabelDatum>;
    }) {
        const data = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(data, undefined);
    }

    protected async updateLabelNodes(opts: { labelSelection: Selection<Text, MapNodeLabelDatum> }) {
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;
        labelSelection.each((label, { lon, lat, text }) => {
            const [x, y] = this.scale!.convert([lon, lat]);

            label.visible = true;
            label.x = x;
            label.y = y;
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

    override resetAnimation(phase: ChartAnimationPhase): void {
        if (phase === 'initial') {
            this.animationState.transition('reset');
        } else if (phase === 'ready') {
            this.animationState.transition('skip');
        }
    }

    private resetAllAnimation(data: MapAnimationData) {
        // Stop any running animations by prefix convention.
        this.ctx.animationManager.stopByAnimationGroupId(this.id);

        if (data.contextData.some((d) => d.animationValid === false)) {
            this.ctx.animationManager.skipCurrentBatch();
        }
    }

    private animateEmptyUpdateReady(data: MapAnimationData) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    private animateWaitingUpdateReady(data: MapAnimationData) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    private animateReadyHighlight(data: Selection<GeoGeometry, MapNodeDatum>) {
        const item = this.animationResetFns?.item;
        if (item != null) {
            resetMotion([data], item);
        }
    }

    private animateReadyResize(data: MapAnimationData) {
        this.resetAllAnimation(data);
    }

    private animateClearingUpdateEmpty(data: MapAnimationData) {
        this.ctx.animationManager.skipCurrentBatch();
        this.resetAllAnimation(data);
    }

    // private animationTransitionClear() {
    //     this.animationState.transition('clear', this.getAnimationData());
    // }

    // private getAnimationData(seriesRect?: BBox, previousContextData?: MapNodeDataContext[]) {
    //     const animationData: MapAnimationData = {
    //         datumSelections: [this.itemSelection],
    //         contextData: this.contextNodeData,
    //         previousContextData,
    //         seriesRect,
    //     };

    //     return animationData;
    // }

    override getLabelData(): PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] | GradientLegendDatum[] {
        const { processedData, dataModel } = this;
        if (processedData == null || dataModel == null) return [];
        const {
            legendItemName,
            idKey,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            colorKey,
            colorName,
            colorRange,
            visible,
        } = this.properties;

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
            const legendDatum: CategoryLegendDatum = {
                legendType: 'category',
                id: this.id,
                itemId: legendItemName ?? idKey,
                seriesId: this.id,
                enabled: visible,
                label: { text: legendItemName ?? idKey },
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

    override getTooltipHtml(nodeDatum: MapNodeDatum): string {
        const {
            id: seriesId,
            processedData,
            ctx: { callbackCache },
        } = this;

        if (!processedData || !this.properties.isValid()) {
            return '';
        }

        const { idKey, colorKey, colorName, stroke, strokeWidth, formatter, tooltip } = this.properties;
        const { itemId, datum, fill, colorValue } = nodeDatum;

        const title = sanitizeHtml(itemId);
        const content = colorValue != null ? sanitizeHtml((colorName ?? colorKey) + ': ' + colorValue) : '';

        let format: AgMapSeriesStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum,
                idKey,
                fill,
                stroke,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                highlighted: false,
            });
        }

        const color = format?.fill ?? fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                idKey,
                title,
                color,
                ...this.getModuleTooltipParams(),
            }
        );
    }
}
