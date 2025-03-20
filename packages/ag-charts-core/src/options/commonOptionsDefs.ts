import type {
    AgColorType,
    AgGradientColor,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientColorStrict,
    AgGradientType,
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
    union,
} from '../utils/validation';

const colorStop = optionsDefs<AgGradientColorStop>({ color: color, stop: ratio }, '');
const colorStopsOrderValidator = attachDescription((value) => {
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
export const gradientColorStops = and(arrayLength(2), and(arrayOf(colorStop), colorStopsOrderValidator));
const gradientBounds = union('axis', 'item', 'series');

export const gradientStrict = typeUnion<AgGradientColorStrict>(
    {
        gradient: {
            // @ts-expect-error undocumented options
            gradient: union('linear', 'radial', 'conic'),
            bounds: gradientBounds,
            colorStops: required(gradientColorStops),
            rotation: number,
            reverse: boolean,
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
export type InternalAgColorType = CssColor | InternalAgGradientColor | InternalAgPatternColor;

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
            'crosses'
        )
    ),
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

const gradientUndocumentedOpts: OptionsDefs<AgGradientColor> = {
    // @ts-expect-error undocumented option
    gradient: union('linear', 'radial', 'conic'),
    bounds: gradientBounds,
    reverse: boolean,
};

const patternUndocumentedOpts: OptionsDefs<AgPatternColor> = {
    // @ts-expect-error undocumented option
    rotation: number,
    padding: positiveNumber,
};

const colorObject = typeUnion<Exclude<AgColorType, CssColor>>(
    {
        gradient: {
            ...gradientUndocumentedOpts,
            colorStops: gradientColorStops,
            rotation: number,
        },
        pattern: {
            ...patternUndocumentedOpts,
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
            width: positiveNumber,
            height: positiveNumber,
            fill: color,
            fillOpacity: ratio,
            backgroundFill: color,
            backgroundFillOpacity: ratio,
            ...strokeOptionsDef,
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
fillOptionsDef.fillGradientDefaults = fillGradientDefaults;
// @ts-expect-error undocumented option
fillOptionsDef.fillPatternDefaults = fillPatternDefaults;

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
