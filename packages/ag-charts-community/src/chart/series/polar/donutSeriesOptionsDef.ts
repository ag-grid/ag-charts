import {
    type OptionsDefs,
    arrayOf,
    constant,
    fillOptionsDef,
    fontOptionsDef,
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
    innerRadiusOffset: positiveNumber,
    innerRadiusRatio: ratio,
    innerCircle: fillOptionsDef,
    innerLabels: arrayOf(
        optionsDefs<AgDonutInnerLabel>(
            {
                text: string,
                spacing: positiveNumber,
                ...fontOptionsDef,
            },
            'inner label options'
        )
    ),
};
