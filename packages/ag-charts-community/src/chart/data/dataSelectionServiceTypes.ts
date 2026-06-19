import type { ISeries, ISeriesProperties, SelectionState, SeriesNodeDatum } from '../series/seriesTypes';
import type { DataChangeDescriptionListener } from './dataChangeDescription';
import type { DataSet } from './dataSet';
import type { IDataSetSelection } from './dataSetSelectionTypes';

type SeriesLike = ISeries<SeriesNodeDatum, ISeriesProperties, unknown>;

export interface IDataSelectionService extends DataChangeDescriptionListener {
    transferDataSet<T>(newDataSet: DataSet<T>, oldDataSet: DataSet<T>): void;
    getDataSetSelection(series: SeriesLike): IDataSetSelection | undefined;
    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
    getDataCandidateState(series: SeriesLike, datumIndex: number | undefined): SelectionState | undefined;
}
