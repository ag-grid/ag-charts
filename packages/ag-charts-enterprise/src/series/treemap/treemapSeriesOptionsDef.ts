import type {
    AgTreemapSeriesOptions,
    AgTreemapSeriesStyle,
    AgTreemapSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    autoSizedLabelOptionsDefs,
    boolean,
    callbackDefs,
    color,
    colorOrRef,
    colorScaleOptionsDef,
    colorUnion,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    positiveNumber,
    ratio,
    required,
    selectionOptionsDef,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    textAlign,
    tooltipOptionsDefs,
    undocumentedDefs,
    union,
    without,
} from 'ag-charts-core';

import { hierarchyHighlightStyleOptionsDef } from '../hierarchy/hierarchyOptionsDefs';

const hierarchySelectionStyleOptionsDef = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    opacity: ratio,
};

export const treemapSeriesThemeableOptionsDef: OptionsDefs<AgTreemapSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    colorScale: colorScaleOptionsDef,
    itemStyler: callbackDefs<AgTreemapSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
    group: {
        gap: positiveNumber,
        padding: positiveNumber,
        cornerRadius: positiveNumber,
        shadow: shadowOptionsDefs,
        fills: arrayOf(colorUnion),
        textAlign,
        interactive: boolean,
        highlight: {
            enabled: boolean,
            highlightedItem: { ...hierarchyHighlightStyleOptionsDef, shadow: shadowOptionsDefs },
            unhighlightedItem: hierarchyHighlightStyleOptionsDef,
        },
        label: {
            ...seriesLabelOptionsDefs,
            spacing: positiveNumber,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tile: {
        gap: positiveNumber,
        padding: positiveNumber,
        cornerRadius: positiveNumber,
        shadow: shadowOptionsDefs,
        textAlign,
        verticalAlign: union('top', 'middle', 'bottom'),
        label: {
            ...autoSizedLabelOptionsDefs,
            spacing: positiveNumber,
        },
        secondaryLabel: autoSizedLabelOptionsDefs,
        highlight: {
            enabled: boolean,
            highlightedItem: { ...hierarchyHighlightStyleOptionsDef, shadow: shadowOptionsDefs },
            highlightedBranch: hierarchyHighlightStyleOptionsDef,
            unhighlightedItem: hierarchyHighlightStyleOptionsDef,
            unhighlightedBranch: hierarchyHighlightStyleOptionsDef,
        },
        selection: selectionOptionsDef(hierarchySelectionStyleOptionsDef),
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['highlight', 'selection', 'showInLegend']),
    ...undocumentedDefs({
        childrenKey: string,
        undocumentedGroupStrokes: arrayOf(color),
    }),
};

export const treemapSeriesOptionsDef: OptionsDefs<AgTreemapSeriesOptions> = {
    ...treemapSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight', 'selection', 'showInLegend']),
    type: required(constant('treemap')),
    labelKey: string,
    secondaryLabelKey: string,
    childrenKey: string,
    sizeKey: string,
    colorKey: string,
    sizeName: string,
    colorName: string,
};
