import { type AgRangeAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RangeAreaSeries } from './rangeArea';
import { rangeAreaSeriesOptionsDef } from './rangeAreaSeriesOptionsDef';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const {
    ThemeConstants: { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION },
} = _ModuleSupport;

export const RangeAreaModule: _ModuleSupport.SeriesModule<'range-area'> = {
    type: 'series',
    optionsKey: 'series[]',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],

    identifier: 'range-area',
    moduleFactory: (ctx) => new RangeAreaSeries(ctx),
    defaultAxes: [
        { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    ],
    themeTemplate: RANGE_AREA_SERIES_THEME,
};

export const RangeAreaSeriesModule: SeriesModuleDefinition<AgRangeAreaSeriesOptions> = {
    type: 'series',
    name: 'range-area',
    chartType: 'cartesian',
    enterprise: true,

    options: rangeAreaSeriesOptionsDef,

    create: (ctx: _ModuleSupport.ModuleContext) => new RangeAreaSeries(ctx),
};
