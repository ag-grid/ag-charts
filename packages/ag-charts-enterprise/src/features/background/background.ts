import { _ModuleSupport } from 'ag-charts-community';

import type { BackgroundImage } from './backgroundImage';

const { ActionOnSet } = _ModuleSupport;

export class Background extends _ModuleSupport.Background<BackgroundImage> {
    protected updateService: _ModuleSupport.UpdateService;

    @ActionOnSet<Background>({
        newValue(image: BackgroundImage) {
            this.node.appendChild(image.node);
            image.onload = () => this.onImageLoad();
        },
        oldValue(image: BackgroundImage) {
            this.node.removeChild(image.node);
            image.onload = undefined;
        },
    })
    override image?: BackgroundImage;

    constructor(ctx: _ModuleSupport.ModuleContext) {
        super(ctx);

        this.updateService = ctx.updateService;
    }

    protected override onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        super.onLayoutComplete(event);
        if (this.image) {
            const { width, height } = event.chart;
            this.image.performLayout(width, height);
        }
    }

    protected onImageLoad() {
        this.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }
}
