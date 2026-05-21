import type { DataSet } from './dataSet';

type SeriesLike = { id: string; data: DataSet<unknown> | undefined };

export interface DataSelectionService {
    getSeriesSelectedCount(series: SeriesLike): number;
}
