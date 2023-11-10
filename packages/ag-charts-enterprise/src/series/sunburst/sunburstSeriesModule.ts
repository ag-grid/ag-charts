import { type _ModuleSupport, _Theme } from 'ag-charts-community';

import { SunburstSeries } from './sunburstSeries';

const { EXTENDS_SERIES_DEFAULTS } = _Theme;

export const SunburstSeriesModule: _ModuleSupport.SeriesModule<'sunburst'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['hierarchy'],

    identifier: 'sunburst',
    instanceConstructor: SunburstSeries,
    seriesDefaults: {},
    themeTemplate: {
        __extends__: EXTENDS_SERIES_DEFAULTS,
        showInLegend: false,
        highlightStyle: {
            stroke: 'black',
            strokeWidth: 2,
            strokeOpacity: 0.2,
        },
    },
};
