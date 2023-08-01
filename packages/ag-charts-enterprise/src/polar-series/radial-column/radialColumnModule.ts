import type { _ModuleSupport } from 'ag-charts-community';
import { _Scale } from 'ag-charts-community';
import { NIGHTINGALE_DEFAULTS } from '../nightingale/nightingaleDefaults';
import { RadialColumnSeries } from './radialColumnSeries';
import { NIGHTINGALE_SERIES_THEME } from '../nightingale/nightingaleThemes';

export const RadialColumnModule: _ModuleSupport.SeriesModule = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radial-column',
    instanceConstructor: RadialColumnSeries,
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
