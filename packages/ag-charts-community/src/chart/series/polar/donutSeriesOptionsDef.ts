import {
    type OptionsDefs,
    arrayOfDefs,
    colorUnion,
    constant,
    fontOptionsDef,
    labelBoxOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    string,
    textOrSegments,
    undocumented,
} from 'ag-charts-core';
import type { AgDonutInnerLabel, AgDonutSeriesOptions, AgDonutSeriesThemeableOptions } from 'ag-charts-types';

import { pieSeriesOptionsDef, pieSeriesThemeableOptionsDef } from './pieSeriesOptionsDef';

export const donutSeriesThemeableOptionsDef: OptionsDefs<AgDonutSeriesThemeableOptions> = {
    ...pieSeriesThemeableOptionsDef,
    innerRadiusOffset: number,
    innerRadiusRatio: ratio,
    innerCircle: {
        fill: colorUnion,
        fillOpacity: ratio,
    },
    innerLabels: {
        spacing: positiveNumber,
        ...fontOptionsDef,
        ...labelBoxOptionsDef,
    },
};

export const donutSeriesOptionsDef: OptionsDefs<AgDonutSeriesOptions> = {
    ...donutSeriesThemeableOptionsDef,
    ...pieSeriesOptionsDef,
    type: required(constant('donut')),
    innerLabels: arrayOfDefs<AgDonutInnerLabel>(
        {
            text: required(textOrSegments),
            spacing: positiveNumber,
            ...fontOptionsDef,
            ...labelBoxOptionsDef,
        },
        'inner label options array'
    ),
};

// @ts-expect-error undocumented option
donutSeriesOptionsDef.angleFilterKey = undocumented(string);
