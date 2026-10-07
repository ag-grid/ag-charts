import type { AgRadiusCategoryAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    commonAxisCaptionOptionsDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    constant,
    crossLineOptionsDefs,
    defined,
    number,
    radiusCrossLineLabelOptionsDefs,
    ratio,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

import { polarAxisListenersOptionsDefs } from '../polar-crosslines/polarAxisListenersOptionsDefs';

export const radiusCategoryAxisOptionsDefs: OptionsDefs<AgRadiusCategoryAxisOptions> = {
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
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(defined, radiusCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
    // The theme template emits `axis.options.shape = 'circle'`, which is absent from `AgRadiusCategoryAxisOptions`.
    ...undocumentedDefs({ shape: union('polygon', 'circle') }),
};
