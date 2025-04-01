import { type AgCandlestickSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { CandlestickSeries } from './candlestickSeries';
import { candlestickSeriesOptionsDef } from './candlestickSeriesOptionsDef';
import { CANDLESTICK_SERIES_THEME } from './candlestickThemes';

const { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } = _ModuleSupport.ThemeConstants;

export const CandlestickModule: _ModuleSupport.SeriesModule<'candlestick'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'candlestick',
    moduleFactory: (ctx) => new CandlestickSeries(ctx),
    tooltipDefaults: { range: 'nearest' },
    defaultAxes: [
        {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        {
            type: CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    ],
    themeTemplate: CANDLESTICK_SERIES_THEME,
    groupable: false,
};

export const CandlestickSeriesModule: SeriesModuleDefinition<AgCandlestickSeriesOptions<never>> = {
    type: 'series',
    name: 'candlestick',
    chartType: 'cartesian',
    enterprise: true,

    options: candlestickSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new CandlestickSeries(ctx),
};
