import { type AgChartOptions } from 'ag-charts-community';
import { ModuleRegistry, enterpriseRegistry } from 'ag-charts-core';

import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { AllCommunityAndEnterpriseModules } from './module-bundles/all-with-community';
import styles from './styles.css';

export function setupEnterpriseModules() {
    ModuleRegistry.registerModules(AllCommunityAndEnterpriseModules);

    enterpriseRegistry.styles = styles;
    enterpriseRegistry.licenseManager = (options: AgChartOptions) =>
        new LicenseManager(
            options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
        );
    enterpriseRegistry.injectWatermark = injectWatermark;
}
