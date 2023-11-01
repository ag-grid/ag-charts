import { MODULE_CONFLICTS } from '../../module/module';
import type { AgChartOptions } from '../../options/agChartOptions';
import { Logger } from '../../util/logger';
import type { DeepPartial } from '../../util/types';
import { CARTESIAN_AXIS_POSITIONS, CARTESIAN_AXIS_TYPES } from '../themes/constants';
import { isAgCartesianChartOptions } from './types';

export const DEFAULT_CARTESIAN_CHART_OVERRIDES = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPES.NUMBER,
            position: CARTESIAN_AXIS_POSITIONS.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPES.CATEGORY,
            position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
        },
    ],
};

export function swapAxes<T extends AgChartOptions>(opts: T): T {
    if (!isAgCartesianChartOptions(opts)) {
        return opts;
    }

    const [axis0, axis1] = opts.axes ?? [];
    return {
        ...opts,
        axes: [
            { ...axis0, position: axis1.position },
            { ...axis1, position: axis0.position },
        ],
    };
}

type PossibleObject = { enabled?: boolean } | undefined;

export function resolveModuleConflicts<T extends AgChartOptions>(opts: T) {
    const conflictOverrides = {} as Record<keyof T, { enabled?: boolean }>;
    for (const [source, conflicts] of MODULE_CONFLICTS.entries()) {
        if (opts[source] == null || !conflicts.length) {
            continue;
        }
        conflictOverrides[source] ??= {};
        for (const conflict of conflicts) {
            if ((opts[source] as PossibleObject)?.enabled && (opts[conflict] as PossibleObject)?.enabled) {
                Logger.warnOnce(
                    `the [${source}] module can not be used at the same time as [${conflict}], it will be disabled.`
                );
                conflictOverrides[source].enabled = false;
            } else {
                conflictOverrides[source].enabled = (opts[source] as PossibleObject)?.enabled;
            }
        }
    }
    return conflictOverrides as DeepPartial<T>;
}
