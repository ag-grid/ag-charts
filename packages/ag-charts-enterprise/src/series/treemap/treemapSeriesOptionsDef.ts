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
    deprecated,
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
    verticalAlign,
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
        textAlign: deprecated(textAlign, 'Use `label.textAlign` instead.'),
        interactive: boolean,
        highlight: {
            enabled: boolean,
            highlightedItem: { ...hierarchyHighlightStyleOptionsDef, shadow: shadowOptionsDefs },
            unhighlightedItem: hierarchyHighlightStyleOptionsDef,
        },
        label: {
            ...seriesLabelOptionsDefs,
            spacing: positiveNumber,
            textAlign,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tile: {
        gap: positiveNumber,
        padding: positiveNumber,
        cornerRadius: positiveNumber,
        shadow: shadowOptionsDefs,
        textAlign: deprecated(textAlign, 'Use `label.textAlign` and `secondaryLabel.textAlign` instead.'),
        verticalAlign: deprecated(
            verticalAlign,
            'Use `label.verticalAlign` and `secondaryLabel.verticalAlign` instead.'
        ),
        label: {
            ...autoSizedLabelOptionsDefs,
            spacing: positiveNumber,
            textAlign,
            verticalAlign,
        },
        secondaryLabel: {
            ...autoSizedLabelOptionsDefs,
            textAlign,
            verticalAlign,
        },
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
