import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgFlowProportionChartOptions,
    AgFlowProportionSeriesOptions,
    AgGaugeChartOptions,
    AgGaugeOptions,
    AgHierarchyChartOptions,
    AgHierarchySeriesOptions,
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
    isEnterpriseFlowProportion,
    isEnterpriseGauge,
    isEnterpriseHierarchy,
    isEnterprisePolar,
    isEnterpriseStandalone,
    isEnterpriseTopology,
} from '../factory/expectedEnterpriseModules';

export type SeriesOptionsTypes =
    | AgCartesianSeriesOptions
    | AgPolarSeriesOptions
    | AgHierarchySeriesOptions
    | AgTopologySeriesOptions
    | AgFlowProportionSeriesOptions
    | AgStandaloneSeriesOptions
    | AgGaugeOptions;

export type SeriesType = SeriesOptionsTypes['type'];

export function optionsType(input: { series?: { type?: SeriesType }[] }): NonNullable<SeriesType> {
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

export function isAgHierarchyChartOptions(input: AgChartOptions): input is AgHierarchyChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isHierarchy(specifiedType) || isEnterpriseHierarchy(specifiedType);
}

export function isAgTopologyChartOptions(input: AgChartOptions): input is AgTopologyChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isTopology(specifiedType) || isEnterpriseTopology(specifiedType);
}

export function isAgFlowProportionChartOptions(input: AgChartOptions): input is AgFlowProportionChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isFlowProportion(specifiedType) || isEnterpriseFlowProportion(specifiedType);
}

export function isAgStandaloneChartOptions(input: AgChartOptions): input is AgStandaloneChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isStandalone(specifiedType) || isEnterpriseStandalone(specifiedType);
}

export function isAgGaugeChartOptions(input: any): input is AgGaugeChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isGauge(specifiedType) || isEnterpriseGauge(specifiedType);
}

export function isAgPolarChartOptionsWithSeriesBasedLegend(input: AgChartOptions): input is AgPolarChartOptions {
    const specifiedType = optionsType(input);
    return isAgPolarChartOptions(input) && specifiedType !== 'pie' && specifiedType !== 'donut';
}

export function isSeriesOptionType(input?: string): input is NonNullable<SeriesType> {
    if (input == null) {
        return false;
    }
    return chartTypes.has(input);
}
