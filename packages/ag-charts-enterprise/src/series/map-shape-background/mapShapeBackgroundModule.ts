import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapShapeBackgroundSeries } from './mapShapeBackgroundSeries';

const { DEFAULT_BACKGROUND_COLOUR, DEFAULT_HIERARCHY_FILLS } = _Theme;

export const MapShapeBackgroundModule: _ModuleSupport.SeriesModule<'map-shape-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-shape-background',
    moduleFactory: (ctx) => new MapShapeBackgroundSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            stroke: DEFAULT_BACKGROUND_COLOUR,
            strokeWidth: 1,
        },
    },
    paletteFactory: ({ themeTemplateParameters }) => {
        return {
            fill: themeTemplateParameters.get(DEFAULT_HIERARCHY_FILLS)?.[1],
        };
    },
};
