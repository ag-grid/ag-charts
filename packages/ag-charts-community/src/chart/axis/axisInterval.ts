import { BaseProperties, Property } from 'ag-charts-core';
import type { AgAxisBaseIntervalOptions } from 'ag-charts-types';

import type { TickInterval } from './axisTick';

// NOTE: This class remains on BaseProperties/@Property because enterprise axis code
// (AngleAxisInterval) extends it. Full migration waits for those subclasses.
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

    applyOptions(options: AgAxisBaseIntervalOptions | undefined): void {
        this.set(options as Parameters<this['set']>[0]);
    }
}
