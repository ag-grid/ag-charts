import type { AgAngleNumberAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    type WithoutCrossLineOptions,
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

export const angleNumberAxisOptionsDefs: OptionsDefs<WithoutCrossLineOptions<AgAngleNumberAxisOptions>> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('angle-number'),
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
