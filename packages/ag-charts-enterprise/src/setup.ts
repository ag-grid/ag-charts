import { _ModuleSupport } from 'ag-charts-community';

import { AngleCategoryAxisModule } from './axes/angle-category/main';
import { AngleNumberAxisModule } from './axes/angle-number/main';
import { OrdinalTimeAxisModule } from './axes/ordinal/ordinalTimeAxisModule';
import { RadiusCategoryAxisModule } from './axes/radius-category/main';
import { RadiusNumberAxisModule } from './axes/radius-number/main';
import { AnimationModule } from './features/animation/main';
import { AnnotationsModule } from './features/annotations/annotationsModule';
import { BackgroundModule } from './features/background/main';
import { ContextMenuModule } from './features/context-menu/main';
import { CrosshairModule } from './features/crosshair/main';
import { DataSourceModule } from './features/data-source/main';
import { ErrorBarsModule } from './features/error-bar/errorBarModule';
import { NavigatorModule } from './features/navigator/navigatorModule';
import { SyncModule } from './features/sync/syncModule';
import { ZoomModule } from './features/zoom/main';
import { GradientLegendModule } from './gradient-legend/gradientLegendModule';
import { LicenseManager } from './license/licenseManager';
import { injectWatermark } from './license/watermark';
import { BoxPlotModule } from './series/box-plot/main';
import { BulletModule } from './series/bullet/bulletModule';
import { CandlestickModule } from './series/candlestick/main';
import { HeatmapModule } from './series/heatmap/main';
import { MapLineBackgroundModule } from './series/map-line-background/main';
import { MapLineModule } from './series/map-line/main';
import { MapMarkerModule } from './series/map-marker/main';
import { MapShapeBackgroundModule } from './series/map-shape-background/main';
import { MapShapeModule } from './series/map-shape/main';
import { NightingaleModule } from './series/nightingale/main';
import { OhlcModule } from './series/ohlc/main';
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
    _ModuleSupport.moduleRegistry.register(
        AngleCategoryAxisModule,
        AngleNumberAxisModule,
        AnimationModule,
        AnnotationsModule,
        BackgroundModule,
        BoxPlotModule,
        CandlestickModule,
        OhlcModule,
        BulletModule,
        ContextMenuModule,
        CrosshairModule,
        DataSourceModule,
        ErrorBarsModule,
        MapLineModule,
        MapLineBackgroundModule,
        MapMarkerModule,
        MapShapeModule,
        MapShapeBackgroundModule,
        NavigatorModule,
        GradientLegendModule,
        HeatmapModule,
        NightingaleModule,
        OrdinalTimeAxisModule,
        RadarAreaModule,
        RadarLineModule,
        RadialBarModule,
        RadialColumnModule,
        RadiusCategoryAxisModule,
        RadiusNumberAxisModule,
        RangeBarModule,
        RangeAreaModule,
        SunburstModule,
        SyncModule,
        TreemapModule,
        WaterfallModule,
        ZoomModule
    );

    _ModuleSupport.enterpriseModule.isEnterprise = true;
    _ModuleSupport.enterpriseModule.licenseManager = new LicenseManager();
    _ModuleSupport.enterpriseModule.injectWatermark = injectWatermark;
}
