import { AgEnterpriseCharts, AgChartOptions } from 'ag-charts-enterprise';
import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    series: Object.entries(getData()).map(([relationship, data]) => ({
        data,
        type: 'radar-line',
        angleKey: 'recognitionTime',
        angleName: 'Recognition Time',
        radiusKey: 'closeness',
        radiusName: `${relationship[0].toUpperCase()}${relationship.slice(1)}`,
        strokeWidth: 0,
    })),
    axes: [
        {
            type: 'angle-number',
            shape: 'circle',
            gridLine: {
                enabled: false,
            },
            line: {
                width: 0
            }
        },
        {
            type: 'radius-number',
            shape: 'circle',
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'range',
                    range: [1, 2],
                },
                {
                    type: 'range',
                    range: [6, 10],
                },
            ],
        },
    ],
};

AgEnterpriseCharts.create(options);
