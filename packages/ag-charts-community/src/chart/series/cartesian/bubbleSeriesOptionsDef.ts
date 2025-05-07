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
import type { AgBubbleSeriesOptions, AgBubbleSeriesThemeableOptions } from 'ag-charts-types';

import { without } from '../../../util/object';
import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

export const bubbleSeriesThemeableOptionsDef: OptionsDefs<AgBubbleSeriesThemeableOptions> = {
    title: string,
    domain: arrayOf(number),
    maxSize: positiveNumber,
    showInMiniChart: boolean,
    label: {
        placement: union('top', 'right', 'bottom', 'left'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
};

export const bubbleSeriesOptionsDef: OptionsDefs<AgBubbleSeriesOptions> = {
    ...bubbleSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('bubble')),
    xKey: required(string),
    yKey: required(string),
    sizeKey: required(string),
    labelKey: string,
    xName: string,
    yName: string,
    sizeName: string,
    labelName: string,
};
