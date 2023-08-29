import type { AgCartesianChartOptions, AgChartOptions } from '../agChartOptions';
import { NumberAxis } from '../axis/numberAxis';
import { CategoryAxis } from '../axis/categoryAxis';
import { isAgCartesianChartOptions } from './prepare';

export type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number];

export const DEFAULT_CARTESIAN_CHART_OVERRIDES: AgCartesianChartOptions = {
    axes: [
        {
            type: NumberAxis.type,
            position: 'left',
        },
        {
            type: CategoryAxis.type,
            position: 'bottom',
        },
    ],
};

export const DEFAULT_BAR_CHART_OVERRIDES: AgCartesianChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'category',
            position: 'left',
        },
    ],
};

export const DEFAULT_SCATTER_HISTOGRAM_CHART_OVERRIDES: AgCartesianChartOptions = {
    axes: [
        {
            type: 'number',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
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
