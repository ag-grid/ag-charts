import { type OptionsDefs, boolean, constant, required, string, union } from 'ag-charts-core';
import type { AgScatterSeriesOptions, AgScatterSeriesThemeableOptions } from 'ag-charts-types';

import { without } from '../../../util/object';
import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    errorBarOptionsDefs,
    errorBarThemeableOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

export const scatterSeriesThemeableOptionsDef: OptionsDefs<AgScatterSeriesThemeableOptions> = {
    title: string,
    showInMiniChart: boolean,
    label: {
        placement: union('top', 'right', 'bottom', 'left'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarThemeableOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
};

export const scatterSeriesOptionsDef: OptionsDefs<AgScatterSeriesOptions> = {
    ...scatterSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('scatter')),
    xKey: required(string),
    yKey: required(string),
    labelKey: string,
    xName: string,
    yName: string,
    labelName: string,
    errorBar: errorBarOptionsDefs,
};
