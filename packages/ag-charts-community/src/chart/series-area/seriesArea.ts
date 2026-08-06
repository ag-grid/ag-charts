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
import { Group, TransformableGroup } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import type { BackgroundRegion } from '../background-regions/backgroundRegion';
import type { SeriesAreaContext } from './seriesAreaContext';

export class SeriesArea extends BaseProperties {
    private readonly seriesAreaGroup = new Group({
        name: 'series-area-container',
        zIndex: ZIndexMap.SERIES_AREA_CONTAINER,
    });
    private readonly borderNode = this.seriesAreaGroup.appendChild(new Rect());

    // This property is required to silence warnings about unable to set 'backgroundRegions'. However, this property
    // is not used. Instead these options are passed through to the background regions module and plugin.
    @Property
    backgroundRegions: any;

    @Property
    border = new Border(this.borderNode);

    @Property
    clip?: boolean;

    @ProxyPropertyOnWrite('borderNode', 'cornerRadius')
    @Property
    cornerRadius: number = 0;

    @Property
    padding = new Padding(0);

    protected readonly cleanup = new CleanupRegistry();

    private readonly moduleMap = new ModuleMap<SeriesAreaPluginModuleInstance>();
    private moduleContext?: DynamicContext<ChartSeriesAreaRegistry<SeriesAreaContext>>;
    private seriesAreaContext?: SeriesAreaContext;

    private readonly underlayGroup = new TransformableGroup({
        name: 'SeriesArea-Underlay',
        zIndex: ZIndexMap.SERIES_AREA_UNDERLAY,
    });

    constructor(protected readonly ctx: DynamicContext<ChartRegistry>) {
        super();

        this.borderNode.fill = undefined;

        this.cleanup.register(
            ctx.scene.attachNode(this.seriesAreaGroup),
            ctx.scene.attachNode(this.underlayGroup),
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
        this.seriesAreaContext ??= this.createSeriesAreaContext();
        this.moduleContext ??= this.ctx
            .child<{ backgroundRegion: BackgroundRegion; parent: SeriesAreaContext }>()
            .constant('parent', this.seriesAreaContext);
        return this.moduleContext;
    }

    update() {
        for (const module of this.moduleMap.modules()) {
            module.onSeriesAreaUpdate?.();
        }
    }

    private createSeriesAreaContext(): SeriesAreaContext {
        return {
            attachSeriesAreaUnderlay: (group) => this.underlayGroup.appendChild(group),
        };
    }

    protected onLayoutComplete(event: LayoutCompleteEvent) {
        const { x, y, width, height } = event.series.paddedRect;
        this.borderNode.x = x;
        this.borderNode.y = y;
        this.borderNode.width = width;
        this.borderNode.height = height;

        this.underlayGroup.translationX = x;
        this.underlayGroup.translationY = y;
    }
}
