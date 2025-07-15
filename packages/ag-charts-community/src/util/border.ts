import type { StrokeOptions } from 'ag-charts-types';

import type { Rect } from '../scene/shape/rect';
import { BaseProperties, Property } from './properties';
import { ActionOnSet, ProxyPropertyOnWrite } from './proxy';

export class Border extends BaseProperties implements StrokeOptions {
    @ActionOnSet<Border>({
        changeValue(newValue) {
            if (newValue) {
                this.node.strokeWidth = this.strokeWidth;
            } else {
                this.node.strokeWidth = 0;
            }
        },
    })
    @Property
    enabled: boolean = false;

    @ProxyPropertyOnWrite('node', 'stroke')
    @Property
    stroke: string = 'black';

    @ProxyPropertyOnWrite('node', 'strokeOpacity')
    @Property
    strokeOpacity: number = 1;

    @ActionOnSet<Border>({
        changeValue(newValue) {
            if (this.enabled) {
                this.node.strokeWidth = newValue;
            } else {
                this.node.strokeWidth = 0;
            }
        },
    })
    @Property
    strokeWidth: number = 1;

    constructor(public readonly node: Rect) {
        super();
    }
}
