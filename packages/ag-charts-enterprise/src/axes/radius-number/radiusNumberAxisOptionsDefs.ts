import type { AgRadiusNumberAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonAxisCaptionOptionsDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    constant,
    continuousAxisOptions,
    number,
    numberFormatValidator,
    numericValue,
    ratio,
    union,
} from 'ag-charts-core';

import { polarAxisListenersOptionsDefs } from '../polar-crosslines/polarAxisListenersOptionsDefs';

export const radiusNumberAxisOptionsDefs: OptionsDefs<Omit<AgRadiusNumberAxisOptions, 'crossLines'>> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('radius-number'),
    listeners: polarAxisListenersOptionsDefs,
    shape: union('polygon', 'circle'),
    positionAngle: number,
    innerRadiusRatio: ratio,
    title: commonAxisCaptionOptionsDefs,
    label: {
        ...commonAxisLabelOptionsDefs,
        format: numberFormatValidator,
    },
};
