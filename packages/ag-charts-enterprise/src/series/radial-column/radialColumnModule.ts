import type { _ModuleSupport } from 'ag-charts-community';

import { RADIAL_COLUMN_DEFAULTS } from './radialColumnDefaults';
import { RadialColumnSeries } from './radialColumnSeries';
import { RADIAL_COLUMN_SERIES_THEME } from './radialColumnThemes';

export const RadialColumnModule: _ModuleSupport.SeriesModule<'radial-column'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radial-column',
    instanceConstructor: RadialColumnSeries,
    seriesDefaults: RADIAL_COLUMN_DEFAULTS,
    themeTemplate: RADIAL_COLUMN_SERIES_THEME,
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
