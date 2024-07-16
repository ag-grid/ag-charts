import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { Scale } from '../../scale/scale';
import type { TimeScale } from '../../scale/timeScale';
import { BaseProperties } from '../../util/properties';
import { TimeInterval } from '../../util/time/interval';
export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale ? number | TimeInterval : number;
export type TickCount<S> = S extends TimeScale ? number | TimeInterval : number;
export declare abstract class AxisTick<S extends Scale<D, number, I>, D = any, I = any> extends BaseProperties {
    enabled: boolean;
    /**
     * The line width to be used by axis ticks.
     */
    width: number;
    /**
     * The line length to be used by axis ticks.
     */
    size: number;
    /**
     * The color of the axis ticks.
     * Use `undefined` rather than `rgba(0, 0, 0, 0)` to make the ticks invisible.
     */
    color?: string;
    interval?: TickInterval<S>;
    values?: any[];
    abstract minSpacing: number;
    maxSpacing?: number;
}
