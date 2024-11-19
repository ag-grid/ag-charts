import { AgCharts, VERSION, _Scene, _Theme, _Util, setupCommunityModules } from 'ag-charts-community';
import type { IntegratedModule } from 'ag-charts-types';

import { setupEnterpriseModules as internalSetup } from './setup';

export { AgCharts, VERSION };

export function setupEnterpriseModules() {
    internalSetup();
    setupCommunityModules();
}

export const AgChartsEnterpriseModule: IntegratedModule = {
    VERSION,
    // @ts-expect-error types don't exactly match
    _Scene,
    // @ts-expect-error types don't exactly match
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    createSparkline: AgCharts.__createSparkline.bind(AgCharts),
    setup: setupEnterpriseModules,
    setGridContext: AgCharts.setGridContext.bind(AgCharts),
    setLicenseKey: AgCharts.setLicenseKey.bind(AgCharts),
    isEnterprise: true,
};
