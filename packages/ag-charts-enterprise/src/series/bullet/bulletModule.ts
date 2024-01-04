import { _ModuleSupport } from 'ag-charts-community';

import { BULLET_DEFAULTS } from './bulletDefaults';
import { BulletSeries } from './bulletSeries';
import { BulletColorRange } from './bulletSeriesProperties';
import { BULLET_SERIES_THEME } from './bulletThemes';

const { deepClone, isNumber } = _ModuleSupport;

export const BulletModule: _ModuleSupport.SeriesModule<'bullet'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    identifier: 'bullet',
    solo: true,
    optionConstructors: { 'series[].colorRanges': BulletColorRange },
    instanceConstructor: BulletSeries,
    seriesDefaults: ({ scale }) => {
        const seriesDefaults = deepClone(BULLET_DEFAULTS);
        if (scale && isNumber(scale.max)) {
            seriesDefaults.axes[0].max = scale.max;
        }
        return seriesDefaults;
    },
    themeTemplate: BULLET_SERIES_THEME,
    swapDefaultAxesCondition: (series) => series?.direction === 'horizontal',
};
