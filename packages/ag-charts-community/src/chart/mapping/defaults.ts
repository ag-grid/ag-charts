import type { AgChartOptions } from '../../options/agChartOptions';
import { BOTTOM, CATEGORY, LEFT, NUMBER } from '../themes/constants';
import { isAgCartesianChartOptions } from './types';

export const DEFAULT_CARTESIAN_CHART_OVERRIDES = {
    axes: [
        {
            type: NUMBER,
            position: LEFT,
        },
        {
            type: CATEGORY,
            position: BOTTOM,
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
