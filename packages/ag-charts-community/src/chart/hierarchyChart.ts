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

    override async performLayout() {
        const shrinkRect = await super.performLayout();

        const {
            seriesArea: { padding },
            seriesRoot,
            annotationRoot,
            highlightRoot,
        } = this;

        const fullSeriesRect = shrinkRect.clone();
        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');

        this.seriesRect = shrinkRect;
        this.animationRect = shrinkRect;
        this.hoverRect = shrinkRect;

        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(shrinkRect.x);
            group.translationY = Math.floor(shrinkRect.y);
        }

        await Promise.all(
            this.series.map(async (series) => {
                await series.update({ seriesRect: shrinkRect }); // this has to happen after the `updateAxes` call
            })
        );

        seriesRoot.visible = this.series[0].visible;
        seriesRoot.setClipRectInGroupCoordinateSpace(
            new BBox(shrinkRect.x, shrinkRect.y, shrinkRect.width, shrinkRect.height)
        );

        this.ctx.layoutService.dispatchLayoutComplete({
            type: 'layout-complete',
            chart: { width: this.ctx.scene.width, height: this.ctx.scene.height },
            clipSeries: false,
            series: { rect: fullSeriesRect, paddedRect: shrinkRect, visible: true },
            axes: [],
        });

        return shrinkRect;
    }
}
