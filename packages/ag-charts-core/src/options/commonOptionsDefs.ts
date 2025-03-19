import type {
    AgGradientColor,
    AgGradientColorStop,
    AgGradientColorStrict,
    AgPatternColor,
    FillOptions,
    FontOptions,
    LineDashOptions,
    StrokeOptions,
} from 'ag-charts-types';

import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    color,
    constant,
    number,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    typeUnion,
    union,
} from '../utils/validation';

// const operationsDef: OptionsDefs<any> = {
//     // Location operations
//     $ref: string,
//     $path: string,
//     // Logic operations
//     $if: array,
//     $or: array,
//     $and: array,
//     $eq: array,
//     // Numeric operations
//     $mul: array,
//     $round: array,
//     // Transform operations
//     $map: array,
//     $merge: array,
//     $value: string,
//     // Font operations
//     $rem: array,
//     // Color operations
//     $mix: array,
//     $foregroundBackgroundMix: array,
//     $foregroundBackgroundAccentMix: array,
// };

export const colorStopsOrderValidator = attachDescription((value) => {
    let lastStop = -Infinity;
    for (const item of value as AgGradientColorStop[]) {
        if (item?.stop != null) {
            if (item.stop < lastStop) {
                return false;
            }
            lastStop = item.stop;
        }
    }
    return true;
}, 'stops to be defined in ascending order');

// const gradientBounds = union('axis', 'item', 'series');
const gradientColorStops = or(
    and(
        arrayLength(2),
        arrayOfDefs<AgGradientColorStop>({ color: color, stop: ratio }, 'color stops'),
        colorStopsOrderValidator
    ),
    and(arrayLength(2), arrayOf(color, 'color stops'))
);

export const gradient = typeUnion<AgGradientColor>(
    {
        gradient: {
            // gradient: union('linear', 'radial', 'conic'),
            // bounds: gradientBounds,
            colorStops: gradientColorStops,
            rotation: number,
            reverse: boolean,
        },
    },
    'a gradient object'
);

export const gradientStrict = typeUnion<AgGradientColorStrict>(
    {
        gradient: {
            // gradient: union('linear', 'radial', 'conic'),
            // bounds: gradientBounds,
            colorStops: required(gradientColorStops),
            rotation: number,
            reverse: boolean,
        },
    },
    'a gradient object with color stops'
);

export const stringFillOptionsDef: OptionsDefs<{ fill: string; fillOpacity: number }> = {
    fill: color,
    fillOpacity: ratio,
};

export const strokeOptionsDef: OptionsDefs<StrokeOptions> = {
    stroke: color,
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
};

const patternOptionsDef: OptionsDefs<AgPatternColor> = {
    type: required(constant('pattern')),
    pattern: union(
        'vertical-lines',
        'horizontal-lines',
        'forward-slanted-lines',
        'backward-slanted-lines',
        'circles',
        'squares',
        'triangles',
        'diamonds',
        'stars',
        'hearts',
        'crosses'
    ),
    width: number,
    height: number,
    padding: number,
    fill: string,
    fillOpacity: ratio,
    backgroundFill: string,
    backgroundFillOpacity: ratio,
    ...strokeOptionsDef,
};

export const pattern = optionsDefs(patternOptionsDef, 'a pattern');

export const fillOptionsDef: OptionsDefs<FillOptions> = {
    fill: or(string, gradient, pattern),
    fillOpacity: ratio,
};

// @ts-expect-error undocumented option
fillOptionsDef.fillGradientDefaults = gradientStrict;

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
