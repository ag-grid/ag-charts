import { type AgChartOptions, _ModuleSupport } from 'ag-charts-community';
import { ModuleRegistry } from 'ag-charts-core';

import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { AllEnterpriseModules } from './module-bundles';
import styles from './styles.css';

export function setupEnterpriseModules() {
    ModuleRegistry.registerModules(AllEnterpriseModules);

    _ModuleSupport.enterpriseModule.isEnterprise = true;
    _ModuleSupport.enterpriseModule.styles = styles;
    _ModuleSupport.enterpriseModule.licenseManager = (options: AgChartOptions) =>
        new LicenseManager(
            options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
        );
    _ModuleSupport.enterpriseModule.injectWatermark = injectWatermark;
}
