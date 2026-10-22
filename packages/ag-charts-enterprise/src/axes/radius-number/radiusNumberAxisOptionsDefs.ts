import type { AgRadiusNumberAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    type WithoutCrossLineOptions,
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

export const radiusNumberAxisOptionsDefs: OptionsDefs<WithoutCrossLineOptions<AgRadiusNumberAxisOptions>> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('radius-number'),
    shape: union('polygon', 'circle'),
    positionAngle: number,
    innerRadiusRatio: ratio,
    title: commonAxisCaptionOptionsDefs,
    label: {
        ...commonAxisLabelOptionsDefs,
        format: numberFormatValidator,
    },
};
