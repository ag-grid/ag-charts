import type { AgAxisBaseTickOptions, AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import type { OrdinalTimeScale } from '../../scale/ordinalTimeScale';
import type { TimeScale } from '../../scale/timeScale';
import type { UnitTimeScale } from '../../scale/unitTimeScale';

export type TickInterval<S> = S extends TimeScale | OrdinalTimeScale | UnitTimeScale
    ? number | AgTimeInterval | AgTimeIntervalUnit
    : number;

const DEFAULTS = {
    enabled: true,
    width: 1,
    size: 6,
    stroke: undefined as string | undefined,
};

export class AxisTick {
    enabled = DEFAULTS.enabled;

    /** The line width to be used by axis ticks. */
    width: number = DEFAULTS.width;

    /** The line length to be used by axis ticks. */
    size: number = DEFAULTS.size;

    /** The colour of the axis ticks. */
    stroke?: string = DEFAULTS.stroke;

    applyOptions(options: AgAxisBaseTickOptions | undefined): void {
        for (const key of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) {
            const override = options != null && key in options ? (options as any)[key] : DEFAULTS[key];
            (this as any)[key] = override;
        }
    }
}
