import { type AgChartOptions } from 'ag-charts-community';
import { ModuleRegistry, enterpriseRegistry } from 'ag-charts-core';

import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { AllEnterpriseModule } from './module-bundles/all';
import { Background } from './features/background/background';
import { Foreground } from './features/foreground/foreground';
import styles from './styles.css';

export function setupEnterpriseModules() {
    ModuleRegistry.registerModules(AllEnterpriseModule);

    enterpriseRegistry.styles = styles;
    enterpriseRegistry.licenseManager = (options: AgChartOptions) =>
        new LicenseManager(
            options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
        );
    enterpriseRegistry.injectWatermark = injectWatermark;
    enterpriseRegistry.createBackground = (ctx) => new Background(ctx);
    enterpriseRegistry.createForeground = (ctx) => new Foreground(ctx);
}
