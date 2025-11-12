import { ModuleRegistry } from 'ag-charts-core';

import { AllEnterpriseModule } from './module-bundles/all';

export * from './main';

ModuleRegistry.registerModules(AllEnterpriseModule);
