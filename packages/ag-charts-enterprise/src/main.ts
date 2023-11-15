import type { AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { AngleCategoryAxisModule } from './axes/angle-category/main';
import { AngleNumberAxisModule } from './axes/angle-number/main';
import { RadiusCategoryAxisModule } from './axes/radius-category/main';
import { RadiusNumberAxisModule } from './axes/radius-number/main';
import { AnimationModule } from './features/animation/main';
import { BackgroundModule } from './features/background/main';
import { ContextMenuModule } from './features/context-menu/main';
import { CrosshairModule } from './features/crosshair/main';
import { ErrorBarsModule } from './features/error-bar/errorBarModule';
import { NavigatorModule } from './features/navigator/navigatorModule';
import { ZoomModule } from './features/zoom/main';
import { GradientLegendModule } from './gradient-legend/main';
import { LicenseManager } from './license/licenseManager';
import { BoxPlotModule } from './series/box-plot/boxPlotModule';
import { BulletModule } from './series/bullet/bulletModule';
import { HeatmapModule } from './series/heatmap/main';
import { HistogramSeriesModule } from './series/histogram/histogramSeriesModule';
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

export * from 'ag-charts-community';
export { AgChart, VERSION, time } from 'ag-charts-community';

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
_ModuleSupport.registerModule(HistogramSeriesModule);
_ModuleSupport.registerModule(NightingaleModule);
_ModuleSupport.registerModule(NavigatorModule);
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

_ModuleSupport.enterpriseModule.licenseManager = (options: AgChartOptions) =>
    new LicenseManager(
        options.container?.ownerDocument ?? typeof document !== 'undefined' ? document : undefined
    ).validateLicense();
