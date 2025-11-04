import { ModuleRegistry } from 'ag-charts-core';

import { AllCommunityModules } from './module-bundles/all';

export * from './main';

ModuleRegistry.registerModules(AllCommunityModules);
