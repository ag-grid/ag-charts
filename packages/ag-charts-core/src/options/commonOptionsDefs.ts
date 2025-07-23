import type {
    AgBarHighlightStyleOptions,
    AgColorType,
    AgGradientColor,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientColorStrict,
    AgGradientType,
    AgHighlightStyleOptions,
    AgImageFill,
    AgLineHighlightStyleOptions,
    AgPatternColor,
    AgSeriesLineSegmentOptions,
    AgSeriesSegmentation,
    AgSeriesShapeSegmentOptions,
    BorderOptions,
    CssColor,
    FillOptions,
    FontOptions,
    GoogleFontFamily,
    LabelBoxOptions,
    LineDashOptions,
    PaddingOptions,
    StrokeOptions,
} from 'ag-charts-types';

import { isObject } from '../utils/typeGuards';
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
    defined,
    number,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    stringLength,
    typeUnion,
    undocumented,
    union,
} from '../utils/validation';

// TODO set description once operators are officially released
export const themeOperator = (value: unknown) => {
    if (!isObject(value)) return false;
    const keys = Object.keys(value);
    return keys.length === 1 && keys[0].startsWith('$');
};

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

export const gradientStrict = optionsDefs<AgGradientColorStrict>(
    {
        type: required(constant('gradient')),
        colorStops: required(gradientColorStops),
        rotation: number,
        // @ts-expect-error undocumented options
        gradient: undocumented(union('linear', 'radial', 'conic')),
        bounds: undocumented(gradientBounds),
        reverse: undocumented(boolean),
        colorSpace: undocumented(union('rgb', 'oklch')),
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
    /** Colour space to use when interpolating colours in the gradient. */
    colorSpace?: ColorSpace;
}

export type ColorSpace = 'rgb' | 'oklch';

export interface InternalAgPatternColor extends AgPatternColor {
    /** Padding for the shape in the pattern unit. */
    padding?: number;
}
export interface InternalAgImageFill extends AgImageFill {}

export type RequiredInternalAgImageFill = Required<Omit<InternalAgImageFill, 'url' | 'width' | 'height'>> &
    Pick<Partial<InternalAgImageFill>, 'url'> &
    Pick<InternalAgImageFill, 'width' | 'height'>;

export type RequiredInternalAgPatternColor = Required<Omit<InternalAgPatternColor, 'path'>> &
    Pick<InternalAgPatternColor, 'path'>;

export type RequiredInternalAgGradientColor = Required<InternalAgGradientColor>;

export type InternalAgColorType = CssColor | InternalAgGradientColor | InternalAgPatternColor | InternalAgImageFill;
export type RequiredInternalAgColorType =
    | CssColor
    | RequiredInternalAgGradientColor
    | RequiredInternalAgPatternColor
    | (RequiredInternalAgImageFill & Pick<InternalAgImageFill, 'url'>);

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
    colorSpace: required(union('rgb', 'oklch')),
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
    path: stringLength(2),
    width: required(positiveNumber),
    height: required(positiveNumber),
    fill: required(color),
    fillOpacity: required(ratio),
    backgroundFill: required(color),
    backgroundFillOpacity: required(ratio),
    padding: required(positiveNumber),
    rotation: required(number),
    scale: required(positiveNumber),
    stroke: required(color),
    strokeWidth: required(positiveNumber),
    strokeOpacity: required(ratio),
});

export const fillImageDefaults = optionsDefs<InternalAgImageFill>({
    type: required(constant('image')),
    url: string,
    width: positiveNumber,
    height: positiveNumber,
    rotation: required(number),
    backgroundFill: required(color),
    backgroundFillOpacity: ratio,
    fit: required(union('stretch', 'contain', 'cover')),
    repeat: required(union('repeat', 'repeat-x', 'repeat-y', 'no-repeat')),
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
            colorSpace: undocumented(union('rgb', 'oklch')),
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
                'crosses'
            ),
            path: stringLength(2),
            width: positiveNumber,
            height: positiveNumber,
            rotation: number,
            scale: positiveNumber,
            fill: color,
            fillOpacity: ratio,
            backgroundFill: color,
            backgroundFillOpacity: ratio,
            ...strokeOptionsDef,
            // @ts-expect-error undocumented option
            padding: undocumented(positiveNumber),
        },
        image: {
            url: required(string),
            backgroundFill: color,
            backgroundFillOpacity: ratio,
            width: positiveNumber,
            height: positiveNumber,
            fit: union('stretch', 'contain', 'cover', 'none'),
            repeat: union('repeat', 'repeat-x', 'repeat-y', 'no-repeat'),
            rotation: number,
        },
    },
    'a color object'
);

export const colorUnion = or(color, optionsDefs(colorObject, 'a color object'));

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

export const barHighlightOptionsDef: OptionsDefs<AgBarHighlightStyleOptions> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    opacity: ratio,
    cornerRadius: positiveNumber,
};

export const lineHighlightOptionsDef: OptionsDefs<AgLineHighlightStyleOptions> = {
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    opacity: ratio,
};

export const shapeHighlightOptionsDef: OptionsDefs<AgHighlightStyleOptions> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    opacity: ratio,
};

export function highlightOptionsDef<T>(itemHighlightOptionsDef: T) {
    return {
        enabled: boolean,
        range: union('tooltip', 'node'),
        highlightedItem: itemHighlightOptionsDef,
        unhighlightedItem: itemHighlightOptionsDef,
    };
}

export function multiSeriesHighlightOptionsDef<I, S>(itemHighlightOptionsDef: I, seriesHighlightOptionsDef: S) {
    return {
        enabled: boolean,
        range: union('tooltip', 'node'),
        highlightedItem: itemHighlightOptionsDef,
        unhighlightedItem: itemHighlightOptionsDef,
        highlightedSeries: seriesHighlightOptionsDef,
        unhighlightedSeries: seriesHighlightOptionsDef,
        bringToFront: boolean,
    };
}

export const shapeSegmentOptions: OptionsDefs<AgSeriesShapeSegmentOptions> = {
    start: defined,
    stop: defined,
    ...strokeOptionsDef,
    ...fillOptionsDef,
    ...lineDashOptionsDef,
};

export const lineSegmentOptions: OptionsDefs<AgSeriesLineSegmentOptions> = {
    start: defined,
    stop: defined,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const shapeSegmentation = optionsDefs<AgSeriesSegmentation<AgSeriesShapeSegmentOptions>>(
    {
        enabled: boolean,
        key: required(union('x', 'y')),
        segments: arrayOfDefs<AgSeriesShapeSegmentOptions>(shapeSegmentOptions, 'path segments array'),
    },
    'a segmentation object',
    true
);

export const lineSegmentation = optionsDefs<AgSeriesSegmentation<AgSeriesLineSegmentOptions>>(
    {
        enabled: boolean,
        key: required(union('x', 'y')),
        segments: arrayOfDefs<AgSeriesLineSegmentOptions>(lineSegmentOptions, 'path segments array'),
    },
    'a segmentation object',
    true
);

export const googleFont = optionsDefs<GoogleFontFamily>({ googleFont: string }, 'google font');
export const fontFamilyFull = or(string, themeOperator, googleFont, arrayOf(or(string, googleFont)));

export const fontOptionsDef: OptionsDefs<FontOptions> = {
    color: color,
    fontFamily: fontFamilyFull,
    fontSize: positiveNumber,
    fontStyle: union('normal', 'italic', 'oblique'),
    fontWeight: or(positiveNumber, union('normal', 'bold', 'bolder', 'lighter')),
};

export const paddingOptions = optionsDefs<PaddingOptions>(
    {
        top: positiveNumber,
        right: positiveNumber,
        bottom: positiveNumber,
        left: positiveNumber,
    },
    'padding object'
);
export const padding = or(number, paddingOptions);

export const borderOptionsDef: OptionsDefs<BorderOptions> = {
    enabled: boolean,
    stroke: color,
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
};

export const labelBoxOptionsDef: OptionsDefs<LabelBoxOptions> = {
    border: { ...borderOptionsDef },
    cornerRadius: number,
    padding,
    ...fillOptionsDef,
};
