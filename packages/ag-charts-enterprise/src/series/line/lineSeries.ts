import { _ModuleSupport } from 'ag-charts-community';

import { aggregateLineData } from './lineAggregation';

const { ChartAxisDirection, ContinuousScale, DiscreteTimeScale } = _ModuleSupport;

export class LineSeries extends _ModuleSupport.LineSeries {
    protected override aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, false>,
        processedData: _ModuleSupport.UngroupedData<any>
    ) {
        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null || !(ContinuousScale.is(xAxis.scale) || DiscreteTimeScale.is(xAxis.scale))) {
            return;
        }

        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);

        return aggregateLineData(xValues, yValues, domain);
    }
}
