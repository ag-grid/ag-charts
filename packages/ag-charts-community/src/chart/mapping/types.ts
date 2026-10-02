import { ModuleRegistry, type ModuleScope, ModuleType } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartOptions, SeriesType } from 'ag-charts-types';

import { getSeriesExpectedChartType } from '../factory/expectedModules';

const DEFAULT_SERIES_TYPE: SeriesType = 'line';

/**
 * The series type a chart with no `series` resolves against: `line` when it is in scope, otherwise the first
 * registered cartesian series type, otherwise the first registered series type. Falls back to `line` when no series
 * module is in scope, so the missing module is still reported.
 */
export function resolveDefaultSeriesType(
    moduleRegistry: ModuleScope = ModuleRegistry.resolveModuleScope()
): SeriesType {
    if (moduleRegistry.getSeriesModule(DEFAULT_SERIES_TYPE) != null) return DEFAULT_SERIES_TYPE;

    let firstSeriesType: SeriesType | undefined;
    for (const definition of moduleRegistry.listModulesByType(ModuleType.Series)) {
        const seriesType = definition.name as SeriesType;
        if (definition.chartType === 'cartesian') return seriesType;
        firstSeriesType ??= seriesType;
    }
    return firstSeriesType ?? DEFAULT_SERIES_TYPE;
}

export function detectChartType(
    input: AgChartOptions,
    moduleRegistry: ModuleScope = ModuleRegistry.resolveModuleScope()
): string {
    const mainSeriesType = input.series?.[0]?.type ?? resolveDefaultSeriesType(moduleRegistry);
    return (
        moduleRegistry.getSeriesModule(mainSeriesType)?.chartType ??
        getSeriesExpectedChartType(mainSeriesType) ??
        'unknown'
    );
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    return detectChartType(input) === 'cartesian';
}
