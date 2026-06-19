import type {
    AgGradientColor,
    AgGradientColorBounds,
    AgGradientColorStop,
    AgGradientType,
    AgImageFill,
    AgPatternColor,
    BorderOptions,
    CssColor,
    FillOptions,
    ImageSegment,
    PaddingOptions,
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

export type InternalAgColorType = CssColor | InternalAgGradientColor | InternalAgPatternColor | InternalAgImageFill;
export type RequiredInternalAgColorType =
    | CssColor
    | RequiredInternalAgGradientColor
    | RequiredInternalAgPatternColor
    | (RequiredInternalAgImageFill & Pick<InternalAgImageFill, 'url'>);

export type NormalisedColorType = CssColor | InternalAgGradientColor | InternalAgPatternColor | InternalAgImageFill;

export type NormalisedFillOptions = Normalised<FillOptions, never, { fill?: NormalisedColorType }>;
export type NormalisedStrokeOptions = Normalised<StrokeOptions, never, { stroke?: CssColor }>;

export type NormalisedBorderOptions = Normalised<
    BorderOptions,
    'enabled' | 'strokeWidth' | 'strokeOpacity',
    { stroke?: CssColor }
>;

export type FillStrokeMorph = { fill?: NormalisedColorType; stroke?: CssColor };
