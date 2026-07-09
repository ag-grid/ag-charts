import { useMemo } from 'react';

import { type AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { DemoPage } from '../../DemoPage';
import { getData } from './data';

export const LineExample = () => {
    const options = useMemo<AgChartOptions>(
        () => ({
            title: { text: 'Website visitors' },
            data: getData(),
            series: [{ type: 'line', xKey: 'month', yKey: 'visitors', yName: 'Visitors' }],
        }),
        []
    );

    return (
        <DemoPage title="Line demo" description="A minimal AG Charts React line chart.">
            <AgCharts options={options} style={{ height: 400 }} />
        </DemoPage>
    );
};
