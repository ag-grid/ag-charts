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

export type SeriesOptionsTypes<TDatum = unknown> =
    | AgCartesianSeriesOptions<TDatum>
    | AgPolarSeriesOptions<TDatum>
    | AgHierarchySeriesOptions<TDatum>
    | AgTopologySeriesOptions<TDatum>
    | AgFlowProportionSeriesOptions<TDatum>
    | AgStandaloneSeriesOptions<TDatum>
    | AgGaugeOptions;

export type SeriesType = SeriesOptionsTypes['type'];

export function optionsType(input: { series?: { type?: SeriesType }[] }): NonNullable<SeriesType> {
    const { series } = input;
    return series?.[0]?.type ?? 'line';
}

export function isAgCartesianChartOptions<D>(input: AgChartOptions<D>): input is AgCartesianChartOptions<D> {
    const specifiedType = optionsType(input);
    return chartTypes.isCartesian(specifiedType) || isEnterpriseCartesian(specifiedType);
}

export function isAgPolarChartOptions<D>(input: AgChartOptions<D>): input is AgPolarChartOptions<D> {
    const specifiedType = optionsType(input);
    return chartTypes.isPolar(specifiedType) || isEnterprisePolar(specifiedType);
}

export function isAgHierarchyChartOptions<D>(input: AgChartOptions<D>): input is AgHierarchyChartOptions<D> {
    const specifiedType = optionsType(input);
    return chartTypes.isHierarchy(specifiedType) || isEnterpriseHierarchy(specifiedType);
}

export function isAgTopologyChartOptions<D>(input: AgChartOptions<D>): input is AgTopologyChartOptions<D> {
    const specifiedType = optionsType(input);
    return chartTypes.isTopology(specifiedType) || isEnterpriseTopology(specifiedType);
}

export function isAgFlowProportionChartOptions<D>(input: AgChartOptions<D>): input is AgFlowProportionChartOptions<D> {
    const specifiedType = optionsType(input);
    return chartTypes.isFlowProportion(specifiedType) || isEnterpriseFlowProportion(specifiedType);
}

export function isAgStandaloneChartOptions<D>(input: AgChartOptions<D>): input is AgStandaloneChartOptions<D> {
    const specifiedType = optionsType(input);
    return chartTypes.isStandalone(specifiedType) || isEnterpriseStandalone(specifiedType);
}

export function isAgGaugeChartOptions(input: any): input is AgGaugeChartOptions {
    const specifiedType = optionsType(input);
    return chartTypes.isGauge(specifiedType) || isEnterpriseGauge(specifiedType);
}

export function isAgPolarChartOptionsWithSeriesBasedLegend<D>(
    input: AgChartOptions<D>
): input is AgPolarChartOptions<D> {
    const specifiedType = optionsType(input);
    return isAgPolarChartOptions(input) && specifiedType !== 'pie' && specifiedType !== 'donut';
}

export function isSeriesOptionType(input?: string): input is NonNullable<SeriesType> {
    if (input == null) {
        return false;
    }
    return chartTypes.has(input);
}
