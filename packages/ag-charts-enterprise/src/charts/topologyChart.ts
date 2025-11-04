import { _ModuleSupport } from 'ag-charts-community';
import { type AxisID, createId } from 'ag-charts-core';
import type { AgTopologyChartOptions } from 'ag-charts-types';

const { Chart, MercatorScale, ChartAxisDirection, Property } = _ModuleSupport;

function isTopologySeries(
    series: _ModuleSupport.Series<_ModuleSupport.DatumIndexType, any, object, any>
): series is _ModuleSupport.ITopology {
    return (
        series.type === 'map-shape' ||
        series.type === 'map-line' ||
        series.type === 'map-marker' ||
        series.type === 'map-shape-background' ||
        series.type === 'map-line-background'
    );
}

export class TopologyChart extends Chart {
    static readonly className = 'TopologyChart';
    static readonly type = 'topology' as const;
    private readonly xAxis = { id: createId<AxisID>(_ModuleSupport.Axis), direction: ChartAxisDirection.X } as const;
    private readonly yAxis = { id: createId<AxisID>(_ModuleSupport.Axis), direction: ChartAxisDirection.Y } as const;

    @Property
    topology?: _ModuleSupport.FeatureCollection;

    constructor(options: _ModuleSupport.ChartOptions, resources?: _ModuleSupport.TransferableResources) {
        super(options, resources);

        this.ctx.zoomManager.setAxes([this.xAxis, this.yAxis]);
    }

    override getChartType() {
        return 'topology' as const;
    }

    override updateData() {
        super.updateData();

        const options = this.getOptions() as AgTopologyChartOptions;
        if (this.topology !== options.topology) {
            this.topology = options.topology;
        }

        const { topology } = this;
        for (const series of this.series) {
            if (isTopologySeries(series)) {
                series.setChartTopology(topology);
            }
        }
    }

    protected performLayout(ctx: _ModuleSupport.LayoutContext) {
        const { seriesRoot, annotationRoot } = this;

        const seriesAreaModule: any = this.modulesManager.getModule('seriesArea');
        const seriesRect = ctx.layoutBox.clone().shrink(seriesAreaModule.getPadding());

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;

        const mapSeries = this.series as _ModuleSupport.ITopology[];
        const combinedBbox = mapSeries.reduce<_ModuleSupport.LonLatBBox | undefined>((combined, series) => {
            if (!series.visible) return combined;
            const bbox = series.topologyBounds;
            if (bbox == null) return combined;
            if (combined == null) return bbox;
            return combined.merge(bbox);
        }, undefined);

        let scale: _ModuleSupport.MercatorScale | undefined;
        if (combinedBbox != null) {
            const { lon0, lat0, lon1, lat1 } = combinedBbox;
            const domain: _ModuleSupport.Position[] = [
                [lon0, lat0],
                [lon1, lat1],
            ];
            const bounds = MercatorScale.bounds(domain);
            const { width, height } = seriesRect;

            const viewBoxScale = Math.min(width / bounds.width, height / bounds.height);

            const viewBoxWidth = bounds.width * viewBoxScale;
            const viewBoxHeight = bounds.height * viewBoxScale;
            const viewBoxOriginX = (width - viewBoxWidth) / 2;
            const viewBoxOriginY = (height - viewBoxHeight) / 2;

            const x0 = viewBoxOriginX;
            const y0 = viewBoxOriginY;
            const x1 = viewBoxOriginX + viewBoxWidth;
            const y1 = viewBoxOriginY + viewBoxHeight;

            const xZoom = this.ctx.zoomManager.getAxisZoom(this.xAxis.id);
            const yZoom = this.ctx.zoomManager.getAxisZoom(this.yAxis.id);
            const xSpan = (x1 - x0) / (xZoom.max - xZoom.min);
            const xStart = x0 - xSpan * xZoom.min;
            const ySpan = (y1 - y0) / (1 - yZoom.min - (1 - yZoom.max));
            const yStart = y0 - ySpan * (1 - yZoom.max);

            scale = new MercatorScale(domain, [
                [xStart, yStart],
                [xStart + xSpan, yStart + ySpan],
            ]);
        }

        for (const series of mapSeries) {
            series.scale = scale;
        }

        const seriesVisible = this.series.some((s) => s.visible);
        seriesRoot.visible = seriesVisible;
        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(seriesRect.x);
            group.translationY = Math.floor(seriesRect.y);
            group.setClipRect(seriesRect.clone());
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: seriesVisible, rect: seriesRect, paddedRect: ctx.layoutBox },
        });
    }
}
