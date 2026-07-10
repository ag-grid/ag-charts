import { useMemo, useRef } from 'react';

import { type AgChartInstance, type AgFinancialChartOptions } from 'ag-charts-community';
import { AgFinancialCharts } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { type ChartDatum } from '../types';

// Widen only the right padding for this chart; a financial preset takes padding
// through the theme's common overrides, not a top-level `padding` option.
const CHART_THEME = {
    ...THEME,
    overrides: {
        ...THEME.overrides,
        common: {
            ...THEME.overrides.common,
            padding: { ...THEME.overrides.common.padding, right: 10 },
        },
    },
};

function createFinancialOptions(
    data: ChartDatum[],
    chartType: AgFinancialChartOptions['chartType']
): AgFinancialChartOptions {
    // The visible range is controlled by windowing the data (see below) rather than by
    // zoom state, so the view streams with the trailing window and no initialState is
    // re-applied on each update (which would otherwise reset zoom/chart type).
    return {
        data,
        chartType,
        dateKey: 'date',
        openKey: 'open',
        highKey: 'high',
        lowKey: 'low',
        closeKey: 'close',
        volumeKey: 'volume',
        volume: true,
        rangeButtons: false,
        theme: CHART_THEME,
    } as AgFinancialChartOptions;
}

interface FinancialChartProps {
    data: ChartDatum[];
    /** Trailing window in minutes; bars are one minute apart, so this is a bar count. */
    windowMinutes: number;
}

export function FinancialChart({ data, windowMinutes }: FinancialChartProps) {
    const chartRef = useRef<AgChartInstance>(null);

    // Show only the trailing window; as bars stream in the slice advances, so the
    // view moves with time without touching zoom state.
    const windowedData = useMemo(
        () => (data.length > windowMinutes ? data.slice(data.length - windowMinutes) : data),
        [data, windowMinutes]
    );

    const options = useMemo(() => {
        // The preset rebuilds the price series from chartType on every update, so
        // read the live selection back from the instance (set by the built-in
        // toolbar) rather than always forcing the initial type.
        const currentType = (chartRef.current?.getOptions() as AgFinancialChartOptions | undefined)?.chartType;
        return createFinancialOptions(windowedData, currentType ?? 'candlestick');
    }, [windowedData]);

    return <AgFinancialCharts ref={chartRef} options={options} style={{ height: '100%', width: '100%' }} />;
}
