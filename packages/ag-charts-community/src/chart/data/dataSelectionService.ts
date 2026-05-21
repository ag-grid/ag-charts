import type { ISeries, ISeriesProperties, SelectionState, SeriesNodeDatum } from '../series/seriesTypes';

type SeriesLike = ISeries<number, SeriesNodeDatum<number>, ISeriesProperties, unknown>;

export interface DataSelectionService {
    getSeriesSelectedCount(series: SeriesLike): number;
    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
}
