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
    constant,
    number,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    union,
} from '../utils/validation';

// TODO: AG-13892 Attach a description to this validator
export const operation = or(
    optionsDefs<{ $ref: string }>({ $ref: string }),
    optionsDefs<{ $path: [] }>({ $path: string }),
    optionsDefs<{ $if: [] }>({ $if: array }),
    optionsDefs<{ $or: [] }>({ $or: array }),
    optionsDefs<{ $and: [] }>({ $and: array }),
    optionsDefs<{ $eq: [] }>({ $eq: array }),
    optionsDefs<{ $mul: [] }>({ $mul: array }),
    optionsDefs<{ $round: [] }>({ $round: array }),
    optionsDefs<{ $rem: [] }>({ $rem: array }),
    optionsDefs<{ $map: [] }>({ $map: array }),
    optionsDefs<{ $merge: [] }>({ $merge: array }),
    optionsDefs<{ $mix: [] }>({ $mix: array }),
    optionsDefs<{ $foregroundBackgroundMix: [] }>({ $foregroundBackgroundMix: array }),
    optionsDefs<{ $foregroundBackgroundAccentMix: [] }>({ $foregroundBackgroundAccentMix: array })
);

const gradientOptionsDef: OptionsDefs<AgGradientFill> = {
    type: required(constant('gradient')),
    direction: union('horizontal', 'vertical'),
    colorStops: arrayOfDefs<AgGradientColorStop>({ color: string, stop: number }, 'color stops'),
    bounds: union('series', 'item', 'axes'),
    angle: number,
};

export const gradient = optionsDefs(gradientOptionsDef, 'a gradient');

export const fillOptionsDef: OptionsDefs<FillOptions> = {
    fill: or(string, gradient, operation),
    fillOpacity: ratio,
};

export const strokeOptionsDef: OptionsDefs<StrokeOptions> = {
    stroke: or(string, operation),
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
};

export const lineDashOptionsDef: OptionsDefs<LineDashOptions> = {
    lineDash: arrayOf(positiveNumber),
    lineDashOffset: number,
};

export const fontOptionsDef: OptionsDefs<FontOptions> = {
    color: string,
    fontFamily: string,
    fontSize: positiveNumber,
    fontStyle: union('normal', 'italic', 'oblique'),
    fontWeight: or(positiveNumber, union('normal', 'bold', 'bolder', 'lighter')),
};
