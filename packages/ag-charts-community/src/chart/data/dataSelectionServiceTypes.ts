import type {
    DatumIndexType,
    ISeries,
    ISeriesProperties,
    SelectionState,
    SeriesNodeDatum,
} from '../series/seriesTypes';
import type { DataChangeDescription } from './dataChangeDescription';
import type { DataSet } from './dataSet';
import type { IDataSetSelection } from './dataSetSelectionTypes';

type SeriesLike = ISeries<DatumIndexType, SeriesNodeDatum<DatumIndexType>, ISeriesProperties, unknown>;

export interface IDataSelectionService {
    transferDataSet<T>(newDataSet: DataSet<T>, oldDataSet: DataSet<T>): void;
    applyDataChange(changeDescription: DataChangeDescription): void;
    getDataSetSelection(series: SeriesLike): IDataSetSelection | undefined;
    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
}
