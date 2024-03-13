import type { ChartOptions } from '../module/optionsModule';
import type { AgTopologyChartOptions } from '../options/agChartOptions';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { Series } from './series/series';
import type { LonLatBBox } from './series/topology/lonLatBbox';
import { MercatorScale } from './series/topology/mercatorScale';
import type { TopologySeries } from './series/topologySeries';

function isTopologySeries(series: Series<any, any>): series is TopologySeries {
    return (
        series.type === 'map-shape' ||
        series.type === 'map-line' ||
        series.type === 'map-marker' ||
        series.type === 'map-shape-background'
    );
}

export class TopologyChart extends Chart {
    static readonly className = 'TopologyChart';
    static readonly type = 'topology' as const;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
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

    private firstSeriesTranslation = true;
    override async performLayout() {
        const shrinkRect = await super.performLayout();

        const {
            seriesArea: { padding },
            seriesRoot,
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
            const { width, height } = shrinkRect;
            scale = new MercatorScale(
                [
                    [lon0, lat0],
                    [lon1, lat1],
                ],
                [
                    [0, 0],
                    [width, height],
                ]
            );
        }

        mapSeries.forEach((series) => {
            series.scale = scale;
        });

        const seriesVisible = this.series.some((s) => s.visible);
        seriesRoot.visible = seriesVisible;
        if (this.firstSeriesTranslation) {
            seriesRoot.translationX = Math.floor(shrinkRect.x);
            seriesRoot.translationY = Math.floor(shrinkRect.y);
            seriesRoot.setClipRectInGroupCoordinateSpace(
                new BBox(shrinkRect.x, shrinkRect.y, shrinkRect.width, shrinkRect.height)
            );
            this.firstSeriesTranslation = false;
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
