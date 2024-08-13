import type { AgFlowProportionChartOptions } from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
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

    override async performLayout({ layoutBox }: LayoutContext) {
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

        const { width, height } = this.ctx.scene;
        this.ctx.layoutService.emitLayoutComplete(width, height, {
            series: { visible: seriesVisible, rect: fullSeriesRect, paddedRect: layoutBox },
        });
    }
}
