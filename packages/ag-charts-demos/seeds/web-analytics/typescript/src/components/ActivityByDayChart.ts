import type { AgCartesianChartOptions } from 'ag-charts-community';

import { type DataChart, createDataChart } from '../agChart';
import { PALETTE, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { ActivityCell } from '../types';

interface DayTotal {
    day: string;
    sessions: number;
}

export function createActivityByDayChart(data: ActivityCell[]): DataChart<ActivityCell[]> {
    return createDataChart(data, (data): AgCartesianChartOptions => {
        // Roll the hourly heatmap cells up to a per-weekday total, keeping the
        // Monday-first ordering the source data is already in.
        const totals = new Map<string, number>();
        for (const { day, sessions } of data) {
            totals.set(day, (totals.get(day) ?? 0) + sessions);
        }
        const byDay = [...totals.entries()].map(([day, sessions]): DayTotal => ({ day, sessions }));

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
                    cornerRadius: 6,
                    fill: { ref: 'chartBackgroundColor', mix: 0.2, ontoColor: PALETTE[0] },
                    strokeWidth: 0,
                    stroke: PALETTE[0],
                    label: {
                        enabled: false,
                    },
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
            padding: { top: 6, right: 52, bottom: 10, left: 38 },
            formatter: {
                y: ({ value }) => fmtInt(Number(value)),
            },
        };
    });
}
