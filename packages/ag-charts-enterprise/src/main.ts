import type { AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import { AgCharts, time } from 'ag-charts-community';

import { AngleCategoryAxisModule } from './axes/angle-category/main';
import { AngleNumberAxisModule } from './axes/angle-number/main';
import { RadiusCategoryAxisModule } from './axes/radius-category/main';
import { RadiusNumberAxisModule } from './axes/radius-number/main';
import { AnimationModule } from './features/animation/main';
import { BackgroundModule } from './features/background/main';
import { ContextMenuModule } from './features/context-menu/main';
import { CrosshairModule } from './features/crosshair/main';
import { ErrorBarsModule } from './features/error-bar/errorBarModule';
import { ZoomModule } from './features/zoom/main';
import { GradientLegendModule } from './gradient-legend/main';
import { LicenseManager } from './license/licenseManager';
import { BoxPlotModule } from './series/box-plot/boxPlotModule';
import { BulletModule } from './series/bullet/bulletModule';
import { HeatmapModule } from './series/heatmap/main';
import { NightingaleModule } from './series/nightingale/main';
import { RadarAreaModule } from './series/radar-area/main';
import { RadarLineModule } from './series/radar-line/main';
import { RadialBarModule } from './series/radial-bar/main';
import { RadialColumnModule } from './series/radial-column/main';
import { RangeAreaModule } from './series/range-area/rangeAreaModule';
import { RangeBarModule } from './series/range-bar/main';
import { SunburstSeriesModule } from './series/sunburst/sunburstSeriesModule';
import { TreemapSeriesModule } from './series/treemap/treemapSeriesModule';
import { WaterfallModule } from './series/waterfall/main';

// Export types.
export * from 'ag-charts-community';
// Needed for UMD global exports to work correctly.
export { time, AgCharts };

_ModuleSupport.registerModule(AngleCategoryAxisModule);
_ModuleSupport.registerModule(AngleNumberAxisModule);
_ModuleSupport.registerModule(AnimationModule);
_ModuleSupport.registerModule(BackgroundModule);
_ModuleSupport.registerModule(BoxPlotModule);
_ModuleSupport.registerModule(BulletModule);
_ModuleSupport.registerModule(ContextMenuModule);
_ModuleSupport.registerModule(CrosshairModule);
_ModuleSupport.registerModule(ErrorBarsModule);
_ModuleSupport.registerModule(GradientLegendModule);
_ModuleSupport.registerModule(HeatmapModule);
_ModuleSupport.registerModule(NightingaleModule);
_ModuleSupport.registerModule(RadarAreaModule);
_ModuleSupport.registerModule(RadarLineModule);
_ModuleSupport.registerModule(RadialBarModule);
_ModuleSupport.registerModule(RadialColumnModule);
_ModuleSupport.registerModule(RadiusCategoryAxisModule);
_ModuleSupport.registerModule(RadiusNumberAxisModule);
_ModuleSupport.registerModule(RangeBarModule);
_ModuleSupport.registerModule(RangeAreaModule);
_ModuleSupport.registerModule(SunburstSeriesModule);
_ModuleSupport.registerModule(TreemapSeriesModule);
_ModuleSupport.registerModule(WaterfallModule);
_ModuleSupport.registerModule(ZoomModule);

_ModuleSupport.enterpriseModule.isEnterprise = true;
_ModuleSupport.enterpriseModule.licenseManager = (options: AgChartOptions) =>
    new LicenseManager(
        options.container?.ownerDocument ?? (typeof document !== 'undefined' ? document : undefined)
    ).validateLicense();
