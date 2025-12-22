import type { BorderOptions } from 'ag-charts-types';

import { BaseProperties, Property } from '../../state/properties';
import { ActionOnSet, ProxyPropertyOnWrite } from '../../state/proxy';

export class Border extends BaseProperties implements BorderOptions {
    @ActionOnSet<Border>({
        changeValue(newValue: boolean) {
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
        changeValue(newValue: number) {
            if (this.enabled) {
                this.node.strokeWidth = newValue;
            } else {
                this.node.strokeWidth = 0;
            }
        },
    })
    @Property
    strokeWidth: number = 1;

    constructor(public readonly node: { stroke?: string | object; strokeOpacity: number; strokeWidth: number }) {
        super();
    }
}
