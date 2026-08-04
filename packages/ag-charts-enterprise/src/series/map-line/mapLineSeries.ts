import { type AgMapLineSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import type {
    CallbackParamRules,
    DynamicContext,
    Feature,
    FeatureCollection,
    FillStrokeMorph,
    Geometry,
    Normalised,
    PlacedLabel,
} from 'ag-charts-core';
import {
    type ITextMeasurer,
    type LabelFit,
    type NormalisedChartLabelStyleOptions,
    type Point,
    cachedTextMeasurer,
    findDiscreteColorBinLabel,
    fitLabelText,
    formatValue,
    mergeDefaults,
    resolveLabelFit,
    resolveSeriesLabelDefaults,
} from 'ag-charts-core';
import type {
    AgDrawingMode,
    AgMapLineSeriesItemStylerParams,
    AgMapLineSeriesLabelFormatterParams,
    AgMapLineSeriesOptions,
} from 'ag-charts-types';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { GeometryType, containsType, geometryBbox, largestLineString, projectGeometry } from '../map-util/geometryUtil';
import { lineStringCenter } from '../map-util/lineStringUtil';
import { LonLatBBox } from '../map-util/lonLatBbox';
import { findFocusedGeoGeometry } from '../map-util/mapUtil';
import { MapZIndexMap } from '../map-util/mapZIndexMap';
import { TopologySeries } from '../map-util/topologySeries';
import type { ITopology } from '../map-util/topologyTypes';
import { type MapLineNodeDatum, type MapLineNodeLabelDatum, MapLineSeriesProperties } from './mapLineSeriesProperties';

const {
    getMissCount,
    getLabelStyles,
    expandLabelBoxExtent,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
    configureColorScale,
    createDatumId,
    SeriesNodePickMode,
    valueProperty,
    ColorScale,
    LinearScale,
    Selection,
    Text,
    Transformable,
} = _ModuleSupport;

interface MapLineNodeDataContext extends _ModuleSupport.DataModelSeriesNodeDataContext<
    MapLineNodeDatum,
    MapLineNodeLabelDatum
> {}

interface LineDataValues {
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly labelValue: string | undefined;
}

type NormalisedMapLineSeriesStyle = Normalised<AgMapLineSeriesStyle, never, FillStrokeMorph>;

export class MapLineSeries
    extends TopologySeries<
        MapLineNodeDatum,
        AgMapLineSeriesOptions,
        MapLineSeriesProperties,
        MapLineNodeLabelDatum,
        MapLineNodeDataContext
    >
    implements ITopology
{
    static override readonly className = 'MapLineSeries';
    static readonly type = 'map-line' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: LonLatBBox | undefined;

    override properties = new MapLineSeriesProperties();

    private _chartTopology?: FeatureCollection = undefined;

    public override getNodeData(): MapLineNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override get hasData() {
        return super.hasData && this.topology != null;
    }

    private readonly colorScale = new ColorScale();
    private readonly sizeScale = new LinearScale();

    public datumSelection = Selection.select<GeoGeometry<MapLineNodeDatum>>(this.contentGroup, () =>
        this.nodeFactory()
    );
    private labelSelection = Selection.select<_ModuleSupport.Text<PlacedLabel<MapLineNodeLabelDatum>>>(
        this.labelGroup,
        Text
    );
    private highlightDatumSelection = Selection.select<GeoGeometry<MapLineNodeDatum>>(this.highlightNodeGroup, () =>
        this.nodeFactory()
    );
    private highlightLabelSelection = Selection.select<_ModuleSupport.Text<PlacedLabel<MapLineNodeLabelDatum>>>(
        this.highlightLabelGroup,
        Text
    );
    private placedLabelData: PlacedLabel<MapLineNodeLabelDatum>[] = [];

    public contextNodeData?: MapLineNodeDataContext;

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
    }

    override renderToOffscreenCanvas(): boolean {
        return true;
    }

    override setZIndex(zIndex: number): boolean {
        super.setZIndex(zIndex);

        this.contentGroup.zIndex = [MapZIndexMap.ShapeLine, zIndex];
        this.highlightGroup.zIndex = [MapZIndexMap.ShapeLineHighlight, zIndex];

        return true;
    }

    setChartTopology(topology: any): void {
        this._chartTopology = topology;
        if (this.topology === topology) {
            this.nodeDataRefresh = true;
        }
    }

    private isLabelEnabled() {
        return this.properties.labelKey != null && this.properties.label.enabled;
    }

    private nodeFactory(): GeoGeometry<MapLineNodeDatum> {
        const geoGeometry = new GeoGeometry<MapLineNodeDatum>();
        geoGeometry.renderMode = GeoGeometryRenderMode.Lines;
        geoGeometry.lineJoin = 'round';
        geoGeometry.lineCap = 'round';
        return geoGeometry;
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (this.data == null) return;

        const { data, topology, sizeScale, colorScale } = this;
        const { topologyIdKey, idKey, sizeKey, colorKey, labelKey, sizeDomain } = this.properties;

        const featureById = new Map<string, Feature>();
        for (const feature of topology?.features.values() ?? []) {
            const property = feature.properties?.[topologyIdKey];
            if (property == null || !containsType(feature.geometry, GeometryType.LineString)) continue;
            featureById.set(property, feature);
        }

        const sizeScaleType = this.sizeScale.type;
        const colorScaleType = this.colorScale.type;
        const mercatorScaleType = this.scale?.type;

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                valueProperty(idKey, mercatorScaleType, { id: 'idValue', includeProperty: false }),
                valueProperty(idKey, mercatorScaleType, {
                    id: 'featureValue',
                    includeProperty: false,
                    processor: () => (datum) => featureById.get(datum as string),
                }),
                ...(labelKey == null ? [] : [valueProperty(labelKey, 'category', { id: 'labelValue' })]),
                ...(sizeKey == null ? [] : [valueProperty(sizeKey, sizeScaleType, { id: 'sizeValue' })]),
                ...(colorKey == null
                    ? []
                    : [valueProperty(colorKey, colorScaleType, { id: 'colorValue', invalidValue: undefined })]),
            ],
        });

        const featureValues = dataModel.resolveColumnById<Feature | undefined>(
            this,
            `featureValue`,
            processedData,
            'object'
        );
        this.topologyBounds = featureValues.reduce<LonLatBBox | undefined>((current, feature) => {
            const geometry = feature?.geometry;
            if (geometry == null) return current;
            return geometryBbox(geometry, current);
        }, undefined);

        if (sizeKey != null) {
            const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`);
            const processedSize = processedData.domain.values[sizeIdx] ?? [];
            sizeScale.domain = sizeDomain ?? processedSize;
        }

        if (this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            const domain = processedData.domain.values[colorKeyIdx];
            configureColorScale(colorScale, this.properties.colorScale, domain, this.ctx.logger);
        }

        if (topology == null) {
            this.ctx.logger.warnOnce(`no topology was provided for [MapLineSeries]; nothing will be rendered.`);
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

        const colorIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
        const dataCount = processedData.input.count;
        const missCount = getMissCount(this, processedData.defs.values[colorIdx].missing);
        const colorDataMissing = dataCount === 0 || dataCount === missCount;
        return !colorDataMissing;
    }

    private getLabelDatum(
        datum: any,
        datumIndex: number,
        idValue: string | undefined,
        labelValue: string | undefined,
        projectedGeometry: Geometry | undefined,
        measurer: ITextMeasurer,
        labelFit: LabelFit | undefined,
        labelStyle: NormalisedChartLabelStyleOptions & { fontSize: number }
    ): MapLineNodeLabelDatum | undefined {
        if (labelValue == null || projectedGeometry == null || idValue == null) return;

        const lineString = largestLineString(projectedGeometry);
        if (lineString == null) return;

        const { idKey, idName, sizeKey, sizeName, colorKey, colorName, labelKey, labelName, label } = this.properties;
        if (labelKey == null || !label.enabled) return;

        const labelText = this.getLabelText<AgMapLineSeriesLabelFormatterParams>(
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
                sizeKey,
                sizeName,
                colorKey,
                colorName,
                labelKey,
                labelName,
            }
        );
        if (labelText == null) return;

        const fittedText = fitLabelText(labelText, labelFit, labelStyle);
        const labelCenter = lineStringCenter(lineString);
        if (labelCenter == null) return;

        const [x, y] = labelCenter.point;
        const text = measurer.measureLines(String(fittedText));
        // Inflate the text by the label's drawn box (padding + border stroke) so collisions avoid the box.
        const box = expandLabelBoxExtent(labelStyle);
        const width = text.width + box.left + box.right;
        const height = text.height + box.top + box.bottom;

        return {
            point: { x, y, size: 0 },
            label: { width, height, text: fittedText },
            anchor: undefined,
            placement: undefined,
            datumIndex,
            idValue,
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

    private resolveLineDataColumns(processedData: _ModuleSupport.ProcessedData<any>) {
        const { sizeKey, colorKey, labelKey } = this.properties;

        return {
            idValues: this.dataModel!.resolveColumnById(this, 'idValue', processedData, 'string'),
            featureValues: this.dataModel!.resolveColumnById<Feature | undefined>(
                this,
                'featureValue',
                processedData,
                'object'
            ),
            labelValues: this.resolveColumn<string>(labelKey, 'labelValue', processedData, 'object'),
            sizeValues: this.resolveColumn<number>(sizeKey, 'sizeValue', processedData, 'number'),
            colorValues: this.resolveColumn<number>(colorKey, 'colorValue', processedData, 'number'),
        };
    }

    private prepareProjectedLineGeometries(
        idValues: string[],
        featureValues: (Feature | undefined)[],
        processedData: _ModuleSupport.ProcessedData<any>
    ): Map<string, Geometry> {
        const projectedGeometries = new Map<string, Geometry>();

        for (const [datumIndex] of processedData.dataSources.get(this.id)?.data.entries() ?? []) {
            const id = idValues[datumIndex];
            const geometry = featureValues[datumIndex]?.geometry;
            const projectedGeometry =
                geometry != null && this.scale != null ? projectGeometry(geometry, this.scale) : undefined;

            if (id != null && projectedGeometry != null) {
                projectedGeometries.set(id, projectedGeometry);
            }
        }

        return projectedGeometries;
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

    override createNodeData() {
        const { id: seriesId, dataModel, processedData, sizeScale, properties } = this;
        const { label, legendItemName } = properties;

        if (dataModel == null || processedData == null) return;

        if (!this.visible) {
            return { itemId: seriesId, nodeData: [], labelData: [] };
        }

        const columns = this.resolveLineDataColumns(processedData);

        // `minStrokeWidth` is the explicit lower bound when `sizeKey` is present, defaulting to `strokeWidth`.
        // It is authoritative: raise the upper bound to it when a smaller `maxStrokeWidth` would invert the range.
        const minStrokeWidth = properties.minStrokeWidth ?? properties.strokeWidth;
        const maxStrokeWidth = properties.maxStrokeWidth ?? properties.strokeWidth;
        sizeScale.range = [minStrokeWidth, Math.max(minStrokeWidth, maxStrokeWidth)];
        // The styler takes no datum here, so one resolved style governs every label of this series;
        // measuring and reserving against it keeps each collision footprint equal to the box drawn.
        const labelStyle = getLabelStyles<AgMapLineSeriesLabelFormatterParams>(
            this,
            undefined,
            properties,
            label,
            false,
            undefined
        );
        const measurer = cachedTextMeasurer(labelStyle);
        const labelFit = resolveLabelFit(label, !label.collision.alwaysShow);

        const projectedGeometries = this.prepareProjectedLineGeometries(
            columns.idValues,
            columns.featureValues,
            processedData
        );

        const nodeData: MapLineNodeDatum[] = [];
        const labelData: MapLineNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        for (const [datumIndex, datum] of rawData.entries()) {
            const dataValues: LineDataValues = {
                idValue: columns.idValues[datumIndex],
                colorValue: columns.colorValues?.[datumIndex],
                sizeValue: columns.sizeValues?.[datumIndex],
                labelValue: columns.labelValues?.[datumIndex],
            };

            const projectedGeometry = projectedGeometries.get(dataValues.idValue);
            if (projectedGeometry == null) {
                missingGeometries.push(dataValues.idValue);
            }

            const labelDatum = this.getLabelDatum(
                datum,
                datumIndex,
                dataValues.idValue,
                dataValues.labelValue,
                projectedGeometry,
                measurer,
                labelFit,
                labelStyle
            );
            if (labelDatum != null) {
                labelData.push(labelDatum);
            }

            nodeData.push({
                series: this,
                datum,
                datumIndex,
                ...dataValues,
                projectedGeometry,
                legendItemName,
                style: this.getItemStyle(
                    { datumIndex, datum, colorValue: dataValues.colorValue, sizeValue: dataValues.sizeValue },
                    false
                ),
            });
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

    override update() {
        const { datumSelection, highlightDatumSelection } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.labelGroup.visible = this.visible;
        const drawingMode = this.ctx.chartService.highlight?.drawingMode ?? 'overlay';

        const highlightedDatum = this.getHighlightedDatum();
        const nodeData = this.contextNodeData?.nodeData ?? [];

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumStyles({ datumSelection, isHighlight: false });
        this.updateDatumNodes({ datumSelection, isHighlight: false, drawingMode: 'overlay' });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum == null ? [] : [highlightedDatum],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumStyles({ datumSelection: highlightDatumSelection, isHighlight: true });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true, drawingMode });

        this.updateLabelNodes({ labelSelection: this.labelSelection, isHighlight: false });
        this.updateHighlightLabelSelection(highlightedDatum);
    }

    private updateDatumSelection(opts: {
        nodeData: MapLineNodeDatum[];
        datumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry<MapLineNodeDatum>>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    protected getItemStyle(
        { datumIndex = 0, datum, colorValue, sizeValue }: Partial<MapLineNodeDatum>,
        isHighlight: boolean
    ): Required<NormalisedMapLineSeriesStyle> {
        const { properties, colorScale, sizeScale } = this;
        const { colorKey, colorScale: colorScaleProps, itemStyler } = properties;
        const { missingDataFill } = colorScaleProps;

        const baseStyle = properties.getStyle();

        if (colorValue != null) {
            baseStyle.stroke = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : (colorScaleProps.fills[0]?.color ?? properties.stroke);
        } else if (colorKey != null && missingDataFill != null) {
            baseStyle.stroke = missingDataFill;
        }

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const selectionStyle = this.getSelectionStyle(datumIndex);
        // Colour refs in `baseStyle` are resolved before this point, so the merged style is concrete.
        const style = mergeDefaults(
            selectionStyle,
            highlightStyle,
            baseStyle
        ) as Required<NormalisedMapLineSeriesStyle>;

        if (sizeValue != null) {
            style.strokeWidth = sizeScale.convertClamped(sizeValue);
        }

        let overrides;
        if (itemStyler != null) {
            overrides = this.cachedDatumCallback(createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'), () => {
                const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                return this.ctx.optionsGraphService.resolvePartial(
                    ['series', `${this.declarationOrder}`],
                    this.callWithContext(itemStyler, params)
                );
            });
        }

        return overrides ? mergeDefaults(style, overrides) : style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedMapLineSeriesStyle>
    ) {
        const { id: seriesId } = this;
        const { sizeKey, idKey, labelKey, colorKey } = this.properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionState = this.getSelectionStateString(datumIndex);
        const candidateState = this.getCandidateStateString(datumIndex);

        return {
            seriesId,
            sizeKey,
            idKey,
            labelKey,
            colorKey,
            datum,
            highlightState,
            selectionState,
            candidateState,
            ...style,
        } satisfies CallbackParamRules<AgMapLineSeriesItemStylerParams>;
    }

    private updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry<MapLineNodeDatum>>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, nodeDatum) => {
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight);
        });
    }

    private updateDatumNodes({
        datumSelection,
        drawingMode,
    }: {
        datumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry<MapLineNodeDatum>>;
        isHighlight: boolean;
        drawingMode: AgDrawingMode;
    }) {
        datumSelection.each((geoGeometry, nodeDatum) => {
            const { projectedGeometry, style } = nodeDatum;
            if (projectedGeometry == null) {
                geoGeometry.visible = false;
                geoGeometry.projectedGeometry = undefined;
                return;
            }

            geoGeometry.visible = true;
            geoGeometry.projectedGeometry = projectedGeometry;

            // Colour refs are resolved during theme-merge, so the style is concrete by render.
            geoGeometry.setProperties(style as NormalisedMapLineSeriesStyle);
            geoGeometry.drawingMode = drawingMode;
        });
    }

    public override updatePlacedLabelData(labelData: PlacedLabel<MapLineNodeLabelDatum>[]) {
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
            PlacedLabel<MapLineNodeLabelDatum>,
            _ModuleSupport.Text<PlacedLabel<MapLineNodeLabelDatum>>
        >;
        isHighlight: boolean;
    }) {
        const { properties } = this;
        const activeHighlight = this.getHighlightedDatum();
        labelSelection.each((label, placedLabel) => {
            const { x, y, width, height, text, datum: labelDatum } = placedLabel;
            const style = getLabelStyles<AgMapLineSeriesLabelFormatterParams>(
                this,
                undefined,
                properties,
                properties.label,
                isHighlight,
                activeHighlight
            );
            if (!style.enabled) {
                label.visible = false;
                return;
            }
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

    private updateHighlightLabelSelection(highlightedDatum: MapLineNodeDatum | undefined = this.getHighlightedDatum()) {
        const highlightId = highlightedDatum?.idValue;
        const highlightLabels =
            highlightId == null || !this.isLabelEnabled()
                ? []
                : this.placedLabelData.filter((label) => label.datum.idValue === highlightId);

        this.highlightLabelSelection = this.highlightLabelSelection.update(highlightLabels);
        if (highlightLabels.length === 0) {
            this.highlightLabelSelection.cleanup();
        }
        this.updateLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });
    }

    resetAnimation() {
        // No animations
    }

    override getLabelData() {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    // Labels centre on the line with no directional placement, so defaults carry avoidance only.
    override getLabelDefaults() {
        return resolveSeriesLabelDefaults(this.properties.label.collision);
    }

    override pickNodeClosestDatum({ x, y }: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum | undefined;
        let minNode: _ModuleSupport.Node<unknown> | undefined;

        this.datumSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
                minNode = node;
            }
        });

        return minDatum == null || minNode == null
            ? undefined
            : { datum: minDatum, distance: Math.sqrt(minDistanceSquared), target: minNode };
    }

    private _previousDatumMidPoint: { datum: _ModuleSupport.SeriesNodeDatum; point: Point | undefined } | undefined =
        undefined;
    datumMidPoint(datum: _ModuleSupport.SeriesNodeDatum): Point | undefined {
        const { _previousDatumMidPoint } = this;
        if (_previousDatumMidPoint?.datum === datum) {
            return _previousDatumMidPoint.point;
        }

        const projectedGeometry = (datum as MapLineNodeDatum).projectedGeometry;
        const lineString = projectedGeometry == null ? undefined : largestLineString(projectedGeometry);
        const center = lineString == null ? undefined : lineStringCenter(lineString)?.point;
        const point = center == null ? undefined : { x: center[0], y: center[1] };

        this._previousDatumMidPoint = { datum, point };

        return point;
    }

    private legendItemSymbol(datumIndex?: number): _ModuleSupport.LegendSymbolOptions {
        const { dataModel, processedData, properties } = this;
        const { colorKey, strokeWidth, strokeOpacity, lineDash } = properties;
        const { missingDataFill } = properties.colorScale;

        let { stroke } = properties;
        if (datumIndex != null && this.isColorScaleValid()) {
            const colorValues = dataModel!.resolveColumnById(this, 'colorValue', processedData!, 'mixed-numeric');
            const colorValue = colorValues[datumIndex];
            if (colorValue != null) {
                stroke = this.colorScale.convert(colorValue);
            } else if (colorKey != null && missingDataFill != null) {
                stroke = missingDataFill;
            }
        }

        return {
            marker: {
                fill: undefined,
                fillOpacity: 0,
                stroke: undefined,
                strokeWidth: 0,
                strokeOpacity: 0,
                lineDash: [0],
                lineDashOffset: 0,
                enabled: false,
            },
            line: {
                enabled: true,
                stroke,
                strokeWidth,
                strokeOpacity,
                lineDash,
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
            idKey,
            idName,
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
                label: { text: legendItemName ?? title ?? idName ?? idKey },
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
        const idValues = dataModel.resolveColumnById(this, `idValue`, processedData, 'string');
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
        if (sizeValue != null && sizeKey != null) {
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
        if (colorValue != null && colorKey != null) {
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

        const format = this.getItemStyle({ datumIndex, datum, colorValue, sizeValue }, false);

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: idValues[datumIndex],
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

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        const geometry = findFocusedGeoGeometry(this, opts);
        return geometry ? Transformable.toCanvas(this.contentGroup, geometry.getBBox()) : undefined;
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
