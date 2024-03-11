import {
    AgMapMarkerSeriesOptionsKeys,
    AgMapShapeSeriesStyle,
    AgSeriesMarkerFormatterParams,
    AgSeriesMarkerStyle,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { extendBbox } from '../map-util/bboxUtil';
import { GeoGeometry } from '../map-util/geoGeometry';
import { geometryBbox, markerPositions, projectGeometry } from '../map-util/geometryUtil';
import { prepareMapMarkerAnimationFunctions } from '../map-util/mapUtil';
import { GEOJSON_OBJECT } from '../map-util/validation';
import { MapMarkerNodeDatum, MapMarkerNodeLabelDatum, MapMarkerSeriesProperties } from './mapMarkerSeriesProperties';

const {
    Validate,
    fromToMotion,
    StateMachine,
    getMissCount,
    createDatumId,
    DataModelSeries,
    SeriesNodePickMode,
    valueProperty,
} = _ModuleSupport;
const { ColorScale, LinearScale } = _Scale;
const { Group, Selection, Text, getMarker } = _Scene;
const { sanitizeHtml, Logger } = _Util;

export interface MapMarkerNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<MapMarkerNodeDatum, MapMarkerNodeLabelDatum> {
    projectedBackgroundGeometry: _ModuleSupport.Geometry | undefined;
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
    static readonly className = 'MapMarkerSeries';
    static readonly type = 'map-marker' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapMarkerSeriesProperties();

    @Validate(GEOJSON_OBJECT, { optional: true, property: 'topology' })
    private _chartTopology?: _ModuleSupport.FeatureCollection = undefined;

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override get hasData() {
        const hasLatLon = this.properties.latKey != null && this.properties.lonKey != null;
        return super.hasData && (this.topology != null || hasLatLon);
    }

    private readonly colorScale = new ColorScale();
    private readonly sizeScale = new LinearScale();

    private backgroundNode = this.contentGroup.appendChild(new GeoGeometry());

    private markerGroup = this.contentGroup.appendChild(new Group({ name: 'markerGroup' }));
    private highlightMarkerGroup = this.contentGroup.appendChild(new Group({ name: 'highlightMarkerGroup' }));

    private labelSelection: _Scene.Selection<_Scene.Text, _Util.PlacedLabel<_Util.PointLabelDatum>> = Selection.select(
        this.labelGroup,
        Text,
        false
    );
    private markerSelection: _Scene.Selection<_Scene.Marker, MapMarkerNodeDatum> = Selection.select(
        this.markerGroup,
        () => this.markerFactory(),
        false
    );
    private highlightMarkerSelection: _Scene.Selection<_Scene.Marker, MapMarkerNodeDatum> = Selection.select(
        this.highlightMarkerGroup,
        () => this.markerFactory()
    );

    private contextNodeData: MapMarkerNodeDataContext[] = [];

    private animationState: _ModuleSupport.StateMachine<MapMarkerAnimationState, MapMarkerAnimationEvent>;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
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

    setChartTopology(topology: any): void {
        this._chartTopology = topology;
        if (this.topology === topology) {
            this.nodeDataRefresh = true;
        }
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

    private markerFactory(): _Scene.Marker {
        const { shape } = this.properties.marker;
        const MarkerShape = getMarker(shape);
        return new MarkerShape();
    }

    private getBackgroundGeometry(): _ModuleSupport.Geometry | undefined {
        const { background } = this.properties;
        const { id, topologyIdKey } = background;
        if (id == null) return;

        const topology = background.topology ?? this.topology;
        return topology?.features.find((feature: _ModuleSupport.Feature) => feature.properties?.[topologyIdKey] === id)
            ?.geometry;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const { data, topology, sizeScale, colorScale } = this;
        const { topologyIdKey, idKey, latKey, lonKey, sizeKey, colorKey, labelKey, colorRange, marker } =
            this.properties;

        const featureById = new Map<string, _ModuleSupport.Feature>();
        topology?.features.forEach((feature) => {
            const property = feature.properties?.[topologyIdKey];
            if (property == null) return;
            featureById.set(property, feature);
        });

        const hasLatLon = latKey != null && lonKey != null;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                ...(idKey != null
                    ? [
                          valueProperty(this, idKey, false, { id: 'idValue' }),
                          valueProperty(this, idKey, false, {
                              id: 'featureValue',
                              processor: () => (datum) => featureById.get(datum),
                          }),
                      ]
                    : []),
                ...(hasLatLon
                    ? [
                          valueProperty(this, latKey, false, { id: 'latValue' }),
                          valueProperty(this, lonKey, false, { id: 'lonValue' }),
                      ]
                    : []),
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: 'labelValue' })] : []),
                ...(sizeKey ? [valueProperty(this, sizeKey, true, { id: 'sizeValue' })] : []),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
            ],
        });

        const featureIdx =
            idKey != null ? dataModel.resolveProcessedDataIndexById(this, `featureValue`).index : undefined;
        const latIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `latValue`).index : undefined;
        const lonIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `lonValue`).index : undefined;
        let bbox = (processedData.data as any[]).reduce<_ModuleSupport.LonLatBBox | undefined>(
            (current, { values }) => {
                const feature: _ModuleSupport.Feature | undefined = featureIdx != null ? values[featureIdx] : undefined;
                if (feature != null) {
                    current = geometryBbox(feature.geometry, current);
                }
                if (latIdx != null && lonIdx != null) {
                    const lon = values[lonIdx];
                    const lat = values[latIdx];
                    current = extendBbox(current, lon, lat, lon, lat);
                }
                return current;
            },
            undefined
        );

        const backgroundGeometry = this.getBackgroundGeometry();
        if (backgroundGeometry != null) {
            bbox = geometryBbox(backgroundGeometry, bbox);
        }

        this.topologyBounds = bbox;

        if (sizeKey != null) {
            const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index;
            const processedSize = processedData.domain.values[sizeIdx] ?? [];
            sizeScale.domain = marker.domain ?? processedSize;
        }

        if (colorRange != null && this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
            colorScale.domain = processedData.domain.values[colorKeyIdx];
            colorScale.range = colorRange;
            colorScale.update();
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

    private getLabelDatum(
        datum: any,
        labelValue: string | undefined,
        x: number,
        y: number,
        size: number,
        font: string
    ): MapMarkerNodeLabelDatum | undefined {
        if (labelValue == null) return;

        const { idKey, idName, latKey, latName, lonKey, lonName, sizeKey, sizeName, labelKey, labelName, label } =
            this.properties;
        const { placement } = label;
        const labelText = this.getLabelText(label, {
            value: labelValue,
            datum,
            idKey,
            idName,
            latKey,
            latName,
            lonKey,
            lonName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
        });
        if (labelText == null) return;

        const { width, height } = Text.getTextSize(String(labelText), font);

        return {
            point: { x, y, size },
            label: { width, height, text: labelText },
            marker: getMarker(this.properties.marker.shape),
            placement,
        };
    }

    override async createNodeData(): Promise<MapMarkerNodeDataContext[]> {
        const { id: seriesId, dataModel, processedData, colorScale, sizeScale, properties, scale } = this;
        const { idKey, latKey, lonKey, sizeKey, colorKey, labelKey, label, marker } = properties;

        if (dataModel == null || processedData == null || scale == null) return [];

        const colorScaleValid = this.isColorScaleValid();

        const hasLatLon = latKey != null && lonKey != null;

        const idIdx = idKey != null ? dataModel.resolveProcessedDataIndexById(this, `idValue`).index : undefined;
        const featureIdx =
            idKey != null ? dataModel.resolveProcessedDataIndexById(this, `featureValue`).index : undefined;
        const latIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `latValue`).index : undefined;
        const lonIdx = hasLatLon ? dataModel.resolveProcessedDataIndexById(this, `lonValue`).index : undefined;
        const labelIdx =
            labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : undefined;
        const sizeIdx = sizeKey != null ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index : undefined;
        const colorIdx =
            colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : undefined;

        sizeScale.range = [marker.size, marker.maxSize ?? marker.size];
        const font = label.getFont();

        let projectedGeometries: Map<string, _ModuleSupport.Geometry> | undefined;
        if (idIdx != null && featureIdx != null) {
            projectedGeometries = new Map<string, _ModuleSupport.Geometry>();
            processedData.data.forEach(({ values }) => {
                const id: string | undefined = values[idIdx];
                const geometry: _ModuleSupport.Geometry | undefined = values[featureIdx]?.geometry;
                const projectedGeometry =
                    geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;
                if (id != null && projectedGeometry != null) {
                    projectedGeometries!.set(id, projectedGeometry);
                }
            });
        }

        const nodeData: MapMarkerNodeDatum[] = [];
        const labelData: MapMarkerNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        processedData.data.forEach(({ datum, values }) => {
            const idValue: string | undefined = idIdx != null ? values[idIdx] : undefined;
            const lonValue: number | undefined = lonIdx != null ? values[lonIdx] : undefined;
            const latValue: number | undefined = latIdx != null ? values[latIdx] : undefined;
            const colorValue: number | undefined = colorIdx != null ? values[colorIdx] : undefined;
            const sizeValue: number | undefined = sizeIdx != null ? values[sizeIdx] : undefined;
            const labelValue: string | undefined = labelIdx != null ? values[labelIdx] : undefined;

            const color: string | undefined =
                colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : undefined;
            const size = sizeValue != null ? sizeScale.convert(sizeValue) : 0;

            const projectedGeometry = idValue != null ? projectedGeometries?.get(idValue) : undefined;
            if (idValue != null && projectGeometry == null) {
                missingGeometries.push(idValue);
            }

            if (projectedGeometry != null) {
                markerPositions(projectedGeometry, 1).forEach(([x, y], index) => {
                    const labelDatum = this.getLabelDatum(datum, labelValue, x, y, size, font);
                    if (labelDatum) {
                        labelData.push(labelDatum);
                    }

                    nodeData.push({
                        series: this,
                        itemId: latKey,
                        datum,
                        index,
                        fill: color,
                        idValue,
                        lonValue,
                        latValue,
                        sizeValue,
                        colorValue,
                        projectedGeometry,
                        point: { x, y, size },
                    });
                });
            }

            if (lonValue != null && latValue != null) {
                const [x, y] = scale.convert([lonValue, latValue]);

                const labelDatum = this.getLabelDatum(datum, labelValue, x, y, size, font);
                if (labelDatum) {
                    labelData.push(labelDatum);
                }

                nodeData.push({
                    series: this,
                    itemId: latKey,
                    datum,
                    index: -1,
                    fill: color,
                    idValue,
                    lonValue,
                    latValue,
                    sizeValue,
                    colorValue,
                    projectedGeometry: undefined,
                    point: { x, y, size },
                });
            }
        });

        const backgroundGeometry = this.getBackgroundGeometry();
        const projectedBackgroundGeometry =
            backgroundGeometry != null ? projectGeometry(backgroundGeometry, scale) : undefined;

        const missingGeometriesCap = 10;
        if (missingGeometries.length > missingGeometriesCap) {
            const excessItems = missingGeometries.length - missingGeometriesCap;
            missingGeometries.length = missingGeometriesCap;
            missingGeometries.push(`(+${excessItems} more)`);
        }
        if (missingGeometries.length > 0) {
            Logger.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
        }

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

    override async update({ seriesRect }: { seriesRect?: _Scene.BBox }): Promise<void> {
        const { labelSelection, markerSelection, highlightMarkerSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

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

    private updateBackground(projectedGeometry: _ModuleSupport.Geometry | undefined) {
        const { backgroundNode, properties } = this;
        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } =
            properties.background;

        if (projectedGeometry == null) {
            backgroundNode.visible = false;
            backgroundNode.projectedGeometry = undefined;
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

    private async updateLabelSelection(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, _Util.PlacedLabel<_Util.PointLabelDatum>>;
    }) {
        const placedLabels = (this.isLabelEnabled() ? this.chart?.placeLabels().get(this) : undefined) ?? [];
        return opts.labelSelection.update(placedLabels);
    }

    private async updateLabelNodes(opts: {
        labelSelection: _Scene.Selection<_Scene.Text, _Util.PlacedLabel<_Util.PointLabelDatum>>;
    }) {
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
        markerSelection: _Scene.Selection<_Scene.Marker, MapMarkerNodeDatum>;
    }) {
        const { markerData, markerSelection } = opts;

        if (this.properties.marker.isDirty()) {
            markerSelection.clear();
            markerSelection.cleanup();
        }

        const data = this.isMarkerEnabled() ? markerData : [];
        return markerSelection.update(data, undefined, (datum) =>
            createDatumId([datum.index, datum.idValue, datum.lonValue, datum.latValue])
        );
    }

    private async updateMarkerNodes(opts: {
        markerSelection: _Scene.Selection<_Scene.Marker, MapMarkerNodeDatum>;
        isHighlight: boolean;
    }) {
        const {
            id: seriesId,
            properties,
            ctx: { callbackCache },
        } = this;
        const { markerSelection, isHighlight } = opts;
        const { idKey, latKey, lonKey, labelKey, sizeKey } = properties;
        const { fill, fillOpacity, stroke, strokeOpacity, size, formatter } = properties.marker;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.marker.strokeWidth);

        markerSelection.each((marker, markerDatum) => {
            const { point } = markerDatum;

            let format: AgSeriesMarkerStyle | undefined;
            if (formatter != null) {
                const params: _Util.RequireOptional<AgSeriesMarkerFormatterParams<MapMarkerNodeDatum>> &
                    _Util.RequireOptional<AgMapMarkerSeriesOptionsKeys> = {
                    seriesId,
                    datum: markerDatum.datum,
                    itemId: markerDatum.itemId,
                    size: point.size,
                    idKey,
                    latKey,
                    lonKey,
                    labelKey,
                    sizeKey,
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                    highlighted: isHighlight,
                };
                format = callbackCache.call(
                    formatter,
                    params as AgSeriesMarkerFormatterParams<MapMarkerNodeDatum> &
                        _Util.RequireOptional<AgMapMarkerSeriesOptionsKeys>
                );
            }

            marker.size = point.size > 0 ? point.size : size;
            marker.fill = highlightStyle?.fill ?? format?.fill ?? markerDatum.fill ?? fill;
            marker.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
            marker.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
            marker.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
            marker.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            marker.translationX = point.x;
            marker.translationY = point.y;
        });

        if (!isHighlight) {
            this.properties.marker.markClean();
        }
    }

    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent) {
        const { legendItemName } = this.properties;
        const { enabled, itemId, series } = event;

        const matchedLegendItemName = legendItemName != null && legendItemName === event.legendItemName;
        if (series.id === this.id || matchedLegendItemName) {
            this.toggleSeriesItem(itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: _ModuleSupport.LegendItemDoubleClickChartEvent) {
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

    override resetAnimation(phase: _ModuleSupport.ChartAnimationPhase): void {
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

    override getLabelData(): _Util.PointLabelDatum[] {
        return this.contextNodeData.flatMap(({ labelData }) => labelData);
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData(
        legendType: _ModuleSupport.ChartLegendType
    ): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[] {
        const { processedData, dataModel } = this;
        if (processedData == null || dataModel == null) return [];
        const { legendItemName, idKey, latKey, colorKey, colorName, colorRange, visible, marker } = this.properties;

        if (legendType === 'gradient' && colorKey != null && colorRange != null) {
            const colorDomain =
                processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, 'colorValue').index];
            const legendDatum: _ModuleSupport.GradientLegendDatum = {
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

            const legendDatum: _ModuleSupport.CategoryLegendDatum = {
                legendType: 'category',
                id: this.id,
                itemId: (legendItemName ?? idKey ?? latKey)!,
                seriesId: this.id,
                enabled: visible,
                label: { text: (legendItemName ?? idKey ?? latKey)! },
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

        const { idKey, latKey, lonKey, sizeKey, sizeName, colorKey, colorName, formatter, marker, tooltip } =
            this.properties;
        const { datum, fill, latValue, lonValue, sizeValue, colorValue } = nodeDatum;

        const title =
            sanitizeHtml(idKey) ??
            (latValue != null && lonValue != null
                ? sanitizeHtml(`${latValue.toFixed(6)} ${lonValue.toFixed(6)}`)
                : undefined) ??
            '';
        const contentLines: string[] = [];
        if (sizeValue != null) {
            contentLines.push(sanitizeHtml((sizeName ?? sizeKey) + ': ' + sizeValue));
        }
        if (colorValue != null) {
            contentLines.push(sanitizeHtml((colorName ?? colorKey) + ': ' + colorValue));
        }
        const content = contentLines.join('<br>');

        let format: AgMapShapeSeriesStyle | undefined;

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
                idKey,
                latKey,
                lonKey,
                title,
                color,
                ...this.getModuleTooltipParams(),
            }
        );
    }
}
