import { ModuleRegistry } from 'ag-charts-core';

import { AllEnterpriseModule } from './module-bundles/all';

export * from './main';

ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.UMD);
ModuleRegistry.registerModules(AllEnterpriseModule);
