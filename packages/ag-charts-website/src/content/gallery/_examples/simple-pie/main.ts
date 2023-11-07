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
            calloutLabelKey: 'religion',
            sectorLabelKey: 'population',
            angleKey: 'population',
            calloutLabel: {
                minAngle: 0,
            },
            sectorLabel: {
                formatter: ({ datum, sectorLabelKey }) => {
                    return numFormatter.format(datum[sectorLabelKey!]);
                },
            },
            tooltip: {
                renderer: ({ datum, color, calloutLabelKey, sectorLabelKey }) => {
                    return [
                        `<div style="background-color: ${color}; padding: 4px 8px; border-top-left-radius: 5px; border-top-right-radius: 5px; font-weight: bold; color: white;">${
                            datum[calloutLabelKey!]
                        }</div>`,
                        `<div style="padding: 4px 8px">${numFormatter.format(datum[sectorLabelKey!])}</div>`,
                    ].join('\n');
                },
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgEnterpriseCharts.create(options);
