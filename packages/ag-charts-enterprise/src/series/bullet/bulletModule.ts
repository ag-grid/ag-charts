import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { BULLET_DEFAULTS } from './bulletDefaults';
import { BulletSeries } from './bulletSeries';
import { BULLET_SERIES_THEME } from './bulletThemes';

const { CARTESIAN_AXIS_POSITIONS } = _Theme;

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    instanceConstructor: BulletSeries,
    seriesDefaults: BULLET_DEFAULTS,
    themeTemplate: BULLET_SERIES_THEME,
    swapDefaultAxesCondition: (opts) => opts?.direction !== 'horizontal',
    customDefaultAxesSwapper: (opts) => {
        const [axis0, axis1] = opts.axes ?? [];
        return {
            ...opts,
            axes: [
                { ...axis0, position: CARTESIAN_AXIS_POSITIONS.LEFT },
                { ...axis1, position: CARTESIAN_AXIS_POSITIONS.TOP },
            ],
        };
    },
};
