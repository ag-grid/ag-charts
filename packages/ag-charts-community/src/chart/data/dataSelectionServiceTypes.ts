import type {
    DatumIndexType,
    ISeries,
    ISeriesProperties,
    SelectionState,
    SeriesNodeDatum,
} from '../series/seriesTypes';
import type { IDataSetSelection } from './dataSetSelectionTypes';

type SeriesLike = ISeries<DatumIndexType, SeriesNodeDatum<DatumIndexType>, ISeriesProperties, unknown>;

export interface IDataSelectionService {
    getDataSetSelection(series: SeriesLike): IDataSetSelection | undefined;
    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
}
