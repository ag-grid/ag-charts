import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { LatLongBBox } from './series/topology/LatLongBBox';
import { MapSeries } from './series/topology/mapSeries';
import { MercatorScale } from './series/topology/mercatorScale';

export class TopologyChart extends Chart {
    static className = 'TopologyChart';
    static type = 'topology' as const;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
    }

    protected _data: any = {};

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

        await Promise.all(mapSeries.map((series) => series.updateSelections()));

        const combinedBbox: LatLongBBox | undefined = mapSeries.reduce<LatLongBBox | undefined>((combined, series) => {
            const bbox = series.computeLatLngBox();
            if (bbox == null) return combined;
            if (combined == null) return bbox;
            combined.merge(bbox);
            return combined;
        }, undefined);

        let scale: MercatorScale | undefined;
        if (combinedBbox != null) {
            const { lon0, lat0, lon1, lat1 } = combinedBbox;
            const { x, y, width, height } = shrinkRect;
            scale = new MercatorScale(
                [
                    [lon0, lat0],
                    [lon1, lat1],
                ],
                [
                    [x, y],
                    [x + width, y + height],
                ]
            );
        }

        mapSeries.forEach((series) => {
            series.scale = scale;
        });

        await Promise.all(
            this.series.map(async (series) => {
                await series.update({ seriesRect: shrinkRect });
            })
        );

        const seriesVisible = this.series.some((s) => s.visible);
        seriesRoot.visible = seriesVisible;
        seriesRoot.setClipRectInGroupCoordinateSpace(
            new BBox(shrinkRect.x, shrinkRect.y, shrinkRect.width, shrinkRect.height)
        );

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
