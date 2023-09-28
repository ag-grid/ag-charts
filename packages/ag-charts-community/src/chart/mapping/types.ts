import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgHierarchyChartOptions,
    AgPolarChartOptions,
} from '../../options/agChartOptions';
import { Logger } from '../../util/logger';
import { AXIS_TYPES } from '../factory/axisTypes';
import { CHART_TYPES } from '../factory/chartTypes';

export type AxesOptionsTypes = NonNullable<AgCartesianChartOptions['axes']>[number];
export type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number];

export function optionsType(input: {
    type?: SeriesOptionsTypes['type'];
    series?: { type?: SeriesOptionsTypes['type'] }[];
}): NonNullable<SeriesOptionsTypes['type']> {
    return input.type ?? input.series?.[0]?.type ?? 'line';
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

    return CHART_TYPES.isCartesian(specifiedType);
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

    return CHART_TYPES.isHierarchy(specifiedType);
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

    return CHART_TYPES.isPolar(specifiedType);
}

export function isSeriesOptionType(input?: string): input is NonNullable<SeriesOptionsTypes['type']> {
    if (input == null) {
        return false;
    }
    return CHART_TYPES.has(input);
}

export function isAxisOptionType(input?: string): input is NonNullable<AxesOptionsTypes>['type'] {
    if (input == null) {
        return false;
    }
    return AXIS_TYPES.has(input);
}
