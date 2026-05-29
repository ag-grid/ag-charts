import { _ModuleSupport } from 'ag-charts-community';
import type { DynamicContext } from 'ag-charts-core';

const { SelectionState } = _ModuleSupport;

type ChartRegistry = _ModuleSupport.ChartRegistry;
type IDataSelectionService = _ModuleSupport.IDataSelectionService;
type DataSetSelection = _ModuleSupport.DataSetSelection;
type SelectionStateEnum = _ModuleSupport.SelectionState;
type SeriesLike = Parameters<IDataSelectionService['getDataSelectionState']>[0];

export class DataSelectionService implements IDataSelectionService {
    public totalSelectedCount = 0;

    constructor(private readonly ctx: DynamicContext<ChartRegistry>) {}

    getDataSetSelection(series: SeriesLike): DataSetSelection | undefined {
        return series.data?.selections?.get(series.id);
    }

    getDataSelectionState(series: SeriesLike, datumIndex: number | undefined): SelectionStateEnum | undefined {
        if (!series.properties.selection.enabled) return undefined;

        const options = this.ctx.chartState.getValue('options');
        if (!options?.selection?.enabled) return undefined;

        if (this.totalSelectedCount === 0) {
            return SelectionState.None;
        }

        // When aggregation is active, a rendered marker stands in for an
        // entire bucket. The bucket is considered selected if any of its
        // underlying datums is selected, regardless of which one happens to
        // be the bucket's representative index. Fall back to the per-datum
        // bitset when no aggregation level applies.
        const selectionBuffer = this.getDataSetSelection(series);
        if (typeof datumIndex === 'number') {
            const aggregated = series.ensureBucketLookupFeature()?.isBucketSelected(datumIndex);
            const isItem = aggregated ?? selectionBuffer?.isSelected(datumIndex) ?? false;
            if (isItem) {
                return SelectionState.Item;
            } else {
                return SelectionState.OtherItem;
            }
        }
        return SelectionState.OtherSeries;
    }
}
