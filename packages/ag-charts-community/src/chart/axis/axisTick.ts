import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { TimeScale } from '../../scale/timeScale';
import { BaseProperties } from '../../util/properties';
import { TimeInterval } from '../../util/time';
import { BOOLEAN, COLOR_STRING, POSITIVE_NUMBER, Validate } from '../../util/validation';

export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale ? number | TimeInterval : number;

export class AxisTick extends BaseProperties {
    @Validate(BOOLEAN)
    enabled = true;

    /** The line width to be used by axis ticks. */
    @Validate(POSITIVE_NUMBER)
    width: number = 1;

    /** The line length to be used by axis ticks. */
    @Validate(POSITIVE_NUMBER)
    size: number = 6;

    /** The color of the axis ticks. */
    @Validate(COLOR_STRING, { optional: true })
    stroke?: string;
}
