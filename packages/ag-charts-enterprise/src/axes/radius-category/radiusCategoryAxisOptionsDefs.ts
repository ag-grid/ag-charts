import type { AgRadiusCategoryAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    type WithoutCrossLineOptions,
    commonAxisCaptionOptionsDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    constant,
    number,
    ratio,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

export const radiusCategoryAxisOptionsDefs: OptionsDefs<WithoutCrossLineOptions<AgRadiusCategoryAxisOptions>> = {
    ...commonAxisOptionsDefs,
    type: constant('radius-category'),
    positionAngle: number,
    innerRadiusRatio: ratio,
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    label: commonAxisLabelOptionsDefs,
    title: commonAxisCaptionOptionsDefs,
    // The theme template emits `axis.options.shape = 'circle'`, which is absent from `AgRadiusCategoryAxisOptions`.
    ...undocumentedDefs({ shape: union('polygon', 'circle') }),
};
