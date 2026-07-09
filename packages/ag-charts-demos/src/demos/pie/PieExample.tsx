import { useMemo } from 'react';

import { type AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-react';

import { DemoPage } from '../../DemoPage';
import { getData } from './data';

export const PieExample = () => {
    const options = useMemo<AgChartOptions>(
        () => ({
            title: { text: 'Traffic by source' },
            data: getData(),
            series: [{ type: 'pie', angleKey: 'share', calloutLabelKey: 'source', legendItemKey: 'source' }],
        }),
        []
    );

    return (
        <DemoPage title="Pie demo" description="A minimal AG Charts React pie chart.">
            <AgCharts options={options} style={{ height: 400 }} />
        </DemoPage>
    );
};
