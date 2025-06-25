import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgGaugeOptions,
    AgPolarChartOptions,
    AgPolarSeriesOptions,
    AgStandaloneChartOptions,
    AgStandaloneSeriesOptions,
    AgTopologyChartOptions,
    AgTopologySeriesOptions,
} from 'ag-charts-types';

import { chartTypes } from '../factory/chartTypes';
import {
    isEnterpriseCartesian,
    isEnterprisePolar,
    isEnterpriseStandalone,
    isEnterpriseTopology,
} from '../factory/expectedEnterpriseModules';

export type SeriesOptionsTypes =
    | AgCartesianSeriesOptions
    | AgPolarSeriesOptions
    | AgTopologySeriesOptions
    | AgStandaloneSeriesOptions
    | AgGaugeOptions;

export type SeriesType = SeriesOptionsTypes['type'];

function optionsType(input: { series?: { type?: SeriesType }[] }): NonNullable<SeriesType> {
    const { series } = input;
    return series?.[0]?.type ?? 'line';
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isCartesian(specifiedType) || isEnterpriseCartesian(specifiedType);
}

export function isAgPolarChartOptions(input: AgChartOptions): input is AgPolarChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isPolar(specifiedType) || isEnterprisePolar(specifiedType);
}

export function isAgTopologyChartOptions(input: AgChartOptions): input is AgTopologyChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isTopology(specifiedType) || isEnterpriseTopology(specifiedType);
}

export function isAgStandaloneChartOptions(input: AgChartOptions): input is AgStandaloneChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isStandalone(specifiedType) || isEnterpriseStandalone(specifiedType);
}
