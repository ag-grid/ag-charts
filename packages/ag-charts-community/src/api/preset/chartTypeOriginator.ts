import type { AgFinancialChartOptions, AgInitialStateChartType } from 'ag-charts-types';

import type { ChartService } from '../../chart/chartService';
import { includes } from '../../util/array';
import { isString } from '../../util/type-guards';
import type { MementoOriginator } from '../state/memento';

export type ChartTypeMemento = AgInitialStateChartType;

const chartTypes: Array<AgInitialStateChartType> = [
    'candlestick',
    'hollow-candlestick',
    'ohlc',
    'line',
    'step-line',
    'hlc',
    'high-low',
];

export class ChartTypeOriginator implements MementoOriginator<ChartTypeMemento> {
    public mementoOriginatorKey = 'chartType' as const;

    constructor(private readonly chartService: ChartService) {}

    public createMemento() {
        let chartType = (this.chartService.publicApi?.getOptions() as AgFinancialChartOptions)?.chartType;
        if (chartType == null) chartType = 'candlestick';
        return chartType;
    }

    public guardMemento(blob: unknown): blob is ChartTypeMemento | undefined {
        return blob == null || (isString(blob) && includes(chartTypes, blob));
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: ChartTypeMemento | undefined) {
        // Migration from older versions can be implemented here.

        if (memento == null) return;

        const options: AgFinancialChartOptions = { chartType: memento };
        void this.chartService.publicApi?.updateDelta(options as any);
    }
}
