import type { MementoOriginator } from 'ag-charts-core';
import { Logger } from 'ag-charts-core';
import type { AgFinancialChartOptions, AgInitialStateChartType } from 'ag-charts-types';

import type { ChartService } from '../../chart/chartService';

type ChartTypeMemento = AgInitialStateChartType;

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
        chartType ??= 'candlestick';
        return chartType;
    }

    public guardMemento(blob: unknown): blob is ChartTypeMemento | undefined {
        return blob == null || chartTypes.includes(blob as AgInitialStateChartType);
    }

    public restoreMemento(_version: string, _mementoVersion: string, memento: ChartTypeMemento | undefined) {
        // Migration from older versions can be implemented here.

        if (memento == null) return;

        const options: AgFinancialChartOptions = { chartType: memento };
        this.chartService.publicApi?.updateDelta(options as any).catch((e) => Logger.error('error restoring state', e));
    }
}
