import { _ModuleSupport } from 'ag-charts-community';
import { ChartUpdateType, type DynamicContext, type Placement, ZIndexMap } from 'ag-charts-core';

import { Image } from '../image/image';

export class Foreground extends _ModuleSupport.Background {
    private readonly image = new Image();
    private imageInScene = false;

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super(ctx);
        this.image.onLoad = () => this.onImageLoad();
        this.cleanup.register(() => {
            if (this.imageInScene) {
                this.image.node.remove();
            }
            this.image.onLoad = undefined;
        });
    }

    // Foreground is not a plugin module and so has no `themeTemplate`: the inline defaults below are
    // the canonical source for the `foreground` option subtree.
    protected override applyOptions() {
        const opts = this.ctx.chartState.getValue('options', 'foreground');
        this.node.visible = opts?.visible ?? true;
        this.rectNode.fill = opts?.fill ?? 'transparent';
        this.rectNode.fillOpacity = opts?.fillOpacity ?? 1;
        if (opts?.image != null) {
            if (!this.imageInScene) {
                this.node.appendChild(this.image.node);
                this.imageInScene = true;
            }
            this.image.set(opts.image);
        }
        this.textNode.text = opts?.text;
    }

    protected override createNode() {
        return new _ModuleSupport.Group({ name: 'foreground', zIndex: ZIndexMap.FOREGROUND });
    }

    protected override onLayoutComplete(event: _ModuleSupport.LayoutCompleteEvent) {
        super.onLayoutComplete(event);

        const { width, height } = event.chart;
        const placement = this.image.performLayout(width, height);

        if (this.textNode.text) {
            this.updateTextNode(placement);
        }
    }

    private onImageLoad() {
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
