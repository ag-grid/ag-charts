import { type AgRangeAreaSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    LABEL_MANAGER_SERVICES,
    type SeriesModuleDefinition,
} from 'ag-charts-core';

import { BackgroundRegionsModule } from '../../features/background-regions/backgroundRegionsModule';
import { RangeAreaSeries } from './rangeArea';
import { rangeAreaSeriesOptionsDef, rangeAreaSeriesThemeableOptionsDef } from './rangeAreaSeriesOptionsDef';
import { RANGE_AREA_SERIES_THEME } from './rangeAreaThemes';

const { predictCartesianNonPrimitiveAxis } = _ModuleSupport;

export const RangeAreaSeriesModule: SeriesModuleDefinition<AgRangeAreaSeriesOptions> = {
    type: 'series',
    name: 'range-area',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule, BackgroundRegionsModule],
    services: LABEL_MANAGER_SERVICES,

    options: rangeAreaSeriesOptionsDef,

    themeOptions: rangeAreaSeriesThemeableOptionsDef,
    matchingKeys: ['xKey', 'yLowKey', 'yHighKey', 'normalizedTo'],
    predictAxis: predictCartesianNonPrimitiveAxis,
    defaultAxes: {
        y: { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        x: { type: CARTESIAN_AXIS_TYPE.CATEGORY, position: CARTESIAN_POSITION.BOTTOM },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeTemplate: RANGE_AREA_SERIES_THEME,

    create: (ctx) => new RangeAreaSeries(ctx),
};
