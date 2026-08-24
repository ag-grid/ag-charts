import {
    type OptionsDefs,
    arrayOfDefs,
    boolean,
    constant,
    date,
    defined,
    number,
    numberFormatValidator,
    numericValue,
    or,
    ratio,
    union,
} from 'ag-charts-core';
import type {
    AgAngleCategoryAxisOptions,
    AgAngleNumberAxisOptions,
    AgOrdinalTimeAxisOptions,
    AgRadiusCategoryAxisOptions,
    AgRadiusNumberAxisOptions,
} from 'ag-charts-types';

import {
    cartesianAxisBandHighlightOptions,
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianCrossLineLabelOptionsDefs,
    cartesianTimeAxisLabel,
    cartesianTimeAxisParentLevel,
    commonAxisCaptionOptionsDefs,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    commonCrossLineLabelOptionsDefs,
    continuousAxisOptions,
    crossLineOptionsDefs,
    discreteTimeAxisIntervalOptionsDefs,
    radiusCrossLineLabelOptionsDefs,
} from './axesOptionsDefs';

export const ordinalTimeAxisOptionsDefs: OptionsDefs<AgOrdinalTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: constant('ordinal-time'),
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    interval: discreteTimeAxisIntervalOptionsDefs,
    crosshair: cartesianAxisCrosshairOptions(true, true),
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(or(numericValue, date), cartesianCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
    bandHighlight: cartesianAxisBandHighlightOptions,
    bandAlignment: union('justify', 'start', 'center', 'end'),
    skipNullBars: boolean,
};

export const angleNumberAxisOptionsDefs: OptionsDefs<AgAngleNumberAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('angle-number'),
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
};

// The theme template emits `axis.options.shape = 'circle'`, which is absent from `AgAngleNumberAxisOptions`.
// @ts-expect-error theme-emitted, not user-facing
angleNumberAxisOptionsDefs.shape = union('polygon', 'circle');

export const angleCategoryAxisOptionsDefs: OptionsDefs<AgAngleCategoryAxisOptions> = {
    ...commonAxisOptionsDefs,
    type: constant('angle-category'),
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

export const radiusNumberAxisOptionsDefs: OptionsDefs<AgRadiusNumberAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('radius-number'),
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

export const radiusCategoryAxisOptionsDefs: OptionsDefs<AgRadiusCategoryAxisOptions> = {
    ...commonAxisOptionsDefs,
    type: constant('radius-category'),
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
};

// The theme template emits `axis.options.shape = 'circle'`, which is absent from `AgRadiusCategoryAxisOptions`.
// @ts-expect-error theme-emitted, not user-facing
radiusCategoryAxisOptionsDefs.shape = union('polygon', 'circle');
