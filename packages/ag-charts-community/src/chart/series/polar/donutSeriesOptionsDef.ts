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
import type { AgDonutInnerLabel, AgDonutSeriesOptions } from 'ag-charts-types';

import { pieSeriesOptionsDef } from './pieSeriesOptionsDef';

export const donutSeriesOptionsDef: OptionsDefs<AgDonutSeriesOptions> = {
    ...pieSeriesOptionsDef,
    type: required(constant('donut')),
    innerRadiusOffset: number,
    innerRadiusRatio: ratio,
    innerCircle: {
        fill: string,
        fillOpacity: ratio,
    },
    innerLabels: arrayOfDefs<AgDonutInnerLabel>(
        {
            text: required(string),
            spacing: positiveNumber,
            ...fontOptionsDef,
        },
        'inner label options array'
    ),
};
