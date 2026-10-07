import type {
    AgSunburstInnerLabel,
    AgSunburstSeriesOptions,
    AgSunburstSeriesStyle,
    AgSunburstSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    arrayOfDefs,
    autoSizedLabelOptionsDefs,
    boolean,
    callbackDefs,
    colorOrRef,
    colorScaleOptionsDef,
    colorUnion,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    labelBoxOptionsDef,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    textOrSegments,
    tooltipOptionsDefs,
    undocumentedDefs,
    without,
} from 'ag-charts-core';

import { hierarchyHighlightStyleOptionsDef } from '../hierarchy/hierarchyOptionsDefs';

export const sunburstSeriesThemeableOptionsDef: OptionsDefs<AgSunburstSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    colorScale: colorScaleOptionsDef,
    sectorSpacing: positiveNumber,
    cornerRadius: positiveNumber,
    shadow: shadowOptionsDefs,
    padding: positiveNumber,
    innerRadiusRatio: ratio,
    innerRadiusSize: positiveNumberNonZero,
    innerCircle: {
        fill: colorUnion,
        fillOpacity: ratio,
    },
    innerLabels: {
        spacing: positiveNumber,
        ...fontOptionsDef,
        ...labelBoxOptionsDef,
    },
    itemStyler: callbackDefs<AgSunburstSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
    label: {
        spacing: positiveNumber,
        ...autoSizedLabelOptionsDefs,
    },
    secondaryLabel: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['highlight', 'showInLegend']),
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    highlight: {
        enabled: boolean,
        highlightedItem: { ...hierarchyHighlightStyleOptionsDef, shadow: shadowOptionsDefs },
        highlightedBranch: hierarchyHighlightStyleOptionsDef,
        unhighlightedItem: hierarchyHighlightStyleOptionsDef,
        unhighlightedBranch: hierarchyHighlightStyleOptionsDef,
    },
    ...undocumentedDefs({
        childrenKey: string,
    }),
};

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
