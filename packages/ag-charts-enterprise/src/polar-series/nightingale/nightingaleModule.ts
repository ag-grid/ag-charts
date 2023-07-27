import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { NIGHTINGALE_DEFAULTS } from './nightingaleDefaults';
import { NightingaleSeries } from './nightingaleSeries';
import { NIGHTINGALE_SERIES_THEME } from './nightingaleThemes';

export const NightingaleModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'nightingale',
    instanceConstructor: NightingaleSeries,
    seriesDefaults: NIGHTINGALE_DEFAULTS,
    themeTemplate: NIGHTINGALE_SERIES_THEME,
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
