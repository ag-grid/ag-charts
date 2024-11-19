import { setupEnterpriseModules } from './setup';

// Export types.
export * from 'ag-charts-community';
export * from './main-modules';
// Needed for UMD global exports to work correctly.

setupEnterpriseModules();
