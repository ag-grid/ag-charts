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
    greaterThan,
    instanceOf,
    isPlainObject,
    lessThan,
    number,
    or,
    positiveNumber,
    positiveNumberNonZero,
    required,
    string,
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
    cartesianAxisCrosshairOptions,
    cartesianAxisLabelOptionsDefs,
    cartesianAxisOptionsDefs,
    continuousAxisOptions,
    numberFormatValidator,
} from '../chart/axesOptionsDefs';
import { CategoryAxis } from '../chart/axis/categoryAxis';
import { GroupedCategoryAxis } from '../chart/axis/groupedCategoryAxis';
import { LogAxis } from '../chart/axis/logAxis';
import { NumberAxis } from '../chart/axis/numberAxis';
import { TimeAxis } from '../chart/axis/timeAxis';
import { UnitTimeAxis } from '../chart/axis/unitTimeAxis';
import { TimeInterval } from '../util/time';
import type { ModuleContext } from './moduleContext';

export const numberAxisOptionsDefs: OptionsDefs<AgNumberAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: required(constant('number')),
    label: {
        format: numberFormatValidator,
        ...cartesianAxisLabelOptionsDefs,
    },
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
    label: {
        format: numberFormatValidator,
        ...cartesianAxisLabelOptionsDefs,
    },
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const timeAxisOptionsDefs: OptionsDefs<AgTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(or(number, date), true),
    type: required(constant('time')),
    label: {
        ...cartesianAxisLabelOptionsDefs,
        format: string,
    },
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const categoryAxisOptionsDefs: OptionsDefs<AgCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('category')),
    label: cartesianAxisLabelOptionsDefs,
    paddingInner: positiveNumber,
    paddingOuter: positiveNumber,
    groupPaddingInner: positiveNumber,
    crosshair: cartesianAxisCrosshairOptions(),
};

export const groupedCategoryAxisOptionsDefs: OptionsDefs<AgGroupedCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('grouped-category')),
    label: cartesianAxisLabelOptionsDefs,
    crosshair: cartesianAxisCrosshairOptions(),
    paddingInner: positiveNumber,
    groupPaddingInner: positiveNumber,
    depthOptions: arrayOfDefs<AgGroupedCategoryDepthOptions>(
        {
            label: {
                enabled: boolean,
                avoidCollisions: boolean,
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
    type: required(constant('unit-time')),
    unit: instanceOf(TimeInterval),
    label: {
        ...cartesianAxisLabelOptionsDefs,
        format: string,
    },
    paddingInner: positiveNumber,
    paddingOuter: positiveNumber,
    groupPaddingInner: positiveNumber,
    crosshair: cartesianAxisCrosshairOptions(true),
    min: and(date, lessThan('max')),
    max: and(date, greaterThan('min')),
};

// @todo(AG-14472) - Remove
const mergeOptionsDefs = (a: OptionsDefs<any>, b: OptionsDefs<any>) => {
    const out: OptionsDefs<any> = {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        const aDef = (a as any)[key];
        const bDef = (b as any)[key];
        if (isPlainObject(aDef) && isPlainObject(bDef)) {
            out[key] = mergeOptionsDefs(aDef, bDef);
        } else if (aDef != null && bDef != null && aDef !== bDef) {
            out[key] = or(aDef, bDef);
        } else {
            out[key] = aDef ?? bDef;
        }
    }
    return out;
};
const timeAxisOptionsCompatibilityDefs = mergeOptionsDefs(timeAxisOptionsDefs, unitTimeAxisOptionsDefs);

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
    options: timeAxisOptionsCompatibilityDefs as any,

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
