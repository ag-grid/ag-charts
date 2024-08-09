import type { AgFlowProportionChartOptions } from 'ag-charts-types';

import { BBox } from '../scene/bbox';
import { Chart } from './chart';
import type { FlowProportionSeries } from './series/flowProportionSeries';
import type { Series } from './series/series';

function isFlowProportion(series: Series<any, any>): series is FlowProportionSeries {
    return series.type === 'sankey' || series.type === 'chord';
}
export class FlowProportionChart extends Chart {
    static readonly className = 'FlowProportionChart';
    static readonly type = 'flow-proportion' as const;

    override getChartType() {
        return 'flow-proportion' as const;
    }

    override async updateData() {
        await super.updateData();

        const { nodes } = this.getOptions() as AgFlowProportionChartOptions;

        this.series.forEach((series) => {
            if (isFlowProportion(series)) {
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

        const seriesVisible = this.series.some((s) => s.visible);
        seriesRoot.visible = seriesVisible;
        for (const group of [seriesRoot, annotationRoot, highlightRoot]) {
            group.translationX = Math.floor(shrinkRect.x);
            group.translationY = Math.floor(shrinkRect.y);
            group.setClipRectInGroupCoordinateSpace(
                new BBox(fullSeriesRect.x, fullSeriesRect.y, fullSeriesRect.width, fullSeriesRect.height)
            );
        }

        const { width, height } = this.ctx.scene;
        this.ctx.layoutService.setLayout(width, height, {
            series: { visible: seriesVisible, rect: fullSeriesRect, paddedRect: shrinkRect },
        });

        return shrinkRect;
    }
}
