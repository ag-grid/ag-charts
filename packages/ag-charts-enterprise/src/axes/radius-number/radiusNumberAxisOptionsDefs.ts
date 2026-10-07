import type { AgRadiusNumberAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    commonAxisCaptionOptionsDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    constant,
    continuousAxisOptions,
    crossLineOptionsDefs,
    number,
    numberFormatValidator,
    numericValue,
    radiusCrossLineLabelOptionsDefs,
    ratio,
    union,
} from 'ag-charts-core';

import { polarAxisListenersOptionsDefs } from '../polar-crosslines/polarAxisListenersOptionsDefs';

export const radiusNumberAxisOptionsDefs: OptionsDefs<AgRadiusNumberAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('radius-number'),
    listeners: polarAxisListenersOptionsDefs,
    shape: union('polygon', 'circle'),
    positionAngle: number,
    innerRadiusRatio: ratio,
    title: commonAxisCaptionOptionsDefs,
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(numericValue, radiusCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
    label: {
        ...commonAxisLabelOptionsDefs,
        format: numberFormatValidator,
    },
};
