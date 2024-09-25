import { _ModuleSupport } from 'ag-charts-community';

import { Image } from '../image/image';

const { zIndexMap, ActionOnSet, Validate, ProxyPropertyOnWrite, OBJECT, RATIO, COLOR_STRING } = _ModuleSupport;

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
        super(ctx, zIndexMap.FOREGROUND, true);
    }

    protected override onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        super.onLayoutComplete(event);
        const { width, height } = event.chart;

        let placement = {
            x: 0,
            y: 0,
            width,
            height,
        };

        if (this.image) {
            placement = this.image.performLayout(width, height);
        }

        if (this.text) {
            this.updateTextNode(placement);
        }
    }

    protected onImageLoad() {
        this.ctx.updateService.update(_ModuleSupport.ChartUpdateType.SCENE_RENDER);
    }

    private updateTextNode(placement: _ModuleSupport.Placement) {
        const { textNode } = this;

        // match watermark message styles
        textNode.fontWeight = 'bold';
        textNode.fontFamily = 'Impact, sans-serif';
        textNode.fontSize = 19;
        textNode.opacity = 0.7;
        textNode.fill = '#9b9b9b';
        textNode.textBaseline = 'top';

        const textBBox = this.textNode.getBBox();
        const textPadding = 10;

        textNode.x = placement.x + placement.width / 2 - textBBox.width / 2;
        textNode.y = placement.y + placement.height + textPadding;
    }
}
