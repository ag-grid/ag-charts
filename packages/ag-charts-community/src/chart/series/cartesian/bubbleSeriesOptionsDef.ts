import {
    type OptionsDefs,
    arrayOf,
    boolean,
    constant,
    number,
    positiveNumber,
    required,
    string,
    union,
} from 'ag-charts-core';
import type { AgBubbleSeriesOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDef,
    markerOptionsDef,
    seriesLabelOptionsDef,
    tooltipOptionsDef,
} from '../../commonOptionsDef';

export const bubbleSeriesOptionsDef: OptionsDefs<AgBubbleSeriesOptions> = {
    type: required(constant('bubble')),
    xKey: required(string),
    yKey: required(string),
    sizeKey: required(string),
    labelKey: string,
    xName: string,
    yName: string,
    sizeName: string,
    labelName: string,
    title: string,
    domain: arrayOf(number),
    maxSize: positiveNumber,
    showInMiniChart: boolean,
    label: {
        placement: union('top', 'right', 'bottom', 'left'),
        ...seriesLabelOptionsDef,
    },
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...markerOptionsDef,
};
