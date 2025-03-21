import { type AgRadiusCrossLineOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type AxisModuleDefinition,
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
    AgRadiusNumberAxisOptions,
} from 'ag-charts-types';

import { AngleCategoryAxis } from './angle-category/angleCategoryAxis';
import { AngleNumberAxis } from './angle-number/angleNumberAxis';
import { OrdinalTimeAxis } from './ordinal/ordinalTimeAxis';
import { RadiusCategoryAxis } from './radius-category/radiusCategoryAxis';
import { RadiusNumberAxis } from './radius-number/radiusNumberAxis';

const {
    cartesianAxisLabelOptionsDefs,
    cartesianAxisOptionsDefs,
    cartesianAxisCrosshairOptions,
    continuousAxisOptions,
    commonAxisLabelOptionsDefs,
    commonAxisOptionsDefs,
    commonCrossLineOptionsDefs,
    commonCrossLineLabelOptionsDefs,
} = _ModuleSupport;

export const ordinalTimeAxisOptionsDefs: OptionsDefs<AgOrdinalTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('ordinal-time')),
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    label: {
        ...cartesianAxisLabelOptionsDefs,
        format: string,
    },
    interval: continuousAxisOptions(or(number, date), true).interval,
    crosshair: cartesianAxisCrosshairOptions(true),
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
        format: string,
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
        format: string,
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

export const OrdinalTimeAxisModule: AxisModuleDefinition<AgOrdinalTimeAxisOptions> = {
    type: 'axis',
    name: 'ordinal-time',
    chartType: 'cartesian',
    enterprise: true,

    options: ordinalTimeAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new OrdinalTimeAxis(ctx),
};

export const AngleNumberAxisModule: AxisModuleDefinition<AgAngleNumberAxisOptions> = {
    type: 'axis',
    name: 'angle-number',
    chartType: 'polar',
    enterprise: true,

    options: angleNumberAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new AngleNumberAxis(ctx),
};

export const AngleCategoryAxisModule: AxisModuleDefinition<AgAngleCategoryAxisOptions> = {
    type: 'axis',
    name: 'angle-category',
    chartType: 'polar',
    enterprise: true,

    options: angleCategoryAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new AngleCategoryAxis(ctx),
};

export const RadiusNumberAxisModule: AxisModuleDefinition<AgRadiusNumberAxisOptions> = {
    type: 'axis',
    name: 'radius-number',
    chartType: 'polar',
    enterprise: true,

    options: radiusNumberAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadiusNumberAxis(ctx),
};

export const RadiusCategoryAxisModule: AxisModuleDefinition<AgRadiusCategoryAxisOptions> = {
    type: 'axis',
    name: 'radius-category',
    chartType: 'polar',
    enterprise: true,

    options: radiusCategoryAxisOptionsDefs,

    create: (ctx: _ModuleSupport.ModuleContext) => new RadiusCategoryAxis(ctx),
};
