import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AG_CHARTS_LOCALE_FR_FR } from 'ag-charts-locale';

import { type LocaleContext, makeLocaleContext } from './context';
import { type DatumType, getData } from './data';

const options: AgChartOptions<DatumType, LocaleContext> = {
    context: makeLocaleContext('fr-FR'),
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
                formatter: (params) => params.context.formatMonth(params.value),
            },
        },
        {
            type: 'number',
            position: 'left',
            keys: ['income'],
            title: { text: 'Revenu' },
            label: {
                formatter: (params) => params.context.formatUSD(params.value),
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['growth'],
            title: { text: 'Croissance (%)' },
            label: {
                formatter: (params) => params.context.formatPercent(params.value),
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
