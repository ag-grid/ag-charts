import type { AgFinancialChartOptions, AgInitialStateChartType } from 'ag-charts-types';

import type { ChartService } from '../../chart/chartService';
import { isString } from '../../util/type-guards';
import type { MementoOriginator } from '../state/memento';

export type ChartTypeMemento = AgInitialStateChartType;

export class ChartTypeOriginator implements MementoOriginator<ChartTypeMemento> {
    public mementoOriginatorKey = 'chartType' as const;

    constructor(private readonly chartService: ChartService) {}

    public createMemento() {
        let chartType = (this.chartService.publicApi?.getOptions() as AgFinancialChartOptions)?.chartType;
        if (chartType === 'range-area') chartType = 'candlestick';
        if (chartType == null) chartType = 'candlestick';
        return chartType;
    }

    public guardMemento(blob: unknown): blob is ChartTypeMemento {
        return (
            isString(blob) &&
            ['candlestick', 'hollow-candlestick', 'ohlc', 'line', 'step-line', 'hlc', 'high-low'].includes(blob)
        );
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: ChartTypeMemento) {
        // Migration from older versions can be implemented here.

        const options: AgFinancialChartOptions = { chartType: memento };
        void this.chartService.publicApi?.updateDelta(options as any);
    }
}
