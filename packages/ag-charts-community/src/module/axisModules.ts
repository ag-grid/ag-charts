import {
    type AxisModuleDefinition,
    type OptionsDefs,
    and,
    arrayOfDefs,
    attachDescription,
    boolean,
    color,
    constant,
    date,
    fontOptionsDef,
    number,
    or,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
} from 'ag-charts-core';
import type {
    AgCategoryAxisOptions,
    AgContinuousTimeAxisOptions,
    AgGroupedCategoryAxisOptions,
    AgGroupedCategoryDepthOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgTimeAxisOptions,
} from 'ag-charts-types';

import {
    cartesianAxisCrosshairOptions,
    cartesianAxisLabelOptionsDefs,
    cartesianAxisOptionsDefs,
    cartesianNumericAxisLabel,
    cartesianTimeAxisLabel,
    cartesianTimeAxisParentLevel,
    continuousAxisOptions,
    timeInterval,
    timeIntervalUnit,
} from '../chart/axesOptionsDefs';
import { CategoryAxis } from '../chart/axis/categoryAxis';
import { ContinuousTimeAxis } from '../chart/axis/continuousTimeAxis';
import { GroupedCategoryAxis } from '../chart/axis/groupedCategoryAxis';
import { LogAxis } from '../chart/axis/logAxis';
import { NumberAxis } from '../chart/axis/numberAxis';
import { TimeAxis } from '../chart/axis/timeAxis';
import type { ModuleContext } from './moduleContext';

export const numberAxisOptionsDefs: OptionsDefs<AgNumberAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: required(constant('number')),
    label: cartesianNumericAxisLabel,
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const logAxisOptionsDefs: OptionsDefs<AgLogAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: required(constant('log')),
    base: and(
        positiveNumberNonZero,
        attachDescription((value) => value !== 1, 'not equal to 1')
    ),
    label: cartesianNumericAxisLabel,
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const continuousTimeAxisOptionsDefs: OptionsDefs<AgContinuousTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(or(number, date), true),
    type: required(constant('continuous-time')),
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const categoryAxisOptionsDefs: OptionsDefs<AgCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('category')),
    label: cartesianAxisLabelOptionsDefs,
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    crosshair: cartesianAxisCrosshairOptions(),
};

export const groupedCategoryAxisOptionsDefs: OptionsDefs<AgGroupedCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('grouped-category')),
    label: cartesianAxisLabelOptionsDefs,
    crosshair: cartesianAxisCrosshairOptions(),
    paddingInner: ratio,
    groupPaddingInner: ratio,
    depthOptions: arrayOfDefs<AgGroupedCategoryDepthOptions>(
        {
            label: {
                enabled: boolean,
                avoidCollisions: boolean,
                rotation: number,
                spacing: number,
                ...fontOptionsDef,
            },
            tick: {
                enabled: boolean,
                stroke: color,
                width: positiveNumber,
            },
        },
        'depth options objects array'
    ),
};

export const timeAxisOptionsDefs: OptionsDefs<AgTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    // @todo(AG-14472) - Remove nice
    // ...without(continuousAxisOptions(or(number, date), true), ['nice']),
    ...continuousAxisOptions(or(number, date), true),
    type: required(constant('time')),
    unit: or(timeInterval, timeIntervalUnit),
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const NumberAxisModule: AxisModuleDefinition<AgNumberAxisOptions> = {
    type: 'axis',
    name: 'number',
    chartType: 'cartesian',

    options: numberAxisOptionsDefs,

    create: (ctx: ModuleContext) => new NumberAxis(ctx),
};

export const LogAxisModule: AxisModuleDefinition<AgLogAxisOptions> = {
    type: 'axis',
    name: 'log',
    chartType: 'cartesian',

    options: logAxisOptionsDefs,

    create: (ctx: ModuleContext) => new LogAxis(ctx),
};

export const ContinuousTimeAxisModule: AxisModuleDefinition<AgContinuousTimeAxisOptions> = {
    type: 'axis',
    name: 'continuous-time',
    chartType: 'cartesian',

    // @todo(AG-14472) - Replace with timeAxisOptionsDefs,
    options: continuousTimeAxisOptionsDefs,

    create: (ctx: ModuleContext) => new ContinuousTimeAxis(ctx),
};

export const CategoryAxisModule: AxisModuleDefinition<AgCategoryAxisOptions> = {
    type: 'axis',
    name: 'category',
    chartType: 'cartesian',

    options: categoryAxisOptionsDefs,

    create: (ctx: ModuleContext) => new CategoryAxis(ctx),
};

export const GroupedCategoryAxisModule: AxisModuleDefinition<AgGroupedCategoryAxisOptions> = {
    type: 'axis',
    name: 'grouped-category',
    chartType: 'cartesian',

    options: groupedCategoryAxisOptionsDefs,

    create: (ctx: ModuleContext) => new GroupedCategoryAxis(ctx),
};

export const TimeAxisModule: AxisModuleDefinition<AgTimeAxisOptions> = {
    type: 'axis',
    name: 'time',
    chartType: 'cartesian',

    options: timeAxisOptionsDefs,

    create: (ctx: ModuleContext) => new TimeAxis(ctx),
};
