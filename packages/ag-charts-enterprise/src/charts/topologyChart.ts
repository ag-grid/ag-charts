import { _ModuleSupport } from 'ag-charts-community';
import type { AxisID, BoxBounds, FeatureCollection, Position } from 'ag-charts-core';
import { ChartAxisDirection, PanToBBoxScalingModeEnum, createId } from 'ag-charts-core';

import type { LonLatBBox } from '../series/map-util/lonLatBbox';
import { MercatorScale } from '../series/map-util/mercatorScale';
import type { ITopology } from '../series/map-util/topologyTypes';

function isTopologySeries(series: _ModuleSupport.UnknownSeries): series is _ModuleSupport.UnknownSeries & ITopology {
    return (
        series.type === 'map-shape' ||
        series.type === 'map-line' ||
        series.type === 'map-marker' ||
        series.type === 'map-shape-background' ||
        series.type === 'map-line-background'
    );
}

export class TopologyChartType implements _ModuleSupport.ChartTypeInstance {
    static readonly type = 'topology' as const;
    readonly type = TopologyChartType.type;
    readonly pageNavigation = false;

    private readonly xAxis = { id: createId<AxisID>(_ModuleSupport.Axis), direction: ChartAxisDirection.X } as const;
    private readonly yAxis = { id: createId<AxisID>(_ModuleSupport.Axis), direction: ChartAxisDirection.Y } as const;

    topology?: FeatureCollection;

    constructor(private readonly host: _ModuleSupport.ChartTypeHost) {
        if (host.ctx.zoomManager) {
            host.ctx.zoomManager.setAxes([this.xAxis, this.yAxis]);
            host.ctx.zoomManager.panToBBoxScalingMode =
                PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYProportionally;
        }
    }

    updateData() {
        const options = this.host.getOptions();
        const topology = 'topology' in options ? options.topology : undefined;
        if (this.topology !== topology) {
            this.topology = topology;
        }

        for (const series of this.host.series) {
            if (isTopologySeries(series)) {
                series.setChartTopology(topology);
            }
        }
    }

    destroy() {
        // Nothing to release: the zoom axes are plain ids.
    }

    layout(ctx: _ModuleSupport.LayoutContext) {
        const { host } = this;

        const seriesRect = ctx.layoutBox.clone().shrink(host.getSeriesAreaPadding());

        host.setLayoutRects(seriesRect, seriesRect);

        const mapSeries = host.series.filter(isTopologySeries);
        const combinedBbox = mapSeries.reduce<LonLatBBox | undefined>((combined, series) => {
            if (!series.visible) return combined;
            const bbox = series.topologyBounds;
            if (bbox == null) return combined;
            if (combined == null) return bbox;
            return combined.merge(bbox);
        }, undefined);

        let scale: MercatorScale | undefined;
        let zoomRect: BoxBounds | undefined;
        if (combinedBbox != null) {
            const { lon0, lat0, lon1, lat1 } = combinedBbox;
            const domain: Position[] = [
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

            const zoom = host.ctx.chartState.getValue('zoom');
            const xZoom = zoom?.x ?? { min: 0, max: 1 };
            const yZoom = zoom?.y ?? { min: 0, max: 1 };
            const xSpan = (x1 - x0) / (xZoom.max - xZoom.min);
            const xStart = x0 - xSpan * xZoom.min;
            const ySpan = (y1 - y0) / (1 - yZoom.min - (1 - yZoom.max));
            const yStart = y0 - ySpan * (1 - yZoom.max);

            scale = new MercatorScale(domain, [
                [xStart, yStart],
                [xStart + xSpan, yStart + ySpan],
            ]);

            // The zoom ratios span the letterboxed view box, not the whole series rect.
            zoomRect = { x: seriesRect.x + x0, y: seriesRect.y + y0, width: x1 - x0, height: y1 - y0 };
        }

        if (this.ctx.zoomManager) {
            this.ctx.zoomManager.panToBBoxZoomRect = zoomRect;
        }

        for (const series of mapSeries) {
            series.scale = scale;
        }

        const seriesVisible = host.series.some((s) => s.visible);
        host.seriesRoot.visible = seriesVisible;
        host.placeSeriesRoots(seriesRect, { snap: true, clipRect: seriesRect.clone() });

        host.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: seriesVisible, rect: seriesRect, paddedRect: ctx.layoutBox },
            layoutBox: ctx.layoutBox,
        });
    }
}
