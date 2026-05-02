import { _ModuleSupport } from 'ag-charts-community';
import type { AxisID } from 'ag-charts-core';
import { ChartAxisDirection, createId } from 'ag-charts-core';

import { HierarchyDataSet } from './hierarchyDataSet';

const { Chart } = _ModuleSupport;

export class StandaloneChart extends Chart {
    static override readonly className = 'StandaloneChart';
    static readonly type = 'standalone' as const;

    private readonly xAxis = { id: createId<AxisID>(_ModuleSupport.Axis), direction: ChartAxisDirection.X } as const;
    private readonly yAxis = { id: createId<AxisID>(_ModuleSupport.Axis), direction: ChartAxisDirection.Y } as const;
    private standaloneZoomRegistered = false;

    override getChartType() {
        return 'standalone' as const;
    }

    override updateData() {
        super.updateData();
        this.refreshStandaloneZoomRegistration();
    }

    // Lazy: `this.series` is empty at construction. Series opt in via `supportsStandaloneZoom`
    // (instance flag, mirror of `alwaysClip`). Tracks state across hot-swaps so axes register
    // when an opt-in series joins and unregister when the last one leaves.
    private refreshStandaloneZoomRegistration() {
        const { zoomManager } = this.ctx;
        if (!zoomManager) return;

        const wantsZoom = this.series.some((s) => s.supportsStandaloneZoom);
        if (wantsZoom === this.standaloneZoomRegistered) return;

        zoomManager.setAxes(wantsZoom ? [this.xAxis, this.yAxis] : []);
        if (wantsZoom) {
            zoomManager.panToBBoxScalingMode =
                _ModuleSupport.PanToBBoxScalingModeEnum.WhenViewportTooSmallScaleXYProportionally;
        }
        this.standaloneZoomRegistered = wantsZoom;
    }

    protected override createDataSet(data: unknown[]): _ModuleSupport.DataSet {
        for (const series of this.series) {
            if ('childrenKey' in series.properties) {
                const ds = new HierarchyDataSet(data, this.dataIdKey, series.properties.childrenKey);
                if (this.data) ds.transferFrom(this.data);
                return ds;
            }
        }
        return super.createDataSet(data);
    }

    protected performLayout(ctx: _ModuleSupport.LayoutContext) {
        const { seriesRoot, annotationRoot } = this;
        const seriesRect = ctx.layoutBox.clone().shrink(this.seriesArea.getPadding());

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;

        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(seriesRect.x);
            group.translationY = Math.floor(seriesRect.y);
        }

        // Match cartesian: any `alwaysClip` series clips to layoutBox so panned content
        // doesn't bleed into title/subtitle/footnote.
        const clipRect = this.series.some((s) => s.alwaysClip) ? ctx.layoutBox : undefined;
        seriesRoot.setClipRect(clipRect);
        annotationRoot.setClipRect(clipRect);

        seriesRoot.visible = this.series[0].visible;

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: ctx.layoutBox },
            layoutBox: ctx.layoutBox,
        });
    }

    protected override getAriaLabel(): string {
        const seriesType = this.series[0]?.type;
        if (seriesType == null) return '';

        const caption = this.getCaptionText();

        switch (seriesType) {
            case 'radial-gauge':
            case 'linear-gauge': {
                const captions: string[] = [];
                if (caption.length !== 0) {
                    captions.push(caption);
                }

                for (const series of this.series) {
                    captions.push((series as _ModuleSupport.GaugeSeries).getCaptionText());
                }

                return this.ctx.localeManager.t('ariaAnnounceGaugeChart', { caption: captions.join('. ') });
            }
            case 'treemap':
            case 'sunburst':
                return this.ctx.localeManager.t('ariaAnnounceHierarchyChart', { caption });
            default: {
                return this.ctx.localeManager.t('ariaAnnounceStandaloneChart', { caption });
            }
        }
    }
}
