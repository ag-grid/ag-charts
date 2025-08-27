import { type AgMapLineSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import { type ITextMeasurer, Logger, type Point, cachedTextMeasurer } from 'ag-charts-core';
import type { AgMapLineSeriesLabelFormatterParams, AgMapLineSeriesOptions } from 'ag-charts-types';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { GeometryType, containsType, geometryBbox, largestLineString, projectGeometry } from '../map-util/geometryUtil';
import { lineStringCenter } from '../map-util/lineStringUtil';
import { findFocusedGeoGeometry } from '../map-util/mapUtil';
import { MapZIndexMap } from '../map-util/mapZIndexMap';
import { TopologySeries } from '../map-util/topologySeries';
import { type MapLineNodeDatum, type MapLineNodeLabelDatum, MapLineSeriesProperties } from './mapLineSeriesProperties';

const {
    getMissCount,
    getLabelStyles,
    createDatumId,
    SeriesNodePickMode,
    valueProperty,
    ColorScale,
    LinearScale,
    Selection,
    Text,
    Transformable,
    mergeDefaults,
} = _ModuleSupport;

interface MapLineNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<MapLineNodeDatum, MapLineNodeLabelDatum> {}

export class MapLineSeries extends TopologySeries<
    MapLineNodeDatum,
    AgMapLineSeriesOptions,
    MapLineSeriesProperties,
    MapLineNodeLabelDatum,
    MapLineNodeDataContext
> {
    static readonly className = 'MapLineSeries';
    static readonly type = 'map-line' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapLineSeriesProperties();

    private _chartTopology?: _ModuleSupport.FeatureCollection = undefined;

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

    public datumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry> = Selection.select(
        this.contentGroup,
        () => this.nodeFactory()
    );
    private labelSelection: _ModuleSupport.Selection<
        _ModuleSupport.Text,
        _ModuleSupport.PlacedLabel<MapLineNodeLabelDatum>
    > = Selection.select(this.labelGroup, Text);
    private highlightDatumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry> = Selection.select(
        this.highlightGroup,
        () => this.nodeFactory()
    );

    public contextNodeData?: MapLineNodeDataContext;

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

    private nodeFactory(): GeoGeometry {
        const geoGeometry = new GeoGeometry();
        geoGeometry.renderMode = GeoGeometryRenderMode.Lines;
        geoGeometry.lineJoin = 'round';
        geoGeometry.lineCap = 'round';
        return geoGeometry;
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        if (this.data == null) return;

        const { data, topology, sizeScale, colorScale } = this;
        const { topologyIdKey, idKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } = this.properties;

        const featureById = new Map<string, _ModuleSupport.Feature>();
        topology?.features.forEach((feature) => {
            const property = feature.properties?.[topologyIdKey];
            if (property == null || !containsType(feature.geometry, GeometryType.LineString)) return;
            featureById.set(property, feature);
        });

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
                ...(labelKey != null ? [valueProperty(labelKey, 'category', { id: 'labelValue' })] : []),
                ...(sizeKey != null ? [valueProperty(sizeKey, sizeScaleType, { id: 'sizeValue' })] : []),
                ...(colorKey != null ? [valueProperty(colorKey, colorScaleType, { id: 'colorValue' })] : []),
            ],
        });

        const featureValues = dataModel.resolveColumnById<_ModuleSupport.Feature | undefined>(
            this,
            `featureValue`,
            processedData
        );
        this.topologyBounds = featureValues.reduce<_ModuleSupport.LonLatBBox | undefined>((current, feature) => {
            const geometry = feature?.geometry;
            if (geometry == null) return current;
            return geometryBbox(geometry, current);
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

        if (topology == null) {
            Logger.warnOnce(`no topology was provided for [MapLineSeries]; nothing will be rendered.`);
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
        labelValue: string | undefined,
        projectedGeometry: _ModuleSupport.Geometry | undefined,
        measurer: ITextMeasurer
    ): MapLineNodeLabelDatum | undefined {
        if (labelValue == null || projectedGeometry == null) return;

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

        const labelSize = measurer.measureText(String(labelText));
        const labelCenter = lineStringCenter(lineString);
        if (labelCenter == null) return;

        const [x, y] = labelCenter.point;
        const { width, height } = labelSize;

        return {
            point: { x, y, size: 0 },
            label: { width, height, text: labelText },
            anchor: undefined,
            placement: undefined,
        };
    }

    override createNodeData() {
        const { id: seriesId, dataModel, processedData, sizeScale, properties, scale } = this;
        const { idKey, sizeKey, colorKey, labelKey, label, legendItemName } = properties;

        if (dataModel == null || processedData == null) return;

        const idValues = dataModel.resolveColumnById<string>(this, `idValue`, processedData);
        const featureValues = dataModel.resolveColumnById<_ModuleSupport.Feature | undefined>(
            this,
            `featureValue`,
            processedData
        );
        const labelValues =
            labelKey != null ? dataModel.resolveColumnById<string>(this, `labelValue`, processedData) : undefined;
        const sizeValues =
            sizeKey != null ? dataModel.resolveColumnById<number>(this, `sizeValue`, processedData) : undefined;
        const colorValues =
            colorKey != null ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData) : undefined;

        const maxStrokeWidth = properties.maxStrokeWidth ?? properties.strokeWidth;
        sizeScale.range = [Math.min(properties.strokeWidth, maxStrokeWidth), maxStrokeWidth];
        const measurer = cachedTextMeasurer(label);

        const projectedGeometries = new Map<string, _ModuleSupport.Geometry>();
        processedData.dataSources.get(this.id)?.forEach((_datum, datumIndex) => {
            const id: string | undefined = idValues[datumIndex];
            const geometry: _ModuleSupport.Geometry | undefined = featureValues[datumIndex]?.geometry ?? undefined;
            const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;
            if (id != null && projectedGeometry != null) {
                projectedGeometries.set(id, projectedGeometry);
            }
        });

        const nodeData: MapLineNodeDatum[] = [];
        const labelData: MapLineNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((datum, datumIndex) => {
            const idValue = idValues[datumIndex];
            const colorValue = colorValues?.[datumIndex];
            const sizeValue = sizeValues?.[datumIndex];
            const labelValue = labelValues?.[datumIndex];

            const projectedGeometry = projectedGeometries.get(idValue);
            if (projectedGeometry == null) {
                missingGeometries.push(idValue);
            }

            const labelDatum = this.getLabelDatum(datum, labelValue, projectedGeometry, measurer);
            if (labelDatum != null) {
                labelData.push(labelDatum);
            }

            nodeData.push({
                series: this,
                itemId: idKey,
                datum,
                datumIndex,
                idValue,
                labelValue,
                colorValue,
                sizeValue,
                projectedGeometry,
                legendItemName,
                style: this.getItemStyle({ datumIndex, datum, colorValue, sizeValue }, false),
            });
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

    override update() {
        const { datumSelection, highlightDatumSelection } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.labelGroup.visible = this.visible;

        let highlightedDatum: MapLineNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;

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

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumStyles({ datumSelection, isHighlight: false });
        this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumStyles({ datumSelection: highlightDatumSelection, isHighlight: true });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    }

    private updateDatumSelection(opts: {
        nodeData: MapLineNodeDatum[];
        datumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    protected getItemStyle(
        { datumIndex = 0, datum, colorValue, sizeValue }: Partial<MapLineNodeDatum>,
        isHighlight: boolean
    ): Required<AgMapLineSeriesStyle> {
        const { id: seriesId, properties, colorScale, sizeScale } = this;
        const { colorRange, itemStyler } = properties;

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const baseStyle = mergeDefaults(highlightStyle, properties.getStyle());

        if (!isHighlight && colorValue != null) {
            baseStyle.stroke = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : colorRange?.[0] ?? properties.stroke;
        }

        if (sizeValue != null) {
            baseStyle.strokeWidth = sizeScale.convert(sizeValue, { clamp: true });
        }

        let overrides;
        if (itemStyler != null) {
            overrides = this.cachedDatumCallback(createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'), () => {
                const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
                const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);
                return this.callWithContext(itemStyler, {
                    seriesId,
                    datum,
                    highlighted: isHighlight,
                    highlightState,
                    ...baseStyle,
                });
            });
        }

        return overrides ? mergeDefaults(baseStyle, overrides) : baseStyle;
    }

    private updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, nodeDatum) => {
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight);
        });
    }

    private updateDatumNodes({
        datumSelection,
    }: {
        datumSelection: _ModuleSupport.Selection<MapLineNodeDatum, GeoGeometry>;
        isHighlight: boolean;
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

            geoGeometry.setProperties(style);
        });
    }

    public override updatePlacedLabelData(labelData: _ModuleSupport.PlacedLabel<MapLineNodeLabelDatum>[]) {
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
        opts.labelSelection.each((label, { x, y, width, height, text }, datumIndex) => {
            const style = getLabelStyles<AgMapLineSeriesLabelFormatterParams>(
                this,
                undefined,
                this.properties,
                this.properties.label
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
            label.fillOpacity = this.getHighlightStyle(false, datumIndex).opacity ?? 1;
            label.setBoxing(style);
        });
    }

    resetAnimation() {
        // No animations
    }

    override getLabelData() {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    override pickNodeClosestDatum({ x, y }: Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistanceSquared = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum<unknown> | undefined;

        this.datumSelection.each((node, datum) => {
            const distanceSquared = node.distanceSquared(x, y);
            if (distanceSquared < minDistanceSquared) {
                minDistanceSquared = distanceSquared;
                minDatum = datum;
            }
        });

        return minDatum != null ? { datum: minDatum, distance: Math.sqrt(minDistanceSquared) } : undefined;
    }

    private _previousDatumMidPoint:
        | { datum: _ModuleSupport.SeriesNodeDatum<unknown>; point: Point | undefined }
        | undefined = undefined;
    datumMidPoint(datum: _ModuleSupport.SeriesNodeDatum<unknown>): Point | undefined {
        const { _previousDatumMidPoint } = this;
        if (_previousDatumMidPoint?.datum === datum) {
            return _previousDatumMidPoint.point;
        }

        const projectedGeometry = (datum as MapLineNodeDatum).projectedGeometry;
        const lineString = projectedGeometry != null ? largestLineString(projectedGeometry) : undefined;
        const center = lineString != null ? lineStringCenter(lineString)?.point : undefined;
        const point = center != null ? { x: center[0], y: center[1] } : undefined;

        this._previousDatumMidPoint = { datum, point };

        return point;
    }

    private legendItemSymbol(datumIndex?: number): _ModuleSupport.LegendSymbolOptions {
        const { dataModel, processedData, properties } = this;
        const { strokeWidth, strokeOpacity, lineDash } = properties;

        let { stroke } = properties;
        if (datumIndex != null && this.isColorScaleValid()) {
            const colorValues = dataModel!.resolveColumnById(this, 'colorValue', processedData!);
            const colorValue = colorValues[datumIndex];
            stroke = this.colorScale.convert(colorValue);
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

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const idValues = dataModel.resolveColumnById<string>(this, `idValue`, processedData);
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
        if (sizeValue != null && sizeKey != null) {
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
        if (colorValue != null && colorKey != null) {
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
        return this.properties.itemStyler != null;
    }
}
