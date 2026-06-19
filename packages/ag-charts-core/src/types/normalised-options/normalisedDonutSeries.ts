import type { AgDonutSeriesStyle, AgDonutSeriesTooltipRendererParams } from 'ag-charts-types';

import type { Normalised } from './normalise';
import type { FillStrokeMorph } from './normalisedCommonOptions';

export type NormalisedDonutSeriesStyle = Normalised<AgDonutSeriesStyle, never, FillStrokeMorph>;

export type NormalisedDonutSeriesTooltipRendererParams<T> = Normalised<
    AgDonutSeriesTooltipRendererParams<T>,
    never,
    FillStrokeMorph
>;
