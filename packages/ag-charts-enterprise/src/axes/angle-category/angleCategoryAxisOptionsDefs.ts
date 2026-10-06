import type { AgAngleCategoryAxisOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    commonCrossLineLabelOptionsDefs,
    constant,
    crossLineOptionsDefs,
    defined,
    number,
    ratio,
    union,
} from 'ag-charts-core';

import { polarAxisListenersOptionsDefs } from '../polar-crosslines/polarAxisListenersOptionsDefs';

export const angleCategoryAxisOptionsDefs: OptionsDefs<AgAngleCategoryAxisOptions> = {
    ...commonAxisOptionsDefs,
    type: constant('angle-category'),
    listeners: polarAxisListenersOptionsDefs,
    shape: union('polygon', 'circle'),
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(defined, commonCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
    startAngle: number,
    endAngle: number,
    paddingInner: ratio,
    groupPaddingInner: ratio,
    label: {
        ...commonAxisLabelOptionsDefs,
        orientation: union('fixed', 'parallel', 'perpendicular'),
    },
};

// @ts-expect-error integrated sets this from the formatting panel, but it isn't relevant.
angleCategoryAxisOptionsDefs.innerRadiusRatio = ratio;
