import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MapShapeBackgroundSeries } from './mapShapeBackgroundSeries';

const { DEFAULT_MAP_BACKGROUND_FILL, DEFAULT_BACKGROUND_COLOUR } = _Theme;

export const MapShapeBackgroundModule: _ModuleSupport.SeriesModule<'map-shape-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-shape-background',
    instanceConstructor: MapShapeBackgroundSeries,
    seriesDefaults: {},
    themeTemplate: {
        series: {
            fill: DEFAULT_MAP_BACKGROUND_FILL,
            stroke: DEFAULT_BACKGROUND_COLOUR,
            strokeWidth: 1,
            tooltip: {
                enabled: false,
            },
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
