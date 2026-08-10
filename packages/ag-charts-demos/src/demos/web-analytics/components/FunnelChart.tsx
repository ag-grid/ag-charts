import { useMemo } from 'react';

import type { AgChartOptions, AgFunnelSeriesOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { FUNNEL_COLORS, THEME } from '../chartTheme';
import { fmtInt } from '../format';
import type { FunnelStep } from '../types';

interface FunnelChartProps {
    data: FunnelStep[];
}

export function FunnelChart({ data }: FunnelChartProps) {
    const options = useMemo<AgChartOptions>(() => {
        const series: AgFunnelSeriesOptions = {
            type: 'funnel',
            stageKey: 'stepName',
            valueKey: 'sessionsEntering',
            fills: FUNNEL_COLORS,
            strokeWidth: 0,
            stageLabel: {
                enabled: false,
            },
            label: {
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
    }, [data]);

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
