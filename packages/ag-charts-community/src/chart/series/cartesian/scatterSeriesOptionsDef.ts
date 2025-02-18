import { type OptionsDefs, boolean, constant, required, string, union } from 'ag-charts-core';
import type { AgScatterSeriesOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDef,
    errorBarOptionsDef,
    markerOptionsDef,
    seriesLabelOptionsDef,
    tooltipOptionsDef,
} from '../../commonOptionsDef';

export const scatterSeriesOptionsDef: OptionsDefs<AgScatterSeriesOptions> = {
    type: required(constant('scatter')),
    xKey: required(string),
    yKey: required(string),
    labelKey: string,
    xName: string,
    yName: string,
    labelName: string,
    title: string,
    showInMiniChart: boolean,
    label: {
        placement: union('top', 'right', 'bottom', 'left'),
        ...seriesLabelOptionsDef,
    },
    tooltip: tooltipOptionsDef,
    errorBar: errorBarOptionsDef,
    ...commonSeriesOptionsDef,
    ...markerOptionsDef,
};
