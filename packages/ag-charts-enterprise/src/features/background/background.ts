import { _ModuleSupport } from 'ag-charts-community';

import { BackgroundImage } from './backgroundImage';

const { ActionOnSet, OBJECT, Validate } = _ModuleSupport;

export class Background extends _ModuleSupport.Background<BackgroundImage> {
    @Validate(OBJECT, { optional: true })
    @ActionOnSet<Background>({
        newValue(image: BackgroundImage) {
            this.node.appendChild(image.node);
            image.onLoad = () => this.onImageLoad();
        },
        oldValue(image: BackgroundImage) {
            this.node.removeChild(image.node);
            image.onLoad = undefined;
        },
    })
    override image = new BackgroundImage();

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super(ctx);
    }

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
