import type {
    DatumIndexType,
    ISeries,
    ISeriesProperties,
    SelectionState,
    SeriesNodeDatum,
} from '../series/seriesTypes';

type SeriesLike = ISeries<DatumIndexType, SeriesNodeDatum<DatumIndexType>, ISeriesProperties, unknown>;

export interface DataSelectionService {
    getSeriesSelectedCount(series: SeriesLike): number;
    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
}
