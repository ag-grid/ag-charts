import { type AgPyramidSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { PyramidSeries } from './pyramidSeries';
import { pyramidSeriesOptionsDef } from './pyramidSeriesOptionsDef';
import { PYRAMID_SERIES_THEME } from './pyramidThemes';

const {
    ThemeSymbols: { DEFAULT_COLOR_RANGE },
} = _ModuleSupport;

export const PyramidModule: _ModuleSupport.SeriesModule<'pyramid'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['standalone'],

    identifier: 'pyramid',
    moduleFactory: (ctx) => new PyramidSeries(ctx),
    solo: true,
    tooltipDefaults: { range: 'exact' },
    themeTemplate: PYRAMID_SERIES_THEME,

    paletteFactory: ({ takeColors, colorsCount, themeTemplateParameters }) => {
        const { fills, strokes } = takeColors(colorsCount);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        return { fills, strokes, defaultColorRange };
    },
};

export const PyramidSeriesModule: SeriesModuleDefinition<AgPyramidSeriesOptions> = {
    type: 'series',
    name: 'pyramid',
    chartType: 'standalone',
    enterprise: true,

    options: pyramidSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new PyramidSeries(ctx),
};
