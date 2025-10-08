import { ModuleRegistry } from 'ag-charts-core';

import { AllCommunityModules } from '../../main-modules';
import { VERSION } from '../../version';

export function registerInbuiltModules() {
    ModuleRegistry.registerMany(AllCommunityModules, VERSION);
}
