import { MODULE_CONFLICTS } from '../../module/module';
import type { AgChartOptions } from '../../options/agChartOptions';
import { Logger } from '../../util/logger';
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

export function resolveModuleConflicts<T extends AgChartOptions>(opts: T) {
    const conflictOverrides = {} as Record<keyof T, { enabled?: boolean }>;
    for (const [source, conflicts] of MODULE_CONFLICTS.entries()) {
        const sourceOpt = opts[source];

        if (sourceOpt == null || typeof sourceOpt !== 'object' || !conflicts.length) {
            continue;
        }

        conflictOverrides[source] ??= {};

        for (const conflict of conflicts) {
            const conflictOpt = opts[conflict];
            if (
                conflictOpt != null &&
                typeof conflictOpt === 'object' &&
                'enabled' in sourceOpt &&
                'enabled' in conflictOpt &&
                sourceOpt.enabled &&
                conflictOpt.enabled
            ) {
                Logger.warnOnce(
                    `the [${source}] module can not be used at the same time as [${conflict}], it will be disabled.`
                );
                conflictOverrides[source].enabled = false;
            } else {
                conflictOverrides[source].enabled = 'enabled' in sourceOpt ? sourceOpt.enabled : undefined;
            }
        }
    }

    return conflictOverrides as Partial<T>;
}
