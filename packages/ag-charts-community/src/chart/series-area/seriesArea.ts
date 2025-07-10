import type { StrokeOptions } from 'ag-charts-types';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ModuleInstance } from '../../module/baseModule';
import { BaseModuleInstance } from '../../module/module';
import type { ModuleContext } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { Padding } from '../../util/padding';
import { BaseProperties, Property } from '../../util/properties';
import { ProxyPropertyOnWrite } from '../../util/proxy';
import { ZIndexMap } from '../zIndexMap';

class Border extends BaseProperties implements StrokeOptions {
    @ProxyPropertyOnWrite('rectNode', 'stroke')
    @Property
    stroke: string = 'black';

    @ProxyPropertyOnWrite('rectNode', 'strokeOpacity')
    @Property
    strokeOpacity: number = 1;

    @ProxyPropertyOnWrite('rectNode', 'strokeWidth')
    @Property
    strokeWidth: number = 0;

    constructor(public readonly rectNode: Rect) {
        super();
    }
}

export class SeriesArea extends BaseModuleInstance implements ModuleInstance {
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

    public getPadding() {
        return {
            top: this.padding.top + this.border.strokeWidth,
            right: this.padding.right + this.border.strokeWidth,
            bottom: this.padding.bottom + this.border.strokeWidth,
            left: this.padding.left + this.border.strokeWidth,
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
