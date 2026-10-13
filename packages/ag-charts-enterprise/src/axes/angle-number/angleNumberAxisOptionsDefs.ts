import type { AgAngleNumberAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    commonCrossLineLabelOptionsDefs,
    constant,
    continuousAxisOptions,
    crossLineOptionsDefs,
    number,
    numberFormatValidator,
    numericValue,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

import { polarAxisListenersOptionsDefs } from '../polar-crosslines/polarAxisListenersOptionsDefs';

export const angleNumberAxisOptionsDefs: OptionsDefs<AgAngleNumberAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('angle-number'),
    listeners: polarAxisListenersOptionsDefs,
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(numericValue, commonCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
    startAngle: number,
    endAngle: number,
    label: {
        ...commonAxisLabelOptionsDefs,
        orientation: union('fixed', 'parallel', 'perpendicular'),
        format: numberFormatValidator,
    },
    // The theme template emits `axis.options.shape = 'circle'`, which is absent from `AgAngleNumberAxisOptions`.
    ...undocumentedDefs({ shape: union('polygon', 'circle') }),
};
