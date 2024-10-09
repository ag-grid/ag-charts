import { AgCharts, setupCommunityModules } from 'ag-charts-community';

import { setupEnterpriseModules as internalSetup } from './setup';

export function setupEnterpriseModules() {
    internalSetup();
    return setupCommunityModules();
}

export { AgCharts };
