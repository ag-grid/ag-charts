import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { BULLET_DEFAULTS } from './bulletDefaults';
import { BulletColorRange, BulletSeries } from './bulletSeries';
import { BULLET_SERIES_THEME } from './bulletThemes';

const { CARTESIAN_AXIS_POSITIONS } = _Theme;

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    optionConstructors: { 'series[].colorRanges': BulletColorRange },
    instanceConstructor: BulletSeries,
    seriesDefaults: BULLET_DEFAULTS,
    themeTemplate: BULLET_SERIES_THEME,
    customDefaultsFunction: (series) => {
        const axis0 = { ...BULLET_DEFAULTS.axes[0] };
        const axis1 = { ...BULLET_DEFAULTS.axes[1] };
        if (series.direction === 'horizontal') {
            axis0.position = CARTESIAN_AXIS_POSITIONS.BOTTOM;
            axis1.position = CARTESIAN_AXIS_POSITIONS.LEFT;
        }
        if (series.scale?.max !== undefined) {
            axis0.max = series.scale.max;
        }
        return { ...BULLET_DEFAULTS, axes: [axis0, axis1] };
    },
};
