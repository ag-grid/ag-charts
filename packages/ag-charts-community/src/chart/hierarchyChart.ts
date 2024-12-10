import type { LayoutContext } from '../module/baseModule';
import type { ChartOptions } from '../module/optionsModule';
import type { TransferableResources } from './chart';
import { Chart } from './chart';

export class HierarchyChart extends Chart {
    static readonly className = 'HierarchyChart';
    static readonly type = 'hierarchy' as const;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
    }

    override getChartType() {
        return 'hierarchy' as const;
    }

    protected performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot } = this;
        const { layoutBox } = ctx;

        layoutBox.shrink(this.seriesArea.padding.toJson());
        const seriesRect = layoutBox.clone();

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;

        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(seriesRect.x);
            group.translationY = Math.floor(seriesRect.y);
        }

        seriesRoot.visible = this.series[0].visible;
        seriesRoot.setClipRect(seriesRect.clone());

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: seriesRect },
        });
    }

    protected override getAriaLabel(): string {
        const caption = this.getCaptionText();
        return this.ctx.localeManager.t('ariaAnnounceHierarchyChart', { caption });
    }
}
