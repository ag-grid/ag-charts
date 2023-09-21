import type { _ModuleSupport } from 'ag-charts-community';
import { RadialBarSeries } from './radialBarSeries';
import { RADIAL_BAR_DEFAULTS } from './radialBarDefaults';
import { RADIAL_BAR_SERIES_THEME } from './radialBarThemes';

export const RadialBarModule: _ModuleSupport.SeriesModule<'radial-bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radial-bar',
    instanceConstructor: RadialBarSeries,
    seriesDefaults: RADIAL_BAR_DEFAULTS,
    themeTemplate: RADIAL_BAR_SERIES_THEME,
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
    stackable: true,
    groupable: true,
};
