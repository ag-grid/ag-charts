import { _ModuleSupport } from 'ag-charts-community';

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

    updateData(data: any) {
        return this.miniChart.updateData(data);
    }

    processData(dataController: _ModuleSupport.DataController) {
        return this.miniChart.processData(dataController);
    }

    protected override onLayoutStart(opts: _ModuleSupport.LayoutContext) {
        super.onLayoutStart(opts);

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
