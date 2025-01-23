import type { FillOptions, FontOptions, LineDashOptions, StrokeOptions } from 'ag-charts-types';

import { type OptionsDefs, arrayOf, number, or, positiveNumber, ratio, string, union } from '../utils/validation';

export const fillOptionsDef: OptionsDefs<FillOptions> = {
    fill: string,
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
