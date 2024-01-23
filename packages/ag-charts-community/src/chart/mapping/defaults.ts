import type { AgChartOptions } from '../../options/agChartOptions';
import { CARTESIAN_AXIS_TYPE, POSITION } from '../themes/constants';
import { isAgCartesianChartOptions } from './types';

export const DEFAULT_CARTESIAN_CHART_OVERRIDES = {
    axes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.CATEGORY,
            position: POSITION.BOTTOM,
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
