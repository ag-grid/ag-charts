import { AgCharts, ModuleRegistry, VERSION, _Scene, _Theme, _Util } from 'ag-charts-community';
import type { IntegratedModule } from 'ag-charts-types';

import { LicenseManager as RealLicenseManager } from '../license/licenseManager';
import { setupEnterpriseModules } from '../setup';

export const LicenseManager = {
    setLicenseKey(key: string) {
        RealLicenseManager.setLicenseKey(key);
    },
};

export const AgChartsEnterpriseModule: IntegratedModule = {
    VERSION,
    _Scene,
    _Theme,
    _Util,
    create: AgCharts.create.bind(AgCharts),
    createSparkline: AgCharts.__createSparkline.bind(AgCharts),
    setup: () => {
        ModuleRegistry.setRegistryMode(ModuleRegistry.RegistryMode.Integrated);
        setupEnterpriseModules();
    },
    setGridContext: RealLicenseManager.setGridContext.bind(RealLicenseManager),
    setLicenseKey: RealLicenseManager.setLicenseKey.bind(RealLicenseManager),
    isEnterprise: true,
};
