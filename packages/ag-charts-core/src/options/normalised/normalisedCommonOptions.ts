import type {
    AgDropShadowOptions,
    AgGradientColor,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientType,
    AgImageFill,
    AgPatternColor,
    AgSolidColor,
    BorderOptions,
    CssColor,
    FillOptions,
    ImageSegment,
    PaddingOptions,
    PixelSize,
    StrokeOptions,
    TextOptions,
    TextSegment,
    TextValue,
} from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedPaddingOptions = Normalised<PaddingOptions, 'top' | 'right' | 'bottom' | 'left'>;

export type NormalisedTextOptions = Normalised<TextOptions, never, { color?: CssColor }>;
export type NormalisedTextSegment = Normalised<TextSegment, never, { color?: CssColor }>;
export type NormalisedContentSegment = NormalisedTextSegment | ImageSegment;
export type NormalisedTextOrSegments = TextValue | NormalisedContentSegment[];

export type ColorSpace = 'rgb' | 'oklch';

export type NormalisedGradientColorStop = Normalised<AgGradientColorStop, never, { color?: CssColor }>;
export type NormalisedGradientColor = Normalised<
    AgGradientColor,
    never,
    { colorStops?: NormalisedGradientColorStop[] }
>;

export interface InternalAgGradientColor extends NormalisedGradientColor {
    /** Format of the gradient */
    gradient?: AgGradientType;
    /** The domain of the colour gradient, defaults to item. */
    bounds?: AgGradientColorBounds;
    /** Reverse the order of colour stops. */
    reverse?: boolean;
    /** Colour space to use when interpolating colours in the gradient. */
    colorSpace?: ColorSpace;
}

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

export type InternalAgColorType =
    CssColor | AgSolidColor | InternalAgGradientColor | InternalAgPatternColor | InternalAgImageFill;
export type RequiredInternalAgColorType =
    | CssColor
    | AgSolidColor
    | RequiredInternalAgGradientColor
    | RequiredInternalAgPatternColor
    | (RequiredInternalAgImageFill & Pick<InternalAgImageFill, 'url'>);

export type NormalisedColorType =
    CssColor | AgSolidColor | InternalAgGradientColor | InternalAgPatternColor | InternalAgImageFill;

export type NormalisedFillOptions = Normalised<FillOptions, never, { fill?: NormalisedColorType }>;
export type NormalisedStrokeOptions = Normalised<StrokeOptions, never, { stroke?: CssColor }>;

/** The theme resolves a named `lineDash` to its array of lengths, so only the array form remains. */
export type NormalisedLineDash = { lineDash?: PixelSize[] };

/**
 * Only a glow's `fill` may be unset. `glow` marks the shadow that a highlight `glow` makes, which surrounds an item
 * with no visible fill by its stroke.
 */
export type NormalisedDropShadowOptions = Normalised<
    AgDropShadowOptions,
    'enabled' | 'xOffset' | 'yOffset' | 'blur'
> & {
    glow?: true;
    /** Whether the `fillOpacity` was set by a user or theme override, not the theme default; unset when not known. */
    _fillOpacitySet?: boolean;
    /** A glow with no `gap` that is cast in an overlay, which cuts it only where its item, and every item that glows, is painted. */
    overlay?: true;
    /** The `gap` of a glow: how far the shadow's silhouette is cut out of it, or undefined to cast it like a shadow. */
    gap?: PixelSize;
    /** A glow that casts nothing, which only cuts the footprint of its item out of the glow overlay. */
    cutOnly?: true;
    /** With `cutOnly`, cuts the footprint out of the glows of its own series alone. */
    ownCut?: true;
    /** A glow cast above the glows of the other casters of its overlay, cut by the footprint of its own item before it merges, and by the other footprints after. */
    selfCut?: true;
};

/** A shadow with the `fill` that it casts in. */
export type ResolvedDropShadowOptions = NormalisedDropShadowOptions & { fill: string };

export type NormalisedBorderOptions = Normalised<
    BorderOptions,
    'enabled' | 'strokeWidth' | 'strokeOpacity',
    { stroke?: CssColor }
>;

export type FillStrokeMorph = { fill?: NormalisedColorType; stroke?: CssColor };
