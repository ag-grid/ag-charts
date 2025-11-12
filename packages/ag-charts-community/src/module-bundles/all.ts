import { type ModuleDefinition } from 'ag-charts-core';

import { GaugePresetModule, PriceVolumePresetModule, SparklinePresetModule } from '../api/preset/presetModules';
import { AllCartesianCommunityModules } from './cartesian';
import { AllPolarCommunityModules } from './polar';

export const AllCommunityModules: ModuleDefinition[] = [
    ...AllCartesianCommunityModules,
    ...AllPolarCommunityModules,

    // Presets
    PriceVolumePresetModule,
    GaugePresetModule,
    SparklinePresetModule,
];
