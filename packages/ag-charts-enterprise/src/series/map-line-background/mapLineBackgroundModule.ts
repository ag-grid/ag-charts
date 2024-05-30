import { _ModuleSupport, _Theme } from 'ag-charts-community';

import { MAP_THEME_DEFAULTS } from '../map-util/mapThemeDefaults';
import { MapLineBackgroundSeries } from './mapLineBackgroundSeries';

const { DEFAULT_HIERARCHY_STROKES } = _Theme;

export const MapLineBackgroundModule: _ModuleSupport.SeriesModule<'map-line-background'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['topology'],

    identifier: 'map-line-background',
    instanceConstructor: MapLineBackgroundSeries,
    themeTemplate: {
        ...MAP_THEME_DEFAULTS,
        series: {
            strokeWidth: 1,
            lineDash: [0],
            lineDashOffset: 0,
        },
    },
    paletteFactory: ({ themeTemplateParameters }) => {
        return {
            stroke: themeTemplateParameters.get(DEFAULT_HIERARCHY_STROKES)?.[1],
        };
    },
};
