import type {
    AgColorType,
    AgGradientColor,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientColorStrict,
    AgGradientType,
    AgImageColor,
    AgPatternColor,
    CssColor,
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
    undocumented,
    union,
} from '../utils/validation';

const colorStop = optionsDefs<AgGradientColorStop>({ color: color, stop: ratio }, '');
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
}, 'color stops to be defined in ascending order');
export const gradientColorStops = and(arrayLength(2), arrayOf(colorStop), colorStopsOrderValidator);
const gradientBounds = union('axis', 'item', 'series');

export const gradientStrict = typeUnion<AgGradientColorStrict>(
    {
        gradient: {
            colorStops: required(gradientColorStops),
            rotation: number,
            // @ts-expect-error undocumented options
            gradient: undocumented(union('linear', 'radial', 'conic')),
            bounds: undocumented(gradientBounds),
            reverse: undocumented(boolean),
        },
    },
    'a gradient object with color stops'
);

export interface InternalAgGradientColor extends AgGradientColor {
    /** Format of the gradient */
    gradient?: AgGradientType;
    /** The domain of the color gradient, defaults to item. */
    bounds?: AgGradientColorBounds;
    /** Reverse the order of colour stops. */
    reverse?: boolean;
}
export interface InternalAgPatternColor extends AgPatternColor {
    /** Padding for the shape in the pattern unit. */
    padding?: number;
    /** The rotation angle of the pattern. */
    rotation?: number;
}
export interface InternalAgImageColor extends AgImageColor {}

export type RequiredInternalAgImageColor = Required<Omit<InternalAgImageColor, 'url' | 'width' | 'height'>> &
    Pick<Partial<InternalAgImageColor>, 'url'> &
    Pick<InternalAgImageColor, 'width' | 'height'>;

export type RequiredInternalAgPatternColor = Required<Omit<InternalAgPatternColor, 'path'>> &
    Pick<InternalAgPatternColor, 'path'>;

export type RequiredInternalAgGradientColor = Required<InternalAgGradientColor>;

export type InternalAgColorType = CssColor | InternalAgGradientColor | InternalAgPatternColor | InternalAgImageColor;
export type RequiredInternalAgColorType =
    | CssColor
    | RequiredInternalAgGradientColor
    | RequiredInternalAgPatternColor
    | (RequiredInternalAgImageColor & Pick<InternalAgImageColor, 'url'>);

export const strokeOptionsDef: OptionsDefs<StrokeOptions> = {
    stroke: color,
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
};

export const fillGradientDefaults = optionsDefs<InternalAgGradientColor>({
    type: required(constant('gradient')),
    gradient: required(union('linear', 'radial', 'conic')),
    bounds: required(gradientBounds),
    colorStops: required(or(gradientColorStops, and(arrayLength(2), arrayOf(color)))),
    rotation: required(number),
    reverse: required(boolean),
});

export const fillPatternDefaults = optionsDefs<InternalAgPatternColor>({
    type: required(constant('pattern')),
    pattern: required(
        union(
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
            'crosses',
            'custom'
        )
    ),
    path: string,
    width: required(positiveNumber),
    height: required(positiveNumber),
    fill: required(color),
    fillOpacity: required(ratio),
    backgroundFill: required(color),
    backgroundFillOpacity: required(ratio),
    padding: required(positiveNumber),
    rotation: required(number),
    stroke: required(color),
    strokeWidth: required(positiveNumber),
    strokeOpacity: required(ratio),
});

export const fillImageDefaults = optionsDefs<InternalAgImageColor>({
    type: required(constant('image')),
    url: string,
    width: positiveNumber,
    height: positiveNumber,
    rotation: required(number),
    scale: required(positiveNumber),
    fallback: required(color),
    fit: required(union('stretch', 'contain', 'cover')),
    repetition: required(union('repeat', 'repeat-x', 'repeat-y', 'no-repeat')),
});

const colorObject = typeUnion<Exclude<AgColorType, CssColor>>(
    {
        gradient: {
            colorStops: gradientColorStops,
            rotation: number,
            // @ts-expect-error undocumented option
            gradient: undocumented(union('linear', 'radial', 'conic')),
            bounds: undocumented(gradientBounds),
            reverse: undocumented(boolean),
        },
        pattern: {
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
                'crosses',
                'custom'
            ),
            path: string,
            width: positiveNumber,
            height: positiveNumber,
            fill: color,
            fillOpacity: ratio,
            backgroundFill: color,
            backgroundFillOpacity: ratio,
            ...strokeOptionsDef,
            // @ts-expect-error undocumented option
            rotation: undocumented(number),
            padding: undocumented(positiveNumber),
        },
        image: {
            url: required(string),
            fallback: color,
            width: positiveNumber,
            height: positiveNumber,
            fit: union('stretch', 'contain', 'cover'),
            repetition: union('repeat', 'repeat-x', 'repeat-y', 'no-repeat'),
            rotation: number,
            scale: positiveNumber,
        },
    },
    'a color object'
);

export const colorUnion = or(color, colorObject);

export const fillOptionsDef: OptionsDefs<FillOptions> = {
    fill: colorUnion,
    fillOpacity: ratio,
};

// @ts-expect-error undocumented option
fillOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
fillOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
fillOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);

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
