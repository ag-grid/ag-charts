import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport, AgChart } from 'ag-charts-community';

import { AnimationModule } from './animation/main';
import { BackgroundModule } from './background/main';
import { ContextMenuModule } from './context-menu/main';
import { CrosshairModule } from './crosshair/main';
import { GradientLegendModule } from './gradient-legend/main';
import { HeatmapModule } from './heatmap/main';
import { AngleCategoryAxisModule } from './polar-axes/angle-category/main';
import { RadiusNumberAxisModule } from './polar-axes/radius-number/main';
import { NightingaleModule } from './polar-series/nightingale/main';
import { RadialColumnModule } from './polar-series/radial-column/main';
import { RadarLineModule } from './polar-series/radar-line/main';
import { RadarAreaModule } from './polar-series/radar-area/main';
import { ZoomModule } from './zoom/main';
import { WaterfallModule } from './waterfall/main';
import { RangeBarModule } from './range-bar/main';
import { RangeAreaModule } from './range-area/rangeAreaModule';
import { LicenseManager } from './license/licenseManager';
import { BoxPlotModule } from './box-plot/boxPlotModule';
import { ErrorBarsModule } from './error-bar/errorBarModule';
import { HistogramSeriesModule } from './histogram/histogramSeriesModule';
import { TreemapSeriesModule } from './treemap/treemapSeriesModule';

export { RadiusNumberAxisModule } from './polar-axes/radius-number/radiusNumberAxisModule';

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
}
