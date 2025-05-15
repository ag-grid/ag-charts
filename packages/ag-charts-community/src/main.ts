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
export { AgCharts, VERSION };

// Undocumented APIs used by Enterprise Modules.
export * as _ModuleSupport from './module-support';
export * as _Widget from './widget/exports';
export { registerInbuiltModules as setupCommunityModules };

// Undocumented APIs used by Integrated Charts.
export { _Scene, _Theme, _Util };

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
