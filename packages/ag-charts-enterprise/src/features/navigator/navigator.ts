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

    updateData(opts: { data: any }) {
        return this.miniChart.updateData(opts);
    }

    processData(opts: { dataController: _ModuleSupport.DataController }) {
        return this.miniChart.processData(opts);
    }

    override async performLayout(opts: _ModuleSupport.LayoutContext) {
        await super.performLayout(opts);

        if (this.enabled) {
            const { top, bottom } = this.miniChart.computeAxisPadding();
            opts.layoutBox.shrink(top + bottom, 'bottom');
            this.y -= bottom;
        }
    }

    override async onLayoutComplete(opts: _ModuleSupport.LayoutCompleteEvent) {
        super.onLayoutComplete(opts);
        await this.miniChart.layout(this.width, this.height);
    }
}
