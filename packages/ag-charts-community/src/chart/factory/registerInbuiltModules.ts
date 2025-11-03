import { ModuleRegistry } from 'ag-charts-core';

import { AllCommunityModules } from '../../module-bundles/all';

export function registerInbuiltModules() {
    ModuleRegistry.registerModules(AllCommunityModules);
}
