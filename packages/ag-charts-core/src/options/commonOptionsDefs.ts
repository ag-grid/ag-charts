import type {
    AgGradientColorStop,
    AgGradientFill,
    FillOptions,
    FontOptions,
    LineDashOptions,
    StrokeOptions,
} from 'ag-charts-types';

import {
    type OptionsDefs,
    array,
    arrayOf,
    arrayOfDefs,
    color,
    number,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    string,
    typeUnion,
    union,
} from '../utils/validation';

const operationsDef: OptionsDefs<any> = {
    // Location operations
    $ref: string,
    $path: string,
    // Logic operations
    $if: array,
    $or: array,
    $and: array,
    $eq: array,
    // Numeric operations
    $mul: array,
    $round: array,
    // Transform operations
    $map: array,
    $merge: array,
    $value: string,
    // Font operations
    $rem: array,
    // Color operations
    $mix: array,
    $foregroundBackgroundMix: array,
    $foregroundBackgroundAccentMix: array,
};

export const operation = optionsDefs(operationsDef, 'a theme operation');

export const gradient = typeUnion<AgGradientFill>(
    {
        gradient: {
            direction: union('horizontal', 'vertical'),
            colorStops: arrayOfDefs<AgGradientColorStop>({ color: color, stop: number }, 'color stops'),
            bounds: union('series', 'item', 'axes'),
            rotation: number,
        },
    },
    'a gradient object'
);

export const fillOptionsDef: OptionsDefs<FillOptions> = {
    fill: or(color, gradient, operation),
    fillOpacity: ratio,
};

export const strokeOptionsDef: OptionsDefs<StrokeOptions> = {
    stroke: or(color, operation),
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
};

export const lineDashOptionsDef: OptionsDefs<LineDashOptions> = {
    lineDash: arrayOf(positiveNumber),
    lineDashOffset: number,
};

export const fontOptionsDef: OptionsDefs<FontOptions> = {
    color: color,
    fontFamily: string,
    fontSize: positiveNumber,
    fontStyle: union('normal', 'italic', 'oblique'),
    fontWeight: or(positiveNumber, union('normal', 'bold', 'bolder', 'lighter')),
};
