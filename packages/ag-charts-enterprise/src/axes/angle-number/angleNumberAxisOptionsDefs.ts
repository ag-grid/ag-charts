import type { AgAngleNumberAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    constant,
    continuousAxisOptions,
    number,
    numberFormatValidator,
    numericValue,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

import { polarAxisListenersOptionsDefs } from '../polar-crosslines/polarAxisListenersOptionsDefs';

export const angleNumberAxisOptionsDefs: OptionsDefs<Omit<AgAngleNumberAxisOptions, 'crossLines'>> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('angle-number'),
    listeners: polarAxisListenersOptionsDefs,
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
