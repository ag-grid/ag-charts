import { ModuleRegistry, type ModuleScope } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-types';

import { getSeriesExpectedChartType } from '../factory/expectedModules';

export function detectChartType(
    input: AgChartOptions,
    moduleRegistry: ModuleScope = ModuleRegistry.resolveModuleScope()
): string {
    const mainSeriesType = input.series?.[0]?.type ?? 'line';
    return (
        moduleRegistry.getSeriesModule(mainSeriesType)?.chartType ??
        getSeriesExpectedChartType(mainSeriesType) ??
        'unknown'
    );
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    return detectChartType(input) === 'cartesian';
}
