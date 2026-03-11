import { Property, ProxyPropertyOnWrite, ZIndexMap } from 'ag-charts-core';

import type { LayoutCompleteEvent } from '../../core/eventsHub';
import { Group } from '../../scene/group';
import { Background } from './background';

export class SimpleForeground extends Background {
    @Property
    @ProxyPropertyOnWrite('rectNode', 'fill')
    override fill?: string = 'transparent';

    protected override createNode() {
        return new Group({ name: 'foreground', zIndex: ZIndexMap.FOREGROUND });
    }

    protected override onLayoutComplete(e: LayoutCompleteEvent) {
        super.onLayoutComplete(e);

        if (this.text) {
            this.updateTextNode(e);
        }
    }

    private updateTextNode(e: LayoutCompleteEvent) {
        const { textNode } = this;
        const { width, height } = e.chart;

        // Match watermark message styles from enterprise Foreground
        textNode.fontWeight = 'bold';
        textNode.fontFamily = 'Impact, sans-serif';
        textNode.fontSize = 19;
        textNode.opacity = 0.7;
        textNode.fill = '#9b9b9b';
        textNode.textBaseline = 'bottom';
        textNode.textAlign = 'right';

        const padding = 10;
        textNode.x = width - padding;
        textNode.y = height - padding;
    }
}
