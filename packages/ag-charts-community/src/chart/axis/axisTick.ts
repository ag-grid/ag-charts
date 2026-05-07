import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { TimeScale } from '../../scale/timeScale';
import type { UnitTimeScale } from '../../scale/unitTimeScale';

export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale | UnitTimeScale
    ? number | AgTimeInterval | AgTimeIntervalUnit
    : number;
