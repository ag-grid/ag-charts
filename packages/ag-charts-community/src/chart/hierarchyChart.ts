import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';

export class HierarchyChart extends Chart {
    static className = 'HierarchyChart';
    static type = 'hierarchy' as const;

    constructor(options: ChartOptions, resources?: TransferableResources) {
        super(options, resources);
    }

    protected _data: any = {};

    override async performLayout() {
        const shrinkRect = await super.performLayout();

        const {
            seriesArea: { padding },
            seriesRoot,
        } = this;

        const fullSeriesRect = shrinkRect.clone();
        shrinkRect.shrink(padding.left, 'left');
        shrinkRect.shrink(padding.top, 'top');
        shrinkRect.shrink(padding.right, 'right');
        shrinkRect.shrink(padding.bottom, 'bottom');

        this.seriesRect = shrinkRect;
        this.animationRect = shrinkRect;
        this.hoverRect = shrinkRect;

        seriesRoot.translationX = Math.floor(shrinkRect.x);
        seriesRoot.translationY = Math.floor(shrinkRect.y);
        await Promise.all(
            this.series.map(async (series) => {
                await series.update({ seriesRect: shrinkRect }); // this has to happen after the `updateAxes` call
            })
        );

        seriesRoot.visible = this.series[0].visible;
        seriesRoot.setClipRectInGroupCoordinateSpace(
            new BBox(shrinkRect.x, shrinkRect.y, shrinkRect.width, shrinkRect.height)
        );

        this.layoutService.dispatchLayoutComplete({
            type: 'layout-complete',
            chart: { width: this.scene.width, height: this.scene.height },
            clipSeries: false,
            series: { rect: fullSeriesRect, paddedRect: shrinkRect, visible: true },
            axes: [],
        });

        return shrinkRect;
    }
}
