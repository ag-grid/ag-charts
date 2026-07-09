import { useMemo } from 'react';

import { type AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { DemoPage } from '../../DemoPage';
import { getData } from './data';

export const StarterExample = () => {
    const options = useMemo<AgChartOptions>(
        () => ({
            title: { text: 'Monthly revenue' },
            data: getData(),
            series: [{ type: 'bar', xKey: 'month', yKey: 'revenue', yName: 'Revenue' }],
        }),
        []
    );

    return (
        <DemoPage title="Starter demo" description="A minimal AG Charts React bar chart.">
            <AgCharts options={options} style={{ height: 400 }} />
        </DemoPage>
    );
};
