import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { BulletSeries } from './bulletSeries';

const { CARTESIAN_AXIS_TYPES, CARTESIAN_AXIS_POSITIONS } = _Theme;

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    instanceConstructor: BulletSeries,
    seriesDefaults: {
        axes: [
            {
                type: CARTESIAN_AXIS_TYPES.NUMBER,
                position: CARTESIAN_AXIS_POSITIONS.BOTTOM,
            },
            {
                type: CARTESIAN_AXIS_TYPES.CATEGORY,
                position: CARTESIAN_AXIS_POSITIONS.LEFT,
            },
        ],
    },
    swapDefaultAxesCondition: (series) => series?.direction !== 'horizontal',
    themeTemplate: {},
};
