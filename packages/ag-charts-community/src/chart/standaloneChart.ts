import type { AxisID, BBox } from 'ag-charts-core';
import { ChartAxisDirection, PanToBBoxScalingModeEnum, createId } from 'ag-charts-core';

import type { ChartTypeHost, ChartTypeInstance } from './chartTypeEnv';
import type { LayoutContext } from './layout/layoutManager';

export class StandaloneChartType implements ChartTypeInstance {
    static readonly className = 'StandaloneChartType';
    static readonly type = 'standalone' as const;
    readonly type = StandaloneChartType.type;

    private readonly xAxis = { id: createId<AxisID>(this), direction: ChartAxisDirection.X } as const;
    private readonly yAxis = { id: createId<AxisID>(this), direction: ChartAxisDirection.Y } as const;
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

    private async layoutSeriesGroups(seriesRect: BBox) {
        const layouts = new Set(this.host.series.map((series) => series.seriesAreaLayout));
        for (const layout of layouts) {
            if (layout == null) continue;
            await layout.layoutSeries(
                this.host.series.filter((series) => series.seriesAreaLayout === layout),
                seriesRect
            );
        }
    }
}
