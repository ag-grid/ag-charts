import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgBubbleSeriesStylerResult,
    AgBubbleSeriesThemeableOptions,
} from 'ag-charts-types';

import { without } from '../../../util/object';
import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

const bubbleStyler = callbackDefs<AgBubbleSeriesStylerResult>({
    ...strokeOptionsDef,
    ...fillOptionsDef,
    ...lineDashOptionsDef,
});

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
    styler: bubbleStyler,
    maxRenderedItems: number,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled', 'autoHide']),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
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
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};
