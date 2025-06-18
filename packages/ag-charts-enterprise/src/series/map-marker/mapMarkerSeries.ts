import { type AgMapMarkerSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import { Logger } from 'ag-charts-core';
import { type AgMapMarkerSeriesLabelFormatterParams } from 'ag-charts-types';

import { geometryBbox, projectGeometry } from '../map-util/geometryUtil';
import { prepareMapMarkerAnimationFunctions } from '../map-util/mapUtil';
import { MapZIndexMap } from '../map-util/mapZIndexMap';
import { markerPositions } from '../map-util/markerUtil';
import { getTopologyShapeFillBBox } from '../map-util/shapeFillBBox';
import { TopologySeries } from '../map-util/topologySeries';
import {
    type MapMarkerNodeDatum,
    type MapMarkerNodeLabelDatum,
    MapMarkerSeriesProperties,
} from './mapMarkerSeriesProperties';

const {
    CachedTextMeasurerPool,
    fromToMotion,
    StateMachine,
    getMissCount,
    createDatumId,
    SeriesNodePickMode,
    valueProperty,
    computeMarkerFocusBounds,
    ColorScale,
    LinearScale,
    Group,
    Selection,
    Text,
    Marker,
    applyShapeStyle,
    getShapeStyle,
    LonLatBBox,
} = _ModuleSupport;

interface MapMarkerNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<MapMarkerNodeDatum, MapMarkerNodeLabelDatum> {}

type MapMarkerAnimationState = 'empty' | 'ready' | 'waiting' | 'clearing';
type MapMarkerAnimationEvent = {
    update: undefined;
    updateData: undefined;
    highlight: undefined;
    resize: undefined;
    clear: undefined;
    reset: undefined;
    skip: undefined;
};

type ItemStyle = Required<AgMapMarkerSeriesStyle>;

export class MapMarkerSeries
    extends TopologySeries<
        MapMarkerNodeDatum,
        MapMarkerSeriesProperties,
        MapMarkerNodeLabelDatum,
        MapMarkerNodeDataContext
    >
    implements _ModuleSupport.ITopology
{
    static readonly className = 'MapMarkerSeries';
    static readonly type = 'map-marker' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapMarkerSeriesProperties();

    private _chartTopology?: _ModuleSupport.FeatureCollection = undefined;

    public override getNodeData(): MapMarkerNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override get hasData() {
        const hasLatLon = this.properties.latitudeKey != null && this.properties.longitudeKey != null;
        return super.hasData && (this.topology != null || hasLatLon);
    }

    private readonly colorScale = new ColorScale();
    private readonly sizeScale = new LinearScale();

    private readonly markerGroup = this.contentGroup.appendChild(new Group({ name: 'markerGroup' }));

    private labelSelection: _ModuleSupport.Selection<
        _ModuleSupport.Text,
        _ModuleSupport.PlacedLabel<_ModuleSupport.PointLabelDatum>
    > = Selection.select(this.labelGroup, Text, false);
    private markerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum> = Selection.select(
        this.markerGroup,
        Marker,
        false
    );
    private highlightMarkerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum> =
        Selection.select(this.highlightNode, Marker);

    private contextNodeData?: MapMarkerNodeDataContext;

    private readonly animationState: _ModuleSupport.StateMachine<MapMarkerAnimationState, MapMarkerAnimationEvent>;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            categoryKey: undefined,
            propertyKeys: {
                size: ['colorKey'],
                color: ['colorKey'],
                label: ['labelKey'],
            },
            propertyNames: {
                size: ['sizeName'],
                color: ['colorName'],
                label: ['labelName'],
            },
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
            usesPlacedLabels: true,
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
                    // chart.ts transitions to updateData on zoom change
                    resize: {
                        target: 'ready',
                        action: () => this.resetAllAnimation(),
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

    override renderToOffscreenCanvas(): boolean {
        return true;
    }

    setChartTopology(topology: any): void {
        this._chartTopology = topology;
        if (this.topology === topology) {
            this.nodeDataRefresh = true;
        }
    }

    override setSeriesIndex(index: number): boolean {
        if (!super.setSeriesIndex(index)) return false;

        this.contentGroup.zIndex = [MapZIndexMap.Marker, index];
        this.highlightGroup.zIndex = [MapZIndexMap.MarkerHighlight, index];

        return true;
    }

    private isLabelEnabled() {
        return this.properties.labelKey != null && this.properties.label.enabled;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null) return;

        const { data, topology, sizeScale, colorScale } = this;
        const { topologyIdKey, idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } =
            this.properties;

        const featureById = new Map<string, _ModuleSupport.Feature>();
        topology?.features.forEach((feature) => {
            const property = feature.properties?.[topologyIdKey];
            if (property == null) return;
            featureById.set(property, feature);
        });

        const sizeScaleType = this.sizeScale.type;
        const colorScaleType = this.colorScale.type;
        const mercatorScaleType = this.scale?.type;

        const hasLatLon = latitudeKey != null && longitudeKey != null;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                ...(idKey != null
                    ? [
                          valueProperty(idKey, mercatorScaleType, { id: 'idValue', includeProperty: false }),
                          valueProperty(idKey, mercatorScaleType, {
                              id: 'featureValue',
                              includeProperty: false,
                              processor: () => (datum) => featureById.get(datum as string),
                          }),
                      ]
                    : []),
                ...(hasLatLon
                    ? [
                          valueProperty(latitudeKey, mercatorScaleType, { id: 'latValue' }),
                          valueProperty(longitudeKey, mercatorScaleType, { id: 'lonValue' }),
                      ]
                    : []),
                ...(labelKey ? [valueProperty(labelKey, 'band', { id: 'labelValue' })] : []),
                ...(sizeKey ? [valueProperty(sizeKey, sizeScaleType, { id: 'sizeValue' })] : []),
                ...(colorKey ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue' })] : []),
            ],
        });

        const featureValues =
            idKey != null
                ? dataModel.resolveColumnById<_ModuleSupport.Feature | undefined>(this, `featureValue`, processedData)
                : undefined;
        const latValues = hasLatLon ? dataModel.resolveColumnById<number>(this, `latValue`, processedData) : undefined;
        const lonValues = hasLatLon ? dataModel.resolveColumnById<number>(this, `lonValue`, processedData) : undefined;
        this.topologyBounds = processedData.dataSources
            .get(this.id)
            ?.reduce<_ModuleSupport.LonLatBBox | undefined>((current, _datum, datumIndex) => {
                const feature: _ModuleSupport.Feature | undefined = featureValues?.[datumIndex];
                const geometry = feature?.geometry;
                if (geometry != null) {
                    current = geometryBbox(geometry, current);
                }
                if (latValues != null && lonValues != null) {
                    const lon = lonValues[datumIndex];
                    const lat = latValues[datumIndex];
                    current = LonLatBBox.extend(current, lon, lat, lon, lat);
                }
                return current;
            }, undefined);

        if (sizeKey != null) {
            const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
            const processedSize = processedData.domain.values[sizeIdx] ?? [];
            sizeScale.domain = sizeDomain ?? processedSize;
        }

        if (colorRange != null && this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
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

        const colorIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
        const dataCount = processedData.input.count;
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
        measurer: _ModuleSupport.CachedTextMeasurer
    ): MapMarkerNodeLabelDatum | undefined {
        if (labelValue == null) return;

        const {
            idKey,
            idName,
            latitudeKey,
            latitudeName,
            longitudeKey,
            longitudeName,
            sizeKey,
            sizeName,
            colorKey,
            colorName,
            labelKey,
            labelName,
            label,
            shape,
        } = this.properties;
        if (labelKey == null) return;

        const { placement } = label;
        const labelText = this.getLabelText<AgMapMarkerSeriesLabelFormatterParams>(
            labelValue,
            datum,
            labelKey,
            'label',
            [],
            label,
            {
                value: labelValue,
                datum,
                idKey,
                idName,
                latitudeKey,
                latitudeName,
                longitudeKey,
                longitudeName,
                sizeKey,
                sizeName,
                colorKey,
                colorName,
                labelKey,
                labelName,
            }
        );
        if (labelText == null) return;

        const { width, height } = measurer.measureText(String(labelText));
        const anchor = Marker.anchor(shape);

        return {
            point: { x, y, size },
            label: { width, height, text: labelText },
            anchor,
            placement,
        };
    }

    override createNodeData() {
        const { id: seriesId, dataModel, processedData, sizeScale, properties, scale } = this;
        const { idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey, label, legendItemName } = properties;

        if (dataModel == null || processedData == null || scale == null) return;

        const hasLatLon = latitudeKey != null && longitudeKey != null;

        const idValues =
            idKey != null ? dataModel.resolveColumnById<string>(this, `idValue`, processedData) : undefined;
        const featureValues =
            idKey != null
                ? dataModel.resolveColumnById<_ModuleSupport.Feature | undefined>(this, `featureValue`, processedData)
                : undefined;
        const latValues = hasLatLon ? dataModel.resolveColumnById<number>(this, `latValue`, processedData) : undefined;
        const lonValues = hasLatLon ? dataModel.resolveColumnById<number>(this, `lonValue`, processedData) : undefined;
        const labelValues =
            labelKey != null ? dataModel.resolveColumnById<string>(this, `labelValue`, processedData) : undefined;
        const sizeValues =
            sizeKey != null ? dataModel.resolveColumnById<number>(this, `sizeValue`, processedData) : undefined;
        const colorValues =
            colorKey != null ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData) : undefined;

        const markerMaxSize = properties.maxSize ?? properties.size;
        sizeScale.range = [Math.min(properties.size, markerMaxSize), markerMaxSize];
        const measurer = CachedTextMeasurerPool.getMeasurer({ font: label });

        let projectedGeometries: Map<string, _ModuleSupport.Geometry> | undefined;
        if (idValues != null && featureValues != null) {
            projectedGeometries = new Map<string, _ModuleSupport.Geometry>();
            processedData.dataSources.get(this.id)?.forEach((_datum, datumIndex) => {
                const id: string | undefined = idValues[datumIndex];
                const geometry: _ModuleSupport.Geometry | undefined = featureValues[datumIndex]?.geometry ?? undefined;
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
        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((datum, datumIndex) => {
            const idValue = idValues?.[datumIndex];
            const lonValue = lonValues?.[datumIndex];
            const latValue = latValues?.[datumIndex];
            const colorValue = colorValues?.[datumIndex];
            const sizeValue = sizeValues?.[datumIndex];
            const labelValue = labelValues?.[datumIndex];

            const size = sizeValue != null ? sizeScale.convert(sizeValue, { clamp: true }) : properties.size;

            const projectedGeometry = idValue != null ? projectedGeometries?.get(idValue) : undefined;
            if (idValue != null && projectGeometry == null) {
                missingGeometries.push(idValue);
            }

            if (lonValue != null && latValue != null) {
                const [x, y] = scale.convert([lonValue, latValue]);

                const labelDatum = this.getLabelDatum(datum, labelValue, x, y, size, measurer);
                if (labelDatum) {
                    labelData.push(labelDatum);
                }

                nodeData.push({
                    series: this,
                    itemId: latitudeKey,
                    datum,
                    datumIndex,
                    index: -1,
                    idValue,
                    lonValue,
                    latValue,
                    labelValue,
                    sizeValue,
                    colorValue,
                    point: { x, y, size },
                    midPoint: { x, y },
                    legendItemName,
                });
            } else if (projectedGeometry != null) {
                markerPositions(projectedGeometry, 1).forEach(([x, y], index) => {
                    const labelDatum = this.getLabelDatum(datum, labelValue, x, y, size, measurer);
                    if (labelDatum) {
                        labelData.push(labelDatum);
                    }

                    nodeData.push({
                        series: this,
                        itemId: latitudeKey,
                        datum,
                        datumIndex,
                        index,
                        idValue,
                        lonValue,
                        latValue,
                        labelValue,
                        sizeValue,
                        colorValue,
                        point: { x, y, size },
                        midPoint: { x, y },
                        legendItemName,
                    });
                });
            }
        });

        const missingGeometriesCap = 10;
        if (missingGeometries.length > missingGeometriesCap) {
            const excessItems = missingGeometries.length - missingGeometriesCap;
            missingGeometries.length = missingGeometriesCap;
            missingGeometries.push(`(+${excessItems} more)`);
        }
        if (missingGeometries.length > 0) {
            Logger.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
        }

        return {
            itemId: seriesId,
            nodeData,
            labelData,
        };
    }

    updateSelections() {
        if (this.nodeDataRefresh) {
            this.contextNodeData = this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    private previousScale: _ModuleSupport.MercatorScale | undefined;
    private checkScaleChange() {
        if (this.previousScale === this.scale) return false;
        this.previousScale = this.scale;
        return true;
    }

    override update({ seriesRect }: { seriesRect?: _ModuleSupport.BBox }) {
        const resize = this.checkResize(seriesRect);
        const scaleChange = this.checkScaleChange();

        const { markerSelection, highlightMarkerSelection } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;

        let highlightedDatum: MapMarkerNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        const { legendItemName } = this.properties;
        const matchingLegendItemName =
            legendItemName != null &&
            highlightedDatum?.datum == null &&
            legendItemName === highlightedDatum?.legendItemName;

        if (
            highlightedDatum != null &&
            ((highlightedDatum.series !== this && !matchingLegendItemName) || highlightedDatum.datum == null)
        ) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];

        this.markerSelection = this.updateMarkerSelection({ markerData: nodeData, markerSelection });
        this.updateMarkerNodes({ markerSelection, isHighlight: false, highlightedDatum });

        this.highlightMarkerSelection = this.updateMarkerSelection({
            markerData: highlightedDatum != null ? [highlightedDatum] : [],
            markerSelection: highlightMarkerSelection,
        });
        this.updateMarkerNodes({
            markerSelection: highlightMarkerSelection,
            isHighlight: true,
            highlightedDatum,
        });

        if (scaleChange || resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    public override updatePlacedLabelData(labelData: _ModuleSupport.PlacedLabel<MapMarkerNodeLabelDatum>[]) {
        this.labelSelection = this.labelSelection.update(labelData, (text) => {
            text.pointerEvents = _ModuleSupport.PointerEvents.None;
        });
        this.updateLabelNodes({ labelSelection: this.labelSelection });
    }

    private updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<
            _ModuleSupport.Text,
            _ModuleSupport.PlacedLabel<_ModuleSupport.PointLabelDatum>
        >;
    }) {
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = this.properties.label;

        labelSelection.each((label, { x, y, width, height, text }, datumIndex) => {
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
            label.opacity = this.getHighlightStyle(false, datumIndex).opacity ?? 1;
        });
    }

    private updateMarkerSelection(opts: {
        markerData: MapMarkerNodeDatum[];
        markerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum>;
    }) {
        const { markerData, markerSelection } = opts;

        return markerSelection.update(markerData, undefined, (datum) =>
            createDatumId([datum.index, datum.idValue, datum.lonValue, datum.latValue])
        );
    }

    private getMarkerItemBaseStyle(isHighlight: boolean, datum?: MapMarkerNodeDatum): ItemStyle {
        const { properties } = this;
        const highlightStyle = this.getHighlightStyle(isHighlight, datum?.datumIndex);

        return getShapeStyle(
            {
                shape: properties.shape,
                size: properties.size,
                fill: highlightStyle?.fill ?? properties.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
                stroke: highlightStyle?.stroke ?? properties.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
                strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
                lineDash: highlightStyle?.lineDash ?? properties.lineDash,
                lineDashOffset: highlightStyle?.lineDashOffset ?? properties.lineDashOffset,
                opacity: highlightStyle.opacity ?? 1,
            },
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    protected getMarkerItemStyleOverrides(
        datumId: string,
        datum: any,
        colorValue: number | undefined,
        sizeValue: number | undefined,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties, colorScale, sizeScale } = this;
        const { colorRange, itemStyler } = properties;

        let overrides: Partial<ItemStyle> | undefined;

        overrides ??= {};
        if (!highlighted && colorValue != null) {
            overrides.fill = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : colorRange?.[0] ?? properties.fill;
        }

        if (sizeValue != null) {
            overrides.size = sizeScale.convert(sizeValue, { clamp: true });
        }

        if (itemStyler != null) {
            const itemStyle = this.cachedDatumCallback(
                createDatumId(datumId, highlighted ? 'highlight' : 'node'),
                () => {
                    return this.callWithContext(itemStyler, {
                        seriesId,
                        datum,
                        highlighted,
                        ...format,
                        ...overrides,
                    });
                }
            );

            overrides ??= {};
            Object.assign(overrides, itemStyle);
        }

        return overrides;
    }

    private updateMarkerNodes(opts: {
        markerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum>;
        isHighlight: boolean;
        highlightedDatum: MapMarkerNodeDatum | undefined;
    }) {
        const { markerSelection, isHighlight, highlightedDatum } = opts;

        const fillBBox = getTopologyShapeFillBBox(this.scale);

        markerSelection.each((marker, markerDatum) => {
            const { datumIndex, datum, point, colorValue, sizeValue } = markerDatum;
            const style = this.getMarkerItemBaseStyle(isHighlight, markerDatum);
            const overrides = this.getMarkerItemStyleOverrides(
                String(datumIndex),
                datum,
                colorValue,
                sizeValue,
                style,
                isHighlight
            );

            marker.shape = overrides?.shape ?? style.shape;
            marker.size = overrides?.size ?? style.size;

            applyShapeStyle(marker, style, overrides, fillBBox);

            marker.x = point.x;
            marker.y = point.y;
            marker.scalingCenterX = point.x;
            marker.scalingCenterY = point.y;

            marker.zIndex = !isHighlight && highlightedDatum != null && datum === highlightedDatum.datum ? 1 : 0;
        });
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

    override getLabelData() {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    override pickNodeClosestDatum(p: _ModuleSupport.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        const { x: x0, y: y0 } = p;

        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum<unknown> | undefined;

        this.contextNodeData?.nodeData.forEach((datum) => {
            const { x, y, size } = datum.point;
            const dx = Math.max(Math.abs(x - x0) - size, 0);
            const dy = Math.max(Math.abs(y - y0) - size, 0);
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });

        return minDatum != null ? { datum: minDatum, distance: Math.sqrt(minDistanceSquared) } : undefined;
    }

    private legendItemSymbol(datumIndex?: number): _ModuleSupport.LegendSymbolOptions {
        const { dataModel, processedData, properties } = this;
        const { shape, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = properties;

        let { fill } = properties;
        if (datumIndex != null && this.isColorScaleValid()) {
            const colorValues = dataModel!.resolveColumnById(this, 'colorValue', processedData!);
            const colorValue = colorValues[datumIndex];
            fill = this.colorScale.convert(colorValue);
        }

        return {
            marker: getShapeStyle(
                {
                    shape,
                    fill,
                    fillOpacity,
                    stroke,
                    strokeWidth,
                    strokeOpacity,
                    lineDash,
                    lineDashOffset,
                },
                this.properties.fillGradientDefaults,
                this.properties.fillPatternDefaults,
                this.properties.fillImageDefaults
            ),
        };
    }

    override getLegendData(
        legendType: _ModuleSupport.ChartLegendType
    ): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[] {
        const { processedData, dataModel } = this;
        if (processedData == null || dataModel == null) return [];

        const { id: seriesId, visible } = this;

        const { title, legendItemName, idName, idKey, colorKey, colorRange, showInLegend } = this.properties;

        if (legendType === 'gradient' && colorKey != null && colorRange != null) {
            const colorDomain =
                processedData.domain.values[dataModel.resolveProcessedDataIndexById(this, 'colorValue')];
            const legendDatum: _ModuleSupport.GradientLegendDatum = {
                legendType: 'gradient',
                enabled: visible,
                seriesId,
                series: this.getFormatterContext('color'),
                colorRange,
                colorDomain,
            };
            return [legendDatum];
        } else if (legendType === 'category') {
            const legendDatum: _ModuleSupport.CategoryLegendDatum = {
                legendType: 'category',
                id: seriesId,
                itemId: seriesId,
                seriesId,
                enabled: visible,
                label: { text: legendItemName ?? title ?? idName ?? idKey ?? seriesId },
                symbol: this.legendItemSymbol(),
                legendItemName,
                hideInLegend: !showInLegend,
            };
            return [legendDatum];
        } else {
            return [];
        }
    }

    override getTooltipContent(datumIndex: number): _ModuleSupport.TooltipContent | undefined {
        const {
            id: seriesId,
            dataModel,
            processedData,
            properties,
            ctx: { formatManager },
        } = this;
        const {
            idKey,
            idName,
            latitudeKey,
            latitudeName,
            longitudeKey,
            longitudeName,
            colorKey,
            colorName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            title,
            legendItemName,
            tooltip,
        } = properties;
        if (!dataModel || !processedData) return;

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const sizeValue =
            sizeKey != null
                ? dataModel.resolveColumnById<number>(this, `sizeValue`, processedData)[datumIndex]
                : undefined;
        const colorValue =
            colorKey != null
                ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData)[datumIndex]
                : undefined;

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        if (this.isLabelEnabled() && labelKey != null && labelKey !== idKey) {
            const labelValue = dataModel.resolveColumnById<string>(this, `labelValue`, processedData)[datumIndex];
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'category',
                value: labelValue,
                datum,
                seriesId,
                legendItemName,
                key: labelKey,
                source: 'tooltip',
                property: 'label',
                domain: [],
                boundSeries: this.getFormatterContext('label'),
            });
            data.push({ label: labelName, fallbackLabel: labelKey, value: content ?? labelValue });
        }
        if (sizeKey != null && sizeValue != null) {
            const domain = dataModel.getDomain(this, `sizeValue`, 'value', processedData);
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: sizeValue,
                datum,
                seriesId,
                legendItemName,
                key: sizeKey,
                source: 'tooltip',
                property: 'size',
                domain,
                boundSeries: this.getFormatterContext('size'),
                fractionDigits: undefined,
            });
            data.push({ label: sizeName, fallbackLabel: sizeKey, value: content ?? String(sizeValue) });
        }
        if (colorKey != null && colorValue != null) {
            const domain = dataModel.getDomain(this, `colorValue`, 'value', processedData);
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: colorValue,
                datum,
                seriesId,
                legendItemName,
                key: colorKey,
                source: 'tooltip',
                property: 'color',
                domain,
                boundSeries: this.getFormatterContext('color'),
                fractionDigits: undefined,
            });
            data.push({ label: colorName, fallbackLabel: colorKey, value: content ?? String(colorValue) });
        }

        let heading: string | undefined;
        if (idKey != null) {
            heading = dataModel.resolveColumnById<string>(this, `idValue`, processedData)[datumIndex];
        } else if (latitudeKey != null && longitudeKey != null) {
            const latValue = dataModel.resolveColumnById<number>(this, `latValue`, processedData)[datumIndex];
            const lonValue = dataModel.resolveColumnById<number>(this, `lonValue`, processedData)[datumIndex];
            heading = `${Math.abs(latValue).toFixed(4)}\u00B0 ${latValue >= 0 ? 'N' : 'S'}, ${Math.abs(lonValue).toFixed(4)}\u00B0 ${lonValue >= 0 ? 'W' : 'E'}`;
        }

        const format = this.getMarkerItemBaseStyle(false);
        Object.assign(
            format,
            this.getMarkerItemStyleOverrides(String(datumIndex), datumIndex, colorValue, sizeValue, format, false)
        );

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading,
                title: title ?? legendItemName,
                symbol: this.legendItemSymbol(datumIndex),
                data,
            },
            {
                seriesId,
                datum,
                title,
                idKey,
                idName,
                latitudeKey,
                latitudeName,
                longitudeKey,
                longitudeName,
                colorKey,
                colorName,
                sizeKey,
                sizeName,
                labelKey,
                labelName,
                ...format,
            }
        );
    }

    public getFormattedMarkerStyle(markerDatum: MapMarkerNodeDatum) {
        const { datumIndex, colorValue, sizeValue } = markerDatum;
        const format = this.getMarkerItemBaseStyle(false);
        Object.assign(
            format,
            this.getMarkerItemStyleOverrides(String(datumIndex), datumIndex, colorValue, sizeValue, format, false)
        );
        return { size: format.size };
    }

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }
}
