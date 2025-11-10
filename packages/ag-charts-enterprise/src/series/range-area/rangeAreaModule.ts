import { type AgRangeAreaSeriesOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import type { SeriesModuleDefinition } from 'ag-charts-core';

import { RangeAreaSeries } from './rangeArea';
import { rangeAreaSeriesOptionsDef } from './rangeAreaSeriesOptionsDef';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const { CARTESIAN_AXIS_TYPE, CARTESIAN_POSITION } = _ModuleSupport.ThemeConstants;

export const RangeAreaSeriesModule: SeriesModuleDefinition<AgRangeAreaSeriesOptions> = {
    type: 'series',
    name: 'range-area',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,

    options: rangeAreaSeriesOptionsDef,
    predictAxis: _ModuleSupport.predictCartesianTimeAxis,
    defaultAxes: {
        y: { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        x: { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    },
    themeTemplate: RANGE_AREA_SERIES_THEME,

    create: (ctx: _ModuleSupport.ModuleContext) => new RangeAreaSeries(ctx),
};
