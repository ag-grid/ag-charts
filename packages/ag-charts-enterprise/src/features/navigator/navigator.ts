import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { MiniChart } from './miniChart';

const { ObserveChanges } = _ModuleSupport;

export class Navigator extends _ModuleSupport.Navigator {
    @ObserveChanges<Navigator, MiniChart>((target, value, oldValue) => {
        target.updateBackground(oldValue?.root, value?.root);
    })
    override miniChart: MiniChart;

    public constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx);

        this.miniChart = new MiniChart(ctx);
    }

    async updateData(opts: { data: any }): Promise<void> {
        await this.miniChart.updateData(opts);
    }

    async processData(opts: { dataController: _ModuleSupport.DataController }): Promise<void> {
        await this.miniChart.processData(opts);
    }

    override async performLayout(opts: _ModuleSupport.LayoutContext): Promise<_ModuleSupport.LayoutContext> {
        const { shrinkRect } = await super.performLayout(opts);

        if (this.enabled) {
            const { top, bottom } = this.miniChart.computeAxisPadding();
            shrinkRect.shrink(top + bottom, 'bottom');
            this.y -= bottom;
        }

        return { ...opts, shrinkRect };
    }

    override async performCartesianLayout(opts: { seriesRect: _Scene.BBox }): Promise<void> {
        await super.performCartesianLayout(opts);
        await this.miniChart.layout(this.width, this.height);
    }
}
