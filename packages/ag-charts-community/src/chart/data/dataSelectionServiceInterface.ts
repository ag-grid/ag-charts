import type { AgChartInstance } from 'ag-charts-types';

export interface IDataSelectionService extends Pick<
    AgChartInstance,
    'getSelection' | 'setSelection' | 'clearSelection'
> {
    getDataSelectionCount(seriesId: string): number;
}
