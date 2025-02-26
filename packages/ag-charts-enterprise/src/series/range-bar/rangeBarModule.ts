import { type AgRangeBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RangeBarSeries } from './rangeBarSeries';
import { rangeBarSeriesOptionsDef } from './rangeBarSeriesOptionsDef';
import { RANGE_BAR_SERIES_THEME } from './rangeBarThemes';

const { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } = _ModuleSupport.ThemeConstants;
const { DEFAULT_COLOR_RANGE } = _ModuleSupport.ThemeSymbols;

export const RangeBarModule: _ModuleSupport.SeriesModule<'range-bar'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-bar',
    moduleFactory: (ctx) => new RangeBarSeries(ctx),
    tooltipDefaults: { range: 'exact' },
    defaultAxes: _ModuleSupport.swapAxisCondition(
        [
            { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
            { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
        ],
        (series) => series?.direction === 'horizontal'
    ),
    themeTemplate: RANGE_BAR_SERIES_THEME,

    paletteFactory: ({ takeColors, themeTemplateParameters }) => {
        const {
            fills: [fill],
            strokes: [stroke],
        } = takeColors(1);
        const defaultColorRange = themeTemplateParameters.get(DEFAULT_COLOR_RANGE);
        return {
            fill,
            stroke,
            defaultColorRange,
        };
    },

    groupable: true,
};

export const RangeBarSeriesModule: SeriesModuleDefinition<AgRangeBarSeriesOptions> = {
    type: 'series',
    name: 'range-bar',
    chartType: 'cartesian',
    enterprise: true,

    options: rangeBarSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new RangeBarSeries(ctx),
};
