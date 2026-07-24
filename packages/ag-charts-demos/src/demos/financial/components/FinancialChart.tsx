import { useEffect, useMemo, useRef } from 'react';

import { type AgChartInstance, type AgFinancialChartOptions } from 'ag-charts-community';
import { AgFinancialCharts } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { type Bar } from '../data';
import { type ChartDatum } from '../types';
import { diffWindow } from '../windowTransaction';

function createFinancialOptions(
    data: ChartDatum[],
    chartType: AgFinancialChartOptions['chartType']
): AgFinancialChartOptions {
    // The visible range is controlled by windowing the data (see below) rather than by
    // zoom state, so the view streams with the trailing window and no initialState is
    // re-applied on each update (which would otherwise reset zoom/chart type).
    return {
        theme: THEME,
        data,
        // Bars carry a stable epoch-ms `time`; matching transactions by it lets a tick
        // append/remove single bars instead of replacing the whole dataset.
        dataIdKey: 'time',
        chartType,
        dateKey: 'date',
        openKey: 'open',
        highKey: 'high',
        lowKey: 'low',
        closeKey: 'close',
        volumeKey: 'volume',
        volume: true,
        rangeButtons: false,
    } as AgFinancialChartOptions;
}

interface FinancialChartProps {
    bars: Bar[];
    /** Trailing window in minutes; bars are one minute apart, so this is a bar count. */
    windowMinutes: number;
}

export function FinancialChart({ bars, windowMinutes }: FinancialChartProps) {
    const chartRef = useRef<AgChartInstance>(null);
    // One ChartDatum per Bar: bars keep their identity across ticks (only the newest
    // is appended), so unchanged bars — and their Dates — are mapped once, not per tick.
    // key={ticker} remounts the chart per instrument, resetting this alongside it.
    const datumCache = useRef(new WeakMap<Bar, ChartDatum>());
    // The datum window currently rendered by the chart, diffed against each new window
    // to derive the incremental transaction.
    const windowRef = useRef<ChartDatum[]>([]);

    const windowedData = useMemo(() => {
        const cache = datumCache.current;
        const window = bars.length > windowMinutes ? bars.slice(bars.length - windowMinutes) : bars;
        return window.map((bar) => {
            let datum = cache.get(bar);
            if (!datum) {
                datum = { ...bar, date: new Date(bar.time) };
                cache.set(bar, datum);
            }
            return datum;
        });
    }, [bars, windowMinutes]);

    // Seed the chart once; every later window change streams in as a transaction so the
    // options object stays referentially stable and never re-runs the slow options path
    // (which would also clobber the toolbar's live chart-type selection).
    const options = useMemo(() => {
        windowRef.current = windowedData;
        return createFinancialOptions(windowedData, 'candlestick');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const transactions = diffWindow(windowRef.current, windowedData, (datum) => datum.time);
        windowRef.current = windowedData;
        for (const transaction of transactions) {
            // eslint-disable-next-line no-console
            chartRef.current?.applyTransaction(transaction).catch((e) => console.error(e));
        }
    }, [windowedData]);

    return <AgFinancialCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
