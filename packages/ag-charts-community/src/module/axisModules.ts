import {
    type AxisModuleDefinition,
    type OptionsDefs,
    type Validator,
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    callback,
    color,
    constant,
    date,
    defined,
    fillOptionsDef,
    fontOptionsDef,
    greaterThan,
    instanceOf,
    isValidNumberFormat,
    lessThan,
    lineDashOptionsDef,
    number,
    numberMin,
    or,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgAxisGridStyle,
    AgBaseAxisLabelOptions,
    AgBaseAxisOptions,
    AgBaseCartesianAxisLabelOptions,
    AgBaseCartesianAxisOptions,
    AgCartesianCrossLineOptions,
    AgCategoryAxisOptions,
    AgContinuousAxisOptions,
    AgGroupedCategoryAxisOptions,
    AgGroupedCategoryDepthOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgTimeAxisOptions,
} from 'ag-charts-types';

import { CategoryAxis } from '../chart/axis/categoryAxis';
import { GroupedCategoryAxis } from '../chart/axis/groupedCategoryAxis';
import { LogAxis } from '../chart/axis/logAxis';
import { NumberAxis } from '../chart/axis/numberAxis';
import { TimeAxis } from '../chart/axis/timeAxis';
import { TimeInterval } from '../util/time';
import type { ModuleContext } from './moduleContext';

const numberFormatValidator = attachDescription(isValidNumberFormat, 'a valid number format string');

const commonAxisLabelOptionsDefs: OptionsDefs<AgBaseAxisLabelOptions> = {
    enabled: boolean,
    rotation: number,
    avoidCollisions: boolean,
    minSpacing: positiveNumber,
    spacing: positiveNumber,
    formatter: callback,
    itemStyler: callback,
    ...fontOptionsDef,
};

const cartesianAxisLabelOptionsDefs: OptionsDefs<AgBaseCartesianAxisLabelOptions> = {
    autoRotate: boolean,
    autoRotateAngle: number,
    ...commonAxisLabelOptionsDefs,
};

const commonAxisOptionsDefs: OptionsDefs<Omit<AgBaseAxisOptions, 'type'>> = {
    keys: arrayOf(string),
    reverse: boolean,
    gridLine: {
        enabled: boolean,
        width: positiveNumber,
        style: arrayOfDefs<AgAxisGridStyle>(
            {
                stroke: string,
                lineDash: arrayOf(positiveNumber),
            },
            'a grid-line style object array'
        ),
    },
    interval: {
        values: arrayOf(defined),
        minSpacing: positiveNumber,
    },
    label: commonAxisLabelOptionsDefs,
    line: {
        enabled: boolean,
        width: positiveNumber,
        stroke: string,
    },
    tick: {
        enabled: boolean,
        width: positiveNumber,
        size: positiveNumber,
        stroke: string,
    },
};

// @ts-expect-error undocumented option
commonAxisOptionsDefs.context = defined;

// @ts-expect-error undocumented option
commonAxisOptionsDefs.layoutConstraints = {
    stacked: required(boolean),
    align: required(union('start', 'end')),
    unit: required(union('percent', 'px')),
    width: required(positiveNumber),
};

const cartesianAxisOptionsDefs: OptionsDefs<Omit<AgBaseCartesianAxisOptions, 'type' | 'label'>> = {
    ...commonAxisOptionsDefs,
    crossLines: arrayOfDefs<AgCartesianCrossLineOptions>({
        enabled: boolean,
        type: required(union('line', 'range')),
        range: and(
            attachDescription((_, context) => context.options.type === 'range', "crossLine type to be 'range'"),
            arrayOf(defined),
            arrayLength(2, 2)
        ),
        value: and(
            attachDescription((_, context) => context.options.type === 'line', "crossLine type to be 'line'"),
            defined
        ),
        label: {
            enabled: boolean,
            text: required(string),
            padding: positiveNumber,
            position: union(
                'top',
                'left',
                'right',
                'bottom',
                'top-left',
                'top-right',
                'bottom-left',
                'bottom-right',
                'inside',
                'inside-left',
                'inside-right',
                'inside-top',
                'inside-bottom',
                'inside-top-left',
                'inside-bottom-left',
                'inside-top-right',
                'inside-bottom-right'
            ),
            rotation: number,
            ...fontOptionsDef,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    crosshair: {
        enabled: boolean,
        snap: boolean,
        label: {
            enabled: boolean,
            xOffset: number,
            yOffset: number,
            format: string,
            renderer: callback,
        },
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    position: union('top', 'right', 'bottom', 'left'),
    thickness: positiveNumber,
    title: {
        enabled: boolean,
        text: string,
        spacing: positiveNumber,
        formatter: callback,
        ...fontOptionsDef,
    },
};

function continuousAxisOptions(validDatum: Validator, validStep?: Validator): OptionsDefs<AgContinuousAxisOptions> {
    return {
        min: and(validDatum, lessThan('max')),
        max: and(validDatum, greaterThan('min')),
        nice: boolean,
        interval: {
            step: validStep ?? validDatum,
            values: arrayOf(validDatum),
            minSpacing: and(positiveNumber, lessThan('maxSpacing')),
            maxSpacing: and(positiveNumber, greaterThan('minSpacing')),
        },
    };
}

export const numberAxisOptionsDefs: OptionsDefs<AgNumberAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: required(constant('number')),
    label: {
        format: numberFormatValidator,
        ...cartesianAxisLabelOptionsDefs,
    },
};

export const logAxisOptionsDefs: OptionsDefs<AgLogAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: required(constant('log')),
    base: and(
        numberMin(0, false),
        attachDescription((value) => value !== 1, 'not equal to 1')
    ),
    label: {
        format: numberFormatValidator,
        ...cartesianAxisLabelOptionsDefs,
    },
};

export const timeAxisOptionsDefs: OptionsDefs<AgTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(or(number, date), or(number, date, instanceOf(TimeInterval))),
    type: required(constant('time')),
    label: {
        ...cartesianAxisLabelOptionsDefs,
        format: string,
    },
};

export const categoryAxisOptionsDefs: OptionsDefs<AgCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('category')),
    label: cartesianAxisLabelOptionsDefs,
    paddingInner: positiveNumber,
    paddingOuter: positiveNumber,
    groupPaddingInner: positiveNumber,
};

export const groupedCategoryAxisOptionsDefs: OptionsDefs<AgGroupedCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: required(constant('grouped-category')),
    label: cartesianAxisLabelOptionsDefs,
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

// export const OrdinalTimeAxisModule: AxisModuleDefinition<AgOrdinalTimeAxisOptions> = {
//     type: 'axis',
//     name: 'ordinal-time',
//     chartType: 'cartesian',
//     enterprise: true,
//
//     options: numberAxisOptionsDefs,
//
//     create: (ctx: ModuleContext) => new OrdinalTimeAxis(ctx),
// };
