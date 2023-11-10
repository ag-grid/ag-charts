import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Religions of London Population',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            data: getData(),
            type: 'pie',
            sectorLabelKey: 'population',
            angleKey: 'population',
            calloutLabel: {
                minAngle: 0,
            },
            sectorLabel: {
                formatter: ({ datum, sectorLabelKey = 'population' }) => {
                    return numFormatter.format(datum[sectorLabelKey]);
                },
            },
            tooltip: {
                renderer: ({ datum, sectorLabelKey = 'population' }) => ({
                    title: `${datum['religion']}`,
                    content: `${datum[sectorLabelKey].toLocaleString()}`,
                }),
            },
        },
    ],
    legend: {
        enabled: false,
    },
};
AgEnterpriseCharts.create(options);
