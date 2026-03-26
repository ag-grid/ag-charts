import { type ModuleDefinition } from 'ag-charts-core';

import { SparklinePresetModule } from '../api/preset/presetModules';
import { AllCartesianModule } from './cartesian';
import { AllPolarModule } from './polar';

export const AllCommunityModule: ModuleDefinition[] = [
    AllCartesianModule,
    AllPolarModule,

    // Presets
    SparklinePresetModule,
].flat();
