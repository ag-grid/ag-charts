import type { IntegratedModule } from 'ag-charts-types';

import { AgCharts } from './api/agCharts';
import { registerInbuiltModules } from './chart/factory/registerInbuiltModules';
import * as _Scene from './integrated-charts-scene';
import * as _Theme from './integrated-charts-theme';
import * as _Util from './integrated-charts-util';
import { VERSION } from './version';

export { AgCharts } from './api/agCharts';
export { VERSION } from './version';
export { registerInbuiltModules as setupCommunityModules } from './chart/factory/registerInbuiltModules';

export const AgChartsCommunityModule: IntegratedModule = {
    VERSION,
    // @ts-expect-error types don't exactly match
    _Scene,
    // @ts-expect-error types don't exactly match
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    createSparkline: AgCharts.__createSparkline.bind(AgCharts),
    setup: registerInbuiltModules,
    setGridContext: AgCharts.setGridContext.bind(AgCharts),
    setLicenseKey: AgCharts.setLicenseKey.bind(AgCharts),
    isEnterprise: false,
};
