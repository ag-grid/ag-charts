import type { AgPieSeriesStyle } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph, NormalisedLineDash } from './normalisedCommonOptions';

export type NormalisedPieSeriesStyle = Normalised<AgPieSeriesStyle, never, FillStrokeMorph & NormalisedLineDash>;
