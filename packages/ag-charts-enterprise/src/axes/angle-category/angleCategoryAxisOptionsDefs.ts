import type { AgAngleCategoryAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    type WithoutCrossLineOptions,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    constant,
    number,
    ratio,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

export const angleCategoryAxisOptionsDefs: OptionsDefs<WithoutCrossLineOptions<AgAngleCategoryAxisOptions>> = {
    ...commonAxisOptionsDefs,
    type: constant('angle-category'),
    shape: union('polygon', 'circle'),
    startAngle: number,
    endAngle: number,
    paddingInner: ratio,
    groupPaddingInner: ratio,
    label: {
        ...commonAxisLabelOptionsDefs,
        orientation: union('fixed', 'parallel', 'perpendicular'),
    },
    // Integrated sets this from the formatting panel, but it isn't relevant.
    ...undocumentedDefs({ innerRadiusRatio: ratio }),
};
