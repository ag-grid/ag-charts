import {
    BaseProperties,
    Border,
    CleanupRegistry,
    type DynamicContext,
    Padding,
    Property,
    ProxyPropertyOnWrite,
    ZIndexMap,
} from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';

export class SeriesArea extends BaseProperties {
    protected readonly node: Group;
    protected readonly rectNode = new Rect();

    @Property
    border = new Border(this.rectNode);

    @Property
    clip?: boolean;

    @ProxyPropertyOnWrite('rectNode', 'cornerRadius')
    @Property
    cornerRadius: number = 0;

    @Property
    padding = new Padding(0);

    protected readonly cleanup = new CleanupRegistry();

    constructor(protected readonly ctx: DynamicContext<ChartRegistry>) {
        super();

        this.node = this.createNode();
        this.node.append([this.rectNode]);

        this.rectNode.fill = undefined;

        this.cleanup.register(
            ctx.scene.attachNode(this.node),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e))
        );
    }

    public destroy() {
        this.cleanup.flush();
    }

    public getPadding() {
        const { border, padding } = this;
        const strokeWidth = border.enabled ? border.strokeWidth : 0;
        return {
            top: padding.top + strokeWidth,
            right: padding.right + strokeWidth,
            bottom: padding.bottom + strokeWidth,
            left: padding.left + strokeWidth,
        };
    }

    protected createNode() {
        return new Group({ name: 'series-area-container', zIndex: ZIndexMap.SERIES_AREA_CONTAINER });
    }

    protected onLayoutComplete(event: LayoutCompleteEvent) {
        const { x, y, width, height } = event.series.paddedRect;
        this.rectNode.x = x;
        this.rectNode.y = y;
        this.rectNode.width = width;
        this.rectNode.height = height;
    }
}
