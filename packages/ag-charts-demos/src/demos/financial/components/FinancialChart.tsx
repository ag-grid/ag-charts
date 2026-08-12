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
        // Bars carry a stable epoch-ms `time`, so a tick appends/removes single bars.
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
    /** The instrument on show. A change swaps the whole series (see the effect below). */
    ticker: string;
}

export function FinancialChart({ bars, windowMinutes, ticker }: FinancialChartProps) {
    const chartRef = useRef<AgChartInstance>(null);
    // OPTIMIZATION: bars are immutable once created, so each one's ChartDatum (and its Date) is
    // built once rather than per tick.
    const datumCache = useRef(new WeakMap<Bar, ChartDatum>());
    // The window currently rendered, diffed against each new window for the transaction.
    const windowRef = useRef<ChartDatum[]>([]);
    // Tracks the window size so a resize can be told apart from a streaming tick.
    const windowMinutesRef = useRef(windowMinutes);
    // Likewise the instrument, so a selection can be told apart from a tick.
    const tickerRef = useRef(ticker);

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

    // Seeded once so the options reference stays stable: re-running the slow options path would also
    // clobber the toolbar's live chart-type selection. Later windows stream in via the effect below.
    const options = useMemo(() => {
        windowRef.current = windowedData;
        return createFinancialOptions(windowedData, 'candlestick');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const baseline = windowRef.current;
        windowRef.current = windowedData;
        // Two changes replace the data outright instead of streaming a diff. A resize swaps most of
        // the window at once, and incremental transactions would leave the time axis domain stale.
        // An instrument change swaps all of it, and cannot be expressed as a diff at all: every feed
        // shares one time grid, so the new bars carry the same `time` values — the dataIdKey — as the
        // old ones, leaving diffWindow with nothing to add or remove and (absent a valueEquals)
        // nothing to update either. Replacing keeps the chart instance, and with it the zoom and the
        // toolbar's chart-type selection, both of which a remount would throw away.
        if (ticker !== tickerRef.current || windowMinutes !== windowMinutesRef.current) {
            tickerRef.current = ticker;
            windowMinutesRef.current = windowMinutes;
            // eslint-disable-next-line no-console
            chartRef.current?.updateDelta({ data: windowedData }).catch((e) => console.error(e));
            return;
        }
        const transactions = diffWindow(baseline, windowedData, (datum) => datum.time);
        for (const transaction of transactions) {
            // eslint-disable-next-line no-console
            chartRef.current?.applyTransaction(transaction).catch((e) => console.error(e));
        }
    }, [windowedData, windowMinutes, ticker]);

    return <AgFinancialCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
