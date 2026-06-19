import type {
    AgBarSeriesStyle,
    AgHistogramSeriesStyle,
    AgLineSeriesStylerResult,
    AgSeriesSegmentation,
    AgSeriesShapeSegmentOptions,
    CssColor,
} from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph } from './normalisedCommonOptions';
import type { NormalisedSeriesMarkerStyle } from './normalisedSeriesMarkerOptions';

export type NormalisedBarSeriesStyle = Normalised<AgBarSeriesStyle, never, FillStrokeMorph>;

export type NormalisedHistogramSeriesStyle = Normalised<AgHistogramSeriesStyle, never, FillStrokeMorph>;

export type NormalisedLineSeriesStylerResult = Normalised<
    AgLineSeriesStylerResult,
    never,
    { stroke?: CssColor; marker?: NormalisedSeriesMarkerStyle }
>;

export type NormalisedSeriesSegmentation = Normalised<
    AgSeriesSegmentation,
    never,
    { segments: NormalisedSeriesShapeSegmentOptions[] }
>;

export type NormalisedSeriesShapeSegmentOptions = Normalised<AgSeriesShapeSegmentOptions, never, FillStrokeMorph>;
