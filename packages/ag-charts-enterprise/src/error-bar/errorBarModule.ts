import type { _ModuleSupport } from 'ag-charts-community';
import { ErrorBars } from './errorBar';

export const ErrorBarsModule: _ModuleSupport.SeriesOptionModule = {
    type: 'series-option',
    optionsKey: 'errorBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    instanceConstructor: ErrorBars,
};
