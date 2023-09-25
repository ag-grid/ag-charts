import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport, AgChart } from 'ag-charts-community';

import { AnimationModule } from './features/animation/main';
import { BackgroundModule } from './features/background/main';
import { ContextMenuModule } from './features/context-menu/main';
import { CrosshairModule } from './features/crosshair/main';
import { GradientLegendModule } from './gradient-legend/main';
import { HeatmapModule } from './series/heatmap/main';
import { AngleCategoryAxisModule } from './axes/angle-category/main';
import { RadiusNumberAxisModule } from './axes/radius-number/main';
import { NightingaleModule } from './series/nightingale/main';
import { RadialColumnModule } from './series/radial-column/main';
import { RadarLineModule } from './series/radar-line/main';
import { RadarAreaModule } from './series/radar-area/main';
import { ZoomModule } from './features/zoom/main';
import { WaterfallModule } from './series/waterfall/main';
import { RangeBarModule } from './series/range-bar/main';
import { RangeAreaModule } from './series/range-area/rangeAreaModule';
import { LicenseManager } from './license/licenseManager';
import { BoxPlotModule } from './series/box-plot/boxPlotModule';
import { ErrorBarsModule } from './features/error-bar/errorBarModule';
import { HistogramSeriesModule } from './series/histogram/histogramSeriesModule';
import { TreemapSeriesModule } from './series/treemap/treemapSeriesModule';
import { NavigatorModule } from './features/navigator/navigatorModule';

export { RadiusNumberAxisModule } from './axes/radius-number/radiusNumberAxisModule';

export * from 'ag-charts-community';

_ModuleSupport.registerModule(AngleCategoryAxisModule);
_ModuleSupport.registerModule(AnimationModule);
_ModuleSupport.registerModule(BackgroundModule);
_ModuleSupport.registerModule(BoxPlotModule);
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
_ModuleSupport.registerModule(RadialColumnModule);
_ModuleSupport.registerModule(RadiusNumberAxisModule);
_ModuleSupport.registerModule(RangeBarModule);
_ModuleSupport.registerModule(RangeAreaModule);
_ModuleSupport.registerModule(TreemapSeriesModule);
_ModuleSupport.registerModule(WaterfallModule);
_ModuleSupport.registerModule(ZoomModule);

export class AgEnterpriseCharts {
    public static create(options: AgChartOptions): AgChartInstance {
        const doc = typeof document !== 'undefined' ? document : undefined;
        new LicenseManager(options.container?.ownerDocument ?? doc).validateLicense();

        return AgChart.create(options as any);
    }

    public static update(chart: AgChartInstance, options: AgChartOptions) {
        return AgChart.update(chart, options as any);
    }

    public static updateDelta(chart: AgChartInstance, deltaOptions: Parameters<(typeof AgChart)['updateDelta']>[1]) {
        return AgChart.updateDelta(chart, deltaOptions);
    }
}
