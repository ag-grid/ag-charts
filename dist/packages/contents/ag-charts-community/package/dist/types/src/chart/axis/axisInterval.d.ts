import { BaseProperties } from '../../util/properties';
import type { TickInterval } from './axisTick';
export declare const TICK_INTERVAL: import("../../util/validation").ValidatePredicate;
export declare class AxisInterval<S> extends BaseProperties {
    step?: TickInterval<S>;
    values?: any[];
    minSpacing: number;
    maxSpacing: number;
}
