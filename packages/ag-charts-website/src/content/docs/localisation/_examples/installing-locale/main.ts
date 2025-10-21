import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AG_CHARTS_LOCALE_FR_FR } from 'ag-charts-locale';

import { type LocaleContext, type LocaleString, makeLocaleContext } from './context';
import { type DatumType, getData } from './data';

type ExampleText = {
    localeText: Record<string, string>;
    income: string;
    growth: string;
    month: string;
};
const EXAMLE_TEXT: { [K in LocaleString]: ExampleText } = {
    'fr-FR': {
        localeText: AG_CHARTS_LOCALE_FR_FR,
        income: 'Revenu',
        growth: 'Croissance (%)',
        month: 'Mois',
    },
};
const INITIAL_LOCALE = 'fr-FR';

const options: AgChartOptions<DatumType, LocaleContext> = {
    context: makeLocaleContext(INITIAL_LOCALE),
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'income',
            yName: EXAMLE_TEXT[INITIAL_LOCALE].income,
            grouped: false,
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'growth',
            yName: EXAMLE_TEXT[INITIAL_LOCALE].growth,
            strokeWidth: 3,
            marker: { enabled: true },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            title: { text: EXAMLE_TEXT[INITIAL_LOCALE].month },
            label: {
                formatter: (params) => params.context.formatMonth(params.value),
            },
        },
        {
            type: 'number',
            position: 'left',
            keys: ['income'],
            title: { text: EXAMLE_TEXT[INITIAL_LOCALE].income },
            label: {
                formatter: (params) => params.context.formatUSD(params.value),
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['growth'],
            title: { text: EXAMLE_TEXT[INITIAL_LOCALE].growth },
            label: {
                formatter: (params) => params.context.formatPercent(params.value),
            },
        },
    ],
    legend: { enabled: true },
    zoom: { enabled: true },
    contextMenu: { enabled: true },
    locale: {
        localeText: EXAMLE_TEXT[INITIAL_LOCALE].localeText,
    },
};

AgCharts.create(options);

function updateLocale(locale: LocaleString) {
    options.context.locale = locale;
    options.series[0]!.yName = EXAMLE_TEXT[locale].income;
    options.series[1]!.yName = EXAMLE_TEXT[locale].growth;
    options.axes[0]!.title!.text = EXAMLE_TEXT[locale].month;
    options.axes[1]!.title!.text = EXAMLE_TEXT[locale].income;
    options.axes[2]!.title!.text = EXAMLE_TEXT[locale].growth;
    options.locale!.localeText = EXAMLE_TEXT[locale].localeText;
}
