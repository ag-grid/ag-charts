import {
    type OptionsDefs,
    arrayOfDefs,
    boolean,
    callbackOf,
    constant,
    fontOptionsDef,
    number,
    positiveNumber,
    ratio,
    union,
} from 'ag-charts-core';
import type {
    AgAngleCategoryAxisOptions,
    AgAngleNumberAxisOptions,
    AgOrdinalTimeAxisOptions,
    AgRadiusCategoryAxisOptions,
    AgRadiusCrossLineOptions,
    AgRadiusNumberAxisOptions,
} from 'ag-charts-types';

import {
    cartesianAxisBandHighlightOptions,
    cartesianAxisCrosshairOptions,
    cartesianAxisOptionsDefs,
    cartesianTimeAxisLabel,
    cartesianTimeAxisParentLevel,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    commonCrossLineLabelOptionsDefs,
    commonCrossLineOptionsDefs,
    continuousAxisOptions,
    discreteTimeAxisIntervalOptionsDefs,
} from './axesOptionsDefs';
import { numberFormatValidator, textOrSegments } from './commonOptionsDefs';

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
    bandHighlight: cartesianAxisBandHighlightOptions,
};

export const angleNumberAxisOptionsDefs: OptionsDefs<AgAngleNumberAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: constant('angle-number'),
    crossLines: arrayOfDefs(commonCrossLineOptionsDefs),
    startAngle: number,
    endAngle: number,
    label: {
        ...commonAxisLabelOptionsDefs,
        orientation: union('fixed', 'parallel', 'perpendicular'),
        format: numberFormatValidator,
    },
};

export const angleCategoryAxisOptionsDefs: OptionsDefs<AgAngleCategoryAxisOptions> = {
    ...commonAxisOptionsDefs,
    type: constant('angle-category'),
    shape: union('polygon', 'circle'),
    crossLines: arrayOfDefs(commonCrossLineOptionsDefs),
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
    ...continuousAxisOptions(number),
    type: constant('radius-number'),
    shape: union('polygon', 'circle'),
    positionAngle: number,
    innerRadiusRatio: ratio,
    crossLines: arrayOfDefs<AgRadiusCrossLineOptions>(
        {
            ...commonCrossLineOptionsDefs,
            label: {
                ...commonCrossLineLabelOptionsDefs,
                positionAngle: number,
            },
        },
        'cross-line options'
    ),
    title: {
        enabled: boolean,
        text: textOrSegments,
        spacing: positiveNumber,
        formatter: callbackOf(textOrSegments),
        ...fontOptionsDef,
    },
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
    crossLines: arrayOfDefs<AgRadiusCrossLineOptions>(
        {
            ...commonCrossLineOptionsDefs,
            label: {
                ...commonCrossLineLabelOptionsDefs,
                positionAngle: number,
            },
        },
        'cross-line options'
    ),
    title: {
        enabled: boolean,
        text: textOrSegments,
        spacing: positiveNumber,
        formatter: callbackOf(textOrSegments),
        ...fontOptionsDef,
    },
};
