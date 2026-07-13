import { ModuleRegistry } from 'ag-charts-core';

import { AllCommunityModule } from './module-bundles/all';

export * from './main';

ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.UMD);
ModuleRegistry.registerModules(AllCommunityModule);
