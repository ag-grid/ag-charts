import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MapLineBackgroundSeries } from './mapLineBackgroundSeries';

const { EXTENDS_SERIES_DEFAULTS, DEFAULT_LABEL_COLOUR } = _Theme;

export const MapLineBackgroundModule: _ModuleSupport.SeriesModule<'map-line-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-line-background',
    instanceConstructor: MapLineBackgroundSeries,
    themeTemplate: {
        series: {
            __extends__: EXTENDS_SERIES_DEFAULTS,
            stroke: DEFAULT_LABEL_COLOUR,
            strokeWidth: 1,
            strokeOpacity: 0.2,
            lineDash: [0],
            lineDashOffset: 0,
        },
        legend: {
            enabled: false,
        },
        gradientLegend: {
            enabled: false,
        },
        tooltip: {
            range: 'exact',
        },
    },
};
