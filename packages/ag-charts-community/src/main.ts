// Documented APIs.
export { AG_CHARTS_LOCALE_EN_US } from 'ag-charts-locale';
export * from 'ag-charts-types';
export { time } from './util/time-interop';
export { AgCharts } from './api/agCharts';
export { VERSION } from './version';
export { ModuleRegistry } from 'ag-charts-core';

// Undocumented APIs used by Enterprise Modules.
export * as _ModuleSupport from './module-support';
export * as _Widget from './widget/exports';

// Undocumented runtime export used by Enterprise Modules. Exposed at the top level
// (rather than via the `_ModuleSupport` barrel) so consumers that don't use annotations
// can tree-shake it out — it has no community-internal runtime dependencies.
export { AnnotationManager } from './chart/annotation/annotationManager';

// Undocumented types used by Enterprise Modules. Exposed as top-level type-only exports
// so enterprise can import them directly (without going through the _ModuleSupport barrel)
// while keeping type identity consistent with the module resolution used everywhere else.
export type { ChartRegistry, ChartAxisRegistry, ChartSeriesRegistry } from './module/moduleContext';
export type { AxisContext } from './module/axisContext';

// Module exports
export { SparklinePresetModule } from './api/preset/presetModules';

export { CartesianChartModule } from './chart/cartesianChartModule';
export { PolarChartModule } from './chart/polarChartModule';

export { LegendModule } from './chart/legend/legendModule';
export { AreaSeriesModule } from './chart/series/cartesian/areaSeriesModule';
export { BarSeriesModule } from './chart/series/cartesian/barSeriesModule';
export { BubbleSeriesModule } from './chart/series/cartesian/bubbleSeriesModule';
export { HistogramSeriesModule } from './chart/series/cartesian/histogramSeriesModule';
export { LineSeriesModule } from './chart/series/cartesian/lineSeriesModule';
export { ScatterSeriesModule } from './chart/series/cartesian/scatterSeriesModule';
export { DonutSeriesModule } from './chart/series/polar/donutSeriesModule';
export { PieSeriesModule } from './chart/series/polar/pieSeriesModule';

export { LocaleModule } from './locale/localeModule';

export { NumberAxisModule } from './module/axis-modules/numberAxisModule';
export { LogAxisModule } from './module/axis-modules/logAxisModule';
export { TimeAxisModule } from './module/axis-modules/timeAxisModule';
export { CategoryAxisModule } from './module/axis-modules/categoryAxisModule';
export { GroupedCategoryAxisModule } from './module/axis-modules/groupedCategoryAxisModule';
export { UnitTimeAxisModule } from './module/axis-modules/unitTimeAxisModule';

export { AllCommunityModule } from './module-bundles/all';
export { AllCartesianModule } from './module-bundles/cartesian';
export { AllCartesianAxesModule } from './module-bundles/cartesian-axes';
export { AllCartesianSeriesModule } from './module-bundles/cartesian-series';
export { AllPolarModule } from './module-bundles/polar';

// Undocumented APIs used by Integrated Charts.
export { AgChartsCommunityModule } from './module-bundles/integrated';
export * as _Scene from './integrated-charts-scene';
export * as _Theme from './integrated-charts-theme';
export * as _Util from './integrated-charts-util';
