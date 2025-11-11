import { _ModuleSupport } from 'ag-charts-community';
import { ActionOnSet, Property } from 'ag-charts-core';

import { Image } from '../image/image';

export class Background extends _ModuleSupport.Background<Image> {
    @Property
    @ActionOnSet<Background>({
        newValue(image: Image) {
            this.node.appendChild(image.node);
            image.onLoad = () => this.onImageLoad();
        },
        oldValue(image: Image) {
            image.node.remove();
            image.onLoad = undefined;
        },
    })
    override image = new Image();

    protected override onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        super.onLayoutComplete(event);
        if (this.image) {
            const { width, height } = event.chart;
            this.image.performLayout(width, height);
        }
    }

    protected onImageLoad() {
        this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }
}
