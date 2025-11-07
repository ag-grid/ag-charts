import { type ModuleDefinition, ModuleRegistry } from 'ag-charts-core';

import { SparklinePresetModule } from '../api/preset/presetModules';
import { GaugePresetModule, PriceVolumePresetModule } from '../api/preset/presetModules';
import { StandaloneChartModule, TopologyChartModule } from '../chart/enterpriseChartModules';
import { AllCartesianCommunityModules } from './cartesian';
import { AllPolarCommunityModules } from './polar';

export const AllCommunityModules: ModuleDefinition[] = [
    ...AllCartesianCommunityModules,
    ...AllPolarCommunityModules,

    // Enterprise placeholders
    StandaloneChartModule,
    TopologyChartModule,

    // Presets
    PriceVolumePresetModule,
    GaugePresetModule,
    SparklinePresetModule,
];

export function registerAllCommunityModules(): void {
    ModuleRegistry.registerModules(AllCommunityModules);
}
