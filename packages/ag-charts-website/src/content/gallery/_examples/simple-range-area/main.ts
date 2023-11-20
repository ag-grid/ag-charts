import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Understanding Japan's Seismic Hazard`,
    },
    subtitle: {
        text: `Magnitude of Earthquakes from 1958 to 2023`,
    },
    series: [
        {
            type: 'range-area',
            xKey: 'year',
            xName: 'Year',
            yLowKey: 'magnitudeLow',
            yHighKey: 'magnitudeHigh',
            strokeWidth: 0,
            fillOpacity: 1,
            label: {
                formatter: ({ value, datum, xKey }) => {
                    return value === 9.1
                        ? `${datum['magnitudeHighRegion']}, ${String(datum[xKey]).substring(0, 15)}`
                        : value === 4.6
                        ? `${datum['magnitudeLowRegion']}, ${String(datum[xKey]).substring(0, 15)}`
                        : '';
                },
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            nice: false,
            gridLine: {
                enabled: true,
            },
            tick: {
                values: [new Date(1958, 0, 1), new Date(2007, 0, 1), new Date(2011, 0, 1), new Date(2023, 0, 1)],
            },
            label: {
                formatter: ({ value }) => `'${String(new Date(value).getFullYear()).slice(2)}`,
            },
            title: {
                text: 'Year',
            },
        },
        {
            type: 'number',
            position: 'left',
            tick: {
                values: [4.6, 9.1],
            },
            title: {
                text: 'Magnitude',
            },
        },
    ],
};

AgCharts.create(options);
