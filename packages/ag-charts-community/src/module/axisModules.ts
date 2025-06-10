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
    AgGroupedCategoryAxisOptions,
    AgGroupedCategoryDepthOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgTimeAxisOptions,
    AgUnitTimeAxisOptions,
} from 'ag-charts-types';

import {
    cartesianAxisBandHighlightOptions,
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
import { GroupedCategoryAxis } from '../chart/axis/groupedCategoryAxis';
import { LogAxis } from '../chart/axis/logAxis';
import { NumberAxis } from '../chart/axis/numberAxis';
import { TimeAxis } from '../chart/axis/timeAxis';
import { UnitTimeAxis } from '../chart/axis/unitTimeAxis';
import { without } from '../util/object';
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

export const timeAxisOptionsDefs: OptionsDefs<AgTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(or(number, date), true),
    type: required(constant('time')),
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    crosshair: cartesianAxisCrosshairOptions(true, true),
};

export const categoryAxisOptionsDefs: OptionsDefs<AgCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('category')),
    label: cartesianAxisLabelOptionsDefs,
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    crosshair: cartesianAxisCrosshairOptions(),
    bandHighlight: cartesianAxisBandHighlightOptions,
};

export const groupedCategoryAxisOptionsDefs: OptionsDefs<AgGroupedCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('grouped-category')),
    label: cartesianAxisLabelOptionsDefs,
    crosshair: cartesianAxisCrosshairOptions(),
    bandHighlight: cartesianAxisBandHighlightOptions,
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

export const unitTimeAxisOptionsDefs: OptionsDefs<AgUnitTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...without(continuousAxisOptions(or(number, date), true), ['nice']),
    type: required(constant('unit-time')),
    unit: or(timeInterval, timeIntervalUnit),
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    crosshair: cartesianAxisCrosshairOptions(true, true),
    bandHighlight: cartesianAxisBandHighlightOptions,
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

export const TimeAxisModule: AxisModuleDefinition<AgTimeAxisOptions> = {
    type: 'axis',
    name: 'time',
    chartType: 'cartesian',

    // @todo(AG-14472) - Replace with timeAxisOptionsDefs,
    options: timeAxisOptionsDefs,

    create: (ctx: ModuleContext) => new TimeAxis(ctx),
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

export const UnitTimeAxisModule: AxisModuleDefinition<AgUnitTimeAxisOptions> = {
    type: 'axis',
    name: 'unit-time',
    chartType: 'cartesian',

    options: unitTimeAxisOptionsDefs,

    create: (ctx: ModuleContext) => new UnitTimeAxis(ctx),
};
