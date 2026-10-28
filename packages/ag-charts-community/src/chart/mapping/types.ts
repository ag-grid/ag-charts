import { ModuleRegistry, type ModuleScope, ModuleType } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartOptions } from 'ag-charts-types';

import { getSeriesExpectedChartType } from '../factory/expectedModules';

export function detectChartType(
    input: AgChartOptions,
    moduleRegistry: ModuleScope = ModuleRegistry.resolveModuleScope()
): string {
    const mainSeriesType = input.series?.[0]?.type;
    // A chart with no series takes the first registered chart type.
    if (mainSeriesType == null)
        return moduleRegistry.listModulesByType(ModuleType.Chart).next().value?.name ?? 'unknown';
    return (
        moduleRegistry.getSeriesModule(mainSeriesType)?.chartType ??
        getSeriesExpectedChartType(mainSeriesType) ??
        'unknown'
    );
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    return detectChartType(input) === 'cartesian';
}
