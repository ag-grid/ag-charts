import {
    type OptionsDefs,
    arrayOfDefs,
    constant,
    fontOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    string,
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
        },
        'inner label options array'
    ),
};
