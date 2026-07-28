import { useMemo } from 'react';

import type { AgPolarChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { VisitorDatum } from '../types';

interface VisitorBreakdownChartProps {
    data: VisitorDatum[];
}

export function VisitorBreakdownChart({ data }: VisitorBreakdownChartProps) {
    const options = useMemo<AgPolarChartOptions>(
        () => ({
            theme: THEME,
            data,
            series: [
                {
                    type: 'donut',
                    angleKey: 'sessions',
                    legendItemKey: 'type',
                    cornerRadius: 4,
                    innerRadiusRatio: 0.8,
                    tooltip: {
                        renderer: () => ({
                            symbol: { marker: { shape: 'circle' } },
                        }),
                    },
                },
            ],
            legend: {
                enabled: true,
                position: 'right',
                spacing: 24,
                maxWidth: 240,
                item: {
                    label: {
                        formatter: ({ datum }) => `${datum.type} - ${fmtInt(datum.sessions)}`,
                    },
                    marker: {
                        shape: 'circle',
                        size: 12,
                    },
                },
            },
            formatter: {
                angle: ({ value }) => fmtInt(Number(value)),
            },
            padding: { top: 8, right: 8, bottom: 8, left: 8 },
        }),
        [data]
    );

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
