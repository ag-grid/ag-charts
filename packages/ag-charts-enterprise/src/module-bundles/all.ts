import { AllCommunityModule, GaugePresetModule, PriceVolumePresetModule } from 'ag-charts-community';
import type { ModuleDefinition } from 'ag-charts-core';

import { AllCartesianEnterpriseModules } from './cartesian';
import { AllPolarEnterpriseModules } from './polar';
import { AllStandaloneEnterpriseModules } from './standalone';
import { AllTopologyEnterpriseModules } from './topology';

export const AllEnterpriseModule: ModuleDefinition[] = [
    ...AllCommunityModule,
    ...AllCartesianEnterpriseModules,
    ...AllPolarEnterpriseModules,
    ...AllStandaloneEnterpriseModules,
    ...AllTopologyEnterpriseModules,
    PriceVolumePresetModule,
    GaugePresetModule,
];
