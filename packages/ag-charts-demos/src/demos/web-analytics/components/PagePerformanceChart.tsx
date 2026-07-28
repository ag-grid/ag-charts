import { useMemo } from 'react';

import type { AgCartesianChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { PALETTE, THEME } from '../chartTheme';
import { fmtCompact, fmtPct } from '../format';
import type { PageRow } from '../types';

interface PagePerformanceChartProps {
    data: PageRow[];
}

// Pages ranked by pageviews (bars, bottom axis) alongside their conversion rate
// (bars, top axis) — a dual value-axis horizontal bar chart.
export function PagePerformanceChart({ data }: PagePerformanceChartProps) {
    const rows = useMemo(() => [...data].sort((a, b) => a.pageviews - b.pageviews), [data]);

    const options = useMemo<AgCartesianChartOptions>(
        () => ({
            theme: THEME,
            data: rows,
            series: [
                {
                    type: 'bar',
                    direction: 'horizontal',
                    xKey: 'pageTitle',
                    yKey: 'pageviews',
                    yName: 'Pageviews',
                    xKeyAxis: 'page',
                    yKeyAxis: 'views',
                    fill: PALETTE[0],
                    cornerRadius: 4,
                },
                {
                    type: 'bar',
                    direction: 'horizontal',
                    xKey: 'pageTitle',
                    yKey: 'conversionRate',
                    yName: 'Conversion rate',
                    xKeyAxis: 'page',
                    yKeyAxis: 'rate',
                    fill: PALETTE[1],
                    cornerRadius: 4,
                },
            ],
            axes: {
                page: { type: 'category', position: 'left' },
                views: {
                    type: 'number',
                    position: 'bottom',
                    title: {
                        text: 'Page views',
                        fontStyle: 'italic',
                        color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[0] },
                        spacing: 2,
                    },
                    label: {
                        formatter: ({ value }) => fmtCompact(value),
                        spacing: 2,
                        color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[0] },
                    },
                },
                rate: {
                    type: 'number',
                    position: 'top',
                    title: {
                        text: 'Conversion rate',
                        fontStyle: 'italic',
                        color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[1] },
                        spacing: 2,
                    },
                    label: {
                        formatter: ({ value }) => fmtPct(Number(value)),
                        spacing: 2,
                        color: { ref: 'textColor', mix: 0.2, ontoColor: PALETTE[1] },
                    },
                },
            },
            legend: { enabled: false, position: 'bottom' },
            padding: { top: 0, right: 4, bottom: 0, left: 0 },
        }),
        [rows]
    );

    return <AgCharts options={options} style={{ height: '100%', width: '100%' }} />;
}
