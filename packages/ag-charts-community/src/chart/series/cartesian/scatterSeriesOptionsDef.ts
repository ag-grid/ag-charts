import { type OptionsDefs, boolean, constant, required, string, union } from 'ag-charts-core';
import type { AgScatterSeriesOptions } from 'ag-charts-types';

import { without } from '../../../util/object';
import {
    commonSeriesOptionsDefs,
    errorBarOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

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
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
};
