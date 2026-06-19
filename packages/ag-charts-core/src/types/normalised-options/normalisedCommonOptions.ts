import type {
    AgGradientColor,
    AgGradientColorStop,
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

import type {
    InternalAgGradientColor,
    InternalAgImageFill,
    InternalAgPatternColor,
} from '../../config/optionsDefaults';
import type { Normalised } from './normalise';

export type NormalisedPaddingOptions = Normalised<PaddingOptions, 'top' | 'right' | 'bottom' | 'left'>;

export type NormalisedTextOptions = Normalised<TextOptions, never, { color?: CssColor }>;
export type NormalisedTextSegment = Normalised<TextSegment, never, { color?: CssColor }>;
export type NormalisedContentSegment = NormalisedTextSegment | ImageSegment;
export type NormalisedTextOrSegments = TextValue | NormalisedContentSegment[];

export type NormalisedColorType = CssColor | InternalAgGradientColor | InternalAgPatternColor | InternalAgImageFill;

export type NormalisedFillOptions = Normalised<FillOptions, never, { fill?: NormalisedColorType }>;
export type NormalisedStrokeOptions = Normalised<StrokeOptions, never, { stroke?: CssColor }>;

export type NormalisedBorderOptions = Normalised<BorderOptions, never, { stroke?: CssColor }>;

export type NormalisedGradientColorStop = Normalised<AgGradientColorStop, never, { color?: CssColor }>;
export type NormalisedGradientColor = Normalised<
    AgGradientColor,
    never,
    { colorStops?: NormalisedGradientColorStop[] }
>;

export type FillStrokeMorph = { fill?: NormalisedColorType; stroke?: CssColor };
