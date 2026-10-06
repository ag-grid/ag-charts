import type { AgNightingaleSeriesOptions, AgNightingaleSeriesThemeableOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    barHighlightOptionsDef,
    boolean,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesShadowHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
} from 'ag-charts-core';

import { radialSeriesStylerDef } from '../radial-column/radialColumnSeriesOptionsDef';

export const nightingaleSeriesThemeableOptionsDef: OptionsDefs<AgNightingaleSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    styler: radialSeriesStylerDef,
    itemStyler: radialSeriesStylerDef,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesShadowHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

export const nightingaleSeriesOptionsDef: OptionsDefs<AgNightingaleSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...nightingaleSeriesThemeableOptionsDef,
    type: required(constant('nightingale')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};

// @ts-expect-error undocumented option
nightingaleSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
nightingaleSeriesOptionsDef.radiusKeyAxis = undocumented(string);
