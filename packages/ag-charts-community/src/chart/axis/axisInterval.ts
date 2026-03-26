import { BaseProperties, Property } from 'ag-charts-core';

import type { TickInterval } from './axisTick';

export class AxisInterval<S> extends BaseProperties {
    @Property
    placement?: 'on' | 'between';

    @Property
    step?: TickInterval<S>;

    @Property
    values?: any[];

    @Property
    minSpacing?: number;

    @Property
    maxSpacing?: number;
}
