import { _ModuleSupport } from 'ag-charts-community';
import { ChartUpdateType, type DynamicContext } from 'ag-charts-core';

import { Image } from '../image/image';

export class Background extends _ModuleSupport.Background {
    private readonly image = new Image();

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(ctx);
        this.node.appendChild(this.image.node);
        this.image.onLoad = () => this.onImageLoad();
        this.cleanup.register(() => {
            this.image.node.remove();
            this.image.onLoad = undefined;
        });
    }

    protected override applyOptions() {
        super.applyOptions();
        const { image } = this.ctx.chartState.getValue('options', 'background');
        if (image != null) {
            this.image.set(image);
        }
    }

    protected override onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        super.onLayoutComplete(event);
        const { width, height } = event.chart;
        this.image.performLayout(width, height);
    }

    private onImageLoad() {
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }
}
