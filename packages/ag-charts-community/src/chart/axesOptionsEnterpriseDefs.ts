import {
    type OptionsDefs,
    arrayOfDefs,
    boolean,
    callback,
    constant,
    date,
    fontOptionsDef,
    number,
    or,
    positiveNumber,
    ratio,
    required,
    string,
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
    numberFormatValidator,
} from './axesOptionsDefs';

export const ordinalTimeAxisOptionsDefs: OptionsDefs<AgOrdinalTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('ordinal-time')),
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    interval: continuousAxisOptions(or(number, date), true).interval,
    crosshair: cartesianAxisCrosshairOptions(true, true),
    bandHighlight: cartesianAxisBandHighlightOptions,
};

export const angleNumberAxisOptionsDefs: OptionsDefs<AgAngleNumberAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: required(constant('angle-number')),
    crossLines: arrayOfDefs(commonCrossLineOptionsDefs),
    startAngle: number,
    endAngle: number,
    label: {
        ...commonAxisLabelOptionsDefs,
        orientation: union('fixed', 'parallel', 'perpendicular'),
        format: numberFormatValidator,
    },
};

const invalidOptionsFromIntegratedCharts: OptionsDefs<AgAngleCategoryAxisOptions> = {
    // @ts-expect-error integrated sets this from the formatting panel, but it isn't relevant.
    innerRadiusRatio: ratio,
};

export const angleCategoryAxisOptionsDefs: OptionsDefs<AgAngleCategoryAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...invalidOptionsFromIntegratedCharts,
    type: required(constant('angle-category')),
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

export const radiusNumberAxisOptionsDefs: OptionsDefs<AgRadiusNumberAxisOptions> = {
    ...commonAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: required(constant('radius-number')),
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
        text: string,
        spacing: positiveNumber,
        formatter: callback,
        ...fontOptionsDef,
    },
    label: {
        ...commonAxisLabelOptionsDefs,
        format: numberFormatValidator,
    },
};

export const radiusCategoryAxisOptionsDefs: OptionsDefs<AgRadiusCategoryAxisOptions> = {
    ...commonAxisOptionsDefs,
    type: required(constant('radius-category')),
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
        text: string,
        spacing: positiveNumber,
        formatter: callback,
        ...fontOptionsDef,
    },
};
