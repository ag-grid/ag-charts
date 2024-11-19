import { _ModuleSupport } from 'ag-charts-community';

import { visibleRange } from '../../utils/aggregation';
import { aggregateData } from './lineAggregation';

const { ChartAxisDirection, ContinuousScale, OrdinalTimeScale } = _ModuleSupport;

export class LineSeries extends _ModuleSupport.LineSeries {
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
        processedData: _ModuleSupport.UngroupedData<any>
    ) {
        if (processedData.rawData.length === 0) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null || !(ContinuousScale.is(xAxis.scale) || OrdinalTimeScale.is(xAxis.scale))) return;

        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);

        return aggregateData(xValues, yValues, domain);
    }
}
