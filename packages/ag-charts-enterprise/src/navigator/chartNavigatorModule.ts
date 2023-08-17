import type { _ModuleSupport } from 'ag-charts-community';
import { Navigator } from './navigator';

export const CHART_NAVIGATOR_MODULE: _ModuleSupport.Module = {
    type: 'root',
    optionsKey: 'navigator',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: Navigator,
};
