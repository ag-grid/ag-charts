import type { StrokeOptions } from 'ag-charts-types';

import type { Rect } from '../scene/shape/rect';
import { BaseProperties, Property } from './properties';
import { ProxyPropertyOnWrite } from './proxy';

export class Border extends BaseProperties implements StrokeOptions {
    @Property
    enabled: boolean = false;

    @ProxyPropertyOnWrite('node', 'stroke')
    @Property
    stroke: string = 'black';

    @ProxyPropertyOnWrite('node', 'strokeOpacity')
    @Property
    strokeOpacity: number = 1;

    @ProxyPropertyOnWrite('node', 'strokeWidth')
    @Property
    strokeWidth: number = 1;

    constructor(public readonly node: Rect) {
        super();
    }
}
