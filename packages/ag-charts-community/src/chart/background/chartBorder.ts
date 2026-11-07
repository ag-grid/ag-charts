import { AbstractModuleInstance, type DynamicContext, Group, Rect, ZIndexMap } from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';

/** Outer corner radius shared by the border and the background; a stroked Rect cannot round its outer edge tighter than half the stroke. */
export function chartBorderOuterRadius(cornerRadius: number, strokeWidth: number) {
    return cornerRadius > 0 ? Math.max(cornerRadius, strokeWidth / 2) : 0;
}

/** Draws `border` at the edge of the chart, above all content including enterprise background and foreground images. */
export class ChartBorder extends AbstractModuleInstance {
    private readonly node = new Group({ name: 'chart-border', zIndex: [ZIndexMap.FOREGROUND, 1] });
    private readonly rectNode = this.node.appendChild(new Rect());

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {
        super();

        this.rectNode.fill = undefined;

        this.cleanup.register(
            ctx.scene.attachNode(this.node),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e))
        );
    }

    private onLayoutComplete(e: LayoutCompleteEvent) {
        const { enabled, stroke, strokeWidth, strokeOpacity, cornerRadius } = this.ctx.chartState.getValue(
            'options',
            'border'
        );
        const { rectNode } = this;
        this.node.visible = enabled;
        rectNode.stroke = stroke;
        rectNode.strokeWidth = strokeWidth;
        rectNode.strokeOpacity = strokeOpacity;
        const outerRadius = chartBorderOuterRadius(cornerRadius, strokeWidth);
        // Rect reduces a stroked corner radius by the full stroke width; this leaves the stroke centre at `outerRadius - strokeWidth / 2`.
        rectNode.cornerRadius = outerRadius > 0 ? outerRadius + strokeWidth / 2 : 0;
        rectNode.lineJoin = outerRadius > 0 ? 'round' : undefined;
        rectNode.width = e.chart.width;
        rectNode.height = e.chart.height;
    }
}
