import { AgCharts } from './api/agCharts';
import { registerInbuiltModules } from './chart/factory/registerInbuiltModules';
import * as _Scene from './integrated-charts-scene';
import * as _Theme from './integrated-charts-theme';
import * as _Util from './integrated-charts-util';
import { VERSION } from './version';

export const ChartCommunityModule = {
    VERSION,
    _Scene,
    _Theme,
    _Util,
    setup: registerInbuiltModules,
    create: AgCharts.create,
};

export const SparklineModule = {
    VERSION,
    _Scene,
    _Theme,
    _Util,
    setup: registerInbuiltModules,
    create: AgCharts.__createSparkline,
};
