import type { AgChartOptions, AgFunnelSeriesOptions } from 'ag-charts-community';

import { type DataChart, createDataChart } from '../agChart';
import { FUNNEL_COLORS, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { FunnelStep } from '../types';

export function createFunnelChart(data: FunnelStep[]): DataChart<FunnelStep[]> {
    return createDataChart(data, (data): AgChartOptions => {
        const series: AgFunnelSeriesOptions = {
            type: 'funnel',
            stageKey: 'stepName',
            valueKey: 'sessionsEntering',
            fills: FUNNEL_COLORS,
            strokeWidth: 0,
            cornerRadius: 5,
            stageLabel: {
                enabled: false,
            },
            label: {
                placement: ['inside-center', 'outside-after'],
                formatter: ({ datum }) => [
                    { text: datum.stepName, fontSize: 13, fontWeight: 'bold' },
                    { text: '\n' },
                    { text: fmtInt(datum.sessionsEntering), fontSize: 12, color: 'white' },
                ],
            },
        };
        return {
            theme: THEME,
            data,
            series: [series],
            padding: 0,
            formatter: {
                y: ({ value }) => fmtInt(Number(value)),
            },
        };
    });
}
