import { _ModuleSupport } from 'ag-charts-community';

import { RadialBarSeries } from './radialBarSeries';
import { RADIAL_BAR_SERIES_THEME } from './radialBarThemes';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;

export const RadialBarModule: _ModuleSupport.SeriesModule<'radial-bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radial-bar',
    moduleFactory: (ctx) => new RadialBarSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_NUMBER }, { type: POLAR_AXIS_TYPE.RADIUS_CATEGORY }],
    themeTemplate: RADIAL_BAR_SERIES_THEME,
    paletteFactory: ({ takeColors }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        return { fill, stroke };
    },
    stackable: true,
    groupable: true,
};
