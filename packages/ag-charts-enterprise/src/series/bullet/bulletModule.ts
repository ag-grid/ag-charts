import type { _ModuleSupport } from 'ag-charts-community';
import { _Theme } from 'ag-charts-community';

import { BULLET_DEFAULTS } from './bulletDefaults';
import { BulletSeries } from './bulletSeries';
import { BulletColorRange } from './bulletSeriesProperties';
import { BULLET_SERIES_THEME } from './bulletThemes';

const { POSITION } = _Theme;

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    solo: true,
    optionConstructors: { 'series[].colorRanges': BulletColorRange },
    instanceConstructor: BulletSeries,
    seriesDefaults: BULLET_DEFAULTS,
    themeTemplate: BULLET_SERIES_THEME,
    customDefaultsFunction: (series) => {
        const axis0 = { ...BULLET_DEFAULTS.axes[0] };
        const axis1 = { ...BULLET_DEFAULTS.axes[1] };
        if (series.direction === 'horizontal') {
            axis0.position = POSITION.BOTTOM;
            axis1.position = POSITION.LEFT;
        }
        if (series.scale?.max !== undefined) {
            axis0.max = series.scale.max;
        }
        return { ...BULLET_DEFAULTS, axes: [axis0, axis1] };
    },
};
