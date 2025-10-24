import { GaugePresetModule, PriceVolumePresetModule } from 'ag-charts-community/modules';
import type { ModuleDefinition } from 'ag-charts-core';

import { AllCartesianEnterpriseModules } from './cartesian';
import { AllPolarEnterpriseModules } from './polar';
import { AllStandaloneEnterpriseModules } from './standalone';
import { AllTopologyEnterpriseModules } from './topology';

export const AllEnterpriseModules: ModuleDefinition[] = [
    ...AllCartesianEnterpriseModules,
    ...AllPolarEnterpriseModules,
    ...AllStandaloneEnterpriseModules,
    ...AllTopologyEnterpriseModules,
    PriceVolumePresetModule,
    GaugePresetModule,
];
