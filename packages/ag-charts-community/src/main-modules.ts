import type { IntegratedChartModule, IntegratedSparklineModule } from 'ag-charts-types';

import { AgCharts } from './api/agCharts';
import { registerInbuiltModules } from './chart/factory/registerInbuiltModules';
import * as _Scene from './integrated-charts-scene';
import * as _Theme from './integrated-charts-theme';
import * as _Util from './integrated-charts-util';
import { VERSION } from './version';

export { AgCharts } from './api/agCharts';
export { VERSION } from './version';
export { registerInbuiltModules as setupCommunityModules } from './chart/factory/registerInbuiltModules';

export const ChartCommunityModule: IntegratedChartModule = {
    VERSION,
    // @ts-ignore
    _Scene,
    // @ts-ignore
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    setup: registerInbuiltModules,
    setGridContext: AgCharts.setGridContext.bind(AgCharts),
    setLicenseKey: AgCharts.setLicenseKey.bind(AgCharts),
    isEnterprise: false,
};

export const SparklineModule: IntegratedSparklineModule = {
    VERSION,
    // @ts-ignore
    _Scene,
    // @ts-ignore
    _Theme,
    _Util,
    create: AgCharts.__createSparkline.bind(AgCharts),
    setup: registerInbuiltModules,
    setGridContext: AgCharts.setGridContext.bind(AgCharts),
    setLicenseKey: AgCharts.setLicenseKey.bind(AgCharts),
    isEnterprise: false,
};
