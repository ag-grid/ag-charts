import type { _ModuleSupport } from 'ag-charts-community';

type SeriesLike = { id: string; data: _ModuleSupport.DataSet<unknown> | undefined };

export class DataSelectionServiceImp implements _ModuleSupport.DataSelectionService {
    constructor() {
        console.log('debug init');
    }
    getSeriesSelectedCount(series: SeriesLike): number {
        return series.data?.selections?.get(series.id)?.getSelectedCount() ?? 0;
    }
}
