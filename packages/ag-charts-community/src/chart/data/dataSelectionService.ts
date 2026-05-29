import type {
    DatumIndexType,
    ISeries,
    ISeriesProperties,
    SelectionState,
    SeriesNodeDatum,
} from '../series/seriesTypes';

type SeriesLike = ISeries<DatumIndexType, SeriesNodeDatum<DatumIndexType>, ISeriesProperties, unknown>;

interface IDataSetSelection {
    getSelectedCount(): number;
    getSelection(): Uint8Array;
}

export interface DataSelectionService {
    getDataSetSelection(series: SeriesLike): IDataSetSelection | undefined;
    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
}
