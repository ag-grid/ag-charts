import { type AgRadialBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RadialBarSeries } from './radialBarSeries';
import { radialBarSeriesOptionsDef } from './radialBarSeriesOptionsDef';
import { RADIAL_BAR_SERIES_THEME } from './radialBarThemes';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;
const { DEFAULT_COLOR_RANGE } = _ModuleSupport.ThemeSymbols;

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
    paletteFactory: ({ takeColors, themeTemplateParameters }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        return { fill, stroke, defaultColorRange };
    },
    stackable: true,
    groupable: true,
};

export const RadialBarSeriesModule: SeriesModuleDefinition<AgRadialBarSeriesOptions> = {
    type: 'series',
    name: 'radial-bar',
    chartType: 'polar',
    enterprise: true,

    options: radialBarSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadialBarSeries(ctx),
};
