import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { LatLongBBox } from './series/topology/LatLongBBox';
import { MapSeries } from './series/topology/mapSeries';
import { MercatorScale } from './series/topology/mercatorScale';

export class TopologyChart extends Chart {
    static readonly className = 'TopologyChart';
    static readonly type = 'topology' as const;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
    }

    protected _data: any = {};

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

        const mapSeries = this.series.filter<MapSeries>((series): series is MapSeries => series instanceof MapSeries);

        const combinedBbox: LatLongBBox | undefined = mapSeries.reduce<LatLongBBox | undefined>((combined, series) => {
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
