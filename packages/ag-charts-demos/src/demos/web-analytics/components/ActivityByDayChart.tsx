import { useMemo } from 'react';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { PALETTE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { ActivityCell } from '../types';

interface ActivityByDayChartProps {
    data: ActivityCell[];
}

interface DayTotal {
    day: string;
    sessions: number;
}

export function ActivityByDayChart({ data }: ActivityByDayChartProps) {
    // Roll the hourly heatmap cells up to a per-weekday total, keeping the
    // Monday-first ordering the source data is already in.
    const byDay = useMemo(() => {
        const totals = new Map<string, number>();
        for (const { day, sessions } of data) {
            totals.set(day, (totals.get(day) ?? 0) + sessions);
        }
        return [...totals.entries()].map(([day, sessions]): DayTotal => ({ day, sessions }));
    }, [data]);

    const options = useMemo<AgCartesianChartOptions>(() => {
        const values = byDay.map((d) => d.sessions);
        const max = Math.max(...values);
        const min = Math.min(...values);

        return {
            theme: THEME,
            data: byDay,
            series: [
                {
                    type: 'bar',
                    direction: 'vertical',
                    xKey: 'day',
                    yKey: 'sessions',
                    yName: 'Sessions',
                    cornerRadius: 8,
                    fill: PALETTE[0],
                    strokeWidth: 0,
                    stroke: PALETTE[0],
                    label: {
                        enabled: true,
                        placement: 'outside-end',
                        spacing: 4,
                        fontWeight: 'bold',
                        // Only annotate the busiest and quietest weekday.
                        formatter: ({ datum }) =>
                            datum.sessions === max || datum.sessions === min ? fmtInt(datum.sessions) : '',
                    },
                    highlight: {
                        enabled: false,
                    },
                    itemStyler: ({ datum }) => ({
                        fillOpacity: datum.sessions === max || datum.sessions === min ? 1 : 0.2,
                    }),
                },
            ],
            axes: {
                x: {
                    type: 'category',
                    position: 'bottom',
                    line: { enabled: false },
                    label: { enabled: false },
                },
                y: {
                    type: 'number',
                    position: 'left',
                    nice: false,
                    gridLine: { width: 0 },
                    label: { enabled: false },
                },
            },
            legend: { enabled: false },
            padding: { top: 16, right: 52, bottom: 12, left: 40 },
        };
    }, [byDay]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
