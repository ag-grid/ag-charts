import type { AgFlowProportionChartOptions } from 'ag-charts-types';

import type { LayoutContext } from '../module/baseModule';
import { Chart } from './chart';
import type { FlowProportionSeries } from './series/flowProportionSeries';
import type { Series } from './series/series';

function isFlowProportion(series: Series<unknown, any, any>): series is FlowProportionSeries {
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

    protected performLayout(ctx: LayoutContext) {
        const { seriesRoot, annotationRoot } = this;
        const { layoutBox } = ctx;

        layoutBox.shrink(this.seriesArea.padding.toJson());
        const seriesRect = layoutBox.clone();

        this.seriesRect = seriesRect;
        this.animationRect = seriesRect;
        seriesRoot.visible = this.series.some((s) => s.visible);

        for (const group of [seriesRoot, annotationRoot]) {
            group.translationX = Math.floor(seriesRect.x);
            group.translationY = Math.floor(seriesRect.y);
        }

        this.ctx.layoutManager.emitLayoutComplete(ctx, {
            series: { visible: seriesRoot.visible, rect: seriesRect, paddedRect: seriesRect },
        });
    }
}
