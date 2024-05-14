import type { AgSankeyChartOptions } from '../options/agChartOptions';
import { BBox } from '../scene/bbox';
import { Chart } from './chart';
import type { Series } from './series/series';

interface SankeyLikeSeries extends Series<any, any> {
    setChartNodes(nodes: any): void;
}

function isSankeySeries(series: Series<any, any>): series is SankeyLikeSeries {
    return series.type === 'sankey';
}
export class SankeyChart extends Chart {
    static readonly className = 'SankeyChart';
    static readonly type = 'sankey' as const;

    override async updateData() {
        await super.updateData();

        const { nodes } = this.getOptions() as AgSankeyChartOptions;

        this.series.forEach((series) => {
            if (isSankeySeries(series)) {
                series.setChartNodes(nodes);
            }
        });
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

        const seriesVisible = this.series.some((s) => s.visible);
        seriesRoot.visible = seriesVisible;
        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(shrinkRect.x);
            group.translationY = Math.floor(shrinkRect.y);
            group.setClipRectInGroupCoordinateSpace(
                new BBox(shrinkRect.x, shrinkRect.y, shrinkRect.width, shrinkRect.height)
            );
        }

        this.ctx.layoutService.dispatchLayoutComplete({
            type: 'layout-complete',
            chart: { width: this.ctx.scene.width, height: this.ctx.scene.height },
            clipSeries: false,
            series: { rect: fullSeriesRect, paddedRect: shrinkRect, visible: seriesVisible },
            axes: [],
        });

        return shrinkRect;
    }
}
