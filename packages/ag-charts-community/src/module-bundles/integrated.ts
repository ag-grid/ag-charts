import { ModuleRegistry } from 'ag-charts-core';
import type { IntegratedModule } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import * as _Scene from '../integrated-charts-scene';
import * as _Theme from '../integrated-charts-theme';
import * as _Util from '../integrated-charts-util';
import { VERSION } from '../version';
import { AllCommunityModules } from './all';

export const AgChartsCommunityModule = {
    VERSION,
    _Scene,
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    createSparkline: AgCharts.__createSparkline.bind(AgCharts),
    setup: () => ModuleRegistry.registerModules(AllCommunityModules),
    isEnterprise: false,
} satisfies IntegratedModule;
