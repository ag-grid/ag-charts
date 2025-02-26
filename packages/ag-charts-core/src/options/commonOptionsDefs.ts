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

export const operationsDef: OptionsDefs<any> = {
    $ref: string,
    $path: string,
    $if: array,
    $or: array,
    $and: array,
    $eq: array,
    $mul: array,
    $round: array,
    $rem: array,
    $mix: array,
    $mixEach: array,
    $foregroundBackgroundMix: array,
    $foregroundBackgroundAccentMix: array,
};

export const operation = optionsDefs(operationsDef, 'a theme operation');

export const colorStop = optionsDefs<AgGradientColorStop>(
    {
        color: string,
        stop: number,
    },
    'a color stop object'
);

const gradientOptionsDef: OptionsDefs<AgGradientFill> = {
    type: required(constant('gradient')),
    direction: union('horizontal', 'vertical'),
    colorStops: arrayOfDefs<AgGradientColorStop>({ color: string, stop: number }, 'color stops'),
    bounds: union('series', 'item', 'axes'),
    rotation: number,
};

export const gradient = optionsDefs(gradientOptionsDef, 'a gradient');
export const arrayOfGradient = arrayOfDefs<AgGradientFill>(gradientOptionsDef);

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
