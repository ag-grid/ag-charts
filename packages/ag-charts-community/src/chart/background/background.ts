import { AbstractModuleInstance, type DynamicContext, Property, ProxyPropertyOnWrite, ZIndexMap } from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { Text } from '../../scene/shape/text';

export class Background<TImage = never> extends AbstractModuleInstance {
    protected readonly node;
    protected readonly rectNode = new Rect();
    protected readonly textNode = new Text();

    @Property
    @ProxyPropertyOnWrite('node', 'visible')
    visible: boolean;

    @Property
    @ProxyPropertyOnWrite('rectNode', 'fill')
    fill?: string = 'white';

    // placeholder for enterprise module
    @Property
    image?: TImage;

    // placeholder for enterprise module
    @Property
    @ProxyPropertyOnWrite('textNode')
    text?: string;

    constructor(protected readonly ctx: DynamicContext<ChartRegistry>) {
        super();

        this.node = this.createNode();
        this.node.append([this.rectNode, this.textNode]);

        this.visible = true;

        this.cleanup.register(
            ctx.scene.attachNode(this.node),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e))
        );
    }

    protected createNode() {
        return new Group({ name: 'background', zIndex: ZIndexMap.CHART_BACKGROUND });
    }

    protected onLayoutComplete(e: LayoutCompleteEvent) {
        const { width, height } = e.chart;
        this.rectNode.width = width;
        this.rectNode.height = height;
    }
}
