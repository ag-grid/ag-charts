import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AG_CHARTS_LOCALE_FR_FR } from 'ag-charts-locale';

import { type DatumType, getData } from './data';

const options: AgChartOptions<DatumType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'income',
            yName: 'Revenu',
            grouped: false,
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'growth',
            yName: 'Croissance (%)',
            yAxisKey: 'rightAxis',
            strokeWidth: 3,
            marker: { enabled: true },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            title: { text: 'Mois' },
            label: {
                formatter: (params) => new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(params.value),
            },
        },
        {
            type: 'number',
            position: 'left',
            keys: ['income'],
            title: { text: 'Revenu' },
            label: {
                formatter: (params) =>
                    params.value.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                    }),
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['growth'],
            title: { text: 'Croissance (%)' },
            label: {
                formatter: (params) =>
                    new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1 }).format(
                        params.value / 100
                    ),
            },
        },
    ],
    legend: { enabled: true },
    zoom: { enabled: true },
    contextMenu: { enabled: true },
    locale: {
        localeText: AG_CHARTS_LOCALE_FR_FR,
    },
};

AgCharts.create(options);
