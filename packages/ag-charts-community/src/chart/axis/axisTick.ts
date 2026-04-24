import type { AgAxisBaseTickOptions, AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { TimeScale } from '../../scale/timeScale';
import type { UnitTimeScale } from '../../scale/unitTimeScale';

export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale | UnitTimeScale
    ? number | AgTimeInterval | AgTimeIntervalUnit
    : number;

export class AxisTick {
    enabled = true;

    /** The line width to be used by axis ticks. */
    width: number = 1;

    /** The line length to be used by axis ticks. */
    size: number = 6;

    /** The colour of the axis ticks. */
    stroke?: string;

    applyOptions(options: AgAxisBaseTickOptions | undefined): void {
        if (options != null) Object.assign(this, options);
    }
}
