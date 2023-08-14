import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { AgChart, _ModuleSupport } from 'ag-charts-community';

import { AnimationModule } from './animation/main';
import { BackgroundModule } from './background/main';
import { ContextMenuModule } from './context-menu/main';
import { CrosshairModule } from './crosshair/main';
import { GradientLegendModule } from './gradient-legend/main';
import { HeatmapModule } from './heatmap/main';
import { AngleCategoryAxisModule } from './polar-axes/angle-category/main';
import { RadiusNumberAxisModule } from './polar-axes/radius-number/main';
export { RadiusNumberAxisModule } from './polar-axes/radius-number/radiusNumberAxisModule';
import { NightingaleModule } from './polar-series/nightingale/main';
import { RadialColumnModule } from './polar-series/radial-column/main';
import { RadarLineModule } from './polar-series/radar-line/main';
import { RadarAreaModule } from './polar-series/radar-area/main';
import { ZoomModule } from './zoom/main';
import { WaterfallBarModule, WaterfallColumnModule } from './waterfall/main';
import { RangeBarModule, RangeColumnModule } from './rangeBar/main';
import { RangeAreaModule } from './rangeArea/rangeAreaModule';

export * from 'ag-charts-community';

_ModuleSupport.registerModule(AngleCategoryAxisModule);
_ModuleSupport.registerModule(AnimationModule);
_ModuleSupport.registerModule(BackgroundModule);
_ModuleSupport.registerModule(ContextMenuModule);
_ModuleSupport.registerModule(CrosshairModule);
_ModuleSupport.registerModule(GradientLegendModule);
_ModuleSupport.registerModule(HeatmapModule);
_ModuleSupport.registerModule(NightingaleModule);
_ModuleSupport.registerModule(RadarAreaModule);
_ModuleSupport.registerModule(RadarLineModule);
_ModuleSupport.registerModule(RadialColumnModule);
_ModuleSupport.registerModule(RadiusNumberAxisModule);
_ModuleSupport.registerModule(WaterfallBarModule);
_ModuleSupport.registerModule(WaterfallColumnModule);
_ModuleSupport.registerModule(RangeBarModule);
_ModuleSupport.registerModule(RangeColumnModule);
_ModuleSupport.registerModule(RangeAreaModule);
_ModuleSupport.registerModule(ZoomModule);

import { LicenseManager } from './license/licenseManager';

export class AgEnterpriseCharts {
    public static create(options: AgChartOptions): AgChartInstance {
        new LicenseManager(options.container?.ownerDocument ?? document).validateLicense();

        return AgChart.create(options as any);
    }

    public static update(chart: AgChartInstance, options: AgChartOptions) {
        return AgChart.update(chart, options as any);
    }
}
