import type { AgPieSeriesStyle } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph } from './normalisedCommonOptions';

export type NormalisedPieSeriesStyle = Normalised<AgPieSeriesStyle, never, FillStrokeMorph>;
