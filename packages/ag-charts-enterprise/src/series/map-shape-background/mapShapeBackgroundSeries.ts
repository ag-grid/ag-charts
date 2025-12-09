import { type AgMapShapeBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import type { FeatureCollection } from 'ag-charts-core';
import { Logger, LonLatBBox } from 'ag-charts-core';

import { GeoGeometry, GeoGeometryRenderMode } from '../map-util/geoGeometry';
import { geometryBbox, projectGeometry } from '../map-util/geometryUtil';
import { MapZIndexMap } from '../map-util/mapZIndexMap';
import { TopologySeries } from '../map-util/topologySeries';
import {
    type MapShapeBackgroundNodeDatum,
    MapShapeBackgroundSeriesProperties,
} from './mapShapeBackgroundSeriesProperties';

const { createDatumId, Selection, Group, PointerEvents } = _ModuleSupport;

interface MapShapeBackgroundNodeDataContext
    extends _ModuleSupport.DataModelSeriesNodeDataContext<MapShapeBackgroundNodeDatum> {}

export class MapShapeBackgroundSeries
    extends TopologySeries<
        MapShapeBackgroundNodeDatum,
        AgMapShapeBackgroundOptions,
        MapShapeBackgroundSeriesProperties,
        MapShapeBackgroundNodeDatum,
        MapShapeBackgroundNodeDataContext
    >
    implements _ModuleSupport.ITopology
{
    static override readonly className = 'MapShapeBackgroundSeries';
    static readonly type = 'map-shape-background' as const;

    scale: _ModuleSupport.MercatorScale | undefined;

    public topologyBounds: LonLatBBox | undefined;

    override properties = new MapShapeBackgroundSeriesProperties();

    private _chartTopology?: FeatureCollection = undefined;

    private get topology() {
        return this.properties.topology ?? this._chartTopology;
    }

    override get focusable() {
        return false;
    }

    override setOptionsData() {
        // Ignore data
    }

    override setChartData() {
        // Ignore data
    }

    public override getNodeData(): MapShapeBackgroundNodeDatum[] | undefined {
        return;
    }

    override get hasData() {
        return false;
    }

    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));

    private datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeBackgroundNodeDatum> = Selection.select(
        this.itemGroup,
        () => this.nodeFactory()
    );

    private contextNodeData?: MapShapeBackgroundNodeDataContext;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            categoryKey: undefined,
            pickModes: [],
        });

        this.itemGroup.pointerEvents = PointerEvents.None;
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

        this.contentGroup.zIndex = [MapZIndexMap.ShapeLineBackground, zIndex, 0];
        this.highlightGroup.zIndex = [MapZIndexMap.ShapeLineBackground, zIndex, 1];

        return true;
    }

    private nodeFactory(): GeoGeometry {
        const geoGeometry = new GeoGeometry();
        geoGeometry.renderMode = GeoGeometryRenderMode.Polygons;
        geoGeometry.lineJoin = 'round';
        geoGeometry.pointerEvents = PointerEvents.None;
        return geoGeometry;
    }

    override processData() {
        const { topology } = this;

        this.topologyBounds = topology?.features.reduce<LonLatBBox | undefined>((current, feature) => {
            const geometry = feature.geometry;
            if (geometry == null) return current;
            return geometryBbox(geometry, current);
        }, undefined);

        if (topology == null) {
            Logger.warnOnce(`no topology was provided for [MapShapeBackgroundSeries]; nothing will be rendered.`);
        }
    }

    override createNodeData() {
        const { id: seriesId, topology, scale, properties } = this;

        if (topology == null) return;

        const { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = properties;

        const nodeData: MapShapeBackgroundNodeDatum[] = [];
        const labelData: never[] = [];
        for (const [index, feature] of topology.features.entries()) {
            const { geometry } = feature;
            const projectedGeometry = geometry != null && scale != null ? projectGeometry(geometry, scale) : undefined;

            if (projectedGeometry == null) continue;

            nodeData.push({
                series: this,
                itemId: index,
                datum: feature,
                datumIndex: 0,
                index,
                projectedGeometry,
                style: { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset },
            });
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
        const { datumSelection } = this;

        this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.labelGroup.visible = this.visible;

        const { nodeData = [] } = this.contextNodeData ?? {};

        this.datumSelection = this.updateDatumSelection({ nodeData, datumSelection });
        this.updateDatumNodes({ datumSelection });
    }

    private updateDatumSelection(opts: {
        nodeData: MapShapeBackgroundNodeDatum[];
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeBackgroundNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, (datum) => createDatumId(datum.index));
    }

    private updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<GeoGeometry, MapShapeBackgroundNodeDatum>;
    }) {
        const { datumSelection } = opts;

        datumSelection.each((geoGeometry, datum) => {
            const { projectedGeometry } = datum;
            if (projectedGeometry == null) {
                geoGeometry.visible = false;
                geoGeometry.projectedGeometry = undefined;
                return;
            }
            geoGeometry.visible = true;
            geoGeometry.projectedGeometry = projectedGeometry;
            geoGeometry.setProperties(datum.style);
        });
    }

    resetAnimation() {
        // No animations
    }

    override getLegendData() {
        return [];
    }

    override getTooltipContent(_seriesDatum: any): _ModuleSupport.TooltipContent | undefined {
        return;
    }

    public override pickFocus() {
        return undefined;
    }

    protected override computeFocusBounds(_opts: _ModuleSupport.PickFocusInputs): _ModuleSupport.BBox | undefined {
        return undefined;
    }

    protected override hasItemStylers(): boolean {
        return false;
    }
}
