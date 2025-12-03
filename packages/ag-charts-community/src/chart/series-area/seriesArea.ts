import { BaseProperties, Border, CleanupRegistry, Property, ProxyPropertyOnWrite } from 'ag-charts-core';
import type { Padding } from 'ag-charts-types';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ModuleContext } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { ZIndexMap } from 'ag-charts-core';

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
    padding: Padding = 0;

    protected readonly cleanup = new CleanupRegistry();

    constructor(protected readonly ctx: ModuleContext) {
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
        if (typeof padding === 'number') {
            const total = padding + strokeWidth;
            return { top: total, right: total, bottom: total, left: total };
        }
        return {
            top: (padding.top ?? 0) + strokeWidth,
            right: (padding.right ?? 0) + strokeWidth,
            bottom: (padding.bottom ?? 0) + strokeWidth,
            left: (padding.left ?? 0) + strokeWidth,
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
