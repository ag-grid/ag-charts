import { _ModuleSupport } from 'ag-charts-community';
import type { AgFlowProportionChartOptions } from 'ag-charts-types';

const { Chart, Property } = _ModuleSupport;

function isFlowProportion(
    series: _ModuleSupport.Series<unknown, any, any>
): series is _ModuleSupport.FlowProportionSeries {
    return series.type === 'sankey' || series.type === 'chord';
}

export class FlowProportionChart extends Chart {
    static readonly className = 'FlowProportionChart';
    static readonly type = 'flow-proportion' as const;

    @Property
    nodes?: any[];

    override getChartType() {
        return 'flow-proportion' as const;
    }

    override async updateData() {
        await super.updateData();

        const options = this.getOptions() as AgFlowProportionChartOptions<unknown>;
        if (this.nodes !== options.nodes) {
            this.nodes = options.nodes;
        }

        const { nodes } = this;
        this.series.forEach((series) => {
            if (isFlowProportion(series)) {
                series.setChartNodes(nodes);
            }
        });
    }

    protected performLayout(ctx: _ModuleSupport.LayoutContext) {
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
