import { _ModuleSupport } from 'ag-charts-community';

import { aggregateBarData } from './barAggregation';

const { ChartAxisDirection, ContinuousScale, UnitTimeScale, OrdinalTimeScale } = _ModuleSupport;

export class BarSeries extends _ModuleSupport.BarSeries {
    protected override aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, false>,
        processedData: _ModuleSupport.ProcessedData<any>
    ) {
        if (processedData?.type !== 'ungrouped') return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (
            xAxis == null ||
            !(ContinuousScale.is(xAxis.scale) || UnitTimeScale.is(xAxis) || OrdinalTimeScale.is(xAxis.scale))
        ) {
            return;
        }

        const xValues = dataModel.resolveKeysById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValue-raw`, processedData);

        const { index } = dataModel.resolveProcessedDataDefById(this, `xValue`);
        const domain = processedData.domain.keys[index];

        return aggregateBarData(xValues, yValues, domain);
    }
}
