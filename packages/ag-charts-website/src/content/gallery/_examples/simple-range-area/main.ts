import { AgChartOptions, AgCharts, AgRangeAreaSeriesTooltipRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

const dateFormatter = Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short' });

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
            interval: {
                values: [new Date(1958, 0, 1), new Date(2007, 0, 1), new Date(2011, 0, 1), new Date(2023, 0, 1)],
            },
            gridLine: {
                enabled: true,
            },
            title: {
                text: 'Year',
            },
        },
        {
            type: 'number',
            position: 'left',
            interval: { values: [4.6, 9.1] },
            title: {
                text: 'Magnitude',
            },
        },
    ],
    formatter: {
        x: (params) =>
            params.source === 'axis'
                ? `'${String((params.value as Date).getFullYear()).slice(2)}`
                : dateFormatter.format(params.value as Date),
    },
};

AgCharts.create(options);
