import type { LayoutContext } from '../module/baseModule';
import { Chart } from './chart';

export class HierarchyChart extends Chart {
    static readonly className = 'HierarchyChart';
    static readonly type = 'hierarchy' as const;

    override getChartType() {
        return 'hierarchy' as const;
    }

    protected performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot } = this;
        const { layoutBox } = ctx;
        const seriesRect = layoutBox.clone();

        layoutBox.shrink(this.seriesArea.padding.toJson());

        this.seriesRect = layoutBox;
        this.animationRect = layoutBox;

        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
        }

        seriesRoot.visible = this.series[0].visible;
        seriesRoot.setClipRect(layoutBox.clone());

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: layoutBox },
        });
    }

    protected override getAriaLabel(): string {
        const caption = this.getCaptionText();
        return this.ctx.localeManager.t('ariaAnnounceHierarchyChart', { caption });
    }
}
