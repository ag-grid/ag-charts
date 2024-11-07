// Documented APIs.
export { AgCharts } from './api/agCharts';
export { VERSION } from './version';
export { AG_CHARTS_LOCALE_EN_US } from 'ag-charts-locale';
export { registerInbuiltModules as setupCommunityModules } from './chart/factory/registerInbuiltModules';
export * from 'ag-charts-types';
export * from './main-modules';
export * as time from './util/time/index';
export { Marker } from './chart/marker/marker';

// Undocumented APIs used by Integrated Charts.
// TODO remove after ag-grid refactored to look at main-module.ts
export * as _Scene from './integrated-charts-scene';
export * as _Theme from './integrated-charts-theme';
export * as _Util from './integrated-charts-util';

// Undocumented APIs used by Enterprise Modules.
export * as _ModuleSupport from './module-support';
export * as _Widget from './widget/exports';
