import type { AgTopologyChartOptions } from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
import type { ChartOptions } from '../module/optionsModule';
import { NumberAxis } from './axis/numberAxis';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { Series } from './series/series';
import type { Position } from './series/topology/geojson';
import type { LonLatBBox } from './series/topology/lonLatBbox';
import { MercatorScale } from './series/topology/mercatorScale';
import type { TopologySeries } from './series/topologySeries';

function isTopologySeries(series: Series<any, any>): series is TopologySeries {
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

    private readonly xAxis: NumberAxis;
    private readonly yAxis: NumberAxis;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);

        this.xAxis = new NumberAxis(this.getModuleContext());
        this.xAxis.position = 'bottom';
        this.yAxis = new NumberAxis(this.getModuleContext());
        this.yAxis.position = 'left';

        this.ctx.zoomManager.updateAxes([this.xAxis, this.yAxis]);
    }

    override getChartType() {
        return 'topology' as const;
    }

    override async updateData() {
        await super.updateData();

        const { topology } = this.getOptions() as AgTopologyChartOptions;

        this.series.forEach((series) => {
            if (isTopologySeries(series)) {
                series.setChartTopology(topology);
            }
        });
    }

    protected performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot, labelRoot } = this;
        const { layoutBox } = ctx;
        const seriesRect = layoutBox.clone();

        layoutBox.shrink(this.seriesArea.padding.toJson());

        this.seriesRect = layoutBox;
        this.animationRect = layoutBox;

        const mapSeries = this.series.filter<TopologySeries>(isTopologySeries);
        const combinedBbox = mapSeries.reduce<LonLatBBox | undefined>((combined, series) => {
            if (!series.visible) return combined;
            const bbox = series.topologyBounds;
            if (bbox == null) return combined;
            if (combined == null) return bbox;
            combined.merge(bbox);
            return combined;
        }, undefined);

        let scale: MercatorScale | undefined;
        if (combinedBbox != null) {
            const { lon0, lat0, lon1, lat1 } = combinedBbox;
            const domain: Position[] = [
                [lon0, lat0],
                [lon1, lat1],
            ];
            const bounds = MercatorScale.bounds(domain);
            const { width, height } = layoutBox;

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

        mapSeries.forEach((series) => {
            series.scale = scale;
        });

        const seriesVisible = this.series.some((s) => s.visible);
        seriesRoot.visible = seriesVisible;
        for (const group of [seriesRoot, annotationRoot, labelRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
            group.setClipRect(layoutBox.clone());
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: seriesVisible, rect: seriesRect, paddedRect: layoutBox },
        });
    }
}
