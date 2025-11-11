import {
    type OptionsDefs,
    arrayOfDefs,
    constant,
    fontOptionsDef,
    labelBoxOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    string,
    undocumented,
} from 'ag-charts-core';
import type { AgDonutInnerLabel, AgDonutSeriesOptions, AgDonutSeriesThemeableOptions } from 'ag-charts-types';

import { pieSeriesOptionsDef, pieSeriesThemeableOptionsDef } from './pieSeriesOptionsDef';

export const donutSeriesThemeableOptionsDef: OptionsDefs<AgDonutSeriesThemeableOptions> = {
    ...pieSeriesThemeableOptionsDef,
    innerRadiusOffset: number,
    innerRadiusRatio: ratio,
    innerCircle: {
        fill: string,
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
            text: required(string),
            spacing: positiveNumber,
            ...fontOptionsDef,
            ...labelBoxOptionsDef,
        },
        'inner label options array'
    ),
};

// @ts-expect-error undocumented option
donutSeriesOptionsDef.angleFilterKey = undocumented(string);
