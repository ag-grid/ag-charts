import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    constant,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    shapeHighlightOptionsDef,
    string,
    union,
} from 'ag-charts-core';
import type {
    AgScatterSeriesOptions,
    AgScatterSeriesStylerResult,
    AgScatterSeriesThemeableOptions,
} from 'ag-charts-types';

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
    styler: callbackDefs<AgScatterSeriesStylerResult>(markerOptionsDefs),
    maxRenderedItems: number,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
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
    legendItemName: string,
    xKeyAxis: string,
    yKeyAxis: string,
    errorBar: errorBarOptionsDefs,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};
