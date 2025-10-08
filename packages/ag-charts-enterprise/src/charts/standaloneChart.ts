import { _ModuleSupport } from 'ag-charts-community';

import type { SeriesArea } from '../../../ag-charts-community/src/chart/series-area/seriesArea';

const { Chart } = _ModuleSupport;

export class StandaloneChart extends Chart {
    static readonly className = 'StandaloneChart';
    static readonly type = 'standalone' as const;

    override getChartType() {
        return 'standalone' as const;
    }

    protected performLayout(layoutBox: _ModuleSupport.BBox) {
        const { seriesRoot, annotationRoot } = this;
        const seriesArea = this.modulesManager.getModule('seriesArea') as SeriesArea;
        const seriesRect = layoutBox.clone().shrink(seriesArea.getPadding());

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;

        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(seriesRect.x);
            group.translationY = Math.floor(seriesRect.y);
        }

        seriesRoot.visible = this.series[0].visible;

        this.ctx.layoutManager.emitLayoutComplete(layoutBox, {
            series: { visible: true, rect: seriesRect, paddedRect: layoutBox },
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
