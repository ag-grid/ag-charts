import { _ModuleSupport } from 'ag-charts-community';

import { aggregateData } from './lineAggregation';

const { ChartAxisDirection, findMinValue, findMaxValue } = _ModuleSupport;

export class LineSeries extends _ModuleSupport.LineSeries {
    protected override visibleRange(
        length: number,
        x0: number,
        x1: number,
        xFor: (index: number) => number
    ): [number, number] {
        let start = findMinValue(0, length - 1, (index) => {
            const x = xFor(index);
            return x > x0 ? index : undefined;
        });
        start = Math.max((start ?? 0) - 1, 0);
        let end = findMaxValue(0, length - 1, (index) => {
            const x = xFor(index);
            return x < x1 ? index : undefined;
        });
        // Two points needed over end so the spans draw correctly
        end = Math.min((end ?? length) + 2, length);
        return [start, end];
    }

    protected override aggregateData() {
        const { dataModel, axes } = this;
        const ungroupedData = this.processedData as any as _ModuleSupport.UngroupedData<any> | undefined;

        const xAxis = axes[ChartAxisDirection.X];

        if (dataModel == null || ungroupedData == null || xAxis == null) return;

        const domain = dataModel.getDomain(this, `xValue`, 'value', ungroupedData);
        const xIdx = dataModel.resolveProcessedDataIndexById(this, `xValue`);
        const yIdx = dataModel.resolveProcessedDataIndexById(this, `yValueRaw`);

        return aggregateData(ungroupedData, xAxis, { domain, xIdx, yIdx });
    }
}
