import type { AxisID, BBox, CanvasPoint } from 'ag-charts-core';
import { ChartAxisDirection, PanToBBoxScalingModeEnum, createId } from 'ag-charts-core';
import type { AgCoordinates } from 'ag-charts-types';

import type { ChartOptions } from '../module/optionsModule';
import { Axis } from './axis/axis';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
import type { LayoutContext } from './layout/layoutManager';
import type { SeriesAreaLayout, UnknownSeries } from './series/series';

export class StandaloneChart extends Chart {
    static override readonly className = 'StandaloneChart';
    static readonly type = 'standalone' as const;

    private readonly xAxis = { id: createId<AxisID>(Axis), direction: ChartAxisDirection.X } as const;
    private readonly yAxis = { id: createId<AxisID>(Axis), direction: ChartAxisDirection.Y } as const;
    private standaloneZoomRegistered = false;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);

        if (this.ctx.zoomManager) {
            this.ctx.zoomManager.panToBBoxScalingMode =
                PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYProportionally;
        }
    }

    override toAgCoordinates(_point: CanvasPoint): AgCoordinates | undefined {
        return undefined; // TODO: stub
    }

    override getChartType() {
        return 'standalone' as const;
    }

    override updateData() {
        super.updateData();
        this.refreshStandaloneZoomRegistration();
    }

    // Lazy because `this.series` is empty at construction; the flag tracks state across
    // hot-swaps so axes register when an opt-in series joins and unregister when it leaves.
    private refreshStandaloneZoomRegistration() {
        const { zoomManager } = this.ctx;
        if (!zoomManager) return;

        const wantsZoom = this.series.some((s) => s.supportsStandaloneZoom);
        if (wantsZoom === this.standaloneZoomRegistered) return;

        zoomManager.setAxes(wantsZoom ? [this.xAxis, this.yAxis] : []);
        this.standaloneZoomRegistered = wantsZoom;
    }

    // A standalone series that opts into zoom moves its own viewport transform and requests its own re-render, so
    // the node data refresh and layout pass would be wasted work.
    protected override onZoomChangeComplete() {
        if (this.standaloneZoomRegistered) return;
        super.onZoomChangeComplete();
    }

    protected async performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot } = this;
        const seriesRect = ctx.layoutBox.clone().shrink(this.getSeriesAreaPadding());

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;

        const snap = this.series.every((s) => s.snapsSeriesAreaOrigin);
        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = snap ? Math.floor(seriesRect.x) : seriesRect.x;
            group.translationY = snap ? Math.floor(seriesRect.y) : seriesRect.y;
        }

        // Matches cartesian: clip panned content out of title/subtitle/footnote.
        const clipRect = this.series.some((s) => s.alwaysClip) ? ctx.layoutBox : undefined;
        seriesRoot.setClipRect(clipRect);
        annotationRoot.setClipRect(clipRect);

        seriesRoot.visible = this.series.some((s) => s.visible);

        await this.layoutSeriesGroups(seriesRect);

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: ctx.layoutBox },
            layoutBox: ctx.layoutBox,
        });
    }

    private async layoutSeriesGroups(seriesRect: BBox) {
        const groups = new Map<SeriesAreaLayout, UnknownSeries[]>();
        for (const series of this.series) {
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

    protected override getDefaultAriaLabel(): string {
        if (this.series.length === 0) return '';
        return this.ctx.localeManager.t('ariaAnnounceStandaloneChart', { caption: this.getCaptionText() });
    }
}
