import { _ModuleSupport } from 'ag-charts-community';

import { Image } from '../image/image';

const { Layers, ActionOnSet, Validate, ProxyPropertyOnWrite, OBJECT, RATIO, COLOR_STRING } = _ModuleSupport;

export class Foreground extends _ModuleSupport.Background<Image> {
    @Validate(OBJECT, { optional: true })
    @ActionOnSet<Foreground>({
        newValue(image: Image) {
            this.node.appendChild(image.node);
            image.onLoad = () => this.onImageLoad();
        },
        oldValue(image: Image) {
            this.node.removeChild(image.node);
            image.onLoad = undefined;
        },
    })
    override image = new Image();

    @Validate(COLOR_STRING, { optional: true })
    @ProxyPropertyOnWrite('rectNode', 'fill')
    override fill?: string = 'transparent';

    @Validate(RATIO, { optional: true })
    @ProxyPropertyOnWrite('rectNode', 'fillOpacity')
    fillOpacity?: number = undefined;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super(ctx, Layers.FOREGROUND_ZINDEX, true);
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
