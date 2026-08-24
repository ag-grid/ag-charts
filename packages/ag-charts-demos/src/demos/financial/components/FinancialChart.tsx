import { useEffect, useMemo, useRef } from 'react';

import { type AgChartInstance, type AgFinancialChartOptions } from 'ag-charts-community';
import { AgFinancialCharts } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { type Bar } from '../data';
import { type ChartDatum } from '../types';
import { diffWindow } from '../windowTransaction';

// Scoped to this chart: the preset omits `padding` from its option types, so the theme is the
// only lever, and the other charts on the page keep the default.
const FINANCIAL_THEME = {
    ...THEME,
    overrides: {
        ...THEME.overrides,
        common: {
            ...THEME.overrides.common,
            padding: {
                top: 8,
                right: 12,
            },
        },
    },
};

function createFinancialOptions(
    data: ChartDatum[],
    chartType: AgFinancialChartOptions['chartType']
): AgFinancialChartOptions {
    // The visible range comes from windowing the data, not zoom state — re-applying initialState on
    // each update would reset the zoom and chart type.
    return {
        theme: FINANCIAL_THEME,
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
        const chart = chartRef.current;
        // Leave the refs alone until there is an instance to apply the change to, so a window the
        // chart never received cannot become the baseline the next diff is taken against.
        if (!chart) return;
        const baseline = windowRef.current;
        windowRef.current = windowedData;
        // Resize or instrument change replaces the data outright: transactions leave the time axis
        // domain stale, and one shared time grid means `time` (the dataIdKey) cannot diff feeds.
        if (ticker !== tickerRef.current || windowMinutes !== windowMinutesRef.current) {
            tickerRef.current = ticker;
            windowMinutesRef.current = windowMinutes;
            // eslint-disable-next-line no-console
            chart.updateDelta({ data: windowedData }).catch((e) => console.error(e));
            return;
        }
        const transactions = diffWindow(baseline, windowedData, (datum) => datum.time);
        for (const transaction of transactions) {
            // eslint-disable-next-line no-console
            chart.applyTransaction(transaction).catch((e) => console.error(e));
        }
    }, [windowedData, windowMinutes, ticker]);

    return <AgFinancialCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
