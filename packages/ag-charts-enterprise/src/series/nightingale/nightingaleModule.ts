import { _ModuleSupport } from 'ag-charts-community';

import { NightingaleSeries } from './nightingaleSeries';
import { NIGHTINGALE_SERIES_THEME } from './nightingaleThemes';

const {
    ThemeSymbols: { DEFAULT_POLAR_SERIES_STROKE },
    ThemeConstants: { POLAR_AXIS_TYPE },
} = _ModuleSupport;

export const NightingaleModule: _ModuleSupport.SeriesModule<'nightingale'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'nightingale',
    moduleFactory: (ctx) => new NightingaleSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, { type: POLAR_AXIS_TYPE.RADIUS_NUMBER }],
    themeTemplate: NIGHTINGALE_SERIES_THEME,
    paletteFactory({ takeColors, userPalette }) {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return {
            fill,
            stroke: userPalette !== 'inbuilt' ? stroke : DEFAULT_POLAR_SERIES_STROKE,
        };
    },
    stackable: true,
    groupable: true,
    stackedByDefault: true,
};
