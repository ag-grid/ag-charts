import { _ModuleSupport } from 'ag-charts-community';

const { Chart } = _ModuleSupport;

export class GaugeChart extends Chart {
    static readonly className = 'GaugeChart';
    static readonly type = 'gauge' as const;

    override getChartType() {
        return 'gauge' as const;
    }

    protected performLayout(ctx: _ModuleSupport.LayoutContext) {
        const { seriesRoot, annotationRoot, series, seriesArea } = this;
        const { layoutBox } = ctx;
        const seriesRect = layoutBox.clone();

        layoutBox.shrink(seriesArea.padding.toJson());

        this.seriesRect = seriesRect.clone().translate(seriesRect.x - layoutBox.x, seriesRect.y - layoutBox.y);
        this.animationRect = layoutBox;
        seriesRoot.visible = series.some((s) => s.visible);

        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: seriesRoot.visible, rect: seriesRect, paddedRect: layoutBox },
        });
    }

    protected override getAriaLabel(): string {
        const captions: string[] = [];

        const chartCaption = this.getCaptionText();
        if (chartCaption.length !== 0) {
            captions.push(chartCaption);
        }

        for (const series of this.series) {
            captions.push((series as _ModuleSupport.GaugeSeries).getCaptionText());
        }

        const caption = captions.join('. ');

        return this.ctx.localeManager.t('ariaAnnounceGaugeChart', { caption });
    }
}
