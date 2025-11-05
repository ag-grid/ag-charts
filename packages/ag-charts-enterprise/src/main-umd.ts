import { ModuleRegistry } from 'ag-charts-core';

import { AllCommunityAndEnterpriseModules } from './module-bundles/all-with-community';

export * from './main';

ModuleRegistry.registerModules(AllCommunityAndEnterpriseModules);
