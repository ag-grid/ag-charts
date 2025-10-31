import type { IntegratedModule } from 'ag-charts-types';

import { AgCharts } from './api/agCharts';
import { registerInbuiltModules } from './chart/factory/registerInbuiltModules';
import * as _Scene from './integrated-charts-scene';
import * as _Theme from './integrated-charts-theme';
import * as _Util from './integrated-charts-util';
import { VERSION } from './version';

// Documented APIs.
export { AG_CHARTS_LOCALE_EN_US } from 'ag-charts-locale';
export * from 'ag-charts-types';
export { time } from './util/time-interop';

// Undocumented APIs used by Enterprise Modules.
export * as _ModuleSupport from './module-support';
export * as _Widget from './widget/exports';
export * from './main-modules';

// Undocumented APIs used by Integrated Charts.
export const AgChartsCommunityModule = {
    VERSION,
    _Scene,
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    createSparkline: AgCharts.__createSparkline.bind(AgCharts),
    setup: registerInbuiltModules,
    isEnterprise: false,
} satisfies IntegratedModule;

export { AgCharts } from './api/agCharts';
export { VERSION } from './version';
export { registerInbuiltModules as setupCommunityModules } from './chart/factory/registerInbuiltModules';
export * as _Scene from './integrated-charts-scene';
export * as _Theme from './integrated-charts-theme';
export * as _Util from './integrated-charts-util';
