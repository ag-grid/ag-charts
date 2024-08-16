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
        const { seriesRoot, annotationRoot, highlightRoot } = this;
        const { layoutBox } = ctx;
        const seriesRect = layoutBox.clone();

        layoutBox.shrink(this.seriesArea.padding.toJson());

        this.seriesRect = layoutBox;
        this.animationRect = layoutBox;

        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
        }

        seriesRoot.visible = this.series[0].visible;
        seriesRoot.setClipRectInGroupCoordinateSpace(layoutBox.clone());

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: true, rect: seriesRect, paddedRect: layoutBox },
        });
    }

    protected override getAriaLabel(): string {
        const captionText = this.getCaptionText();
        return `hierarchical chart, ${captionText}`;
    }
}
