import { _ModuleSupport } from 'ag-charts-community';

import { visibleRange } from '../../utils/aggregation';
import { aggregateData } from './barAggregation';

const { ChartAxisDirection, ContinuousScale, OrdinalTimeScale } = _ModuleSupport;

export class BarSeries extends _ModuleSupport.BarSeries {
    protected override visibleRange(
        length: number,
        x0: number,
        x1: number,
        xFor: (index: number) => number
    ): [number, number] {
        return visibleRange(length, x0, x1, xFor);
    }

    protected override aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, false>,
        processedData: _ModuleSupport.ProcessedData<any>
    ) {
        if (processedData.rawData.length === 0 || processedData.type !== 'ungrouped') return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null || !(ContinuousScale.is(xAxis.scale) || OrdinalTimeScale.is(xAxis.scale))) return;

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue-raw`, processedData);

        const { index } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const domain = processedData.domain.keys[index];

        return aggregateData(xValues, yValues, domain);
    }
}
