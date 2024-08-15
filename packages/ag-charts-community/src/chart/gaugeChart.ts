import type { LayoutContext } from '../module/baseModule';
import { BBox } from '../scene/bbox';
import { Chart } from './chart';

export class GaugeChart extends Chart {
    static readonly className = 'GaugeChart';
    static readonly type = 'gauge' as const;

    override getChartType() {
        return 'gauge' as const;
    }

    override async performLayout(ctx: LayoutContext) {
        const { layoutBox } = ctx;
        const seriesVisible = this.series.some((s) => s.visible);
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

        seriesRoot.visible = seriesVisible;
        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(layoutBox.x);
            group.translationY = Math.floor(layoutBox.y);
            group.setClipRectInGroupCoordinateSpace(
                new BBox(fullSeriesRect.x, fullSeriesRect.y, fullSeriesRect.width, fullSeriesRect.height)
            );
        }

        this.ctx.layoutService.emitLayoutComplete(ctx, {
            series: { visible: seriesVisible, rect: fullSeriesRect, paddedRect: layoutBox },
        });
    }
}
