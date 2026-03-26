import { ModuleRegistry } from 'ag-charts-core';

import { AllCommunityModule } from './module-bundles/all';

export * from './main';

ModuleRegistry.registerModules(AllCommunityModule);
