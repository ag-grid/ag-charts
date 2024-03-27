import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MapShapeBackgroundSeries } from './mapShapeBackgroundSeries';

const { DEFAULT_BACKGROUND_COLOUR, DEFAULT_HIERARCHY_FILLS } = _Theme;

export const MapShapeBackgroundModule: _ModuleSupport.SeriesModule<'map-shape-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-shape-background',
    instanceConstructor: MapShapeBackgroundSeries,
    themeTemplate: {
        series: {
            stroke: DEFAULT_BACKGROUND_COLOUR,
            strokeWidth: 1,
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
    paletteFactory: ({ themeTemplateParameters }) => {
        const { properties } = themeTemplateParameters;
        return {
            fill: properties.get(DEFAULT_HIERARCHY_FILLS)?.[1],
        };
    },
};
