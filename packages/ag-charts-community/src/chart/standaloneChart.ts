import type { AxisID, BBox } from 'ag-charts-core';
import { ChartAxisDirection, PanToBBoxScalingModeEnum, createId } from 'ag-charts-core';

import { Axis } from './axis/axis';
import type { ChartTypeHost, ChartTypeInstance } from './chartTypeInstance';
import type { LayoutContext } from './layout/layoutManager';
import type { SeriesAreaLayout, UnknownSeries } from './series/series';

export class StandaloneChartType implements ChartTypeInstance {
    static readonly type = 'standalone' as const;
    readonly type = StandaloneChartType.type;

    private readonly xAxis = { id: createId<AxisID>(Axis), direction: ChartAxisDirection.X } as const;
    private readonly yAxis = { id: createId<AxisID>(Axis), direction: ChartAxisDirection.Y } as const;
    private standaloneZoomRegistered = false;

    constructor(private readonly host: ChartTypeHost) {
        if (host.ctx.zoomManager) {
            host.ctx.zoomManager.panToBBoxScalingMode =
                PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYProportionally;
        }
    }

    // Lazy because the series are empty at construction; the flag tracks state across
    // hot-swaps so axes register when an opt-in series joins and unregister when it leaves.
    updateData() {
        const { zoomManager } = this.host.ctx;
        if (!zoomManager) return;

        const wantsZoom = this.host.series.some((s) => s.supportsStandaloneZoom);
        if (wantsZoom === this.standaloneZoomRegistered) return;

        zoomManager.setAxes(wantsZoom ? [this.xAxis, this.yAxis] : []);
        this.standaloneZoomRegistered = wantsZoom;
    }

    // A standalone series that opts into zoom moves its own viewport transform and requests its own re-render, so
    // the node data refresh and layout pass would be wasted work.
    shouldRelayoutOnZoomChange() {
        return !this.standaloneZoomRegistered;
    }

    async layout(ctx: LayoutContext) {
        const { host } = this;
        const { series } = host;
        const seriesRect = ctx.layoutBox.clone().shrink(host.getSeriesAreaPadding());

        host.setLayoutRects(seriesRect, seriesRect);

        // Matches cartesian: clip panned content out of title/subtitle/footnote.
        host.placeSeriesRoots(seriesRect, {
            snap: series.every((s) => s.snapsSeriesAreaOrigin),
            clipRect: series.some((s) => s.alwaysClip) ? ctx.layoutBox : undefined,
        });
        host.seriesRoot.visible = series.some((s) => s.visible);

        await this.layoutSeriesGroups(seriesRect);

        host.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: ctx.layoutBox },
            layoutBox: ctx.layoutBox,
        });
    }

    getDefaultAriaLabel(): string {
        if (this.host.series.length === 0) return '';
        return this.host.ctx.localeManager.t('ariaAnnounceStandaloneChart', { caption: this.host.getCaptionText() });
    }

    destroy() {
        // Nothing to release: the zoom axes are plain ids.
    }

    private async layoutSeriesGroups(seriesRect: BBox) {
        const groups = new Map<SeriesAreaLayout, UnknownSeries[]>();
        for (const series of this.host.series) {
            const { seriesAreaLayout } = series;
            if (seriesAreaLayout == null) continue;
            let group = groups.get(seriesAreaLayout);
            if (group == null) {
                group = [];
                groups.set(seriesAreaLayout, group);
            }
            group.push(series);
        }
        for (const [layout, series] of groups) {
            await layout(series, seriesRect);
        }
    }
}
