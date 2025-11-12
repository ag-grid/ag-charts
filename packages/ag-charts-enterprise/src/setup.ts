import { type AgChartOptions } from 'ag-charts-community';
import { ModuleRegistry, enterpriseRegistry } from 'ag-charts-core';

import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { AllEnterpriseModule } from './module-bundles/all';
import styles from './styles.css';

export function setupEnterpriseModules() {
    ModuleRegistry.registerModules(AllEnterpriseModule);

    enterpriseRegistry.styles = styles;
    enterpriseRegistry.licenseManager = (options: AgChartOptions) =>
        new LicenseManager(
            options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
        );
    enterpriseRegistry.injectWatermark = injectWatermark;
}
