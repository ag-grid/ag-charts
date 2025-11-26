import { ModuleRegistry, PieSeriesModule } from 'ag-charts-community';
import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { AnimationModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AnimationModule, PieSeriesModule]);
const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

const totalRevenue = getData().reduce((sum, d) => sum + d.revenue, 0);

const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Technology Revenue by Segment',
    },
    subtitle: {
        text: 'Q4 2024 Revenue Distribution',
    },
    footnote: {
        text: `Total Revenue: ${currencyFormatter.format(totalRevenue)}`,
    },
    series: [
        {
            data: getData(),
            type: 'pie',
            calloutLabelKey: 'segment',
            sectorLabelKey: 'revenue',
            angleKey: 'revenue',
            sectorSpacing: 3,
            calloutLabel: {
                minAngle: 30,
                formatter: ({ datum }) => [
                    {
                        text: currencyFormatter.format(datum.revenue),
                        fontSize: 20,
                    },
                    { text: '\n' + datum.segment, fontSize: 10, color: 'grey' },
                ],
            },
            sectorLabel: {
                positionOffset: 30,
                formatter: ({ datum, angleKey }) => {
                    const value = datum[angleKey] as number;
                    const percentage = ((value / totalRevenue) * 100).toFixed(1);
                    return parseFloat(percentage) >= 5 ? `${percentage}%` : '';
                },
            },
            strokeWidth: 1,
            tooltip: {
                enabled: true,
                renderer: (params) => {
                    const { datum, angleKey } = params;
                    const value = datum[angleKey] as number;
                    const percentage = ((value / totalRevenue) * 100).toFixed(1);
                    return {
                        title: datum.segment,
                        data: [
                            { label: 'Revenue', value: currencyFormatter.format(value) },
                            { label: 'Market Share', value: `${percentage}%` },
                        ],
                    };
                },
            },
        },
    ],
    legend: {
        enabled: false,
    },
    animation: {
        enabled: true,
        duration: 800,
    },
};
AgCharts.create(options);
