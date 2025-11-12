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

// Module exports
export { GaugePresetModule, PriceVolumePresetModule, SparklinePresetModule } from './api/preset/presetModules';

export { BackgroundModule } from './chart/background/backgroundModule';
export { CartesianChartModule } from './chart/cartesianChartModule';
export { LegendModule } from './chart/legend/legendModule';
export { PolarChartModule } from './chart/polarChartModule';
export { SeriesAreaModule } from './chart/series-area/seriesAreaModule';
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

export { AllCartesianCommunityModules } from './module-bundles/cartesian';
export { AllPolarCommunityModules } from './module-bundles/polar';
export { AllCommunityModules } from './module-bundles/all';

// Undocumented APIs used by Integrated Charts.
export { AgChartsCommunityModule } from './module-bundles/integrated';
export * as _Scene from './integrated-charts-scene';
export * as _Theme from './integrated-charts-theme';
export * as _Util from './integrated-charts-util';
