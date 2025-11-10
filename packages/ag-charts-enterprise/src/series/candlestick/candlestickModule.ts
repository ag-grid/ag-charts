import { type AgCandlestickSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { CandlestickSeries } from './candlestickSeries';
import { candlestickSeriesOptionsDef } from './candlestickSeriesOptionsDef';
import { CANDLESTICK_SERIES_THEME } from './candlestickThemes';

const { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } = _ModuleSupport.ThemeConstants;

export const CandlestickSeriesModule: SeriesModuleDefinition<AgCandlestickSeriesOptions> = {
    type: 'series',
    name: 'candlestick',
    chartType: 'cartesian',
    enterprise: true,
    groupable: false,
    version: VERSION,

    options: candlestickSeriesOptionsDef,
    defaultAxes: {
        y: {
            type: CARTESIAN_AXIS_TYPE.NUMBER,
            position: CARTESIAN_POSITION.LEFT,
        },
        x: {
            type: CARTESIAN_AXIS_TYPE.ORDINAL_TIME,
            position: CARTESIAN_POSITION.BOTTOM,
        },
    },
    themeTemplate: CANDLESTICK_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new CandlestickSeries(ctx),
};
