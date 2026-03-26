import { _ModuleSupport } from 'ag-charts-community';
import {
    ActionOnSet,
    ChartUpdateType,
    type Placement,
    Property,
    ProxyPropertyOnWrite,
    ZIndexMap,
} from 'ag-charts-core';

import { Image } from '../image/image';

export class Foreground extends _ModuleSupport.Background<Image> {
    @Property
    @ActionOnSet<Foreground>({
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

    @Property
    @ProxyPropertyOnWrite('rectNode', 'fill')
    override fill?: string = 'transparent';

    @Property
    @ProxyPropertyOnWrite('rectNode', 'fillOpacity')
    fillOpacity?: number = undefined;

    protected override createNode() {
        return new _ModuleSupport.Group({ name: 'foreground', zIndex: ZIndexMap.FOREGROUND });
    }

    protected override onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        super.onLayoutComplete(event);

        const { width, height } = event.chart;
        const placement = this.image.performLayout(width, height);

        if (this.text) {
            this.updateTextNode(placement);
        }
    }

    protected onImageLoad() {
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.SCENE_RENDER });
    }

    private updateTextNode(placement: Placement) {
        const { textNode } = this;

        // match watermark message styles
        textNode.fontWeight = 'bold';
        textNode.fontFamily = 'Impact, sans-serif';
        textNode.fontSize = 19;
        textNode.opacity = 0.7;
        textNode.fill = '#9b9b9b';
        textNode.textBaseline = 'top';

        const { width } = textNode.getBBox();
        const textPadding = 10;

        textNode.x = placement.x + placement.width / 2 - width / 2;
        textNode.y = placement.y + placement.height + textPadding;
    }
}
