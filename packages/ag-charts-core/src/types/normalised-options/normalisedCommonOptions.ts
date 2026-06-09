import type { CssColor, ImageSegment, PaddingOptions, TextOptions, TextSegment, TextValue } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedPaddingOptions = Normalised<PaddingOptions, 'top' | 'right' | 'bottom' | 'left'>;

export type NormalisedTextOptions = Normalised<TextOptions, never, { color?: CssColor }>;

export type NormalisedTextSegment = Normalised<TextSegment, never, { color?: CssColor }>;

export type NormalisedContentSegment = NormalisedTextSegment | ImageSegment;

export type NormalisedTextOrSegments = TextValue | NormalisedContentSegment[];
