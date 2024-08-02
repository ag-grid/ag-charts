import type { _ModuleSupport } from 'ag-charts-community';
import { AgErrorBarSupportedSeriesTypes } from 'ag-charts-community';

import { ErrorBars } from './errorBar';
import { ERROR_BARS_THEME } from './errorBarTheme';

export const ErrorBarsModule: _ModuleSupport.SeriesOptionModule = {
    type: 'series-option',
    identifier: 'error-bars',
    optionsKey: 'errorBar',
    packageType: 'enterprise',
    chartTypes: ['cartesian'],
    seriesTypes: AgErrorBarSupportedSeriesTypes,
    moduleFactory: (ctx) => new ErrorBars(ctx),
    themeTemplate: ERROR_BARS_THEME,
};
