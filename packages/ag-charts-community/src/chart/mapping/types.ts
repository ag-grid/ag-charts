import { ModuleRegistry } from 'ag-charts-core';
import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
    AgTopologyChartOptions,
    SeriesType,
} from 'ag-charts-types';

import { getSeriesExpectedChartType } from '../factory/expectedModules';

function optionsType(input: { series?: { type?: SeriesType }[] }): SeriesType {
    return input.series?.[0]?.type ?? 'line';
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    const mainSeriesType = optionsType(input);
    return (
        ModuleRegistry.getSeriesModule(mainSeriesType)?.chartType === 'cartesian' ||
        getSeriesExpectedChartType(mainSeriesType) === 'cartesian'
    );
}

export function isAgPolarChartOptions(input: AgChartOptions): input is AgPolarChartOptions {
    const mainSeriesType = optionsType(input);
    return (
        ModuleRegistry.getSeriesModule(mainSeriesType)?.chartType === 'polar' ||
        getSeriesExpectedChartType(mainSeriesType) === 'polar'
    );
}

export function isAgTopologyChartOptions(input: AgChartOptions): input is AgTopologyChartOptions {
    const mainSeriesType = optionsType(input);
    return (
        ModuleRegistry.getSeriesModule(mainSeriesType)?.chartType === 'topology' ||
        getSeriesExpectedChartType(mainSeriesType) === 'topology'
    );
}

export function isAgStandaloneChartOptions(input: AgChartOptions): input is AgStandaloneChartOptions {
    const mainSeriesType = optionsType(input);
    return (
        ModuleRegistry.getSeriesModule(mainSeriesType)?.chartType === 'standalone' ||
        getSeriesExpectedChartType(mainSeriesType) === 'standalone'
    );
}
