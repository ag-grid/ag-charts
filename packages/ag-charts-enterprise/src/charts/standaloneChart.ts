import { _ModuleSupport } from 'ag-charts-community';

import { HierarchyDataSet } from './hierarchyDataSet';

const { Chart } = _ModuleSupport;

export class StandaloneChart extends Chart {
    static override readonly className = 'StandaloneChart';
    static readonly type = 'standalone' as const;

    override getChartType() {
        return 'standalone' as const;
    }

    protected override createDataSet(data: unknown[]): _ModuleSupport.DataSet {
        for (const series of this.series) {
            if ('childrenKey' in series.properties) {
                return new HierarchyDataSet(data, this.dataIdKey, (series.properties as any).childrenKey);
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
