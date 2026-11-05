import { AbstractModuleInstance, type DynamicContext, Group, Rect, ZIndexMap } from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';

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
        rectNode.cornerRadius = cornerRadius;
        rectNode.width = e.chart.width;
        rectNode.height = e.chart.height;
    }
}
