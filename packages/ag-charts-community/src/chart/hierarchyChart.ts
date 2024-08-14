import type { LayoutContext } from '../module/baseModule';
import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
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

    override async performLayout(ctx: LayoutContext) {
        const { layoutBox } = ctx;
        const fullSeriesRect = layoutBox.clone();
        const {
            seriesArea: { padding },
            seriesRoot,
            annotationRoot,
            highlightRoot,
        } = this;

        layoutBox.shrink(padding.left, 'left');
        layoutBox.shrink(padding.top, 'top');
        layoutBox.shrink(padding.right, 'right');
        layoutBox.shrink(padding.bottom, 'bottom');

        this.seriesRect = layoutBox;
        this.animationRect = layoutBox;

        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
        }

        // this has to happen after the `updateAxes` call
        await Promise.all(this.series.map((series) => series.update({ seriesRect: layoutBox })));

        seriesRoot.visible = this.series[0].visible;
        seriesRoot.setClipRectInGroupCoordinateSpace(
            new BBox(layoutBox.x, layoutBox.y, layoutBox.width, layoutBox.height)
        );

        this.ctx.layoutService.emitLayoutComplete(ctx, {
            series: { visible: true, rect: fullSeriesRect, paddedRect: layoutBox },
        });
    }

    protected override getAriaLabel(): string {
        const captionText = this.getCaptionText();
        return `hierarchical chart, ${captionText}`;
    }
}
