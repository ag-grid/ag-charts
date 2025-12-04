import { type TextOrSegments, _ModuleSupport } from 'ag-charts-community';
import type { Feature, FeatureCollection, Geometry, ITextMeasurer, Point, Position } from 'ag-charts-core';
import {
    Logger,
    LonLatBBox,
    cachedTextMeasurer,
    isArray,
    measureTextSegments,
    mergeDefaults,
    toPlainText,
} from 'ag-charts-core';
import type {
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesOptions,
    AgMapShapeSeriesStyle,
} from 'ag-charts-types';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { GeometryType, containsType, geometryBbox, largestPolygon, projectGeometry } from '../map-util/geometryUtil';
import { findFocusedGeoGeometry } from '../map-util/mapUtil';
import { MapZIndexMap } from '../map-util/mapZIndexMap';
import { polygonMarkerCenter } from '../map-util/markerUtil';
import { maxWidthInPolygonForRectOfHeight, preferredLabelCenter } from '../map-util/polygonLabelUtil';
import { getTopologyShapeFillBBox } from '../map-util/shapeFillBBox';
import { TopologySeries } from '../map-util/topologySeries';
import { formatSingleLabel } from '../util/labelFormatter';
import {
    type MapShapeNodeDatum,
    type MapShapeNodeLabelDatum,
    MapShapeSeriesProperties,
} from './mapShapeSeriesProperties';

const {
    getMissCount,
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

interface MapShapeNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<MapShapeNodeDatum, MapShapeNodeLabelDatum> {}

interface ShapeDataValues {
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly labelValue: string | undefined;
}

const fixedScale = _ModuleSupport.MercatorScale.fixedScale();

interface LabelLayout {
    geometry: Geometry;
    labelText: TextOrSegments;
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
    implements _ModuleSupport.ITopology
{
    static readonly className = 'MapShapeSeries';
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

    public datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory()
    );
    private labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, MapShapeNodeLabelDatum> = Selection.select(
        this.itemLabelGroup,
        Text
    );
    private highlightDatumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeNodeDatum> = Selection.select(
        this.highlightNodeGroup,
        () => this.nodeFactory()
    );
    private highlightLabelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, MapShapeNodeLabelDatum> =
        Selection.select(this.highlightLabelGroup, Text);

    public contextNodeData?: MapShapeNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
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

    private nodeFactory(): GeoGeometry {
        const geoGeometry = new GeoGeometry();
        geoGeometry.renderMode = GeoGeometryRenderMode.Polygons;
        geoGeometry.lineJoin = 'round';
        return geoGeometry;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null) return;

        const { data, topology, colorScale } = this;
        const { topologyIdKey, idKey, colorKey, labelKey, colorRange } = this.properties;

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
                ...(colorKey ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue' })] : []),
            ],
        });

        const featureValues = dataModel.resolveColumnById<Feature | undefined>(this, `featureValue`, processedData);
        this.topologyBounds = featureValues.reduce<LonLatBBox | undefined>((current, feature) => {
            const geometry = feature?.geometry;
            if (geometry == null) return current;
            return geometryBbox(geometry, current);
        }, undefined);

        if (colorRange != null && this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue');
            colorScale.domain = processedData.domain.values[colorKeyIdx];
            colorScale.range = colorRange;
            colorScale.update();
        }

        if (topology == null) {
            Logger.warnOnce(`no topology was provided for [MapShapeSeries]; nothing will be rendered.`);
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
        processedData: _ModuleSupport.ProcessedData<any>
    ): T[] | undefined {
        if (key == null || this.dataModel == null) return undefined;
        return this.dataModel.resolveColumnById<T>(this, columnId, processedData);
    }

    private resolveShapeDataColumns(processedData: _ModuleSupport.ProcessedData<any>) {
        const { colorKey, labelKey } = this.properties;

        return {
            idValues: this.dataModel!.resolveColumnById<string>(this, 'idValue', processedData),
            featureValues: this.dataModel!.resolveColumnById<Feature | undefined>(this, 'featureValue', processedData),
            labelValues: this.resolveColumn<string>(labelKey, 'labelValue', processedData),
            colorValues: this.resolveColumn<number>(colorKey, 'colorValue', processedData),
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

        Logger.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
    }

    private previousLabelLayouts: Map<string, LabelLayout> | undefined = undefined;
    override createNodeData() {
        const { id: seriesId, dataModel, processedData, properties, scale, previousLabelLayouts } = this;
        const { idKey, label, legendItemName } = properties;

        if (dataModel == null || processedData == null) return;

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
                itemId: idKey,
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

        const highlightedDatum = this.getHighlightedDatum();

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumStyles({ datumSelection, isHighlight: false });
        this.updateDatumNodes({ datumSelection });

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
        this.updateDatumNodes({ datumSelection: highlightDatumSelection });
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
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    protected getItemStyle(
        { datumIndex, datum, colorValue }: Partial<MapShapeNodeDatum>,
        isHighlight: boolean
    ): Required<AgMapShapeSeriesStyle> {
        const { properties, colorScale } = this;
        const { colorRange, itemStyler } = properties;

        const baseStyle = properties.getStyle();

        if (colorValue != null) {
            const fillOverride = this.isColorScaleValid() ? colorScale.convert(colorValue) : colorRange?.[0];
            if (fillOverride != null) {
                baseStyle.fill = fillOverride;
            }
        }

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        let style = mergeDefaults(highlightStyle, baseStyle);

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
        style: Required<AgMapShapeSeriesStyle>
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

    private updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeNodeDatum>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, nodeDatum) => {
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight);
        });
    }

    private updateDatumNodes({
        datumSelection,
    }: {
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeNodeDatum>;
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

            geoGeometry.setStyleProperties(nodeDatum.style, fillBBox);
        });
    }

    private updateLabelSelection(opts: {
        labelData: MapShapeNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, MapShapeNodeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    private updateLabelNodes({
        isHighlight,
        labelSelection,
    }: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, MapShapeNodeLabelDatum>;
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
        let minDatum: _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType> | undefined;

        this.datumSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });

        return minDatum == null ? undefined : { datum: minDatum, distance: Math.sqrt(minDistanceSquared) };
    }

    private _previousDatumMidPoint:
        | { datum: _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType>; point: Point | undefined }
        | undefined = undefined;
    datumMidPoint(datum: _ModuleSupport.SeriesNodeDatum<_ModuleSupport.DatumIndexType>): Point | undefined {
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
        const { fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = properties;

        let { fill } = properties;
        if (datumIndex != null && this.isColorScaleValid()) {
            const colorValues = dataModel!.resolveColumnById(this, 'colorValue', processedData!);
            const colorValue = colorValues[datumIndex];
            fill = this.colorScale.convert(colorValue);
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

        const { title, legendItemName, idKey, idName, colorKey, colorRange, showInLegend } = this.properties;

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
        const idValue = dataModel.resolveColumnById<string>(this, `idValue`, processedData)[datumIndex];
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
            });
            data.push({ label: colorName, fallbackLabel: colorKey!, value: content ?? String(colorValue) });
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
        return this.properties.itemStyler != null || this.properties.label.itemStyler != null;
    }
}
