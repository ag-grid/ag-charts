import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { geometryBbox, projectGeometry } from '../map-util/geometryUtil';
import { GEOJSON_OBJECT } from '../map-util/validation';
import { MapShapeAccessoryNodeDatum, MapShapeAccessorySeriesProperties } from './mapShapeAccessorySeriesProperties';

// import type { Feature, FeatureCollection, Geometry } from 'geojson';
type Feature = any;
type FeatureCollection = any;
type Geometry = any;

const { createDatumId, Series, SeriesNodePickMode, Validate } = _ModuleSupport;
const { Selection, Group, PointerEvents } = _Scene;
const { Logger } = _Util;

export interface MapShapeAccessoryNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<MapShapeAccessoryNodeDatum> {}

export class MapShapeAccessorySeries
    extends Series<
        MapShapeAccessoryNodeDatum,
        MapShapeAccessorySeriesProperties,
        MapShapeAccessoryNodeDatum,
        MapShapeAccessoryNodeDataContext
    >
    implements _ModuleSupport.TopologySeries
{
    static readonly className = 'MapShapeShapeSeries';
    static readonly type = 'map-shape-accessory' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapShapeAccessorySeriesProperties();

    @Validate(GEOJSON_OBJECT, { optional: true, property: 'topology' })
    private _chartTopology?: FeatureCollection = undefined;

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override setOptionsData() {
        // Ignore data
    }

    override setChartData() {
        // Ignore data
    }

    override get hasData() {
        return this.topology != null;
    }

    private itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));

    private datumSelection: _Scene.Selection<GeoGeometry, MapShapeAccessoryNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory(),
        false
    );

    private contextNodeData: MapShapeAccessoryNodeDataContext[] = [];

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
        });
    }

    setChartTopology(topology: any): void {
        this._chartTopology = topology;
        if (this.topology === topology) {
            this.nodeDataRefresh = true;
        }
    }

    private nodeFactory(): GeoGeometry {
        const geoGeometry = new GeoGeometry();
        geoGeometry.renderMode = GeoGeometryRenderMode.Polygons;
        geoGeometry.lineJoin = 'round';
        geoGeometry.pointerEvents = PointerEvents.None;
        return geoGeometry;
    }

    override async processData(): Promise<void> {
        const { topology } = this;

        let topologyBounds: _ModuleSupport.LonLatBBox | undefined;
        topology?.features.forEach((feature: Feature) => {
            const geometry: Geometry = feature.geometry;
            topologyBounds = geometryBbox(geometry, topologyBounds);
        });

        this.topologyBounds = topologyBounds;

        if (topology == null) {
            Logger.warnOnce(`no topology was provided for [MapShapeAccessorySeries]; nothing will be rendered.`);
        }
    }

    override async createNodeData(): Promise<MapShapeAccessoryNodeDataContext[]> {
        const { id: seriesId, topology, scale } = this;

        if (topology == null) return [];

        const nodeData: MapShapeAccessoryNodeDatum[] = [];
        const labelData: never[] = [];
        topology.features.forEach((feature: Feature, index: number) => {
            const geometry: Geometry = feature.geometry;
            const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;

            if (projectedGeometry == null) return;

            nodeData.push({
                series: this,
                itemId: index,
                datum: feature,
                index,
                projectedGeometry,
            });
        });

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
        const { datumSelection } = this;

        await this.updateSelections();

        this.contentGroup.opacity = this.getOpacity() * (this.visible ? 1 : 0.2);

        const { nodeData } = this.contextNodeData[0];

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });
    }

    private async updateDatumSelection(opts: {
        nodeData: MapShapeAccessoryNodeDatum[];
        datumSelection: _Scene.Selection<GeoGeometry, MapShapeAccessoryNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.index));
    }

    private async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<GeoGeometry, MapShapeAccessoryNodeDatum>;
        isHighlight: boolean;
    }) {
        const { properties } = this;
        const { datumSelection, isHighlight } = opts;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties;
        const highlightStyle = isHighlight ? properties.highlightStyle.item : undefined;
        const strokeWidth = this.getStrokeWidth(properties.strokeWidth);

        datumSelection.each((geoGeometry, datum) => {
            const { projectedGeometry } = datum;
            if (projectedGeometry == null) {
                geoGeometry.visible = false;
                geoGeometry.projectedGeometry = undefined;
                return;
            }

            geoGeometry.visible = true;
            geoGeometry.projectedGeometry = projectedGeometry;
            geoGeometry.fill = highlightStyle?.fill ?? fill;
            geoGeometry.fillOpacity = highlightStyle?.fillOpacity ?? fillOpacity;
            geoGeometry.stroke = highlightStyle?.stroke ?? stroke;
            geoGeometry.strokeWidth = highlightStyle?.strokeWidth ?? strokeWidth;
            geoGeometry.strokeOpacity = highlightStyle?.strokeOpacity ?? strokeOpacity;
            geoGeometry.lineDash = highlightStyle?.lineDash ?? lineDash;
            geoGeometry.lineDashOffset = highlightStyle?.lineDashOffset ?? lineDashOffset;
        });
    }

    resetAnimation() {
        this.datumSelection.cleanup();
    }

    override getLabelData(): _Util.PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData<T extends _ModuleSupport.ChartLegendType>(): _ModuleSupport.ChartLegendDatum<T>[] {
        return [];
    }

    override getTooltipHtml(): string {
        return '';
    }
}
