import { useMemo } from 'react';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { PALETTE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { Browser } from '../types';

interface BrowserBreakdownChartProps {
    data: { browser: Browser; sessions: number }[];
}

export function BrowserBreakdownChart({ data }: BrowserBreakdownChartProps) {
    // Descending: largest browser at the top of the horizontal bars.
    const sorted = useMemo(() => [...data].sort((a, b) => b.sessions - a.sessions), [data]);

    const options = useMemo<AgCartesianChartOptions>(
        () => ({
            theme: THEME,
            data: sorted,
            series: [
                {
                    type: 'bar',
                    direction: 'horizontal',
                    xKey: 'browser',
                    yKey: 'sessions',
                    yName: 'Sessions',
                    fillOpacity: 0.2,
                    width: 12,
                    label: {
                        enabled: true,
                        placement: 'outside-end',
                        spacing: 12,
                        fontWeight: 'bold',
                        formatter: ({ value }) => fmtInt(value),
                    },
                    highlight: {
                        enabled: false,
                    },
                },
                {
                    type: 'scatter',
                    xKey: 'sessions',
                    yKey: 'browser',
                    size: 12,
                    fillOpacity: 1,
                    fill: PALETTE[0],
                    stroke: PALETTE[0],
                    highlight: {
                        enabled: false,
                    },
                },
            ],
            axes: {
                y: {
                    type: 'category',
                    position: 'left',
                },
                x: {
                    type: 'number',
                    position: 'bottom',
                    nice: false,
                    gridLine: { width: 0 },
                    label: { enabled: false },
                },
            },
            legend: { enabled: false },
            padding: { top: 8, right: 48, bottom: 8, left: 8 },
            tooltip: {
                enabled: false,
            },
        }),
        [sorted]
    );

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
