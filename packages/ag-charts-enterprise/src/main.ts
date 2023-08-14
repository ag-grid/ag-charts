import type { AgChartOptions as AgCommunityChartOptions, AgChartInstance } from 'ag-charts-community';
import { AgChart, _ModuleSupport } from 'ag-charts-community';

import type { AgAnimationOptions } from './animation/main';
import { AnimationModule } from './animation/main';
import type { AgChartBackgroundImage } from './background/main';
import { BackgroundModule } from './background/main';
import type { AgContextMenuOptions } from './context-menu/main';
import { ContextMenuModule } from './context-menu/main';
import {
    AgCrosshairOptions,
    CrosshairModule,
    AgCrosshairLabel,
    AgCrosshairLabelRendererParams,
    AgCrosshairLabelRendererResult,
} from './crosshair/main';
import { GradientLegendModule } from './gradient-legend/main';
import {
    AgHeatmapSeriesFormat,
    AgHeatmapSeriesFormatterParams,
    AgHeatmapSeriesLabelOptions,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesTooltip,
    AgHeatmapSeriesTooltipRendererParams,
    HeatmapModule,
} from './heatmap/main';
import type { AgNavigatorOptions } from './navigator/main';
import { AngleCategoryAxisModule, AgAngleCategoryAxisOptions } from './polar-axes/angle-category/main';
import { RadiusNumberAxisModule, AgRadiusNumberAxisOptions } from './polar-axes/radius-number/main';
export { RadiusNumberAxisModule } from './polar-axes/radius-number/radiusNumberAxisModule';
import type {
    AgBaseRadarSeriesOptions,
    AgRadarSeriesLabelFormatterParams,
    AgRadarSeriesLabelOptions,
    AgRadarSeriesMarker,
    AgRadarSeriesMarkerFormat,
    AgRadarSeriesMarkerFormatter,
    AgRadarSeriesMarkerFormatterParams,
    AgRadarSeriesTooltip,
    AgRadarSeriesTooltipRendererParams,
} from './polar-series/radar/typings';
import {
    NightingaleModule,
    AgNightingaleSeriesOptions,
    AgNightingaleSeriesFormat,
    AgNightingaleSeriesFormatterParams,
    AgNightingaleSeriesLabelFormatterParams,
    AgNightingaleSeriesLabelOptions,
    AgNightingaleSeriesTooltip,
    AgNightingaleSeriesTooltipRendererParams,
} from './polar-series/nightingale/main';
import {
    RadialColumnModule,
    AgRadialColumnSeriesOptions,
    AgRadialColumnSeriesFormat,
    AgBaseRadialColumnSeriesOptions,
    AgRadialColumnSeriesFormatterParams,
    AgRadialColumnSeriesLabelFormatterParams,
    AgRadialColumnSeriesLabelOptions,
    AgRadialColumnSeriesTooltip,
    AgRadialColumnSeriesTooltipRendererParams,
} from './polar-series/radial-column/main';
import { RadarLineModule, AgRadarLineSeriesOptions } from './polar-series/radar-line/main';
import { RadarAreaModule, AgRadarAreaSeriesOptions } from './polar-series/radar-area/main';
import { AgZoomAxes, AgZoomOptions, AgZoomPanKey, AgZoomScrollingPivot, ZoomModule } from './zoom/main';
import {
    WaterfallBarModule,
    WaterfallColumnModule,
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesTooltip,
    AgWaterfallSeriesLabelOptions,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesItemOptions,
    AgWaterfallSeriesTooltipRendererParams,
} from './waterfall/main';

import {
    RangeBarModule,
    RangeColumnModule,
    AgRangeBarSeriesOptions,
    AgRangeBarSeriesTooltip,
    AgRangeBarSeriesLabelOptions,
    AgRangeBarSeriesTooltipRendererParams,
} from './rangeBar/main';

import {
    RangeAreaModule,
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesTooltip,
    AgRangeAreaSeriesLabelOptions,
    AgRangeAreaSeriesTooltipRendererParams,
} from './rangeArea/main';

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

export { AgCrosshairOptions, AgCrosshairLabel, AgCrosshairLabelRendererParams, AgCrosshairLabelRendererResult };
export {
    AgHeatmapSeriesFormat,
    AgHeatmapSeriesFormatterParams,
    AgHeatmapSeriesLabelOptions,
    AgHeatmapSeriesOptions,
    AgHeatmapSeriesTooltip,
    AgHeatmapSeriesTooltipRendererParams,
};
export { AgAngleCategoryAxisOptions, AgRadiusNumberAxisOptions };
export {
    AgBaseRadarSeriesOptions,
    AgRadarLineSeriesOptions,
    AgRadarAreaSeriesOptions,
    AgRadarSeriesLabelFormatterParams,
    AgRadarSeriesLabelOptions,
    AgRadarSeriesMarker,
    AgRadarSeriesMarkerFormat,
    AgRadarSeriesMarkerFormatter,
    AgRadarSeriesMarkerFormatterParams,
    AgRadarSeriesTooltip,
    AgRadarSeriesTooltipRendererParams,
};
export {
    AgRadialColumnSeriesOptions,
    AgRadialColumnSeriesFormat,
    AgBaseRadialColumnSeriesOptions,
    AgRadialColumnSeriesFormatterParams,
    AgRadialColumnSeriesLabelFormatterParams,
    AgRadialColumnSeriesLabelOptions,
    AgRadialColumnSeriesTooltip,
    AgRadialColumnSeriesTooltipRendererParams,
};
export {
    AgNightingaleSeriesOptions,
    AgNightingaleSeriesFormat,
    AgNightingaleSeriesFormatterParams,
    AgNightingaleSeriesLabelFormatterParams,
    AgNightingaleSeriesLabelOptions,
    AgNightingaleSeriesTooltip,
    AgNightingaleSeriesTooltipRendererParams,
};
export { AgZoomAxes, AgZoomOptions, AgZoomPanKey, AgZoomScrollingPivot };
export {
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesTooltip,
    AgWaterfallSeriesLabelOptions,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesItemOptions,
    AgWaterfallSeriesTooltipRendererParams,
};

export {
    AgRangeBarSeriesOptions,
    AgRangeBarSeriesTooltip,
    AgRangeBarSeriesLabelOptions,
    AgRangeBarSeriesTooltipRendererParams,
};

export {
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesTooltip,
    AgRangeAreaSeriesLabelOptions,
    AgRangeAreaSeriesTooltipRendererParams,
};

declare module 'ag-charts-community' {
    export interface AgCartesianChartOptions {
        animation?: AgAnimationOptions;
        contextMenu?: AgContextMenuOptions;
        /** Configuration for the chart navigator. */
        navigator?: AgNavigatorOptions;
        /** Configuration for zoom. */
        zoom?: AgZoomOptions;
    }

    export interface AgBaseCartesianAxisOptions {
        /** Configuration for the axis crosshair. */
        crosshair?: AgCrosshairOptions;
    }

    export type AgPolarAxisOptions = AgAngleCategoryAxisOptions | AgRadiusNumberAxisOptions;

    export interface AgPolarChartOptions {
        animation?: AgAnimationOptions;
        contextMenu?: AgContextMenuOptions;
        /** Axis configurations. */
        axes?: AgPolarAxisOptions[];
    }

    export interface AgHierarchyChartOptions {
        contextMenu?: AgContextMenuOptions;
    }

    export interface AgChartBackground {
        /** Background image. May be combined with fill colour. */
        image?: AgChartBackgroundImage;
    }
}

import { LicenseManager } from './license/licenseManager';

type CartesianAddonType =
    | 'heatmap'
    | 'waterfall-bar'
    | 'waterfall-column'
    | 'range-bar'
    | 'range-column'
    | 'range-area';
type CartesianAddonSeries =
    | AgHeatmapSeriesOptions
    | AgWaterfallSeriesOptions
    | AgRangeBarSeriesOptions
    | AgRangeAreaSeriesOptions;

type PolarAddonType = 'radar-line' | 'radar-area' | 'radial-column' | 'nightingale';
type PolarAddonSeries =
    | AgRadarLineSeriesOptions
    | AgRadarAreaSeriesOptions
    | AgRadialColumnSeriesOptions
    | AgNightingaleSeriesOptions;

export type AgChartOptions = AgCommunityChartOptions<
    CartesianAddonType,
    CartesianAddonSeries,
    PolarAddonType,
    PolarAddonSeries
>;
export class AgEnterpriseCharts {
    public static create(options: AgChartOptions): AgChartInstance {
        new LicenseManager(options.container?.ownerDocument ?? document).validateLicense();

        return AgChart.create(options as any);
    }

    public static update(chart: AgChartInstance, options: AgChartOptions) {
        return AgChart.update(chart, options as any);
    }
}
