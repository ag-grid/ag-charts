import type { AgRadiusCategoryAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonAxisCaptionOptionsDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    constant,
    number,
    ratio,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

import { polarAxisListenersOptionsDefs } from '../polar-crosslines/polarAxisListenersOptionsDefs';

export const radiusCategoryAxisOptionsDefs: OptionsDefs<Omit<AgRadiusCategoryAxisOptions, 'crossLines'>> = {
    ...commonAxisOptionsDefs,
    type: constant('radius-category'),
    listeners: polarAxisListenersOptionsDefs,
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
