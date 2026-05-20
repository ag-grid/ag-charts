import { AbstractModuleInstance, type DynamicContext, ZIndexMap } from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import { Group } from '../../scene/group';
import { Rect } from '../../scene/shape/rect';
import { Text } from '../../scene/shape/text';

export class Background extends AbstractModuleInstance {
    protected readonly node;
    protected readonly rectNode = new Rect();
    protected readonly textNode = new Text();

    constructor(protected readonly ctx: DynamicContext<ChartRegistry>) {
        super();

        this.node = this.createNode();
        this.node.append([this.rectNode, this.textNode]);

        this.cleanup.register(
            ctx.scene.attachNode(this.node),
            ctx.eventsHub.on('layout:complete', (e) => this.onLayoutComplete(e))
        );
    }

    protected applyOptions() {
        const opts = this.ctx.chartState.getValue('options', 'background');
        this.node.visible = opts.visible;
        this.rectNode.fill = opts.fill;
    }

    protected createNode() {
        return new Group({ name: 'background', zIndex: ZIndexMap.CHART_BACKGROUND });
    }

    protected onLayoutComplete(e: LayoutCompleteEvent) {
        this.applyOptions();
        const { width, height } = e.chart;
        this.rectNode.width = width;
        this.rectNode.height = height;
    }
}
