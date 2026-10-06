import { type AgHlcSeriesOptions, CartesianChartModule, VERSION, _ModuleSupport } from 'ag-charts-community';
import {
    CARTESIAN_AXIS_TYPE,
    CARTESIAN_POSITION,
    ChartAxisDirection,
    type SeriesModuleDefinition,
} from 'ag-charts-core';

import { BackgroundRegionsModule } from '../../features/background-regions/backgroundRegionsModule';
import { HlcSeries } from './hlcSeries';
import { hlcSeriesOptionsDef, hlcSeriesThemeableOptionsDef } from './hlcSeriesOptionsDef';
import { HLC_SERIES_THEME } from './hlcThemes';

const { predictCartesianFinancialAxis } = _ModuleSupport;

export const HlcSeriesModule: SeriesModuleDefinition<AgHlcSeriesOptions> = {
    type: 'series',
    name: 'hlc',
    chartType: 'cartesian',
    enterprise: true,
    version: VERSION,
    dependencies: [CartesianChartModule, BackgroundRegionsModule],

    options: hlcSeriesOptionsDef,
    matchingKeys: ['xKey', 'highKey', 'lowKey', 'closeKey'],
    predictAxis: predictCartesianFinancialAxis,
    defaultAxes: {
        y: { type: CARTESIAN_AXIS_TYPE.NUMBER, position: CARTESIAN_POSITION.LEFT },
        x: { type: CARTESIAN_AXIS_TYPE.ORDINAL_TIME, position: CARTESIAN_POSITION.BOTTOM },
    },
    axisKeys: { [ChartAxisDirection.X]: 'xKeyAxis', [ChartAxisDirection.Y]: 'yKeyAxis' },
    themeOptions: hlcSeriesThemeableOptionsDef,
    themeTemplate: HLC_SERIES_THEME,

    create: (ctx) => new HlcSeries(ctx),
};
