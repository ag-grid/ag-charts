import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { RadarAreaSeries } from './radarAreaSeries';
import { POLAR_DEFAULTS } from '../polarDefaults';
import { RADAR_AREA_SERIES_THEME } from './radarAreaThemes';

export const RadarAreaModule: _ModuleSupport.SeriesModule<'radar-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radar-area',
    instanceConstructor: RadarAreaSeries,
    seriesDefaults: POLAR_DEFAULTS,
    themeTemplate: RADAR_AREA_SERIES_THEME,
    paletteFactory: ({ takeColors }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return {
            fill,
            stroke,
        };
    },
};
