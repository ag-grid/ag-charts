import { type AgSunburstInnerLabel, type AgSunburstSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    colorUnion,
    commonSeriesOptionsDefs,
    constant,
    fontOptionsDef,
    labelBoxOptionsDef,
    positiveNumber,
    ratio,
    required,
    string,
    textOrSegments,
    without,
} from 'ag-charts-core';

const { sunburstSeriesThemeableOptionsDef } = _ModuleSupport;

export const sunburstSeriesOptionsDef: OptionsDefs<AgSunburstSeriesOptions> = {
    ...sunburstSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight', 'showInLegend']),
    type: required(constant('sunburst')),
    // Re-declared after the themeable spread, which would otherwise leave `fill` optional.
    innerCircle: {
        fill: required(colorUnion),
        fillOpacity: ratio,
    },
    innerLabels: arrayOfDefs<AgSunburstInnerLabel>(
        {
            text: required(textOrSegments),
            spacing: positiveNumber,
            ...fontOptionsDef,
            ...labelBoxOptionsDef,
        },
        'inner label options array'
    ),
    labelKey: string,
    secondaryLabelKey: string,
    childrenKey: string,
    sizeKey: string,
    colorKey: string,
    sizeName: string,
    colorName: string,
};
