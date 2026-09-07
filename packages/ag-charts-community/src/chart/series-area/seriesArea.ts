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
import type { BBox } from '../../scene/bbox';
import { Group, TransformableGroup } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';

export class SeriesArea extends BaseProperties {
    private readonly seriesAreaGroup = new Group({
        name: 'series-area-container',
        zIndex: ZIndexMap.SERIES_AREA_CONTAINER,
    });
    private readonly borderNode = this.seriesAreaGroup.appendChild(new Rect());

    // Declared so that setting the option does not warn in community, where the enterprise series
    // area that renders the regions is absent.
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

    protected readonly overlayGroup = new TransformableGroup({
        name: 'SeriesArea-Overlay',
        zIndex: ZIndexMap.SERIES_AREA_CONTAINER,
    });
    protected readonly underlayGroup = new TransformableGroup({
        name: 'SeriesArea-Underlay',
        zIndex: ZIndexMap.SERIES_AREA_UNDERLAY,
    });

    constructor(protected readonly ctx: DynamicContext<ChartRegistry>) {
        super();

        this.borderNode.fill = undefined;

        this.cleanup.register(
            ctx.scene.attachNode(this.seriesAreaGroup),
            ctx.scene.attachNode(this.overlayGroup),
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

    applyOptions() {
        // Overridden by the enterprise series area to apply its enterprise-only option subtrees.
    }

    update(seriesRect: BBox, clipRect: BBox | undefined) {
        // The overlay/underlay groups are translated to the series rect origin, so the clip rect has
        // to be rebased into that space rather than passed through in chart coordinates.
        this.onUpdate(clipRect?.clone().translate(-seriesRect.x, -seriesRect.y));
    }

    protected onUpdate(_clipRect: BBox | undefined) {
        // Overridden by the enterprise series area to update its region content.
    }

    protected onLayoutComplete(event: LayoutCompleteEvent) {
        const { x, y, width, height } = event.series.paddedRect;

        this.borderNode.x = x;
        this.borderNode.y = y;
        this.borderNode.width = width;
        this.borderNode.height = height;

        // Axis scale ranges are relative to the unpadded series rect, so overlay content must share
        // that origin — using the padded rect displaces it by the padding and border width.
        const { x: seriesX, y: seriesY } = event.series.rect;

        this.overlayGroup.translationX = seriesX;
        this.overlayGroup.translationY = seriesY;

        this.underlayGroup.translationX = seriesX;
        this.underlayGroup.translationY = seriesY;
    }
}
