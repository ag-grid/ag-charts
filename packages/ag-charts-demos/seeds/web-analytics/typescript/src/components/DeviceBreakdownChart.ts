import type { AgPolarChartOptions } from 'ag-charts-community';

import { type DataChart, createDataChart } from '../agChart';
import { THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { DeviceDatum } from '../types';

export function createDeviceBreakdownChart(data: DeviceDatum[]): DataChart<DeviceDatum[]> {
    return createDataChart(data, (data): AgPolarChartOptions => {
        // Collapse the new/returning split into a single total per device.
        const totals = data.map((d) => ({ device: d.device, sessions: d.new + d.returning }));
        return {
            theme: THEME,
            data: totals,
            series: [
                {
                    type: 'donut',
                    angleKey: 'sessions',
                    legendItemKey: 'device',
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
                        formatter: ({ datum }) => `${datum.device} - ${fmtInt(datum.sessions)}`,
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
        };
    });
}
