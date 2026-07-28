import { useMemo } from 'react';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { PALETTE, THEME } from '../chartTheme';
import { fmtDuration } from '../format';
import type { Session } from '../types';

interface DurationHistogramChartProps {
    sessions: Session[];
}

// Distribution of session durations. The histogram bins the raw per-session
// duration values and counts sessions per bin.
export function DurationHistogramChart({ sessions }: DurationHistogramChartProps) {
    const options = useMemo<AgCartesianChartOptions>(
        () => ({
            theme: THEME,
            data: sessions,
            series: [
                {
                    type: 'histogram',
                    xKey: 'sessionDuration',
                    xName: 'Session duration',
                    yName: 'Sessions',
                    binCount: 24,
                    fill: PALETTE[0],
                    stroke: 'white',
                    strokeWidth: 1,
                    cornerRadius: 3,
                    tooltip: {
                        renderer: () => ({
                            symbol: { marker: { enabled: false } },
                        }),
                    },
                },
            ],
            axes: {
                x: {
                    type: 'number',
                    position: 'bottom',
                    label: { formatter: ({ value }) => fmtDuration(value) },
                    gridLine: {
                        enabled: false,
                    },
                    nice: false,
                },
                y: {
                    type: 'number',
                    position: 'left',
                    nice: false,
                },
            },
            legend: { enabled: false },
            padding: { top: 8, right: 0, bottom: 0, left: 0 },
        }),
        [sessions]
    );

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
