import { type AgChartOptions, _ModuleSupport } from 'ag-charts-community';

import { AngleCategoryAxisModule } from './axes/angle-category/main';
import { AngleNumberAxisModule } from './axes/angle-number/main';
import { OrdinalTimeAxisModule } from './axes/ordinal/ordinalTimeAxisModule';
import { RadiusCategoryAxisModule } from './axes/radius-category/main';
import { RadiusNumberAxisModule } from './axes/radius-number/main';
import { AnimationModule } from './features/animation/main';
import { BackgroundModule } from './features/background/main';
import { ContextMenuModule } from './features/context-menu/main';
import { CrosshairModule } from './features/crosshair/main';
import { DataSourceModule } from './features/data-source/main';
import { ErrorBarsModule } from './features/error-bar/errorBarModule';
import { NavigatorModule } from './features/navigator/navigatorModule';
import { RangeButtonsModule } from './features/range-buttons/main';
import { SyncModule } from './features/sync/syncModule';
import { ZoomModule } from './features/zoom/main';
import { GradientLegendModule } from './gradient-legend/main';
import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { BoxPlotModule } from './series/box-plot/main';
import { BulletModule } from './series/bullet/bulletModule';
import { CandlestickModule } from './series/candlestick/main';
import { HeatmapModule } from './series/heatmap/main';
import { MapLineModule } from './series/map-line/main';
import { MapMarkerModule } from './series/map-marker/main';
import { MapShapeBackgroundModule } from './series/map-shape-background/main';
import { MapShapeModule } from './series/map-shape/main';
import { NightingaleModule } from './series/nightingale/main';
import { RadarAreaModule } from './series/radar-area/main';
import { RadarLineModule } from './series/radar-line/main';
import { RadialBarModule } from './series/radial-bar/main';
import { RadialColumnModule } from './series/radial-column/main';
import { RangeAreaModule } from './series/range-area/rangeAreaModule';
import { RangeBarModule } from './series/range-bar/main';
import { SunburstModule } from './series/sunburst/main';
import { TreemapModule } from './series/treemap/main';
import { WaterfallModule } from './series/waterfall/main';

export function setupEnterpriseModules() {
    _ModuleSupport.registerModule(AngleCategoryAxisModule);
    _ModuleSupport.registerModule(AngleNumberAxisModule);
    _ModuleSupport.registerModule(AnimationModule);
    _ModuleSupport.registerModule(BackgroundModule);
    _ModuleSupport.registerModule(BoxPlotModule);
    _ModuleSupport.registerModule(CandlestickModule);
    _ModuleSupport.registerModule(BulletModule);
    _ModuleSupport.registerModule(ContextMenuModule);
    _ModuleSupport.registerModule(CrosshairModule);
    _ModuleSupport.registerModule(DataSourceModule);
    _ModuleSupport.registerModule(ErrorBarsModule);
    _ModuleSupport.registerModule(MapLineModule);
    _ModuleSupport.registerModule(MapMarkerModule);
    _ModuleSupport.registerModule(MapShapeModule);
    _ModuleSupport.registerModule(MapShapeBackgroundModule);
    _ModuleSupport.registerModule(NavigatorModule);
    _ModuleSupport.registerModule(GradientLegendModule);
    _ModuleSupport.registerModule(HeatmapModule);
    _ModuleSupport.registerModule(NightingaleModule);
    _ModuleSupport.registerModule(OrdinalTimeAxisModule);
    _ModuleSupport.registerModule(RadarAreaModule);
    _ModuleSupport.registerModule(RadarLineModule);
    _ModuleSupport.registerModule(RadialBarModule);
    _ModuleSupport.registerModule(RadialColumnModule);
    _ModuleSupport.registerModule(RadiusCategoryAxisModule);
    _ModuleSupport.registerModule(RadiusNumberAxisModule);
    _ModuleSupport.registerModule(RangeBarModule);
    _ModuleSupport.registerModule(RangeButtonsModule);
    _ModuleSupport.registerModule(RangeAreaModule);
    _ModuleSupport.registerModule(SunburstModule);
    _ModuleSupport.registerModule(SyncModule);
    _ModuleSupport.registerModule(TreemapModule);
    _ModuleSupport.registerModule(WaterfallModule);
    _ModuleSupport.registerModule(ZoomModule);

    _ModuleSupport.enterpriseModule.isEnterprise = true;
    _ModuleSupport.enterpriseModule.licenseManager = (options: AgChartOptions) =>
        new LicenseManager(
            options.container?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
        );
    _ModuleSupport.enterpriseModule.injectWatermark = injectWatermark;
}
