import { type AgChartOptions, VERSION, _ModuleSupport } from 'ag-charts-community';
import { ModuleRegistry } from 'ag-charts-core';

import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { AllEnterpriseModules } from './main-modules';
import styles from './styles.css';

export function setupEnterpriseModules() {
    ModuleRegistry.registerMany(AllEnterpriseModules, VERSION);

    _ModuleSupport.enterpriseModule.isEnterprise = true;
    _ModuleSupport.enterpriseModule.styles = styles;
    _ModuleSupport.enterpriseModule.licenseManager = (options: AgChartOptions) =>
        new LicenseManager(
            options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
        );
    _ModuleSupport.enterpriseModule.injectWatermark = injectWatermark;
}
