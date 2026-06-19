import type { AgAreaSeriesMarkerItemStylerParams, AgAreaSeriesStylerResult } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedColorType } from './normalisedCommonOptions';
import type { NormalisedSeriesMarkerStyle } from './normalisedSeriesMarkerOptions';

export type NormalisedAreaSeriesMarkerItemStylerParams<TDatum, TContext> = Normalised<
    AgAreaSeriesMarkerItemStylerParams<TDatum, TContext>,
    never,
    { fill?: NormalisedColorType }
>;

export type NormalisedAreaSeriesStylerResult = Normalised<
    AgAreaSeriesStylerResult,
    never,
    FillStrokeMorph & { marker?: NormalisedSeriesMarkerStyle }
>;
