import { type AgSunburstSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    colorUnion,
    commonSeriesOptionsDefs,
    constant,
    ratio,
    required,
    string,
    without,
} from 'ag-charts-core';

const { sunburstSeriesThemeableOptionsDef } = _ModuleSupport;

export const sunburstSeriesOptionsDef: OptionsDefs<AgSunburstSeriesOptions> = {
    ...sunburstSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlightStyle', 'highlight', 'showInLegend']),
    type: required(constant('sunburst')),
    // Re-declared after the themeable spread so `fill` is required on the SERIES option while a
    // theme override may still set `fillOpacity` alone.
    innerCircle: {
        fill: required(colorUnion),
        fillOpacity: ratio,
    },
    labelKey: string,
    secondaryLabelKey: string,
    childrenKey: string,
    sizeKey: string,
    colorKey: string,
    sizeName: string,
    colorName: string,
};
