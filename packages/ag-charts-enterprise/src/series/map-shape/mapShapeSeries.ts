import {
    AgMapShapeSeriesFormatterParams,
    AgMapShapeSeriesLabelFormatterParams,
    AgMapShapeSeriesStyle,
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
} from 'ag-charts-community';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { GeometryType, containsType, geometryBbox, largestPolygon, projectGeometry } from '../map-util/geometryUtil';
import { polygonMarkerCenter } from '../map-util/markerUtil';
import { maxWidthInPolygonForRectOfHeight, preferredLabelCenter } from '../map-util/polygonLabelUtil';
import { GEOJSON_OBJECT } from '../map-util/validation';
import { AutoSizedLabel, formatSingleLabel } from '../util/labelFormatter';
import { MapShapeNodeDatum, MapShapeNodeLabelDatum, MapShapeSeriesProperties } from './mapShapeSeriesProperties';

const { getMissCount, createDatumId, DataModelSeries, SeriesNodePickMode, valueProperty, Validate } = _ModuleSupport;
const { ColorScale } = _Scale;
const { Group, Selection, Text } = _Scene;
const { sanitizeHtml, Logger } = _Util;

export interface MapShapeNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<MapShapeNodeDatum, MapShapeNodeLabelDatum> {}

const fixedScale = _ModuleSupport.MercatorScale.fixedScale();

interface LabelLayout {
    geometry: _ModuleSupport.Geometry;
    labelText: string;
    aspectRatio: number;
    x: number;
    y: number;
    maxWidth: number;
    fixedPolygon: _ModuleSupport.Position[][];
}
export class MapShapeSeries
    extends DataModelSeries<
        MapShapeNodeDatum,
        MapShapeSeriesProperties,
        MapShapeNodeLabelDatum,
        MapShapeNodeDataContext
    >
    implements _ModuleSupport.TopologySeries
{
    static readonly className = 'MapShapeSeries';
    static readonly type = 'map-shape' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapShapeSeriesProperties();

    @Validate(GEOJSON_OBJECT, { optional: true, property: 'topology' })
    private _chartTopology?: _ModuleSupport.FeatureCollection = undefined;

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override get hasData() {
        return super.hasData && this.topology != null;
    }

    private readonly colorScale = new ColorScale();

    private itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));

    private datumSelection: _Scene.Selection<GeoGeometry, MapShapeNodeDatum> = Selection.select(this.itemGroup, () =>
        this.nodeFactory()
    );
    private labelSelection: _Scene.Selection<_Scene.Text, MapShapeNodeLabelDatum> = Selection.select(
        this.labelGroup,
        Text
    );
    private highlightDatumSelection: _Scene.Selection<GeoGeometry, MapShapeNodeDatum> = Selection.select(
        this.highlightGroup,
        () => this.nodeFactory()
    );

    private contextNodeData: MapShapeNodeDataContext[] = [];

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
        geoGeometry.renderMode = GeoGeometryRenderMode.Polygons;
        geoGeometry.lineJoin = 'round';
        return geoGeometry;
    }

    override async processData(dataController: _ModuleSupport.DataController): Promise<void> {
        if (this.data == null || !this.properties.isValid()) {
            return;
        }

        const { data, topology, colorScale } = this;
        const { topologyIdKey, idKey, colorKey, labelKey, colorRange } = this.properties;

        const featureById = new Map<string, _ModuleSupport.Feature>();
        topology?.features.forEach((feature) => {
            const property = feature.properties?.[topologyIdKey];
            if (property == null || !containsType(feature.geometry, GeometryType.Polygon)) return;
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
                ...(labelKey ? [valueProperty(this, labelKey, false, { id: 'labelValue' })] : []),
                ...(colorKey ? [valueProperty(this, colorKey, true, { id: 'colorValue' })] : []),
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

        if (colorRange != null && this.isColorScaleValid()) {
            const colorKeyIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
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

        const colorIdx = dataModel.resolveProcessedDataIndexById(this, 'colorValue').index;
        const dataCount = processedData.data.length;
        const missCount = getMissCount(this, processedData.defs.values[colorIdx].missing);
        const colorDataMissing = dataCount === 0 || dataCount === missCount;
        return !colorDataMissing;
    }

    private getLabelLayout(
        datum: any,
        labelValue: string | undefined,
        font: string,
        geometry: _ModuleSupport.Geometry | undefined,
        previousLabelLayout: LabelLayout | undefined
    ): LabelLayout | undefined {
        if (labelValue == null || geometry == null) return;

        const { idKey, idName, colorKey, colorName, labelKey, labelName, padding, label } = this.properties;

        const labelText = this.getLabelText(label, {
            value: labelValue,
            datum,
            idKey,
            idName,
            colorKey,
            colorName,
            labelKey,
            labelName,
        });
        if (labelText == null) return;

        const baseSize = Text.getTextSize(String(labelText), font);
        const numLines = labelText.split('\n').length;
        const aspectRatio =
            (baseSize.width + 2 * padding) / (numLines * AutoSizedLabel.lineHeight(label.fontSize) + 2 * padding);

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
        scale: number,
        originX: number,
        originY: number
    ): MapShapeNodeLabelDatum | undefined {
        const { padding, label } = this.properties;
        const { labelText, aspectRatio, x: untruncatedX, y, maxWidth, fixedPolygon } = labelLayout;

        const maxSizeWithoutTruncation = {
            width: maxWidth * scale,
            height: (maxWidth * scale + 2 * padding) / aspectRatio - 2 * padding,
            meta: untruncatedX,
        };
        const labelFormatting = formatSingleLabel<number, AgMapShapeSeriesLabelFormatterParams>(
            labelText,
            label,
            { padding },
            (height, allowTruncation) => {
                if (!allowTruncation) return maxSizeWithoutTruncation;

                const result = maxWidthInPolygonForRectOfHeight(fixedPolygon, untruncatedX, y, height / scale);
                return {
                    width: result.width * scale,
                    height,
                    meta: result.x,
                };
            }
        );
        if (labelFormatting == null) return;

        const [{ text, fontSize, lineHeight }, x] = labelFormatting;

        // FIXME - formatSingleLabel should never return an ellipsis
        if (text === Text.ellipsis) return;

        return {
            x: x * scale - originX,
            y: y * scale - originY,
            text,
            fontSize,
            lineHeight,
        };
    }

    private previousLabelLayouts: Map<string, LabelLayout> | undefined = undefined;
    override async createNodeData(): Promise<MapShapeNodeDataContext[]> {
        const { id: seriesId, dataModel, processedData, colorScale, properties, scale, previousLabelLayouts } = this;
        const { idKey, colorKey, labelKey, label, fill: fillProperty } = properties;

        if (dataModel == null || processedData == null) return [];

        const colorScaleValid = this.isColorScaleValid();

        const idIdx = dataModel.resolveProcessedDataIndexById(this, `idValue`).index;
        const featureIdx = dataModel.resolveProcessedDataIndexById(this, `featureValue`).index;
        const labelIdx =
            labelKey != null ? dataModel.resolveProcessedDataIndexById(this, `labelValue`).index : undefined;
        const colorIdx =
            colorKey != null ? dataModel.resolveProcessedDataIndexById(this, `colorValue`).index : undefined;

        const font = label.getFont();

        const labelLayouts = new Map<string, LabelLayout>();
        this.previousLabelLayouts = labelLayouts;

        const nodeData: MapShapeNodeDatum[] = [];
        const labelData: MapShapeNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        processedData.data.forEach(({ datum, values }) => {
            const idValue = values[idIdx];
            const colorValue: number | undefined = colorIdx != null ? values[colorIdx] : undefined;
            const labelValue: string | undefined = labelIdx != null ? values[labelIdx] : undefined;

            const geometry = values[featureIdx]?.geometry;
            if (geometry == null) {
                missingGeometries.push(idValue);
            }

            const color: string | undefined =
                colorScaleValid && colorValue != null ? colorScale.convert(colorValue) : undefined;

            const labelLayout = this.getLabelLayout(
                datum,
                labelValue,
                font,
                geometry,
                previousLabelLayouts?.get(idValue)
            );
            if (labelLayout != null) {
                labelLayouts.set(idValue, labelLayout);
            }

            const labelDatum =
                labelLayout != null && scale != null
                    ? this.getLabelDatum(labelLayout, scale.scale / fixedScale.scale, scale.originX, scale.originY)
                    : undefined;
            if (labelDatum != null) {
                labelData.push(labelDatum);
            }

            const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;

            nodeData.push({
                series: this,
                itemId: idKey,
                datum,
                idValue,
                colorValue,
                labelValue,
                fill: color ?? fillProperty,
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

        let highlightedDatum: MapShapeNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData[0]?.nodeData ?? [];
        const labelData = this.contextNodeData[0]?.labelData ?? [];

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        await this.updateLabelNodes({ labelSelection });

        this.highlightDatumSelection = await this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    }

    private async updateDatumSelection(opts: {
        nodeData: MapShapeNodeDatum[];
        datumSelection: _Scene.Selection<GeoGeometry, MapShapeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    private async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<GeoGeometry, MapShapeNodeDatum>;
        isHighlight: boolean;
    }) {
        const {
            id: seriesId,
            properties,
            ctx: { callbackCache },
        } = this;
        const { datumSelection, isHighlight } = opts;
        const { idKey, colorKey, labelKey, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset, formatter } =
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

            let format: AgMapShapeSeriesStyle | undefined;
            if (formatter != null) {
                const params: _Util.RequireOptional<AgMapShapeSeriesFormatterParams> = {
                    seriesId,
                    datum: datum.datum,
                    itemId: datum.itemId,
                    idKey,
                    colorKey,
                    labelKey,
                    fill: datum.fill,
                    fillOpacity,
                    strokeOpacity,
                    stroke,
                    strokeWidth,
                    lineDash,
                    lineDashOffset,
                    highlighted: isHighlight,
                };
                format = callbackCache.call(formatter, params as AgMapShapeSeriesFormatterParams);
            }

            geoGeometry.visible = true;
            geoGeometry.projectedGeometry = projectedGeometry;
            geoGeometry.fill = highlightStyle?.fill ?? format?.fill ?? datum.fill;
            geoGeometry.fillOpacity = highlightStyle?.fillOpacity ?? format?.fillOpacity ?? fillOpacity;
            geoGeometry.stroke = highlightStyle?.stroke ?? format?.stroke ?? stroke;
            geoGeometry.strokeWidth = highlightStyle?.strokeWidth ?? format?.strokeWidth ?? strokeWidth;
            geoGeometry.strokeOpacity = highlightStyle?.strokeOpacity ?? format?.strokeOpacity ?? strokeOpacity;
            geoGeometry.lineDash = highlightStyle?.lineDash ?? format?.lineDash ?? lineDash;
            geoGeometry.lineDashOffset = highlightStyle?.lineDashOffset ?? format?.lineDashOffset ?? lineDashOffset;
        });
    }

    private async updateLabelSelection(opts: {
        labelData: MapShapeNodeLabelDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, MapShapeNodeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    private async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, MapShapeNodeLabelDatum> }) {
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontFamily } = this.properties.label;

        labelSelection.each((label, { x, y, text, fontSize, lineHeight }) => {
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
        return [];
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

        const projectedGeometry = (datum as MapShapeNodeDatum).projectedGeometry;
        const polygon = projectedGeometry != null ? largestPolygon(projectedGeometry) : undefined;
        const center = polygon != null ? polygonMarkerCenter(polygon, 2) : undefined;
        const point = center != null ? { x: center[0], y: center[1] } : undefined;

        this._previousDatumMidPoint = { datum, point };

        return point;
    }

    override getLegendData(
        legendType: _ModuleSupport.ChartLegendType
    ): _ModuleSupport.CategoryLegendDatum[] | _ModuleSupport.GradientLegendDatum[] {
        const { processedData, dataModel } = this;
        if (processedData == null || dataModel == null) return [];
        const {
            title,
            legendItemName,
            idKey,
            idName,
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            colorKey,
            colorName,
            colorRange,
            visible,
        } = this.properties;

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
                itemId: legendItemName ?? title ?? idName ?? idKey,
                seriesId: this.id,
                enabled: visible,
                label: { text: legendItemName ?? title ?? idName ?? idKey },
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

    override getTooltipHtml(nodeDatum: MapShapeNodeDatum): string {
        const {
            id: seriesId,
            processedData,
            ctx: { callbackCache },
            properties,
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
            labelKey,
            labelName,
            stroke,
            strokeWidth,
            formatter,
            tooltip,
        } = properties;
        const { datum, fill, idValue, colorValue, labelValue } = nodeDatum;

        const title = sanitizeHtml(properties.title ?? legendItemName) ?? '';
        const contentLines: string[] = [];
        contentLines.push(sanitizeHtml((idName != null ? `${idName}: ` : '') + idValue));
        if (colorValue != null) {
            contentLines.push(sanitizeHtml((colorName ?? colorKey) + ': ' + colorValue));
        }
        if (labelValue != null && labelKey !== idKey) {
            contentLines.push(sanitizeHtml((labelName ?? labelKey) + ': ' + labelValue));
        }
        const content = contentLines.join('<br>');

        let format: AgMapShapeSeriesStyle | undefined;

        if (formatter) {
            format = callbackCache.call(formatter, {
                seriesId,
                datum,
                idKey,
                fill,
                stroke,
                strokeWidth: this.getStrokeWidth(strokeWidth),
                highlighted: false,
            });
        }

        const color = format?.fill ?? fill;

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
