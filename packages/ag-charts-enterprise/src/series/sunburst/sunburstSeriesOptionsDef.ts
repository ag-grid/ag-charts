import { type AgSunburstSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callback,
    color,
    colorUnion,
    constant,
    fillOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, autoSizedLabelOptionsDefs, tooltipOptionsDefs, without } = _ModuleSupport;

export const sunburstSeriesOptionsDef: OptionsDefs<AgSunburstSeriesOptions> = {
    type: required(constant('sunburst')),
    labelKey: string,
    secondaryLabelKey: string,
    childrenKey: string,
    sizeKey: string,
    colorKey: string,
    sizeName: string,
    colorName: string,
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    colorRange: arrayOf(color),
    sectorSpacing: positiveNumber,
    cornerRadius: positiveNumber,
    padding: positiveNumber,
    itemStyler: callback,
    label: {
        spacing: positiveNumber,
        ...autoSizedLabelOptionsDefs,
    },
    secondaryLabel: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    highlightStyle: {
        label: {
            color: color,
        },
        secondaryLabel: {
            color: color,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
};
