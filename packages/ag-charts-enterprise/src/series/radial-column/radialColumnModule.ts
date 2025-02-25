import { type AgRadialColumnSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RadialColumnSeries } from './radialColumnSeries';
import { radialColumnSeriesOptionsDef } from './radialColumnSeriesOptionsDef';
import { RADIAL_COLUMN_SERIES_THEME } from './radialColumnThemes';

const { POLAR_AXIS_TYPE } = _ModuleSupport.ThemeConstants;
const { DEFAULT_COLOR_RANGE } = _ModuleSupport.ThemeSymbols;

export const RadialColumnModule: _ModuleSupport.SeriesModule<'radial-column'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['polar'],

    identifier: 'radial-column',
    moduleFactory: (ctx) => new RadialColumnSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: [{ type: POLAR_AXIS_TYPE.ANGLE_CATEGORY }, { type: POLAR_AXIS_TYPE.RADIUS_NUMBER }],
    themeTemplate: RADIAL_COLUMN_SERIES_THEME,
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

export const RadialColumnSeriesModule: SeriesModuleDefinition<AgRadialColumnSeriesOptions> = {
    type: 'series',
    name: 'radial-column',
    chartType: 'polar',
    enterprise: true,

    options: radialColumnSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadialColumnSeries(ctx),
};
