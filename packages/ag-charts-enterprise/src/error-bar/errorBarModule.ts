import { _ModuleSupport } from 'ag-charts-community';

export class ErrorBarsPlaceholder extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {}

export const ErrorBarsModule: _ModuleSupport.SeriesOptionModule = {
    type: 'series-option',
    identifier: 'error-bars',
    optionsKey: 'errorBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: ErrorBarsPlaceholder,
};
