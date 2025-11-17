import { type ModuleDefinition } from 'ag-charts-core';

import { SparklinePresetModule } from '../api/preset/presetModules';
import { AllCartesianCommunityModules } from './cartesian';
import { AllPolarCommunityModules } from './polar';

export const AllCommunityModule: ModuleDefinition[] = [
    ...AllCartesianCommunityModules,
    ...AllPolarCommunityModules,

    // Presets
    SparklinePresetModule,
];
