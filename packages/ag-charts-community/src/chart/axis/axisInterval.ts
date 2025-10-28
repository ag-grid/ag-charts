import { BaseProperties, Property } from '../../util/properties';
import type { TickInterval } from './axisTick';

export class AxisInterval<S> extends BaseProperties {
    @Property
    placement?: 'on' | 'between' = 'between';

    @Property
    step?: TickInterval<S>;

    @Property
    values?: any[];

    @Property
    minSpacing?: number;

    @Property
    maxSpacing?: number;
}
