import { ModuleRegistry } from 'ag-charts-core';
import type { IntegratedModule } from 'ag-charts-types';

import { AgCharts } from '../api/agCharts';
import { _Theme } from '../integrated-charts';
import { VERSION } from '../version';
import { AllCommunityModule } from './all';

export const AgChartsCommunityModule = {
    VERSION,
    _Theme,
    create: AgCharts.create.bind(AgCharts),
    createSparkline: AgCharts.__createSparkline.bind(AgCharts),
    setup: () => {
        ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.Integrated);
        ModuleRegistry.registerModules(AllCommunityModule);
    },
    isEnterprise: false,
} satisfies IntegratedModule;
