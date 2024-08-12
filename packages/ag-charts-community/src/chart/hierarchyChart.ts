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

    override async performLayout({ layoutRect }: LayoutContext) {
        const fullSeriesRect = layoutRect.clone();
        const {
            seriesArea: { padding },
            seriesRoot,
            annotationRoot,
            highlightRoot,
        } = this;

        layoutRect.shrink(padding.left, 'left');
        layoutRect.shrink(padding.top, 'top');
        layoutRect.shrink(padding.right, 'right');
        layoutRect.shrink(padding.bottom, 'bottom');

        this.seriesRect = layoutRect;
        this.animationRect = layoutRect;

        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(layoutRect.x);
            group.translationY = Math.floor(layoutRect.y);
        }

        // this has to happen after the `updateAxes` call
        await Promise.all(this.series.map((series) => series.update({ seriesRect: layoutRect })));

        seriesRoot.visible = this.series[0].visible;
        seriesRoot.setClipRectInGroupCoordinateSpace(
            new BBox(layoutRect.x, layoutRect.y, layoutRect.width, layoutRect.height)
        );

        const { width, height } = this.ctx.scene;
        this.ctx.layoutService.emitLayoutComplete(width, height, {
            series: { visible: true, rect: fullSeriesRect, paddedRect: layoutRect },
        });
    }

    protected override getAriaLabel(): string {
        const captionText = this.getCaptionText();
        return `hierarchical chart, ${captionText}`;
    }
}
