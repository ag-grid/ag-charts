import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { geometryBbox, projectGeometry } from '../map-util/geometryUtil';
import { GEOJSON_OBJECT } from '../map-util/validation';
import {
    type MapShapeBackgroundNodeDatum,
    MapShapeBackgroundSeriesProperties,
} from './mapShapeBackgroundSeriesProperties';

const { createDatumId, Series, SeriesNodePickMode, Validate } = _ModuleSupport;
const { Selection, Group, PointerEvents } = _Scene;
const { Logger } = _Util;

export interface MapShapeBackgroundNodeDataContext
    extends _ModuleSupport.SeriesNodeDataContext<MapShapeBackgroundNodeDatum> {}

export class MapShapeBackgroundSeries
    extends Series<
        MapShapeBackgroundNodeDatum,
        MapShapeBackgroundSeriesProperties,
        MapShapeBackgroundNodeDatum,
        MapShapeBackgroundNodeDataContext
    >
    implements _ModuleSupport.TopologySeries
{
    static readonly className = 'MapShapeBackgroundSeries';
    static readonly type = 'map-shape-background' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: _ModuleSupport.LonLatBBox | undefined;

    override properties = new MapShapeBackgroundSeriesProperties();

    @Validate(GEOJSON_OBJECT, { optional: true, property: 'topology' })
    private _chartTopology?: _ModuleSupport.FeatureCollection = undefined;

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
        return false;
    }

    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));

    private datumSelection: _Scene.Selection<GeoGeometry, MapShapeBackgroundNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory()
    );

    private contextNodeData?: MapShapeBackgroundNodeDataContext;

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

        this.topologyBounds = topology?.features.reduce<_ModuleSupport.LonLatBBox | undefined>((current, feature) => {
            const geometry = feature.geometry;
            if (geometry == null) return current;
            return geometryBbox(geometry, current);
        }, undefined);

        if (topology == null) {
            Logger.warnOnce(`no topology was provided for [MapShapeBackgroundSeries]; nothing will be rendered.`);
        }
    }

    override async createNodeData() {
        const { id: seriesId, topology, scale } = this;

        if (topology == null) return;

        const nodeData: MapShapeBackgroundNodeDatum[] = [];
        const labelData: never[] = [];
        topology.features.forEach((feature, index) => {
            const { geometry } = feature;
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

        return {
            itemId: seriesId,
            nodeData,
            labelData,
        };
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

        this.contentGroup.visible = this.visible;

        const { nodeData = [] } = this.contextNodeData ?? {};

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection });
    }

    private async updateDatumSelection(opts: {
        nodeData: MapShapeBackgroundNodeDatum[];
        datumSelection: _Scene.Selection<GeoGeometry, MapShapeBackgroundNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.index));
    }

    private async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<GeoGeometry, MapShapeBackgroundNodeDatum>;
    }) {
        const { properties } = this;
        const { datumSelection } = opts;
        const { fill, fillOpacity, stroke, strokeOpacity, lineDash, lineDashOffset } = properties;
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
            geoGeometry.fill = fill;
            geoGeometry.fillOpacity = fillOpacity;
            geoGeometry.stroke = stroke;
            geoGeometry.strokeWidth = strokeWidth;
            geoGeometry.strokeOpacity = strokeOpacity;
            geoGeometry.lineDash = lineDash;
            geoGeometry.lineDashOffset = lineDashOffset;
        });
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

    override getLegendData() {
        return [];
    }

    override getTooltipHtml(): _ModuleSupport.TooltipContent {
        return _ModuleSupport.EMPTY_TOOLTIP_CONTENT;
    }

    public override pickFocus(_opts: _ModuleSupport.PickFocusInputs) {
        return undefined;
    }
}
