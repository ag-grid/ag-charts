import type { IntegratedChartModule, IntegratedSparklineModule } from 'ag-charts-types';

import { AgCharts } from './api/agCharts';
import { registerInbuiltModules } from './chart/factory/registerInbuiltModules';
import * as _Scene from './integrated-charts-scene';
import * as _Theme from './integrated-charts-theme';
import * as _Util from './integrated-charts-util';
import { VERSION } from './version';

export const ChartCommunityModule: IntegratedChartModule = {
    AgCharts,
    VERSION,
    // @ts-ignore
    _Scene,
    // @ts-ignore
    _Theme,
    _Util,
    create: AgCharts.create,
    setup: registerInbuiltModules,
    isEnterprise: false,
};

export const SparklineModule: IntegratedSparklineModule = {
    AgCharts,
    VERSION,
    // @ts-ignore
    _Scene,
    // @ts-ignore
    _Theme,
    _Util,
    create: AgCharts.__createSparkline,
    setup: registerInbuiltModules,
    isEnterprise: false,
};
