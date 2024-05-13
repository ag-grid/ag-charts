import type {
    AgCartesianChartOptions,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
    AgSankeyChartOptions,
    AgTopologyChartOptions,
} from '../../options/agChartOptions';
import type { AgChartOptions } from '../../options/chart/chartBuilderOptions';
import { Logger } from '../../util/logger';
import { axisRegistry } from '../factory/axisRegistry';
import { chartTypes } from '../factory/chartTypes';
import {
    isEnterpriseCartesian,
    isEnterpriseHierarchy,
    isEnterprisePolar,
    isEnterpriseTopology,
} from '../factory/expectedEnterpriseModules';

export type AxesOptionsTypes = NonNullable<AgCartesianChartOptions['axes']>[number];
export type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number];
export type SeriesType = SeriesOptionsTypes['type'];

export function optionsType(input: { series?: { type?: SeriesType }[] }): NonNullable<SeriesType> {
    return input.series?.[0]?.type ?? 'line';
}

export function isAgCartesianChartOptions(input: AgChartOptions): input is AgCartesianChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return true;
    }

    if ((specifiedType as string) === 'cartesian') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }

    return chartTypes.isCartesian(specifiedType) || isEnterpriseCartesian(specifiedType);
}

export function isAgPolarChartOptions(input: AgChartOptions): input is AgPolarChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    if ((specifiedType as string) === 'polar') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }

    return chartTypes.isPolar(specifiedType) || isEnterprisePolar(specifiedType);
}

export function isAgHierarchyChartOptions(input: AgChartOptions): input is AgHierarchyChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    if ((specifiedType as string) === 'hierarchy') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }

    return chartTypes.isHierarchy(specifiedType) || isEnterpriseHierarchy(specifiedType);
}

export function isAgTopologyChartOptions(input: AgChartOptions): input is AgTopologyChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    if ((specifiedType as string) === 'topology') {
        Logger.warnOnce(`type '${specifiedType}' is deprecated, use a series type instead`);
        return true;
    }

    return chartTypes.isTopology(specifiedType) || isEnterpriseTopology(specifiedType);
}

export function isAgSankeyChartOptions(input: AgChartOptions): input is AgSankeyChartOptions {
    const specifiedType = optionsType(input);
    if (specifiedType == null) {
        return false;
    }

    return chartTypes.isSankey(specifiedType) || isEnterpriseTopology(specifiedType);
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

export function isAxisOptionType(input?: string): input is NonNullable<AxesOptionsTypes>['type'] {
    if (input == null) {
        return false;
    }
    return axisRegistry.has(input);
}
