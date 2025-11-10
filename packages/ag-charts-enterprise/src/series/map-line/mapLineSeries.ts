import { type AgMapLineSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import { type ITextMeasurer, Logger, type Point, cachedTextMeasurer, mergeDefaults } from 'ag-charts-core';
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
} = _ModuleSupport;

interface MapLineNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<MapLineNodeDatum, MapLineNodeLabelDatum> {}

interface LineDataValues {
    readonly idValue: string;
    readonly colorValue: number | undefined;
    readonly sizeValue: number | undefined;
    readonly labelValue: string | undefined;
}

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

    public datumSelection: _ModuleSupport.Selection<GeoGeometry, MapLineNodeDatum> = Selection.select(
        this.contentGroup,
        () => this.nodeFactory()
    );
    private labelSelection: _ModuleSupport.Selection<
        _ModuleSupport.Text,
        _ModuleSupport.PlacedLabel<MapLineNodeLabelDatum>
    > = Selection.select(this.labelGroup, Text);
    private highlightDatumSelection: _ModuleSupport.Selection<GeoGeometry, MapLineNodeDatum> = Selection.select(
        this.highlightNodeGroup,
        () => this.nodeFactory()
    );
    private highlightLabelSelection: _ModuleSupport.Selection<
        _ModuleSupport.Text,
        _ModuleSupport.PlacedLabel<MapLineNodeLabelDatum>
    > = Selection.select(this.highlightLabelGroup, Text);
    private placedLabelData: _ModuleSupport.PlacedLabel<MapLineNodeLabelDatum>[] = [];

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
                ...(colorKey == null ? [] : [valueProperty(colorKey, colorScaleType, { id: 'colorValue' })]),
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
        datumIndex: number,
        idValue: string | undefined,
        labelValue: string | undefined,
        projectedGeometry: _ModuleSupport.Geometry | undefined,
        measurer: ITextMeasurer
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

        const labelSize = measurer.measureLines(String(labelText));
        const labelCenter = lineStringCenter(lineString);
        if (labelCenter == null) return;

        const [x, y] = labelCenter.point;
        const { width, height } = labelSize;

        return {
            point: { x, y, size: 0 },
            label: { width, height, text: labelText },
            anchor: undefined,
            placement: undefined,
            datumIndex,
            idValue,
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

    private resolveLineDataColumns(processedData: _ModuleSupport.ProcessedData<any>) {
        const { sizeKey, colorKey, labelKey } = this.properties;

        return {
            idValues: this.dataModel!.resolveColumnById<string>(this, 'idValue', processedData),
            featureValues: this.dataModel!.resolveColumnById<_ModuleSupport.Feature | undefined>(
                this,
                'featureValue',
                processedData
            ),
            labelValues: this.resolveColumn<string>(labelKey, 'labelValue', processedData),
            sizeValues: this.resolveColumn<number>(sizeKey, 'sizeValue', processedData),
            colorValues: this.resolveColumn<number>(colorKey, 'colorValue', processedData),
        };
    }

    private prepareProjectedLineGeometries(
        idValues: string[],
        featureValues: (_ModuleSupport.Feature | undefined)[],
        processedData: _ModuleSupport.ProcessedData<any>
    ): Map<string, _ModuleSupport.Geometry> {
        const projectedGeometries = new Map<string, _ModuleSupport.Geometry>();

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

        Logger.warnOnce(`some data items do not have matches in the provided topology`, missingGeometries);
    }

    override createNodeData() {
        const { id: seriesId, dataModel, processedData, sizeScale, properties } = this;
        const { idKey, label, legendItemName } = properties;

        if (dataModel == null || processedData == null) return;

        const columns = this.resolveLineDataColumns(processedData);

        const maxStrokeWidth = properties.maxStrokeWidth ?? properties.strokeWidth;
        sizeScale.range = [Math.min(properties.strokeWidth, maxStrokeWidth), maxStrokeWidth];
        const measurer = cachedTextMeasurer(label);

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
                measurer
            );
            if (labelDatum != null) {
                labelData.push(labelDatum);
            }

            nodeData.push({
                series: this,
                itemId: idKey,
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

        const highlightedDatum = this.getHighlightedDatum();
        const nodeData = this.contextNodeData?.nodeData ?? [];

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumStyles({ datumSelection, isHighlight: false });
        this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum == null ? [] : [highlightedDatum],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumStyles({ datumSelection: highlightDatumSelection, isHighlight: true });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });

        this.updateLabelNodes({ labelSelection: this.labelSelection, isHighlight: false });
        this.updateHighlightLabelSelection(highlightedDatum);
    }

    private updateDatumSelection(opts: {
        nodeData: MapLineNodeDatum[];
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapLineNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    protected getItemStyle(
        { datumIndex = 0, datum, colorValue, sizeValue }: Partial<MapLineNodeDatum>,
        isHighlight: boolean
    ): Required<AgMapLineSeriesStyle> {
        const { properties, colorScale, sizeScale } = this;
        const { colorRange, itemStyler } = properties;

        const baseStyle = properties.getStyle();

        if (colorValue != null) {
            baseStyle.stroke = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : colorRange?.[0] ?? properties.stroke;
        }

        const highlightStyle = this.getHighlightStyle(isHighlight, datumIndex);
        const style = mergeDefaults(highlightStyle, baseStyle);

        if (sizeValue != null) {
            style.strokeWidth = sizeScale.convert(sizeValue, { clamp: true });
        }

        let overrides;
        if (itemStyler != null) {
            overrides = this.cachedDatumCallback(createDatumId(datumIndex, isHighlight ? 'highlight' : 'node'), () => {
                const params = this.makeItemStylerParams(datum, datumIndex, isHighlight, style);
                return this.callWithContext(itemStyler, params);
            });
        }

        return overrides ? mergeDefaults(style, overrides) : style;
    }

    private makeItemStylerParams(
        datum: unknown,
        datumIndex: number,
        isHighlight: boolean,
        style: Required<AgMapLineSeriesStyle>
    ) {
        const { id: seriesId } = this;

        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const highlightState = this.getHighlightStateString(activeHighlight, isHighlight, datumIndex);

        return {
            seriesId,
            datum,
            highlighted: isHighlight,
            highlightState,
            ...style,
        };
    }

    private updateDatumStyles({
        datumSelection,
        isHighlight,
    }: {
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapLineNodeDatum>;
        isHighlight: boolean;
    }) {
        datumSelection.each((_, nodeDatum) => {
            nodeDatum.style = this.getItemStyle(nodeDatum, isHighlight);
        });
    }

    private updateDatumNodes({
        datumSelection,
    }: {
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapLineNodeDatum>;
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
            _ModuleSupport.Text,
            _ModuleSupport.PlacedLabel<MapLineNodeLabelDatum>
        >;
        isHighlight: boolean;
    }) {
        const { properties } = this;
        const activeHighlight = this.getHighlightedDatum();
        labelSelection.each((label, placedLabel) => {
            const { x, y, width, height, text, datum: labelDatum } = placedLabel;
            const style = getLabelStyles(this, undefined, properties, properties.label, isHighlight, activeHighlight);
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

        const projectedGeometry = (datum as MapLineNodeDatum).projectedGeometry;
        const lineString = projectedGeometry == null ? undefined : largestLineString(projectedGeometry);
        const center = lineString == null ? undefined : lineStringCenter(lineString)?.point;
        const point = center == null ? undefined : { x: center[0], y: center[1] };

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

        const datum = processedData.dataSources.get(this.id)?.data[datumIndex];
        const idValues = dataModel.resolveColumnById<string>(this, `idValue`, processedData);
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
        return this.properties.itemStyler != null || this.properties.label.itemStyler != null;
    }
}
