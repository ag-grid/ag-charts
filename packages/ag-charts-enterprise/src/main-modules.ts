import { AgCharts, VERSION, _Scene, _Theme, _Util, setupCommunityModules } from 'ag-charts-community';
import type { IntegratedModule } from 'ag-charts-types';

import { LicenseManager as RealLicenseManager } from './license/licenseManager';
import { setupEnterpriseModules as internalSetup } from './setup';

const LicenseManager = {
    setLicenseKey(key: string) {
        RealLicenseManager.setLicenseKey(key);
    },
};
export { AgCharts, VERSION, LicenseManager };

export function setupEnterpriseModules() {
    internalSetup();
    setupCommunityModules();
}

export const AgChartsEnterpriseModule: IntegratedModule = {
    VERSION,
    _Scene,
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    createSparkline: AgCharts.__createSparkline.bind(AgCharts),
    setup: setupEnterpriseModules,
    setGridContext: RealLicenseManager.setGridContext.bind(RealLicenseManager),
    setLicenseKey: RealLicenseManager.setLicenseKey.bind(RealLicenseManager),
    isEnterprise: true,
};
