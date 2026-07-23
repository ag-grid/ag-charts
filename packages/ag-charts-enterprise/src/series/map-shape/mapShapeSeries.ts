import { _ModuleSupport } from 'ag-charts-community';
import type {
    CallbackParamRules,
    DynamicContext,
    Feature,
    FeatureCollection,
    FillStrokeMorph,
    Geometry,
    ITextMeasurer,
    Normalised,
    NormalisedTextOrSegments,
    Point,
    Position,
} from 'ag-charts-core';
import {
    cachedTextMeasurer,
    findDiscreteColorBinLabel,
    formatValue,
    isArray,
    measureTextSegments,
    mergeDefaults,
    toPlainText,
} from 'ag-charts-core';
import type {
    AgDrawingMode,
    AgMapShapeSeriesItemStylerParams,
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesOptions,
    AgMapShapeSeriesStyle,
} from 'ag-charts-types';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { GeometryType, containsType, geometryBbox, largestPolygon, projectGeometry } from '../map-util/geometryUtil';
import { LonLatBBox } from '../map-util/lonLatBbox';
import { findFocusedGeoGeometry } from '../map-util/mapUtil';
import { MapZIndexMap } from '../map-util/mapZIndexMap';
import { polygonMarkerCenter } from '../map-util/markerUtil';
import { maxWidthInPolygonForRectOfHeight, preferredLabelCenter } from '../map-util/polygonLabelUtil';
import { getTopologyShapeFillBBox } from '../map-util/shapeFillBBox';
import { TopologySeries } from '../map-util/topologySeries';
import type { ITopology } from '../map-util/topologyTypes';
import { formatSingleLabel } from '../util/labelFormatter';
import {
    type MapShapeNodeDatum,
    type MapShapeNodeLabelDatum,
    MapShapeSeriesProperties,
} from './mapShapeSeriesProperties';

const {
    getMissCount,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
    colorScaleLegendFormatterContext,
    configureColorScale,
    createDatumId,
    SeriesNodePickMode,
    valueProperty,
    ColorScale,
    Group,
    Selection,
    Text,
    PointerEvents,
    getLabelStyles,
} = _ModuleSupport;

interface MapShapeNodeDataContext extends _ModuleSupport.DataModelSeriesNodeDataContext<
    MapShapeNodeDatum,
    MapShapeNodeLabelDatum
> {}

interface ShapeDataValues {
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly labelValue: string | undefined;
}

type NormalisedMapShapeSeriesStyle = Normalised<AgMapShapeSeriesStyle, never, FillStrokeMorph>;

const fixedScale = _ModuleSupport.MercatorScale.fixedScale();

interface LabelLayout {
    geometry: Geometry;
    labelText: NormalisedTextOrSegments;
    aspectRatio: number;
    x: number;
    y: number;
    maxWidth: number;
    fixedPolygon: Position[][];
}
export class MapShapeSeries
    extends TopologySeries<
        MapShapeNodeDatum,
        AgMapShapeSeriesOptions,
        MapShapeSeriesProperties,
        MapShapeNodeLabelDatum,
        MapShapeNodeDataContext
    >
    implements ITopology
{
    static override readonly className = 'MapShapeSeries';
    static readonly type = 'map-shape' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: LonLatBBox | undefined;

    override properties = new MapShapeSeriesProperties();

    private _chartTopology?: FeatureCollection = undefined;

    public override getNodeData(): MapShapeNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override get hasData() {
        return super.hasData && this.topology != null;
    }

    private readonly colorScale = new ColorScale();

    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));

    public datumSelection = Selection.select<GeoGeometry<MapShapeNodeDatum>>(this.itemGroup, () => this.nodeFactory());
    private labelSelection = Selection.select<_ModuleSupport.Text<MapShapeNodeLabelDatum>>(this.itemLabelGroup, Text);
    private highlightDatumSelection = Selection.select<GeoGeometry<MapShapeNodeDatum>>(this.highlightNodeGroup, () =>
        this.nodeFactory()
    );
    private highlightLabelSelection = Selection.select<_ModuleSupport.Text<MapShapeNodeLabelDatum>>(
        this.highlightLabelGroup,
        Text
    );

    public contextNodeData?: MapShapeNodeDataContext;

    constructor(moduleCtx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super({
            moduleCtx,
            categoryKey: undefined,
            propertyKeys: {
                color: ['colorKey'],
                label: ['labelKey'],
            },
            propertyNames: {
                color: ['colorName'],
                label: ['labelName'],
            },
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
        });

        this.itemLabelGroup.pointerEvents = PointerEvents.None;
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

        this.contentGroup.zIndex = [MapZIndexMap.ShapeLine, zIndex];
        this.highlightGroup.zIndex = [MapZIndexMap.ShapeLineHighlight, zIndex];

        return true;
    }

    private isLabelEnabled() {
        return this.properties.labelKey != null && this.properties.label.enabled;
    }

    private nodeFactory(): GeoGeometry<MapShapeNodeDatum> {
        const geoGeometry = new GeoGeometry<MapShapeNodeDatum>();
        geoGeometry.renderMode = GeoGeometryRenderMode.Polygons;
        geoGeometry.lineJoin = 'round';
        return geoGeometry;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null) return;

        const { data, topology, colorScale } = this;
        const { topologyIdKey, idKey, colorKey, labelKey } = this.properties;

        const featureById = new Map<string, Feature>();
        for (const feature of topology?.features.values() ?? []) {
            const property = feature.properties?.[topologyIdKey];
            if (property == null || !containsType(feature.geometry, GeometryType.Polygon)) continue;
            featureById.set(property, feature);
        }

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
                ...(labelKey ? [valueProperty(labelKey, 'category', { id: 'labelValue' })] : []),
                ...(colorKey
                    ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue', invalidValue: undefined })]
                    : []),
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

        if (this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            const domain = processedData.domain.values[colorKeyIdx];
            configureColorScale(colorScale, this.properties.colorScale, domain);
        }

        if (topology == null) {
            this.ctx.logger.warnOnce(`no topology was provided for [MapShapeSeries]; nothing will be rendered.`);
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

    private getLabelLayout(
        datum: any,
        labelValue: string | undefined,
        measurer: ITextMeasurer,
        geometry: Geometry | undefined,
        previousLabelLayout: LabelLayout | undefined
    ): LabelLayout | undefined {
        if (labelValue == null || geometry == null) return;

        const { idKey, idName, colorKey, colorName, labelKey, labelName, padding, label } = this.properties;
        if (labelKey == null || !label.enabled) return;

        const labelText = this.getLabelText<AgMapShapeSeriesLabelFormatterParams>(
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
                colorKey,
                colorName,
                labelKey,
                labelName,
            }
        );
        if (labelText == null) return;

        const baseSize = isArray(labelText)
            ? measureTextSegments(labelText, label)
            : measurer.measureLines(String(labelText));
        const aspectRatio = (baseSize.width + 2 * padding) / (baseSize.height + 2 * padding);

        if (
            previousLabelLayout?.geometry === geometry &&
            previousLabelLayout?.labelText === labelText &&
            previousLabelLayout?.aspectRatio === aspectRatio
        ) {
            return previousLabelLayout;
        }

        const fixedGeometry = projectGeometry(geometry, fixedScale);
        const fixedPolygon = largestPolygon(fixedGeometry);
        if (fixedPolygon == null) return;

        const labelPlacement = preferredLabelCenter(fixedPolygon, {
            aspectRatio,
            precision: 1e-3,
        });
        if (labelPlacement == null) return;

        const { x, y, maxWidth } = labelPlacement;

        return { geometry, labelText, aspectRatio, x, y, maxWidth, fixedPolygon };
    }

    private getLabelDatum(
        labelLayout: LabelLayout,
        scaling: number,
        datumIndex: number,
        idValue: string
    ): MapShapeNodeLabelDatum | undefined {
        const { scale } = this;
        if (scale == null) return;

        const { padding, label } = this.properties;
        const { labelText, aspectRatio, x: untruncatedX, y, maxWidth, fixedPolygon } = labelLayout;

        const maxSizeWithoutTruncation = {
            width: Math.ceil(maxWidth * scaling),
            height: Math.ceil((maxWidth * scaling) / aspectRatio),
            meta: untruncatedX,
        };
        const labelFormatting = formatSingleLabel<number>(
            toPlainText(labelText),
            label,
            { padding },
            (height, allowTruncation) => {
                if (!allowTruncation) {
                    return maxSizeWithoutTruncation;
                }

                const result = maxWidthInPolygonForRectOfHeight(fixedPolygon, untruncatedX, y, height / scaling);
                return {
                    width: result.width * scaling,
                    height,
                    meta: result.x,
                };
            }
        );
        if (labelFormatting == null) return;

        const [{ text, fontSize, lineHeight, width }, formattingX] = labelFormatting;

        // Only shift horizontally if necessary
        const x = width < maxSizeWithoutTruncation.width ? untruncatedX : formattingX;

        const position = this.scale!.convert(fixedScale.invert([x, y]));

        return {
            x: position[0],
            y: position[1],
            text,
            fontSize,
            lineHeight,
            datumIndex,
            idValue,
            datumId: createDatumId(idValue),
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

    private resolveShapeDataColumns(processedData: _ModuleSupport.ProcessedData<any>) {
        const { colorKey, labelKey } = this.properties;

        return {
            idValues: this.dataModel!.resolveColumnById(this, 'idValue', processedData, 'string'),
            featureValues: this.dataModel!.resolveColumnById<Feature | undefined>(
                this,
                'featureValue',
                processedData,
                'object'
            ),
            labelValues: this.resolveColumn<string>(labelKey, 'labelValue', processedData, 'object'),
            colorValues: this.resolveColumn<number>(colorKey, 'colorValue', processedData, 'number'),
        };
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

    private previousLabelLayouts: Map<string, LabelLayout> | undefined = undefined;
    override createNodeData() {
        const { id: seriesId, dataModel, processedData, properties, scale, previousLabelLayouts } = this;
        const { label, legendItemName, colorKey } = properties;
        const { missingDataFill } = properties.colorScale;

        if (dataModel == null || processedData == null) return;

        if (!this.visible) {
            return { itemId: seriesId, nodeData: [], labelData: [] };
        }

        const scaling = scale == null ? Number.NaN : (scale.range[1][0] - scale.range[0][0]) / scale.bounds.width;
        const columns = this.resolveShapeDataColumns(processedData);

        const measurer = cachedTextMeasurer(label);

        const labelLayouts = new Map<string, LabelLayout>();
        this.previousLabelLayouts = labelLayouts;

        const nodeData: MapShapeNodeDatum[] = [];
        const labelData: MapShapeNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        const rawData = processedData.dataSources.get(this.id)?.data ?? [];

        for (const [datumIndex, datum] of rawData.entries()) {
            const dataValues: ShapeDataValues = {
                idValue: columns.idValues[datumIndex],
                colorValue: columns.colorValues?.[datumIndex],
                labelValue: columns.labelValues?.[datumIndex],
            };

            const geometry = columns.featureValues[datumIndex]?.geometry ?? undefined;
            if (geometry == null) {
                missingGeometries.push(dataValues.idValue);
            }

            if (colorKey != null && dataValues.colorValue == null && missingDataFill == null) {
                continue;
            }

            const labelLayout = this.getLabelLayout(
                datum,
                dataValues.labelValue,
                measurer,
                geometry,
                previousLabelLayouts?.get(dataValues.idValue)
            );
            if (labelLayout != null) {
                labelLayouts.set(dataValues.idValue, labelLayout);
            }

            const labelDatum =
                labelLayout != null && scale != null
                    ? this.getLabelDatum(labelLayout, scaling, datumIndex, dataValues.idValue)
                    : undefined;
            if (labelDatum != null) {
                labelData.push(labelDatum);
            }

            const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;

            nodeData.push({
                series: this,
                datum,
                datumIndex,
                ...dataValues,
                projectedGeometry,
                legendItemName,
                style: this.getItemStyle({ datum, datumIndex, colorValue: dataValues.colorValue }, false),
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
        const { datumSelection, labelSelection, highlightDatumSelection } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.labelGroup.visible = this.visible;
        const drawingMode = this.ctx.chartService.highlight?.drawingMode ?? 'overlay';

        const highlightedDatum = this.getHighlightedDatum();

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumStyles({ datumSelection, isHighlight: false });
        this.updateDatumNodes({ datumSelection, drawingMode: 'overlay' });

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection });
        const highlightLabelData = this.getHighlightLabelData(labelData, highlightedDatum);
        this.highlightLabelSelection = this.updateLabelSelection({
            labelData: highlightLabelData,
            labelSelection: this.highlightLabelSelection,
        });
        this.updateLabelNodes({ labelSelection: this.labelSelection, isHighlight: false });
        this.updateLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum == null ? [] : [highlightedDatum],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumStyles({ datumSelection: highlightDatumSelection, isHighlight: true });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, drawingMode });
    }

    private getHighlightLabelData(
        labelData: MapShapeNodeLabelDatum[],
        highlightedDatum?: MapShapeNodeDatum
    ): MapShapeNodeLabelDatum[] {
        if (labelData.length === 0) return [];

        const highlightId = createDatumId(highlightedDatum?.idValue);
        return labelData.filter(
            (labelDatum) => labelDatum.datumId === highlightId && labelDatum.datumIndex === highlightedDatum?.datumIndex
        );
    }

    private updateDatumSelection(opts: {
        nodeData: MapShapeNodeDatum[];
        datumSelection: _ModuleSupport.Selection<MapShapeNodeDatum, GeoGeometry<MapShapeNodeDatum>>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    protected getItemStyle(
        { datumIndex, datum, colorValue }: Partial<MapShapeNodeDatum>,
        isHighlight: boolean
    ): Required<NormalisedMapShapeSeriesStyle> {
        const { properties, colorScale } = this;
        const { colorKey, colorScale: colorScaleProps, itemStyler } = properties;
        const { missingDataFill } = colorScaleProps;

        // Colour refs are resolved during theme-merge before getStyle() returns.
        const baseStyle = properties.getStyle() as Required<NormalisedMapShapeSeriesStyle> & { opacity: number };

        if (colorValue != null) {
            const fillOverride = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : colorScaleProps.fills[0]?.color;
            if (fillOverride != null) {
                baseStyle.fill = fillOverride;
            }
        } else if (colorKey != null && missingDataFill != null) {
            baseStyle.fill = missingDataFill;
        }

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const selectionStyle = this.getSelectionStyle(datumIndex);
        let style = mergeDefaults(selectionStyle, highlightStyle, baseStyle);

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
                style = mergeDefaults(overrides, style);
            }
        }

        return style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<NormalisedMapShapeSeriesStyle>
    ) {
        const { id: seriesId } = this;
        const { idKey, labelKey, colorKey } = this.properties;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        const selectionState = this.getSelectionStateString(datumIndex);
        const candidateState = this.getCandidateStateString(datumIndex);
        const fill = this.filterItemStylerFillParams(style.fill) ?? style.fill;

        return {
            seriesId,
            datum,
            idKey,
            labelKey,
            colorKey,
            highlightState,
            selectionState,
            candidateState,
            ...style,
            fill,
        } satisfies CallbackParamRules<AgMapShapeSeriesItemStylerParams>;
    }

    private updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<MapShapeNodeDatum, GeoGeometry<MapShapeNodeDatum>>;
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
        datumSelection: _ModuleSupport.Selection<MapShapeNodeDatum, GeoGeometry<MapShapeNodeDatum>>;
        drawingMode: AgDrawingMode;
    }) {
        const fillBBox = getTopologyShapeFillBBox(this.scale);

        datumSelection.each((geoGeometry, nodeDatum) => {
            const { projectedGeometry } = nodeDatum;
            if (projectedGeometry == null) {
                geoGeometry.visible = false;
                geoGeometry.projectedGeometry = undefined;
                return;
            }

            geoGeometry.visible = true;
            geoGeometry.projectedGeometry = projectedGeometry;

            // Style is resolved by getItemStyle; colour refs are gone by render.
            geoGeometry.setStyleProperties(nodeDatum.style as NormalisedMapShapeSeriesStyle, fillBBox);

            geoGeometry.drawingMode = drawingMode;

            const selectionState = this.getDataSelectionState(nodeDatum.datumIndex);
            const bringToFront = !_ModuleSupport.isUnselected(selectionState);
            geoGeometry.zIndex = bringToFront ? 1 : 0;
        });
    }

    private updateLabelSelection(opts: {
        labelData: MapShapeNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<MapShapeNodeLabelDatum, _ModuleSupport.Text<MapShapeNodeLabelDatum>>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    private updateLabelNodes({
        isHighlight,
        labelSelection,
    }: {
        labelSelection: _ModuleSupport.Selection<MapShapeNodeLabelDatum, _ModuleSupport.Text<MapShapeNodeLabelDatum>>;
        isHighlight: boolean;
    }) {
        const { properties } = this;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        labelSelection.each((label, labelDatum) => {
            const { x, y, text, fontSize, lineHeight, datumIndex } = labelDatum;
            type P = AgMapShapeSeriesLabelFormatterParams;
            const style = getLabelStyles<P>(
                this,
                undefined,
                properties,
                properties.label,
                isHighlight,
                activeHighlight
            );
            const { color: fill, fontStyle, fontWeight, fontFamily } = style;
            label.visible = true;
            label.x = x;
            label.y = y;
            label.text = text;
            label.fill = fill;
            label.fontStyle = fontStyle;
            label.fontWeight = fontWeight;
            label.fontSize = fontSize;
            label.lineHeight = lineHeight;
            label.fontFamily = fontFamily;
            label.textAlign = 'center';
            label.textBaseline = 'middle';
            label.fillOpacity = this.getHighlightStyle(isHighlight, datumIndex).opacity ?? 1;
            label.setBoxing(style);
        });
    }

    resetAnimation() {
        // No animations
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

        const projectedGeometry = (datum as MapShapeNodeDatum).projectedGeometry;
        const polygon = projectedGeometry == null ? undefined : largestPolygon(projectedGeometry);
        const center = polygon == null ? undefined : polygonMarkerCenter(polygon, 2);
        const point = center == null ? undefined : { x: center[0], y: center[1] };

        this._previousDatumMidPoint = { datum, point };

        return point;
    }

    private legendItemSymbol(datumIndex?: number): _ModuleSupport.LegendSymbolOptions {
        const { dataModel, processedData, properties } = this;
        const { colorKey, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = properties;
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
        const { idKey, idName, colorKey, colorName, labelKey, labelName, legendItemName, title, tooltip } = properties;
        if (!dataModel || !processedData) return;

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const idValue = dataModel.resolveColumnById(this, `idValue`, processedData, 'string')[datumIndex];
        const colorValue =
            colorKey == null
                ? undefined
                : dataModel.resolveColumnById(this, `colorValue`, processedData, 'number')[datumIndex];

        if (colorKey != null && colorValue == null) {
            return;
        }

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
        if (colorValue != null) {
            const domain = dataModel.getDomain(this, `colorValue`, 'value', processedData).domain;
            const content = formatManager.format(this.callWithContext.bind(this), {
                type: 'number',
                value: colorValue,
                datum,
                seriesId,
                legendItemName,
                key: colorKey!,
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
            data.push({ label: colorName, fallbackLabel: colorKey!, value: content ?? binLabel ?? String(colorValue) });
        }

        const format = this.getItemStyle({ datum, datumIndex, colorValue }, false);

        return this.formatTooltipWithContext(
            tooltip,
            {
                heading: idValue,
                title: title ?? legendItemName,
                symbol: this.legendItemSymbol(datumIndex),
                data,
            },
            { seriesId, datum, title, idKey, idName, colorKey, colorName, labelKey, labelName, ...format }
        );
    }

    protected override computeFocusBounds(opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.Path | undefined {
        return findFocusedGeoGeometry(this, opts);
    }

    protected override hasItemStylers(): boolean {
        return (
            this.properties.selection.enabled ||
            this.properties.itemStyler != null ||
            this.properties.label.itemStyler != null
        );
    }
}
