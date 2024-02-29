import { AgCharts, time } from 'ag-charts-community';

import { setupEnterpriseModules } from './setup';

// Export types.
export * from 'ag-charts-community';
// Needed for UMD global exports to work correctly.
export { time, AgCharts };

setupEnterpriseModules();
