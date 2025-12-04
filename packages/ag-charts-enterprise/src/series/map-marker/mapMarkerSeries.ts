import { type AgMapMarkerSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartAnimationPhase,
    type Feature,
    type FeatureCollection,
    type Geometry,
    type ITextMeasurer,
    Logger,
    LonLatBBox,
    type PlacedLabel,
    type Point,
    type SizedPoint,
    StateMachine,
    cachedTextMeasurer,
    mergeDefaults,
} from 'ag-charts-core';
import { type AgMapMarkerSeriesLabelFormatterParams, type AgMapMarkerSeriesOptions } from 'ag-charts-types';

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
    fromToMotion,
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
    getLabelStyles,
} = _ModuleSupport;

interface MapMarkerNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<MapMarkerNodeDatum, MapMarkerNodeLabelDatum> {}

interface MarkerDataValues {
    readonly idValue: string | undefined;
    readonly lonValue: number | undefined;
    readonly latValue: number | undefined;
    readonly labelValue: string | undefined;
    readonly sizeValue: number | undefined;
    readonly colorValue: number | undefined;
}

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

export class MapMarkerSeries
    extends TopologySeries<
        MapMarkerNodeDatum,
        AgMapMarkerSeriesOptions,
        MapMarkerSeriesProperties,
        MapMarkerNodeLabelDatum,
        MapMarkerNodeDataContext
    >
    implements _ModuleSupport.ITopology
{
    static readonly className = 'MapMarkerSeries';
    static readonly type = 'map-marker' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: LonLatBBox | undefined;

    override properties = new MapMarkerSeriesProperties();

    private _chartTopology?: FeatureCollection = undefined;

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

    private labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PlacedLabel<MapMarkerNodeLabelDatum>> =
        Selection.select(this.labelGroup, Text, false);
    private highlightLabelSelection: _ModuleSupport.Selection<
        _ModuleSupport.Text,
        PlacedLabel<MapMarkerNodeLabelDatum>
    > = Selection.select(this.highlightLabelGroup, Text, false);
    private markerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum> = Selection.select(
        this.markerGroup,
        Marker,
        false
    );
    private highlightMarkerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum> =
        Selection.select(this.highlightNodeGroup, Marker);
    private placedLabelData: PlacedLabel<MapMarkerNodeLabelDatum>[] = [];

    private contextNodeData?: MapMarkerNodeDataContext;

    private readonly animationState: StateMachine<MapMarkerAnimationState, MapMarkerAnimationEvent>;

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

    override setZIndex(zIndex: number): boolean {
        super.setZIndex(zIndex);

        this.contentGroup.zIndex = [MapZIndexMap.Marker, zIndex];
        this.highlightGroup.zIndex = [MapZIndexMap.MarkerHighlight, zIndex];

        return true;
    }

    private isLabelEnabled() {
        return this.properties.labelKey != null && this.properties.label.enabled;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null) return;

        const { data, sizeScale, colorScale } = this;
        const { topologyIdKey, idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } =
            this.properties;

        const featureById = this.buildFeatureMap(topologyIdKey);

        const sizeScaleType = this.sizeScale.type;
        const colorScaleType = this.colorScale.type;
        const mercatorScaleType = this.scale?.type;

        const hasLatLon = latitudeKey != null && longitudeKey != null;
        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                ...(idKey == null
                    ? []
                    : [
                          valueProperty(idKey, mercatorScaleType, { id: 'idValue', includeProperty: false }),
                          valueProperty(idKey, mercatorScaleType, {
                              id: 'featureValue',
                              includeProperty: false,
                              processor: () => (datum) => featureById.get(datum as string),
                          }),
                      ]),
                ...(hasLatLon
                    ? [
                          valueProperty(latitudeKey, mercatorScaleType, { id: 'latValue' }),
                          valueProperty(longitudeKey, mercatorScaleType, { id: 'lonValue' }),
                      ]
                    : []),
                ...(labelKey ? [valueProperty(labelKey, 'category', { id: 'labelValue' })] : []),
                ...(sizeKey ? [valueProperty(sizeKey, sizeScaleType, { id: 'sizeValue' })] : []),
                ...(colorKey ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue' })] : []),
            ],
        });

        const featureValues =
            idKey == null
                ? undefined
                : dataModel.resolveColumnById<Feature | undefined>(this, `featureValue`, processedData);
        const latValues = hasLatLon ? dataModel.resolveColumnById<number>(this, `latValue`, processedData) : undefined;
        const lonValues = hasLatLon ? dataModel.resolveColumnById<number>(this, `lonValue`, processedData) : undefined;
        this.topologyBounds = processedData.dataSources
            .get(this.id)
            ?.data.reduce<LonLatBBox | undefined>((current, _datum, datumIndex) => {
                const feature: Feature | undefined = featureValues?.[datumIndex];
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
        node: MapMarkerNodeDatum,
        labelValue: string | undefined,
        measurer: ITextMeasurer
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
        if (labelKey == null || !label.enabled) return;

        const { datum, datumIndex, index, idValue, lonValue, latValue, point } = node;
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

        const { width, height } = measurer.measureLines(String(labelText));
        const anchor = Marker.anchor(shape);

        return {
            point: { x: point.x, y: point.y, size: point.size },
            label: { width, height, text: labelText },
            anchor,
            placement,
            datumIndex,
            datumId: createDatumId(index, idValue, lonValue, latValue),
        };
    }

    private resolveColumn<T>(
        key: string | undefined,
        columnId: string,
        processedData: _ModuleSupport.ProcessedData<any>
    ): T[] | undefined {
        if (key == null || this.dataModel == null) return undefined;
        return this.dataModel.resolveColumnById<T>(this, columnId, processedData);
    }

    private resolveDataColumns(processedData: _ModuleSupport.ProcessedData<any>) {
        const { idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey } = this.properties;
        const hasLatLon = latitudeKey != null && longitudeKey != null;

        return {
            idValues: this.resolveColumn<string>(idKey, 'idValue', processedData),
            featureValues: this.resolveColumn<Feature | undefined>(idKey, 'featureValue', processedData),
            latValues: hasLatLon ? this.resolveColumn<number>(latitudeKey, 'latValue', processedData) : undefined,
            lonValues: hasLatLon ? this.resolveColumn<number>(longitudeKey, 'lonValue', processedData) : undefined,
            labelValues: this.resolveColumn<string>(labelKey, 'labelValue', processedData),
            sizeValues: this.resolveColumn<number>(sizeKey, 'sizeValue', processedData),
            colorValues: this.resolveColumn<number>(colorKey, 'colorValue', processedData),
        };
    }

    private prepareProjectedGeometries(
        idValues: string[] | undefined,
        featureValues: (Feature | undefined)[] | undefined,
        processedData: _ModuleSupport.ProcessedData<any>
    ): Map<string, Geometry> | undefined {
        if (idValues == null || featureValues == null || this.scale == null) return undefined;

        const projectedGeometries = new Map<string, Geometry>();
        for (const [datumIndex] of processedData.dataSources.get(this.id)?.data.entries() ?? []) {
            const id = idValues[datumIndex];
            const geometry = featureValues[datumIndex]?.geometry;
            const projectedGeometry = geometry == null ? undefined : projectGeometry(geometry, this.scale);

            if (id != null && projectedGeometry != null) {
                projectedGeometries.set(id, projectedGeometry);
            }
        }

        return projectedGeometries;
    }

    private calculateMarkerSize(sizeValue: number | undefined): number {
        return sizeValue == null ? this.properties.size : this.sizeScale.convert(sizeValue, { clamp: true });
    }

    private buildNodeDatum(
        datum: any,
        datumIndex: number,
        index: number,
        point: SizedPoint,
        dataValues: MarkerDataValues
    ): MapMarkerNodeDatum {
        return {
            series: this,
            itemId: this.properties.latitudeKey,
            datum,
            datumIndex,
            index,
            ...dataValues,
            point,
            midPoint: { x: point.x, y: point.y },
            legendItemName: this.properties.legendItemName,
            style: this.getMarkerItemStyle(
                { datumIndex, datum, colorValue: dataValues.colorValue, sizeValue: dataValues.sizeValue },
                false
            ),
        };
    }

    private createNodeFromLatLon(
        datum: any,
        datumIndex: number,
        lonValue: number,
        latValue: number,
        dataValues: MarkerDataValues,
        size: number,
        measurer: ITextMeasurer
    ): { node: MapMarkerNodeDatum; label: MapMarkerNodeLabelDatum | undefined } {
        if (this.scale == null) {
            throw new Error('Scale is required for createNodeFromLatLon');
        }

        const [x, y] = this.scale.convert([lonValue, latValue]);
        const point = { x, y, size };

        const node = this.buildNodeDatum(datum, datumIndex, -1, point, dataValues);

        const label = this.getLabelDatum(node, dataValues.labelValue, measurer) ?? undefined;

        return { node, label };
    }

    private createNodesFromGeometry(
        datum: any,
        datumIndex: number,
        geometry: Geometry,
        dataValues: MarkerDataValues,
        size: number,
        measurer: ITextMeasurer
    ): { nodes: MapMarkerNodeDatum[]; labels: MapMarkerNodeLabelDatum[] } {
        const nodes: MapMarkerNodeDatum[] = [];
        const labels: MapMarkerNodeLabelDatum[] = [];

        for (const [index, [x, y]] of markerPositions(geometry, 1).entries()) {
            const point = { x, y, size };

            const node = this.buildNodeDatum(datum, datumIndex, index, point, dataValues);
            nodes.push(node);

            const label = this.getLabelDatum(node, dataValues.labelValue, measurer);
            if (label) {
                labels.push(label);
            }
        }

        return { nodes, labels };
    }

    private warnMissingGeometries(missingGeometries: string[]): void {
        if (missingGeometries.length === 0) return;

        const missingGeometriesCap = 10;
        if (missingGeometries.length > missingGeometriesCap) {
            const excessItems = missingGeometries.length - missingGeometriesCap;
            missingGeometries.length = missingGeometriesCap;
            missingGeometries.push(`(+${excessItems} more)`);
        }

        Logger.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
    }

    private buildFeatureMap(topologyIdKey: string): Map<string, Feature> {
        const featureById = new Map<string, Feature>();

        for (const feature of this.topology?.features.values() ?? []) {
            const property = feature.properties?.[topologyIdKey];
            if (property != null) {
                featureById.set(property, feature);
            }
        }

        return featureById;
    }

    override createNodeData() {
        const { id: seriesId, dataModel, processedData, sizeScale, properties, scale } = this;
        const { label } = properties;

        if (dataModel == null || processedData == null || scale == null) return;

        const columns = this.resolveDataColumns(processedData);

        const markerMaxSize = properties.maxSize ?? properties.size;
        sizeScale.range = [Math.min(properties.size, markerMaxSize), markerMaxSize];
        const measurer = cachedTextMeasurer(label);

        const projectedGeometries = this.prepareProjectedGeometries(
            columns.idValues,
            columns.featureValues,
            processedData
        );

        const nodeData: MapMarkerNodeDatum[] = [];
        const labelData: MapMarkerNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        for (const [datumIndex, datum] of rawData.entries()) {
            const dataValues: MarkerDataValues = {
                idValue: columns.idValues?.[datumIndex],
                lonValue: columns.lonValues?.[datumIndex],
                latValue: columns.latValues?.[datumIndex],
                colorValue: columns.colorValues?.[datumIndex],
                sizeValue: columns.sizeValues?.[datumIndex],
                labelValue: columns.labelValues?.[datumIndex],
            };

            const size = this.calculateMarkerSize(dataValues.sizeValue);

            const projectedGeometry =
                dataValues.idValue == null ? undefined : projectedGeometries?.get(dataValues.idValue);
            if (dataValues.idValue != null && projectedGeometries != null && projectedGeometry == null) {
                missingGeometries.push(dataValues.idValue);
            }

            if (dataValues.lonValue != null && dataValues.latValue != null) {
                const result = this.createNodeFromLatLon(
                    datum,
                    datumIndex,
                    dataValues.lonValue,
                    dataValues.latValue,
                    dataValues,
                    size,
                    measurer
                );
                nodeData.push(result.node);
                if (result.label) labelData.push(result.label);
            } else if (projectedGeometry != null) {
                const result = this.createNodesFromGeometry(
                    datum,
                    datumIndex,
                    projectedGeometry,
                    dataValues,
                    size,
                    measurer
                );
                nodeData.push(...result.nodes);
                labelData.push(...result.labels);
            }
        }

        this.warnMissingGeometries(missingGeometries);

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
        this.labelGroup.visible = this.visible;

        const highlightedDatum = this.getHighlightedDatum();

        const nodeData = this.contextNodeData?.nodeData ?? [];

        this.markerSelection = this.updateMarkerSelection({ markerData: nodeData, markerSelection });
        this.updateMarkerNodes({ markerSelection, isHighlight: false, highlightedDatum });

        this.highlightMarkerSelection = this.updateMarkerSelection({
            markerData: highlightedDatum == null ? [] : [highlightedDatum],
            markerSelection: highlightMarkerSelection,
        });
        this.updateMarkerNodes({
            markerSelection: highlightMarkerSelection,
            isHighlight: true,
            highlightedDatum,
        });

        this.updateLabelNodes({ labelSelection: this.labelSelection, isHighlight: false });
        this.updateHighlightLabelSelection(highlightedDatum);

        if (scaleChange || resize) {
            this.animationState.transition('resize');
        }
        this.animationState.transition('update');
    }

    public override updatePlacedLabelData(labelData: PlacedLabel<MapMarkerNodeLabelDatum>[]) {
        this.placedLabelData = labelData;
        this.labelSelection = this.labelSelection.update(labelData, (text) => {
            text.pointerEvents = _ModuleSupport.PointerEvents.None;
        });
        this.updateLabelNodes({ labelSelection: this.labelSelection, isHighlight: false });
        this.updateHighlightLabelSelection();
    }

    private updateLabelNodes({
        isHighlight,
        labelSelection,
    }: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, PlacedLabel<MapMarkerNodeLabelDatum>>;
        isHighlight: boolean;
    }) {
        const { properties } = this;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        labelSelection.each((label, placedLabel) => {
            const { x, y, width, height, text, datum: labelDatum } = placedLabel;
            type P = AgMapMarkerSeriesLabelFormatterParams;
            const style = getLabelStyles<P>(
                this,
                undefined,
                properties,
                properties.label,
                isHighlight,
                activeHighlight
            );
            const { color: fill, fontStyle, fontWeight, fontSize, fontFamily } = style;
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
            const datumIndex = labelDatum?.datumIndex;
            label.fillOpacity = this.getHighlightStyle(isHighlight, datumIndex).opacity ?? 1;
            label.setBoxing(style);
        });
    }

    private getHighlightedLabelId(highlightedDatum: MapMarkerNodeDatum | undefined = this.getHighlightedDatum()) {
        if (highlightedDatum == null) return undefined;
        return createDatumId(
            highlightedDatum.index,
            highlightedDatum.idValue,
            highlightedDatum.lonValue,
            highlightedDatum.latValue
        );
    }

    private updateHighlightLabelSelection(
        highlightedDatum: MapMarkerNodeDatum | undefined = this.getHighlightedDatum()
    ) {
        const highlightId = this.getHighlightedLabelId(highlightedDatum);

        const highlightLabels =
            highlightId == null || !this.isLabelEnabled()
                ? []
                : this.placedLabelData.filter((label) => label.datum.datumId === highlightId);

        this.highlightLabelSelection = this.highlightLabelSelection.update(highlightLabels);

        if (highlightLabels.length === 0) {
            this.highlightLabelSelection.cleanup();
            this.highlightLabelGroup.visible = false;
            return;
        }

        this.highlightLabelGroup.visible = true;
        this.updateLabelNodes({
            labelSelection: this.highlightLabelSelection,
            isHighlight: true,
        });
    }

    private updateMarkerSelection(opts: {
        markerData: MapMarkerNodeDatum[];
        markerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum>;
    }) {
        const { markerData, markerSelection } = opts;

        return markerSelection.update(markerData, undefined, (datum) =>
            createDatumId(datum.index, datum.idValue, datum.lonValue, datum.latValue)
        );
    }

    protected getMarkerItemStyle(
        { datumIndex, datum, colorValue, sizeValue }: Partial<MapMarkerNodeDatum>,
        isHighlight: boolean
    ): Required<AgMapMarkerSeriesStyle> {
        const { properties, colorScale, sizeScale } = this;
        const { colorRange, itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle());

        if (!isHighlight && colorValue != null) {
            baseStyle.fill = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : colorRange?.[0] ?? baseStyle.fill;
        }

        if (sizeValue != null) {
            baseStyle.size = sizeScale.convert(sizeValue, { clamp: true });
        }

        let style = baseStyle;

        if (itemStyler != null && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                    return this.callWithContext(itemStyler, params);
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, baseStyle);
            }
        }
        return style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<AgMapMarkerSeriesStyle>
    ) {
        const { id: seriesId } = this;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            highlightState,
            ...style,
            fill,
        };
    }

    private updateMarkerNodes(opts: {
        markerSelection: _ModuleSupport.Selection<_ModuleSupport.Marker, MapMarkerNodeDatum>;
        isHighlight: boolean;
        highlightedDatum: MapMarkerNodeDatum | undefined;
    }) {
        const { markerSelection, isHighlight, highlightedDatum } = opts;

        const fillBBox = getTopologyShapeFillBBox(this.scale);

        markerSelection.each((marker, markerDatum) => {
            const { datum, point } = markerDatum;
            const style = this.getMarkerItemStyle(markerDatum, isHighlight);

            marker.shape = style.shape;
            marker.size = style.size;

            marker.setStyleProperties(style, fillBBox);

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
        this.highlightLabelSelection.cleanup();
        this.highlightLabelGroup.visible = false;
        this.placedLabelData = [];
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

    override pickNodeClosestDatum(p: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        const { x: x0, y: y0 } = p;

        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType> | undefined;

        for (const datum of this.contextNodeData?.nodeData ?? []) {
            const { x, y, size } = datum.point;
            const dx = Math.max(Math.abs(x - x0) - size, 0);
            const dy = Math.max(Math.abs(y - y0) - size, 0);
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        }

        return minDatum == null ? undefined : { datum: minDatum, distance: Math.sqrt(minDistanceSquared) };
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
            marker: {
                shape,
                fill,
                fillOpacity,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
                lineDashOffset,
            },
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

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const sizeValue =
            sizeKey == null
                ? undefined
                : dataModel.resolveColumnById<number>(this, `sizeValue`, processedData)[datumIndex];
        const colorValue =
            colorKey == null
                ? undefined
                : dataModel.resolveColumnById<number>(this, `colorValue`, processedData)[datumIndex];

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
            const domain = dataModel.getDomain(this, `sizeValue`, 'value', processedData).domain;
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
            const domain = dataModel.getDomain(this, `colorValue`, 'value', processedData).domain;
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

        const format = this.getMarkerItemStyle({ datumIndex, datum, colorValue, sizeValue }, false);

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
        const format = this.getMarkerItemStyle(markerDatum, false);

        return { size: format.size, shape: format.shape };
    }

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return computeMarkerFocusBounds(this, opts);
    }

    protected override hasItemStylers(): boolean {
        return this.properties.itemStyler != null || this.properties.label.itemStyler != null;
    }
}
