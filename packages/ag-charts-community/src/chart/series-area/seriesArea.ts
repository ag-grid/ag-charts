import { CleanupRegistry, type DynamicContext, ZIndexMap, resolvePadding } from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import type { BBox } from '../../scene/bbox';
import { Group, TransformableGroup } from '../../scene/group';
import type { Node } from '../../scene/node';
import { Rect } from '../../scene/shape/rect';
import type { NormalisedSeriesAreaOptions } from '../chartState';

/** Scene content a module renders inside the series area, positioned in series-rect space. */
export interface SeriesAreaContent {
    readonly underlay?: Node;
    readonly overlay?: Node;
    /** `clipRect` is the padded series rect in series-rect space, or `undefined` when unclipped. */
    update(clipRect: BBox | undefined): void;
}

export class SeriesArea {
    private readonly seriesAreaGroup = new Group({
        name: 'series-area-container',
        zIndex: ZIndexMap.SERIES_AREA_CONTAINER,
    });
    private readonly borderNode = this.seriesAreaGroup.appendChild(new Rect());

    private options: NormalisedSeriesAreaOptions = {};

    get clip(): boolean | undefined {
        return this.options.clip;
    }

    private readonly cleanup = new CleanupRegistry();
    private readonly contents = new Set<SeriesAreaContent>();

    private readonly overlayGroup = new TransformableGroup({
        name: 'SeriesArea-Overlay',
        zIndex: ZIndexMap.SERIES_AREA_CONTAINER,
    });
    private readonly underlayGroup = new TransformableGroup({
        name: 'SeriesArea-Underlay',
        zIndex: ZIndexMap.SERIES_AREA_UNDERLAY,
    });

    constructor(ctx: DynamicContext<ChartRegistry>) {
        this.borderNode.fill = undefined;

        this.cleanup.register(
            ctx.scene.attachNode(this.seriesAreaGroup),
            ctx.scene.attachNode(this.overlayGroup),
            ctx.scene.attachNode(this.underlayGroup),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e)),
            ctx.chartState.observe((get) => this.applyOptions(get('options', 'seriesArea') ?? {}))
        );
    }

    private applyOptions(options: NormalisedSeriesAreaOptions) {
        this.options = options;

        const { border, cornerRadius = 0 } = options;
        const { borderNode } = this;
        borderNode.cornerRadius = cornerRadius;
        borderNode.stroke = border?.stroke;
        borderNode.strokeOpacity = border?.strokeOpacity ?? 1;
        borderNode.strokeWidth = border?.enabled ? border.strokeWidth : 0;
    }

    destroy() {
        this.cleanup.flush();
    }

    getPadding() {
        const { border, padding } = this.options;
        const strokeWidth = border?.enabled ? border.strokeWidth : 0;
        const { top, right, bottom, left } = resolvePadding(padding);
        return {
            top: top + strokeWidth,
            right: right + strokeWidth,
            bottom: bottom + strokeWidth,
            left: left + strokeWidth,
        };
    }

    /** Attaches module content beneath and above the series; returns the detach function. */
    attach(content: SeriesAreaContent) {
        const { underlay, overlay } = content;
        if (underlay) this.underlayGroup.appendChild(underlay);
        if (overlay) this.overlayGroup.appendChild(overlay);
        this.contents.add(content);

        return () => {
            this.contents.delete(content);
            underlay?.remove();
            overlay?.remove();
        };
    }

    update(seriesRect: BBox, clipRect: BBox | undefined) {
        // The overlay/underlay groups are translated to the series rect origin, so the clip rect has
        // to be rebased into that space rather than passed through in chart coordinates.
        const rebased = clipRect?.clone().translate(-seriesRect.x, -seriesRect.y);
        for (const content of this.contents) {
            content.update(rebased);
        }
    }

    private onLayoutComplete(event: LayoutCompleteEvent) {
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
