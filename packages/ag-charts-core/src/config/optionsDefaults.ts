import type {
    AgBarHighlightStyleOptions,
    AgColorRefMixOnto,
    AgColorRefMixOntoColor,
    AgColorScale,
    AgColorScaleColorStop,
    AgColorType,
    AgCssColorOrRef,
    AgGradientColorStop,
    AgGradientColorStrict,
    AgHighlightStyleOptions,
    AgLineHighlightStyleOptions,
    AgNumericValue,
    AgSelectionContainment,
    AgSelectionStyleOptions,
    AgSeriesLineSegmentOptions,
    AgSeriesSegmentation,
    AgSeriesShapeSegmentOptions,
    BorderOptions,
    CssColor,
    FillCssOptions,
    FillOptions,
    GoogleFontFamily,
    LabelBoxOptions,
    LineDashOptions,
    PaddingOptions,
    StrokeOptions,
    TextOptions,
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
    defined,
    number,
    numericValue,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    strictUnion,
    string,
    stringLength,
    typeUnion,
    undocumented,
    union,
} from '../state/validation';
import type {
    InternalAgGradientColor,
    InternalAgImageFill,
    InternalAgPatternColor,
} from '../types/normalised-options/normalisedCommonOptions';
import { Color } from '../utils/format/color';
import { isObject } from '../utils/types/typeGuards';

export const themeOperator = (value: unknown) => {
    if (!isObject(value)) return false;
    const keys = Object.keys(value);
    return keys.length === 1 && keys[0].startsWith('$');
};

const themeParams = [
    'accentColor',
    'axisLineColor',
    'backgroundColor',
    'borderColor',
    'borderRadius',
    'chartBackgroundColor',
    'chartPadding',
    'focusShadow',
    'foregroundColor',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'gridLineColor',
    'popupShadow',
    'subtleTextColor',
    'textColor',
    'chromeBackgroundColor',
    'chromeFontFamily',
    'chromeFontSize',
    'chromeFontWeight',
    'chromeTextColor',
    'chromeSubtleTextColor',
    'buttonBackgroundColor',
    'buttonBorder',
    'buttonFontWeight',
    'buttonTextColor',
    'inputBackgroundColor',
    'inputBorder',
    'inputTextColor',
    'menuBackgroundColor',
    'menuBorder',
    'menuTextColor',
    'panelBackgroundColor',
    'panelSubtleTextColor',
    'tooltipBackgroundColor',
    'tooltipBorder',
    'tooltipTextColor',
    'tooltipSubtleTextColor',
    'crosshairLabelBackgroundColor',
    'crosshairLabelTextColor',
    'groupedCategoryLineColor',
];
const themeParamsValidator = union(...themeParams);
// A complete `var(--…)` expression: `var(` … balanced parens … `)` with no trailing text, so a prefix-only match like
// `var(--brand` or `var(--brand)junk` (which the resolver would mis-parse via a fixed first/last-character strip) fails.
function isColorVar(value: string): boolean {
    if (!value.startsWith('var(--') || !value.endsWith(')')) return false;
    let depth = 0;
    for (let i = 3; i < value.length; i++) {
        if (value[i] === '(') depth++;
        else if (value[i] === ')' && --depth === 0) return i === value.length - 1;
    }
    return false;
}
// `ontoColor` accepts only what the blend engine (`Color.fromString`) can render, plus a `var(--…)`; the browser-backed
// `color` validator would admit `lab()` etc. that `Color.fromString` then throws on, silently mis-colouring.
const ontoColorValidator = attachDescription(
    (value: unknown) => typeof value === 'string' && (isColorVar(value) || Color.validColorString(value)),
    'a literal color or var()'
);
const colorRefDef = attachDescription(
    optionsDefs<AgColorRefMixOnto & AgColorRefMixOntoColor>({
        ref: themeParamsValidator,
        mix: positiveNumber, // mix is silently clamped to 0-1 ratio to match Grid
        onto: themeParamsValidator,
        ontoColor: ontoColorValidator,
    }),
    'a color ref'
);
const colorRefMixOnto = attachDescription((value: unknown) => {
    return !isObject(value) || !('onto' in value || 'ontoColor' in value) || 'mix' in value;
}, 'where a color ref with [onto] or [ontoColor] must also have [mix]');
const colorRef = and(colorRefDef, colorRefMixOnto);

// `themeOperator` validator is required by the preset modules which perform a validation of the overrides before
// processing the private operators.
export const colorOrRef = or(color, themeOperator, colorRef);

const colorStop = optionsDefs<AgGradientColorStop>({ color: colorOrRef, stop: ratio }, '');
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
}, 'colour stops to be defined in ascending order');
export const gradientColorStops = and(arrayLength(2), arrayOf(colorStop), colorStopsOrderValidator);

const colorScaleColorStop = optionsDefs<AgColorScaleColorStop>(
    { color: required(colorOrRef), stop: numericValue, name: string },
    'a color scale color stop'
);
export const colorScaleOptionsDef = optionsDefs<AgColorScale>(
    {
        fills: and(arrayLength(2), arrayOf(colorScaleColorStop), colorStopsOrderValidator),
        domain: and(
            arrayLength(2),
            arrayOf(numericValue),
            attachDescription(
                // Mixed bigint/number comparison is safe — only arithmetic mixing throws.
                (value) => (value as AgNumericValue[])[0] <= (value as AgNumericValue[])[1],
                'domain to be in ascending order'
            )
        ),
        mode: union('continuous', 'discrete'),
        missingDataFill: colorOrRef,
    },
    'a colour scale configuration'
);

const gradientBounds = union('axis', 'item', 'series');

const gradientStrictDefs: OptionsDefs<AgGradientColorStrict> = {
    type: required(constant('gradient')),
    colorStops: required(gradientColorStops),
    rotation: number,
    // @ts-expect-error undocumented option
    gradient: undocumented(union('linear', 'radial', 'conic')),
    bounds: undocumented(gradientBounds),
    reverse: undocumented(boolean),
    colorSpace: undocumented(union('rgb', 'oklch')),
};
export const gradientStrict = optionsDefs<AgGradientColorStrict>(
    gradientStrictDefs,
    'a gradient object with colour stops'
);

export const strokeOptionsDef: OptionsDefs<StrokeOptions> = {
    stroke: colorOrRef,
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
};

export const fillGradientDefaults = optionsDefs<InternalAgGradientColor>({
    type: required(constant('gradient')),
    gradient: required(union('linear', 'radial', 'conic')),
    bounds: required(gradientBounds),
    colorStops: required(or(gradientColorStops, and(arrayLength(2), arrayOf(colorOrRef)))),
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
    fill: required(colorOrRef),
    fillOpacity: required(ratio),
    backgroundFill: required(colorOrRef),
    backgroundFillOpacity: required(ratio),
    padding: required(positiveNumber),
    rotation: required(number),
    scale: required(positiveNumber),
    stroke: required(colorOrRef),
    strokeWidth: required(positiveNumber),
    strokeOpacity: required(ratio),
});

export const fillImageDefaults = optionsDefs<InternalAgImageFill>({
    type: required(constant('image')),
    url: string,
    width: positiveNumber,
    height: positiveNumber,
    rotation: required(number),
    backgroundFill: required(colorOrRef),
    backgroundFillOpacity: ratio,
    fit: required(union('stretch', 'contain', 'cover')),
    repeat: required(union('repeat', 'repeat-x', 'repeat-y', 'no-repeat')),
});

const colorObjectDefs: OptionsDefs<Exclude<AgColorType, CssColor>> = {
    // @ts-expect-error undocumented option
    gradient: {
        colorStops: gradientColorStops,
        rotation: number,
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
        fill: colorOrRef,
        fillOpacity: ratio,
        backgroundFill: colorOrRef,
        backgroundFillOpacity: ratio,
        ...strokeOptionsDef,
        padding: undocumented(positiveNumber),
    },
    image: {
        url: required(string),
        backgroundFill: colorOrRef,
        backgroundFillOpacity: ratio,
        width: positiveNumber,
        height: positiveNumber,
        fit: union('stretch', 'contain', 'cover', 'none'),
        repeat: union('repeat', 'repeat-x', 'repeat-y', 'no-repeat'),
        rotation: number,
    },
};
const colorObject = typeUnion<Exclude<AgColorType, AgCssColorOrRef>>(colorObjectDefs as any, 'a color object');

// `themeOperator` validator is required by the preset modules which perform a validation of the overrides before
// processing the private operators.
export const colorUnion = or(color, optionsDefs(colorObject, 'a color object'), themeOperator, colorRef);
export const simpleColorUnion = or(color, optionsDefs(colorObject, 'a color object'));

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

export const fillCssOptionsDef: OptionsDefs<FillCssOptions> = {
    fill: colorOrRef,
    fillOpacity: ratio,
};

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

export const shapeSelectionOptionsDef: OptionsDefs<AgSelectionStyleOptions> = shapeHighlightOptionsDef;

export const selectionContainmentValidator = strictUnion<AgSelectionContainment>()('any', 'all');

export function highlightOptionsDef<T>(itemHighlightOptionsDef: T) {
    return {
        enabled: boolean,
        range: union('tooltip', 'node'),
        highlightedItem: itemHighlightOptionsDef,
        unhighlightedItem: itemHighlightOptionsDef,
    };
}

export function selectionOptionsDef<T>(itemSelectionOptionsDef: T) {
    return {
        enabled: boolean,
        containment: selectionContainmentValidator,
        selectedItem: itemSelectionOptionsDef,
        unselectedItem: itemSelectionOptionsDef,
        unselectedSeries: itemSelectionOptionsDef,
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
export const fontWeight = or(positiveNumber, union('normal', 'bold', 'bolder', 'lighter'));

export const fontOptionsDef: OptionsDefs<TextOptions> = {
    color: colorOrRef,
    fontFamily: fontFamilyFull,
    fontSize: positiveNumber,
    fontStyle: union('normal', 'italic', 'oblique'),
    fontWeight: fontWeight,
};

export const textWrap = union('never', 'always', 'hyphenate', 'on-space');
export const textAlign = union('left', 'center', 'right', 'start', 'end');

export const overflowStrategy = union('ellipsis', 'hide');

export const paddingOptions = optionsDefs<PaddingOptions>(
    { top: positiveNumber, right: positiveNumber, bottom: positiveNumber, left: positiveNumber },
    'padding object'
);
export const padding = or(positiveNumber, paddingOptions);

// Cross-line labels consume `padding` as a signed positional value rather than a box inset, so they are
// deliberately exempt from the non-negative rule. New padding options must use `padding` above.
export const signedPaddingOptions = optionsDefs<PaddingOptions>(
    { top: number, right: number, bottom: number, left: number },
    'padding object'
);
export const signedPadding = or(number, signedPaddingOptions);

export const borderOptionsDef: OptionsDefs<BorderOptions> = {
    enabled: boolean,
    stroke: colorOrRef,
    strokeWidth: positiveNumber,
    strokeOpacity: ratio,
};

export const labelBoxOptionsDef: OptionsDefs<LabelBoxOptions> = {
    border: borderOptionsDef,
    cornerRadius: number,
    padding,
    ...fillOptionsDef,
};
