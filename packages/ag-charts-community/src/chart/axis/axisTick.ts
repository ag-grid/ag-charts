import type { OrdinalTimeScale, TimeScale, UnitTimeScale } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale | UnitTimeScale
    ? number | AgTimeInterval | AgTimeIntervalUnit
    : number;
