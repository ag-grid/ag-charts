import {
    AgCharts,
    type IntegratedChartModule,
    VERSION,
    _Scene,
    _Theme,
    _Util,
    setupCommunityModules,
} from 'ag-charts-community';

import { setupEnterpriseModules as internalSetup } from './setup';

export { AgCharts, VERSION };

export function setupEnterpriseModules() {
    internalSetup();
    setupCommunityModules();
}

export const ChartEnterpriseModule: IntegratedChartModule = {
    VERSION,
    // @ts-ignore
    _Scene,
    // @ts-ignore
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    setup: setupEnterpriseModules,
    setGridContext: AgCharts.setGridContext.bind(AgCharts),
    setLicenseKey: AgCharts.setLicenseKey.bind(AgCharts),
    isEnterprise: true,
};
