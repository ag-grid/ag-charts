import {
    AgMapLineSeriesFormatterParams,
    AgMapLineSeriesStyle,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { GeometryType, containsType, geometryBbox, largestLineString, projectGeometry } from '../map-util/geometryUtil';
import { lineStringCenter } from '../map-util/lineStringUtil';
import { GEOJSON_OBJECT } from '../map-util/validation';
import { MapLineNodeDatum, MapLineNodeLabelDatum, MapLineSeriesProperties } from './mapLineSeriesProperties';

const { getMissCount, createDatumId, DataModelSeries, SeriesNodePickMode, valueProperty, Validate } = _ModuleSupport;
const { ColorScale, LinearScale } = _Scale;
const { Group, Selection, Text } = _Scene;
const { sanitizeHtml, Logger } = _Util;

export interface MapLineNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<MapLineNodeDatum, MapLineNodeLabelDatum> {}

export class MapLineSeries
    extends DataModelSeries<MapLineNodeDatum, MapLineSeriesProperties, MapLineNodeLabelDatum, MapLineNodeDataContext>
    implements _ModuleSupport.TopologySeries
{
    static readonly className = 'MapLineSeries';
    static readonly type = 'map-line' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapLineSeriesProperties();

    @Validate(GEOJSON_OBJECT, { optional: true, property: 'topology' })
    private _chartTopology?: _ModuleSupport.FeatureCollection = undefined;

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override get hasData() {
        return super.hasData && this.topology != null;
    }

    private readonly colorScale = new ColorScale();
    private readonly sizeScale = new LinearScale();

    private itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));

    private datumSelection: _Scene.Selection<GeoGeometry, MapLineNodeDatum> = Selection.select(this.itemGroup, () =>
        this.nodeFactory()
    );
    private labelSelection: _Scene.Selection<_Scene.Text, _Util.PlacedLabel<_Util.PointLabelDatum>> = Selection.select(
        this.labelGroup,
        Text
    );
    private highlightDatumSelection: _Scene.Selection<GeoGeometry, MapLineNodeDatum> = Selection.select(
        this.highlightGroup,
        () => this.nodeFactory()
    );

    private contextNodeData: MapLineNodeDataContext[] = [];

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
        });
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

    private nodeFactory(): GeoGeometry {
        const geoGeometry = new GeoGeometry();
        geoGeometry.renderMode = GeoGeometryRenderMode.Lines;
        geoGeometry.lineJoin = 'round';
        geoGeometry.lineCap = 'round';
        return geoGeometry;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const { data, topology, sizeScale, colorScale } = this;
        const { topologyIdKey, idKey, sizeKey, colorKey, labelKey, sizeDomain, colorRange } = this.properties;

        const featureById = new Map<string, _ModuleSupport.Feature>();
        topology?.features.forEach((feature) => {
            const property = feature.properties?.[topologyIdKey];
            if (property == null || !containsType(feature.geometry, GeometryType.LineString)) return;
            featureById.set(property, feature);
        });

        const { dataModel, processedData } = await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                valueProperty(this, idKey, false, { id: 'idValue', includeProperty: false }),
                valueProperty(this, idKey, false, {
                    id: 'featureValue',
                    includeProperty: false,
                    processor: () => (datum) => featureById.get(datum),
                }),
                ...(labelKey != null ? [valueProperty(this, labelKey, false, { id: 'labelValue' })] : []),
                ...(sizeKey != null ? [valueProperty(this, sizeKey, true, { id: 'sizeValue' })] : []),
                ...(colorKey != null ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
            ],
        });

        const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
        this.topologyBounds = (processedData.data as any[]).reduce<_ModuleSupport.LonLatBBox | undefined>(
            (current, { values }) => {
                const feature: _ModuleSupport.Feature | undefined = values[featureIdx];
                const geometry = feature?.geometry;
                if (geometry == null) return current;
                return geometryBbox(geometry, current);
            },
            undefined
        );

        if (sizeKey != null) {
            const sizeIdx = dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index;
            const processedSize = processedData.domain.values[sizeIdx] ?? [];
            sizeScale.domain = sizeDomain ?? processedSize;
        }

        if (colorRange != null && this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
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

        const colorIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
        const dataCount = processedData.data.length;
        const missCount = getMissCount(this, processedData.defs.values[colorIdx].missing);
        const colorDataMissing = dataCount === 0 || dataCount === missCount;
        return !colorDataMissing;
    }

    private getLabelDatum(
        datum: any,
        labelValue: string | undefined,
        projectedGeometry: _ModuleSupport.Geometry | undefined,
        font: string
    ): MapLineNodeLabelDatum | undefined {
        if (labelValue == null || projectedGeometry == null) return;

        const lineString = largestLineString(projectedGeometry);
        if (lineString == null) return;

        const { idKey, idName, sizeKey, sizeName, colorKey, colorName, labelKey, labelName, label } = this.properties;

        const labelText = this.getLabelText(label, {
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
        });
        if (labelText == null) return;

        const labelSize = Text.getTextSize(String(labelText), font);
        const labelCenter = lineStringCenter(lineString);
        if (labelCenter == null) return;

        const [x, y] = labelCenter.point;
        const { width, height } = labelSize;

        return {
            point: { x, y, size: 0 },
            label: { width, height, text: labelText },
            marker: undefined,
            placement: undefined,
        };
    }

    override async createNodeData(): Promise<MapLineNodeDataContext[]> {
        const { id: seriesId, dataModel, processedData, sizeScale, colorScale, properties, scale } = this;
        const { idKey, sizeKey, colorKey, labelKey, label } = properties;

        if (dataModel == null || processedData == null) return [];

        const colorScaleValid = this.isColorScaleValid();

        const idIdx = dataModel.resolveProcessedDataIndexById(this, `idValue`).index;
        const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
        const labelIdx =
            labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : undefined;
        const sizeIdx = sizeKey != null ? dataModel.resolveProcessedDataIndexById(this, `sizeValue`).index : undefined;
        const colorIdx =
            colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : undefined;

        const maxStrokeWidth = properties.maxStrokeWidth ?? properties.strokeWidth;
        sizeScale.range = [Math.min(properties.strokeWidth, maxStrokeWidth), maxStrokeWidth];
        const font = label.getFont();

        const projectedGeometries = new Map<string, _ModuleSupport.Geometry>();
        processedData.data.forEach(({ values }) => {
            const id: string | undefined = values[idIdx];
            const geometry: _ModuleSupport.Geometry | undefined = values[featureIdx]?.geometry;
            const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;
            if (id != null && projectedGeometry != null) {
                projectedGeometries.set(id, projectedGeometry);
            }
        });

        const nodeData: MapLineNodeDatum[] = [];
        const labelData: MapLineNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        processedData.data.forEach(({ datum, values }) => {
            const idValue = values[idIdx];
            const colorValue: number | undefined = colorIdx != null ? values[colorIdx] : undefined;
            const sizeValue: number | undefined = sizeIdx != null ? values[sizeIdx] : undefined;
            const labelValue: string | undefined = labelIdx != null ? values[labelIdx] : undefined;

            const color: string | undefined =
                colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : undefined;
            const size = sizeValue != null ? sizeScale.convert(sizeValue, { clampMode: 'clamped' }) : undefined;

            const projectedGeometry = projectedGeometries.get(idValue);
            if (projectedGeometry == null) {
                missingGeometries.push(idValue);
            }

            const labelDatum = this.getLabelDatum(datum, labelValue, projectedGeometry, font);
            if (labelDatum != null) {
                labelData.push(labelDatum);
            }

            nodeData.push({
                series: this,
                itemId: idKey,
                datum,
                stroke: color,
                strokeWidth: size,
                idValue,
                labelValue,
                colorValue,
                sizeValue,
                projectedGeometry,
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

        return [
            {
                itemId: seriesId,
                nodeData,
                labelData,
            },
        ];
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update(): Promise<void> {
        const { datumSelection, labelSelection, highlightDatumSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        let highlightedDatum: MapLineNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData[0]?.nodeData ?? [];

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = await this.updateLabelSelection({ labelSelection });
        await this.updateLabelNodes({ labelSelection });

        this.highlightDatumSelection = await this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    }

    private async updateDatumSelection(opts: {
        nodeData: MapLineNodeDatum[];
        datumSelection: _Scene.Selection<GeoGeometry, MapLineNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    private async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<GeoGeometry, MapLineNodeDatum>;
        isHighlight: boolean;
    }) {
        const {
            id: seriesId,
            properties,
            ctx: { callbackCache },
        } = this;
        const { datumSelection, isHighlight } = opts;
        const { idKey, labelKey, sizeKey, colorKey, stroke, strokeOpacity, lineDash, lineDashOffset, formatter } =
            properties;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.strokeWidth);

        datumSelection.each((geoGeometry, datum) => {
            const { projectedGeometry } = datum;
            if (projectedGeometry == null) {
                geoGeometry.visible = false;
                geoGeometry.projectedGeometry = undefined;
                return;
            }

            let format: AgMapLineSeriesStyle | undefined;
            if (formatter != null) {
                const params: _Util.RequireOptional<AgMapLineSeriesFormatterParams> = {
                    seriesId,
                    datum: datum.datum,
                    itemId: datum.itemId,
                    idKey,
                    labelKey,
                    sizeKey,
                    colorKey,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    highlighted: isHighlight,
                };
                format = callbackCache.call(formatter, params as AgMapLineSeriesFormatterParams);
            }

            geoGeometry.visible = true;
            geoGeometry.projectedGeometry = projectedGeometry;
            geoGeometry.stroke = highlightStyle?.stroke ?? format?.stroke ?? datum.stroke ?? stroke;
            geoGeometry.strokeWidth = Math.max(
                highlightStyle?.strokeWidth ?? 0,
                format?.strokeWidth ?? datum.strokeWidth ?? strokeWidth
            );
            geoGeometry.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            geoGeometry.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
            geoGeometry.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
        });
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

    resetAnimation() {
        // No animations
    }

    override getLabelData(): _Util.PointLabelDatum[] {
        return this.contextNodeData.flatMap(({ labelData }) => labelData);
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override pickNodeClosestDatum({ x, y }: _Scene.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
        let minDistance = Infinity;
        let minDatum: _ModuleSupport.SeriesNodeDatum | undefined;

        this.datumSelection.each((node, datum) => {
            const distance = node.distanceToPoint(x, y);
            if (distance < minDistance) {
                minDistance = distance;
                minDatum = datum;
            }
        });

        return minDatum != null ? { datum: minDatum, distance: minDistance } : undefined;
    }

    private _previousDatumMidPoint:
        | { datum: _ModuleSupport.SeriesNodeDatum; point: _Scene.Point | undefined }
        | undefined = undefined;
    datumMidPoint(datum: _ModuleSupport.SeriesNodeDatum): _Scene.Point | undefined {
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

    override getLegendData(
        legendType: _ModuleSupport.ChartLegendType
    ): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[] {
        const { processedData, dataModel } = this;
        if (processedData == null || dataModel == null) return [];
        const { legendItemName, idKey, colorKey, colorName, colorRange, stroke, strokeOpacity, visible } =
            this.properties;

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
            const legendDatum: _ModuleSupport.CategoryLegendDatum = {
                legendType: 'category',
                id: this.id,
                itemId: legendItemName ?? idKey,
                seriesId: this.id,
                enabled: visible,
                label: { text: legendItemName ?? idKey },
                marker: {
                    fill: stroke,
                    fillOpacity: strokeOpacity,
                    stroke: undefined,
                    strokeWidth: 0,
                    strokeOpacity: 0,
                },
                legendItemName,
            };
            return [legendDatum];
        } else {
            return [];
        }
    }

    override getTooltipHtml(nodeDatum: MapLineNodeDatum): string {
        const {
            id: seriesId,
            processedData,
            properties,
            ctx: { callbackCache },
        } = this;

        if (!processedData || !properties.isValid()) {
            return '';
        }

        const {
            legendItemName,
            idKey,
            idName,
            colorKey,
            colorName,
            sizeKey,
            sizeName,
            labelKey,
            labelName,
            formatter,
            tooltip,
        } = properties;
        const { datum, stroke, idValue, colorValue, sizeValue, labelValue } = nodeDatum;

        const title = sanitizeHtml(properties.title ?? legendItemName) ?? '';
        const contentLines: string[] = [];
        contentLines.push(sanitizeHtml((idName != null ? `${idName}: ` : '') + idValue));
        if (colorValue != null) {
            contentLines.push(sanitizeHtml((colorName ?? colorKey) + ': ' + colorValue));
        }
        if (sizeValue != null) {
            contentLines.push(sanitizeHtml((sizeName ?? sizeKey) + ': ' + sizeValue));
        }
        if (labelValue != null && labelKey !== idKey) {
            contentLines.push(sanitizeHtml((labelName ?? labelKey) + ': ' + labelValue));
        }
        const content = contentLines.join('<br>');

        let format: AgMapLineSeriesStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum,
                idKey,
                stroke,
                strokeWidth: this.getStrokeWidth(nodeDatum.strokeWidth ?? properties.strokeWidth),
                highlighted: false,
            });
        }

        const color = format?.stroke ?? stroke ?? properties.stroke;

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
