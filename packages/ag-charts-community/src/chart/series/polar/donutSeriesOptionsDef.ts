import {
    type OptionsDefs,
    arrayOf,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    number,
    optionsDefs,
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
    innerCircle: fillOptionsDef,
    innerLabels: arrayOf(
        optionsDefs<AgDonutInnerLabel>(
            {
                text: required(string),
                spacing: positiveNumber,
                ...fontOptionsDef,
            },
            'inner label options'
        )
    ),
};
