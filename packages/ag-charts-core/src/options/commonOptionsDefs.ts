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
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    color,
    number,
    or,
    positiveNumber,
    ratio,
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

const gradientBounds = union('axes', 'item', 'series');
const gradientColorStops = and(
    arrayLength(2),
    arrayOfDefs<AgGradientColorStop>({ color: color, stop: ratio }, 'color stops'),
    colorStopsOrderValidator
);

export const gradient = typeUnion<AgGradientFill>(
    {
        gradient: {
            bounds: gradientBounds,
            colorStops: gradientColorStops,
            direction: union('horizontal', 'vertical'),
            rotation: number,
        },
        'radial-gradient': {
            bounds: gradientBounds,
            colorStops: gradientColorStops,
        },
        'conic-gradient': {
            bounds: gradientBounds,
            colorStops: gradientColorStops,
            rotation: number,
        },
    },
    'a gradient object'
);

export const fillOptionsDef: OptionsDefs<FillOptions> = {
    fill: or(color, gradient),
    fillOpacity: ratio,
};

export const strokeOptionsDef: OptionsDefs<StrokeOptions> = {
    stroke: color,
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
