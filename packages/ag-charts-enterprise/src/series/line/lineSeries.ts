import { _ModuleSupport } from 'ag-charts-community';

import { aggregateData } from './lineAggregation';

const { ChartAxisDirection, findMinValue, findMaxValue, ContinuousScale } = _ModuleSupport;

export class LineSeries extends _ModuleSupport.LineSeries {
    protected override visibleRange(
        length: number,
        x0: number,
        x1: number,
        xFor: (index: number) => number
    ): [number, number] {
        let start = findMinValue(0, length - 1, (index) => {
            const x = xFor(index);
            return !Number.isFinite(x) || x > x0 ? index : undefined;
        });
        start = Math.max((start ?? 0) - 1, 0);
        let end = findMaxValue(0, length - 1, (index) => {
            const x = xFor(index);
            return !Number.isFinite(x) || x < x1 ? index : undefined;
        });
        // Two points needed over end so the spans draw correctly
        end = Math.min((end ?? length) + 2, length);
        return [start, end];
    }

    protected override aggregateData(
        dataModel: _ModuleSupport.DataModel<any, any, false>,
        processedData: _ModuleSupport.UngroupedData<any>
    ) {
        if (processedData.rawData.length === 0) return;

        const xAxis = this.axes[ChartAxisDirection.X];
        if (xAxis == null || !ContinuousScale.is(xAxis.scale)) return;

        const xValues = dataModel.resolveColumnById(this, `xValue`, processedData);
        const yValues = dataModel.resolveColumnById(this, `yValueRaw`, processedData);
        const domain = dataModel.getDomain(this, `xValue`, 'value', processedData);

        return aggregateData(xValues, yValues, domain);
    }
}
