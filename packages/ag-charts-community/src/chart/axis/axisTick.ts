import { BaseProperties, Property } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { TimeScale } from '../../scale/timeScale';
import type { UnitTimeScale } from '../../scale/unitTimeScale';

export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale | UnitTimeScale
    ? number | AgTimeInterval | AgTimeIntervalUnit
    : number;

export class AxisTick extends BaseProperties {
    @Property
    enabled = true;

    /** The line width to be used by axis ticks. */
    @Property
    width: number = 1;

    /** The line length to be used by axis ticks. */
    @Property
    size: number = 6;

    /** The color of the axis ticks. */
    @Property
    stroke?: string;
}
