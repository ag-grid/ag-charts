import type { AgGradientFill, FillOptions, FontOptions, LineDashOptions, StrokeOptions } from 'ag-charts-types';

import {
    type OptionsDefs,
    arrayOf,
    constant,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    union,
} from '../utils/validation';

const gradientOptionsDef: OptionsDefs<AgGradientFill> = {
    type: required(constant('gradient')),
    direction: union('horizontal', 'vertical'),
    colorStops: object,
    bounds: union('series', 'item', 'axes'),
};

const gradient = optionsDefs(gradientOptionsDef, 'a gradient');

export const fillOptionsDef: OptionsDefs<FillOptions> = {
    fill: or(string, gradient),
    fillOpacity: ratio,
};

export const strokeOptionsDef: OptionsDefs<StrokeOptions> = {
    stroke: string,
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
