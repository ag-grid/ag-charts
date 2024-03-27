import type { ChartOptions } from '../module/optionsModule';
import type { AgTopologyChartOptions } from '../options/agChartOptions';
import { BBox } from '../scene/bbox';
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

    private xAxis: NumberAxis;
    private yAxis: NumberAxis;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);

        this.xAxis = new NumberAxis(this.getModuleContext());
        this.xAxis.position = 'bottom';
        this.yAxis = new NumberAxis(this.getModuleContext());
        this.yAxis.position = 'left';

        this.zoomManager.updateAxes([this.xAxis, this.yAxis]);
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

    override async performLayout() {
        const shrinkRect = await super.performLayout();

        const {
            seriesArea: { padding },
            seriesRoot,
            annotationRoot,
            highlightRoot,
        } = this;

        const fullSeriesRect = shrinkRect.clone();
        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');

        this.seriesRect = shrinkRect;
        this.animationRect = shrinkRect;
        this.hoverRect = shrinkRect;

        const mapSeries = this.series.filter<TopologySeries>(isTopologySeries);

        const combinedBbox: LonLatBBox | undefined = mapSeries.reduce<LonLatBBox | undefined>((combined, series) => {
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
            const { width, height } = shrinkRect;

            const viewBoxScale = Math.min(width / bounds.width, height / bounds.height);

            const viewBoxWidth = bounds.width * viewBoxScale;
            const viewBoxHeight = bounds.height * viewBoxScale;
            const viewBoxOriginX = (width - viewBoxWidth) / 2;
            const viewBoxOriginY = (height - viewBoxHeight) / 2;

            const x0 = viewBoxOriginX;
            const y0 = viewBoxOriginY;
            const x1 = viewBoxOriginX + viewBoxWidth;
            const y1 = viewBoxOriginY + viewBoxHeight;

            const xZoom = this.zoomManager.getAxisZoom(this.xAxis.id);
            const yZoom = this.zoomManager.getAxisZoom(this.yAxis.id);
            const xSpan = (x1 - x0) / (xZoom.max - xZoom.min);
            const xStart = x0 - xSpan * xZoom.min;
            const ySpan = (y1 - y0) / (yZoom.max - yZoom.min);
            const yStart = y0 - ySpan * yZoom.min;

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
        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(shrinkRect.x);
            group.translationY = Math.floor(shrinkRect.y);
            group.setClipRectInGroupCoordinateSpace(
                new BBox(shrinkRect.x, shrinkRect.y, shrinkRect.width, shrinkRect.height)
            );
        }

        this.layoutService.dispatchLayoutComplete({
            type: 'layout-complete',
            chart: { width: this.scene.width, height: this.scene.height },
            clipSeries: false,
            series: { rect: fullSeriesRect, paddedRect: shrinkRect, visible: seriesVisible },
            axes: [],
        });

        return shrinkRect;
    }
}
