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
        fills: ['#c16068', '#a2bf8a', '#ebcc87', '#80a0c3', '#b58dae', '#85c0d1'],
        colorRange: ['#cb4b3f', '#6acb64'],
        label: {
            color: 'white',
            wrapping: 'never',
        },
        highlightStyle: {
            label: {
                color: undefined,
            },
            stroke: `rgba(0, 0, 0, 0.4)`,
            strokeWidth: 2,
        },
        fill: undefined, // Override default fill
        padding: 3,
    },
};
