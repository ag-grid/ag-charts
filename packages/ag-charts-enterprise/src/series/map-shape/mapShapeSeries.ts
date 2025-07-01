import { _ModuleSupport } from 'ag-charts-community';
import { Logger } from 'ag-charts-core';
import type { AgMapShapeSeriesLabelFormatterParams, AgMapShapeSeriesStyle } from 'ag-charts-types';

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
    CachedTextMeasurerPool,
    TextUtils,
    ColorScale,
    Group,
    Selection,
    Text,
    PointerEvents,
    applyShapeStyle,
    getShapeStyle,
} = _ModuleSupport;

interface MapShapeNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<MapShapeNodeDatum, MapShapeNodeLabelDatum> {}

type ItemStyle = Required<AgMapShapeSeriesStyle>;

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
    extends TopologySeries<MapShapeNodeDatum, MapShapeSeriesProperties, MapShapeNodeLabelDatum, MapShapeNodeDataContext>
    implements _ModuleSupport.ITopology
{
    static readonly className = 'MapShapeSeries';
    static readonly type = 'map-shape' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapShapeSeriesProperties();

    private _chartTopology?: _ModuleSupport.FeatureCollection = undefined;

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
        this.highlightGroup,
        () => this.nodeFactory()
    );

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

    override setSeriesIndex(index: number): boolean {
        if (!super.setSeriesIndex(index)) return false;

        this.contentGroup.zIndex = [MapZIndexMap.ShapeLine, index];
        this.highlightGroup.zIndex = [MapZIndexMap.ShapeLineHighlight, index];

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

        const featureById = new Map<string, _ModuleSupport.Feature>();
        topology?.features.forEach((feature) => {
            const property = feature.properties?.[topologyIdKey];
            if (property == null || !containsType(feature.geometry, GeometryType.Polygon)) return;
            featureById.set(property, feature);
        });

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
        measurer: _ModuleSupport.CachedTextMeasurer,
        geometry: _ModuleSupport.Geometry | undefined,
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

        const baseSize = measurer.measureText(String(labelText));
        const numLines = labelText.split('\n').length;
        const aspectRatio =
            (baseSize.width + 2 * padding) / (numLines * TextUtils.getLineHeight(label.fontSize) + 2 * padding);

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

    private getLabelDatum(labelLayout: LabelLayout, scaling: number): MapShapeNodeLabelDatum | undefined {
        const { scale } = this;
        if (scale == null) return;

        const { padding, label } = this.properties;
        const { labelText, aspectRatio, x: untruncatedX, y, maxWidth, fixedPolygon } = labelLayout;

        const maxSizeWithoutTruncation = {
            width: Math.ceil(maxWidth * scaling),
            height: Math.ceil((maxWidth * scaling) / aspectRatio),
            meta: untruncatedX,
        };
        const labelFormatting = formatSingleLabel<number>(labelText, label, { padding }, (height, allowTruncation) => {
            if (!allowTruncation) return maxSizeWithoutTruncation;

            const result = maxWidthInPolygonForRectOfHeight(fixedPolygon, untruncatedX, y, height / scaling);
            return {
                width: result.width * scaling,
                height,
                meta: result.x,
            };
        });
        if (labelFormatting == null) return;

        const [{ text, fontSize, lineHeight, width }, formattingX] = labelFormatting;
        // FIXME - formatSingleLabel should never return an ellipsis
        if (text === TextUtils.EllipsisChar) return;

        // Only shift horizontally if necessary
        const x = width < maxSizeWithoutTruncation.width ? untruncatedX : formattingX;

        const position = this.scale!.convert(fixedScale.invert([x, y]));

        return {
            x: position[0],
            y: position[1],
            text,
            fontSize,
            lineHeight,
        };
    }

    private previousLabelLayouts: Map<string, LabelLayout> | undefined = undefined;
    override createNodeData() {
        const { id: seriesId, dataModel, processedData, properties, scale, previousLabelLayouts } = this;
        const { idKey, colorKey, labelKey, label, legendItemName } = properties;

        if (dataModel == null || processedData == null) return;

        const scaling = scale != null ? (scale.range[1][0] - scale.range[0][0]) / scale.bounds.width : NaN;

        const idValues = dataModel.resolveColumnById<string>(this, `idValue`, processedData);
        const featureValues = dataModel.resolveColumnById<_ModuleSupport.Feature | undefined>(
            this,
            `featureValue`,
            processedData
        );
        const labelValues =
            labelKey != null ? dataModel.resolveColumnById<string>(this, `labelValue`, processedData) : undefined;
        const colorValues =
            colorKey != null ? dataModel.resolveColumnById<number>(this, `colorValue`, processedData) : undefined;

        const measurer = CachedTextMeasurerPool.getMeasurer({ font: label });

        const labelLayouts = new Map<string, LabelLayout>();
        this.previousLabelLayouts = labelLayouts;

        const nodeData: MapShapeNodeDatum[] = [];
        const labelData: MapShapeNodeLabelDatum[] = [];
        const missingGeometries: string[] = [];
        const rawData = processedData.dataSources.get(this.id) ?? [];
        rawData.forEach((datum, datumIndex) => {
            const idValue = idValues[datumIndex];
            const colorValue: number | undefined = colorValues?.[datumIndex];
            const labelValue: string | undefined = labelValues?.[datumIndex];

            const geometry = featureValues[datumIndex]?.geometry ?? undefined;
            if (geometry == null) {
                missingGeometries.push(idValue);
            }

            const labelLayout = this.getLabelLayout(
                datum,
                labelValue,
                measurer,
                geometry,
                previousLabelLayouts?.get(idValue)
            );
            if (labelLayout != null) {
                labelLayouts.set(idValue, labelLayout);
            }

            const labelDatum =
                labelLayout != null && scale != null ? this.getLabelDatum(labelLayout, scaling) : undefined;
            if (labelDatum != null) {
                labelData.push(labelDatum);
            }

            const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;

            nodeData.push({
                series: this,
                itemId: idKey,
                datum,
                datumIndex,
                idValue,
                colorValue,
                labelValue,
                projectedGeometry,
                legendItemName,
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
        const { datumSelection, labelSelection, highlightDatumSelection } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;

        let highlightedDatum: MapShapeNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
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
        const labelData = this.contextNodeData?.labelData ?? [];

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = this.updateLabelSelection({ labelData, labelSelection });
        this.updateLabelNodes({ labelSelection });

        this.highlightDatumSelection = this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    }

    private updateDatumSelection(opts: {
        nodeData: MapShapeNodeDatum[];
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.idValue));
    }

    private getItemBaseStyle(isHighlight: boolean, datum?: MapShapeNodeDatum): ItemStyle {
        const { properties } = this;
        const highlightStyle = this.getHighlightStyle(isHighlight, datum?.datumIndex);

        return getShapeStyle(
            {
                fill: highlightStyle?.fill ?? properties.fill,
                fillOpacity: highlightStyle?.fillOpacity ?? properties.fillOpacity,
                stroke: highlightStyle?.stroke ?? properties.stroke,
                strokeWidth: highlightStyle?.strokeWidth ?? this.getStrokeWidth(properties.strokeWidth),
                strokeOpacity: highlightStyle?.strokeOpacity ?? properties.strokeOpacity,
                lineDash: highlightStyle?.lineDash ?? properties.lineDash,
                lineDashOffset: highlightStyle?.lineDashOffset ?? properties.lineDashOffset,
                opacity: highlightStyle?.opacity ?? 1,
            },
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    protected getItemStyleOverrides(
        datumId: string,
        datum: any,
        colorValue: number | undefined,
        format: ItemStyle,
        highlighted: boolean
    ) {
        const { id: seriesId, properties, colorScale } = this;
        const { colorRange, itemStyler } = properties;

        let overrides: Partial<ItemStyle> | undefined;

        if (!highlighted && colorValue != null) {
            overrides ??= {};
            overrides.fill = this.isColorScaleValid()
                ? colorScale.convert(colorValue)
                : colorRange?.[0] ?? properties.fill;
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

        return getShapeStyle(
            overrides,
            this.properties.fillGradientDefaults,
            this.properties.fillPatternDefaults,
            this.properties.fillImageDefaults
        );
    }

    private updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight } = opts;

        const fillBBox = getTopologyShapeFillBBox(this.scale);

        datumSelection.each((geoGeometry, nodeDatum) => {
            const { datum, datumIndex, colorValue, projectedGeometry } = nodeDatum;
            if (projectedGeometry == null) {
                geoGeometry.visible = false;
                geoGeometry.projectedGeometry = undefined;
                return;
            }

            const style = this.getItemBaseStyle(isHighlight, nodeDatum);
            const overrides = this.getItemStyleOverrides(String(datumIndex), datum, colorValue, style, isHighlight);

            geoGeometry.visible = true;
            geoGeometry.projectedGeometry = projectedGeometry;

            applyShapeStyle(geoGeometry, style, overrides, fillBBox);
        });
    }

    private updateLabelSelection(opts: {
        labelData: MapShapeNodeLabelDatum[];
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, MapShapeNodeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    private updateLabelNodes(opts: {
        labelSelection: _ModuleSupport.Selection<_ModuleSupport.Text, MapShapeNodeLabelDatum>;
    }) {
        const { labelSelection } = opts;
        const { color: fill, fontStyle, fontWeight, fontFamily } = this.properties.label;

        labelSelection.each((label, { x, y, text, fontSize, lineHeight }, datumIndex) => {
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
            label.fillOpacity = this.getHighlightStyle(false, datumIndex).opacity ?? 1;
        });
    }

    resetAnimation() {
        // No animations
    }

    override pickNodeClosestDatum({ x, y }: _ModuleSupport.Point): _ModuleSupport.SeriesNodePickMatch | undefined {
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
        | { datum: _ModuleSupport.SeriesNodeDatum<unknown>; point: _ModuleSupport.Point | undefined }
        | undefined = undefined;
    datumMidPoint(datum: _ModuleSupport.SeriesNodeDatum<unknown>): _ModuleSupport.Point | undefined {
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
            marker: getShapeStyle(
                {
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

        const datum = processedData.dataSources.get(this.id)?.[datumIndex];
        const idValue = dataModel.resolveColumnById<string>(this, `idValue`, processedData)[datumIndex];
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
        if (colorValue != null) {
            const domain = dataModel.getDomain(this, `colorValue`, 'value', processedData);
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

        const format = this.getItemBaseStyle(false);
        Object.assign(format, this.getItemStyleOverrides(String(datumIndex), datumIndex, colorValue, format, false));

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
}
