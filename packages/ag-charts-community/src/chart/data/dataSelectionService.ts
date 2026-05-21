import type {
    DatumIndexType,
    ISeries,
    ISeriesProperties,
    SelectionState,
    SeriesNodeDatum,
} from '../series/seriesTypes';
import type { DataSetSelection } from './dataSetSelection';

type SeriesLike = ISeries<DatumIndexType, SeriesNodeDatum<DatumIndexType>, ISeriesProperties, unknown>;

export interface DataSelectionService {
    getDataSetSelection(series: SeriesLike): DataSetSelection;
    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
}
