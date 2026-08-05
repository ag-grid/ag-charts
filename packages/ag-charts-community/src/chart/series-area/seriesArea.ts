import {
    BaseProperties,
    Border,
    CleanupRegistry,
    type DynamicContext,
    Padding,
    Property,
    ProxyPropertyOnWrite,
    type SeriesAreaPluginModuleInstance,
    ZIndexMap,
} from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry, ChartSeriesAreaRegistry } from '../../module/moduleContext';
import { ModuleMap } from '../../module/moduleMap';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import type { BackgroundRegion } from '../background-regions/backgroundRegion';

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

    private readonly moduleMap = new ModuleMap<SeriesAreaPluginModuleInstance>();
    private moduleContext?: DynamicContext<ChartSeriesAreaRegistry>;

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

    destroy() {
        this.cleanup.flush();
    }

    getPadding() {
        const { border, padding } = this;
        const strokeWidth = border.enabled ? border.strokeWidth : 0;
        return {
            top: padding.top + strokeWidth,
            right: padding.right + strokeWidth,
            bottom: padding.bottom + strokeWidth,
            left: padding.left + strokeWidth,
        };
    }

    getModuleMap() {
        return this.moduleMap;
    }

    createModuleContext() {
        this.moduleContext ??= this.ctx.child<{ backgroundRegion: BackgroundRegion }>();
        return this.moduleContext;
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
