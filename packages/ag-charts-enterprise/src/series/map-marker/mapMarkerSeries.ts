import { type AgMapMarkerSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type CallbackParamRules,
    type ChartAnimationPhase,
    type DynamicContext,
    type Feature,
    type FeatureCollection,
    type FillStrokeMorph,
    type Geometry,
    type ITextMeasurer,
    type LabelFit,
    type Normalised,
    type PlacedLabel,
    type Point,
    type SizedPoint,
    StateMachine,
    cachedTextMeasurer,
    findDiscreteColorBinLabel,
    fitLabelText,
    formatValue,
    mergeDefaults,
    resolveLabelFit,
    resolveSeriesLabelDefaults,
    toArray,
} from 'ag-charts-core';
import {
    type AgDrawingMode,
    type AgMapMarkerSeriesItemStylerParams,
    type AgMapMarkerSeriesLabelFormatterParams,
    type AgMapMarkerSeriesOptions,
} from 'ag-charts-types';

import { geometryBbox, projectGeometry } from '../map-util/geometryUtil';
import { LonLatBBox } from '../map-util/lonLatBbox';
import { prepareMapMarkerAnimationFunctions } from '../map-util/mapUtil';
import { MapZIndexMap } from '../map-util/mapZIndexMap';
import { markerPositions } from '../map-util/markerUtil';
import { getTopologyShapeFillBBox } from '../map-util/shapeFillBBox';
import { TopologySeries } from '../map-util/topologySeries';
import type { ITopology } from '../map-util/topologyTypes';
import {
    type MapMarkerNodeDatum,
    type MapMarkerNodeLabelDatum,
    MapMarkerSeriesProperties,
} from './mapMarkerSeriesProperties';

const {
    fromToMotion,
    getMissCount,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
    configureColorScale,
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
    expandLabelBoxExtent,
} = _ModuleSupport;

type NormalisedMapMarkerSeriesStyle = Normalised<AgMapMarkerSeriesStyle, never, FillStrokeMorph>;

interface MapMarkerNodeDataContext extends _ModuleSupport.DataModelSeriesNodeDataContext<
    MapMarkerNodeDatum,
    MapMarkerNodeLabelDatum
> {}

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
    implements ITopology
{
    static override readonly className = 'MapMarkerSeries';
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

    private labelSelection = Selection.select<_ModuleSupport.Text<PlacedLabel<MapMarkerNodeLabelDatum>>>(
        this.labelGroup,
        Text,
        false
    );
    private highlightLabelSelection = Selection.select<_ModuleSupport.Text<PlacedLabel<MapMarkerNodeLabelDatum>>>(
        this.highlightLabelGroup,
        Text,
        false
    );
    private markerSelection = Selection.select<_ModuleSupport.Marker<MapMarkerNodeDatum>>(
        this.markerGroup,
        Marker,
        false
    );
    private highlightMarkerSelection = Selection.select<_ModuleSupport.Marker<MapMarkerNodeDatum>>(
        this.highlightNodeGroup,
        Marker
    );
    private placedLabelData: PlacedLabel<MapMarkerNodeLabelDatum>[] = [];

    private contextNodeData?: MapMarkerNodeDataContext;

    private readonly animationState: StateMachine<MapMarkerAnimationState, MapMarkerAnimationEvent>;

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
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
        const { topologyIdKey, idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey, sizeDomain } =
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
                ...(colorKey
                    ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue', invalidValue: undefined })]
                    : []),
            ],
        });

        const featureValues =
            idKey == null
                ? undefined
                : dataModel.resolveColumnById<Feature | undefined>(this, `featureValue`, processedData, 'object');
        const latValues = hasLatLon
            ? dataModel.resolveColumnById(this, `latValue`, processedData, 'number')
            : undefined;
        const lonValues = hasLatLon
            ? dataModel.resolveColumnById(this, `lonValue`, processedData, 'number')
            : undefined;
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

        if (this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            const domain = processedData.domain.values[colorKeyIdx];
            configureColorScale(colorScale, this.properties.colorScale, domain);
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
        measurer: ITextMeasurer,
        labelFit: LabelFit | undefined
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
        const placement = toArray(label.placement)[0];
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

        const fittedText = fitLabelText(labelText, labelFit, label);
        const text = measurer.measureLines(String(fittedText));
        // Inflate the text by the label's drawn box (padding + border stroke) so collisions avoid the box.
        const box = expandLabelBoxExtent(label);
        const width = text.width + box.left + box.right;
        const height = text.height + box.top + box.bottom;
        const anchor = Marker.anchor(shape);

        return {
            point: { x: point.x, y: point.y, size: point.size },
            label: { width, height, text: fittedText },
            anchor,
            placement,
            datumIndex,
            datumId: createDatumId(index, idValue, lonValue, latValue),
        };
    }

    private resolveColumn<T>(
        key: string | undefined,
        columnId: string,
        processedData: _ModuleSupport.ProcessedData<any>,
        expectedType: _ModuleSupport.ColumnValueType
    ): T[] | undefined {
        if (key == null || this.dataModel == null) return undefined;
        // expectedType is validated at runtime; the cast only selects the element-typed overload.
        return this.dataModel.resolveColumnById<T>(this, columnId, processedData, expectedType as 'object');
    }

    private resolveDataColumns(processedData: _ModuleSupport.ProcessedData<any>) {
        const { idKey, latitudeKey, longitudeKey, sizeKey, colorKey, labelKey } = this.properties;
        const hasLatLon = latitudeKey != null && longitudeKey != null;

        return {
            idValues: this.resolveColumn<string>(idKey, 'idValue', processedData, 'string'),
            featureValues: this.resolveColumn<Feature | undefined>(idKey, 'featureValue', processedData, 'object'),
            latValues: hasLatLon
                ? this.resolveColumn<number>(latitudeKey, 'latValue', processedData, 'number')
                : undefined,
            lonValues: hasLatLon
                ? this.resolveColumn<number>(longitudeKey, 'lonValue', processedData, 'number')
                : undefined,
            labelValues: this.resolveColumn<string>(labelKey, 'labelValue', processedData, 'object'),
            sizeValues: this.resolveColumn<number>(sizeKey, 'sizeValue', processedData, 'number'),
            colorValues: this.resolveColumn<number>(colorKey, 'colorValue', processedData, 'number'),
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
        return sizeValue == null ? this.properties.size : this.sizeScale.convertClamped(sizeValue);
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
        measurer: ITextMeasurer,
        labelFit: LabelFit | undefined
    ): { node: MapMarkerNodeDatum; label: MapMarkerNodeLabelDatum | undefined } {
        if (this.scale == null) {
            throw new Error('Scale is required for createNodeFromLatLon');
        }

        const [x, y] = this.scale.convert([lonValue, latValue]);
        const point = { x, y, size };

        const node = this.buildNodeDatum(datum, datumIndex, -1, point, dataValues);

        const label = this.getLabelDatum(node, dataValues.labelValue, measurer, labelFit) ?? undefined;

        return { node, label };
    }

    private createNodesFromGeometry(
        datum: any,
        datumIndex: number,
        geometry: Geometry,
        dataValues: MarkerDataValues,
        size: number,
        measurer: ITextMeasurer,
        labelFit: LabelFit | undefined
    ): { nodes: MapMarkerNodeDatum[]; labels: MapMarkerNodeLabelDatum[] } {
        const nodes: MapMarkerNodeDatum[] = [];
        const labels: MapMarkerNodeLabelDatum[] = [];

        for (const [index, [x, y]] of markerPositions(geometry, 1).entries()) {
            const point = { x, y, size };

            const node = this.buildNodeDatum(datum, datumIndex, index, point, dataValues);
            nodes.push(node);

            const label = this.getLabelDatum(node, dataValues.labelValue, measurer, labelFit);
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

        this.ctx.logger.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
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

        if (!this.visible) {
            return { itemId: seriesId, nodeData: [], labelData: [] };
        }

        const columns = this.resolveDataColumns(processedData);

        // `minSize` is the explicit lower bound when `sizeKey` is present, defaulting to `size`. It is
        // authoritative: raise the upper bound to it when a smaller `maxSize` would invert the range.
        const markerMinSize = properties.minSize ?? properties.size;
        const markerMaxSize = properties.maxSize ?? properties.size;
        sizeScale.range = [markerMinSize, Math.max(markerMinSize, markerMaxSize)];
        const measurer = cachedTextMeasurer(label);
        const labelFit = resolveLabelFit(label, !label.collision.suppressHide);

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
                    measurer,
                    labelFit
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
                    measurer,
                    labelFit
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
        const drawingMode = this.ctx.chartService.highlight?.drawingMode ?? 'overlay';

        this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.labelGroup.visible = this.visible;

        const highlightedDatum = this.getHighlightedDatum();

        const nodeData = this.contextNodeData?.nodeData ?? [];

        this.markerSelection = this.updateMarkerSelection({ markerData: nodeData, markerSelection });
        this.updateMarkerNodes({ markerSelection, isHighlight: false, highlightedDatum, drawingMode: 'overlay' });

        this.highlightMarkerSelection = this.updateMarkerSelection({
            markerData: highlightedDatum == null ? [] : [highlightedDatum],
            markerSelection: highlightMarkerSelection,
        });
        this.updateMarkerNodes({
            markerSelection: highlightMarkerSelection,
            isHighlight: true,
            highlightedDatum,
            drawingMode,
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
        labelSelection: _ModuleSupport.Selection<
            PlacedLabel<MapMarkerNodeLabelDatum>,
            _ModuleSupport.Text<PlacedLabel<MapMarkerNodeLabelDatum>>
        >;
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
        markerSelection: _ModuleSupport.Selection<MapMarkerNodeDatum, _ModuleSupport.Marker<MapMarkerNodeDatum>>;
    }) {
        const { markerData, markerSelection } = opts;

        return markerSelection.update(markerData, undefined, (datum) =>
            createDatumId(datum.index, datum.idValue, datum.lonValue, datum.latValue)
        );
    }

    protected getMarkerItemStyle(
        { datumIndex, datum, colorValue, sizeValue }: Partial<MapMarkerNodeDatum>,
        isHighlight: boolean
    ): Required<NormalisedMapMarkerSeriesStyle> {
        const { properties, colorScale, sizeScale } = this;
        const { colorKey, colorScale: colorScaleProps, itemStyler } = properties;
        const { missingDataFill } = colorScaleProps;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const selectionStyle = this.getSelectionStyle(datumIndex);
        const baseStyle = mergeDefaults(selectionStyle, highlightStyle, properties.getStyle());

        if (colorValue != null) {
            const fillOverride = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : colorScaleProps.fills[0]?.color;
            if (fillOverride != null) {
                baseStyle.fill = fillOverride;
            }
        } else if (colorKey != null && missingDataFill != null && highlightStyle?.fill == null) {
            baseStyle.fill = missingDataFill;
        }

        if (sizeValue != null) {
            baseStyle.size = sizeScale.convertClamped(sizeValue);
        }

        let style = baseStyle;

        if (itemStyler != null && datumIndex != null) {
            const overrides = this.cachedDatumCallback(
                createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'),
                () => {
                    const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                    return this.ctx.optionsGraphService.resolvePartial(
                        ['series', `${this.declarationOrder}`],
                        this.callWithContext(itemStyler, params)
                    );
                }
            );

            if (overrides) {
                style = mergeDefaults(overrides, baseStyle);
            }
        }
        // fill/stroke refs are resolved during theme-merge before reaching here.
        return style as Required<NormalisedMapMarkerSeriesStyle>;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedMapMarkerSeriesStyle>
    ) {
        const { id: seriesId } = this;
        const { sizeKey, idKey, labelKey, colorKey, latitudeKey, longitudeKey } = this.properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionState = this.getSelectionStateString(datumIndex);
        const candidateState = this.getCandidateStateString(datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            sizeKey,
            idKey,
            labelKey,
            colorKey,
            latitudeKey,
            longitudeKey,
            highlightState,
            selectionState,
            candidateState,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgMapMarkerSeriesItemStylerParams>;
    }

    private updateMarkerNodes(opts: {
        markerSelection: _ModuleSupport.Selection<MapMarkerNodeDatum, _ModuleSupport.Marker<MapMarkerNodeDatum>>;
        isHighlight: boolean;
        highlightedDatum: MapMarkerNodeDatum | undefined;
        drawingMode: AgDrawingMode;
    }) {
        const { markerSelection, isHighlight, highlightedDatum, drawingMode } = opts;

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

            marker.drawingMode = drawingMode;
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
        const fns = prepareMapMarkerAnimationFunctions<MapMarkerNodeDatum>();
        fromToMotion(this.id, 'markers', animationManager, [this.markerSelection, this.highlightMarkerSelection], fns);
    }

    override getLabelData() {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    override getLabelDefaults() {
        const { label } = this.properties;
        return resolveSeriesLabelDefaults(label.collision, toArray(label.placement), label.spacing);
    }

    override pickNodeClosestDatum(p: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        const { x: x0, y: y0 } = p;

        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum | undefined;

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

        return minDatum == null
            ? undefined
            : { datum: minDatum, distance: Math.sqrt(minDistanceSquared), target: this.contentGroup };
    }

    private legendItemSymbol(datumIndex?: number): _ModuleSupport.LegendSymbolOptions {
        const { dataModel, processedData, properties } = this;
        const { colorKey, shape, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } =
            properties;
        const { missingDataFill } = properties.colorScale;

        let { fill } = properties;
        if (datumIndex != null && this.isColorScaleValid()) {
            const colorValues = dataModel!.resolveColumnById(this, 'colorValue', processedData!, 'mixed-numeric');
            const colorValue = colorValues[datumIndex];
            if (colorValue != null) {
                fill = this.colorScale.convert(colorValue);
            } else if (colorKey != null && missingDataFill != null) {
                fill = missingDataFill;
            }
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

        const {
            title,
            legendItemName,
            idName,
            idKey,
            colorKey,
            colorScale: colorScaleProps,
            showInLegend,
        } = this.properties;
        const hasColorScale = colorScaleProps.fills.length > 0;

        if (legendType === 'gradient' && colorKey != null && hasColorScale) {
            return [
                buildGradientLegendDatum(
                    this.colorScale,
                    colorScaleProps.fills,
                    seriesId,
                    visible,
                    this.getFormatterContext('color')
                ),
            ];
        } else if (legendType === 'category') {
            if (colorScaleProps.mode === 'discrete' && hasColorScale) {
                return buildColorCategoryLegendData(
                    this.colorScale,
                    colorScaleProps.fills,
                    seriesId,
                    visible,
                    colorScaleLegendFormatterContext(this)
                );
            }
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
                : dataModel.resolveColumnById(this, `sizeValue`, processedData, 'number')[datumIndex];
        const colorValue =
            colorKey == null
                ? undefined
                : dataModel.resolveColumnById(this, `colorValue`, processedData, 'number')[datumIndex];

        const data: _ModuleSupport.TooltipContentDataRow[] = [];

        if (this.isLabelEnabled() && labelKey != null && labelKey !== idKey) {
            const labelValue = dataModel.resolveColumnById<string>(this, `labelValue`, processedData, 'object')[
                datumIndex
            ];
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
                visibleDomain: undefined,
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
                visibleDomain: undefined,
            });
            const binLabel = findDiscreteColorBinLabel(
                this.colorScale,
                properties.colorScale.fills,
                colorValue,
                formatValue
            );
            data.push({ label: colorName, fallbackLabel: colorKey, value: content ?? binLabel ?? String(colorValue) });
        }

        let heading: string | undefined;
        if (idKey != null) {
            heading = dataModel.resolveColumnById(this, `idValue`, processedData, 'string')[datumIndex];
        } else if (latitudeKey != null && longitudeKey != null) {
            const latValue = dataModel.resolveColumnById(this, `latValue`, processedData, 'number')[datumIndex];
            const lonValue = dataModel.resolveColumnById(this, `lonValue`, processedData, 'number')[datumIndex];
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
        return (
            this.properties.selection.enabled ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
