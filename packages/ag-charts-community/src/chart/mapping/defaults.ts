import type { AgCartesianChartOptions, AgChartOptions } from '../../options/agChartOptions';
import { NumberAxis } from '../axis/numberAxis';
import { CategoryAxis } from '../axis/categoryAxis';
import { isAgCartesianChartOptions } from './types';
import type { SeriesPaletteFactory } from '../../util/coreModules';

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

export const singleSeriesPaletteFactory: SeriesPaletteFactory = ({ takeColors }) => {
    const {
        fills: [fill],
        strokes: [stroke],
    } = takeColors(1);
    return { fill, stroke };
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
