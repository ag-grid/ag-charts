import type { CssColor, PaddingOptions, TextOptions, TextSegment, TextValue } from 'ag-charts-types';

import type { Normalised } from './normalise';

export type NormalisedPaddingOptions = Normalised<PaddingOptions, 'top' | 'right' | 'bottom' | 'left'>;

export type NormalisedTextOptions = Normalised<TextOptions, never, { color?: CssColor }>;

export type NormalisedTextSegment = Normalised<TextSegment, never, { color?: CssColor }>;

export type NormalisedTextOrSegments = TextValue | NormalisedTextSegment[];
