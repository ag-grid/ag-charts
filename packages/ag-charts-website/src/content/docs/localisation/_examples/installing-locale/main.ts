import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AG_CHARTS_LOCALE_FR_FR } from 'ag-charts-locale';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { month: new Date(2025, 0, 1), income: 250000, growth: 1.1 },
        { month: new Date(2025, 1, 1), income: 300000, growth: 1.2 },
        { month: new Date(2025, 2, 1), income: 450000, growth: 1.5 },
        { month: new Date(2025, 3, 1), income: 600000, growth: 1.33 },
        { month: new Date(2025, 4, 1), income: 720000, growth: 1.2 },
        { month: new Date(2025, 5, 1), income: 680000, growth: -0.06 },
    ],
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
                formatter: params =>
                    new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(params.value),
            },
        },
        {
            type: 'number',
            position: 'left',
            keys: ['income'],
            title: { text: 'Revenu (€)' },
            label: {
                formatter: params =>
                    params.value.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['growth'],
            title: { text: 'Croissance (%)' },
            label: {
                formatter: params =>
                    new Intl.NumberFormat('fr-FR', { style: 'percent', minimumFractionDigits: 1 }).format(params.value / 100),
            },
        },
    ],
    legend: { enabled: true },
    zoom: { enabled: true },
    contextMenu: { enabled: true },
    locale: {
        localeText: AG_CHARTS_LOCALE_FR_FR
    },
};

AgCharts.create(options);
