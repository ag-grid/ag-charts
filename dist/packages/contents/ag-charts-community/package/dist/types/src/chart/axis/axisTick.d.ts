import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { TimeScale } from '../../scale/timeScale';
import { BaseProperties } from '../../util/properties';
import { TimeInterval } from '../../util/time';
export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale ? number | TimeInterval : number;
export declare class AxisTick extends BaseProperties {
    enabled: boolean;
    /** The line width to be used by axis ticks. */
    width: number;
    /** The line length to be used by axis ticks. */
    size: number;
    /** The color of the axis ticks. */
    stroke?: string;
}
