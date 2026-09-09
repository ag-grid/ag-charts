import { ModuleRegistry, enterpriseRegistry } from 'ag-charts-core';

import { backgroundRegionsTheme } from './features/background-regions/backgroundRegionsTheme';
import { Background } from './features/background/background';
import { Foreground } from './features/foreground/foreground';
import { SeriesArea } from './features/series-area/seriesArea';
import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { AllEnterpriseModule } from './module-bundles/all';
import styles from './styles.css';

export function setupEnterpriseModules() {
    ModuleRegistry.registerModules(AllEnterpriseModule);

    enterpriseRegistry.styles = styles;
    enterpriseRegistry.licenseManager = (document) => new LicenseManager(document);
    enterpriseRegistry.injectWatermark = injectWatermark;
    enterpriseRegistry.createBackground = (ctx) => new Background(ctx);
    enterpriseRegistry.createForeground = (ctx) => new Foreground(ctx);
    enterpriseRegistry.createSeriesArea = (ctx) => new SeriesArea(ctx);
    enterpriseRegistry.seriesAreaThemeTemplate = { backgroundRegions: backgroundRegionsTheme };
}
