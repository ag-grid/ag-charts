import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    LocaleModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AnimationModule, CrosshairModule } from 'ag-charts-enterprise';
import { ContextMenuModule, ZoomModule } from 'ag-charts-enterprise';
import {
    AG_CHARTS_LOCALE_AR_EG,
    AG_CHARTS_LOCALE_EN_US,
    AG_CHARTS_LOCALE_FA_IR,
    AG_CHARTS_LOCALE_FR_FR,
    AG_CHARTS_LOCALE_HE_IL,
    AG_CHARTS_LOCALE_PL_PL,
    AG_CHARTS_LOCALE_TR_TR,
    AG_CHARTS_LOCALE_ZH_CN,
} from 'ag-charts-locale';

import { makeLocaleContext } from './context';
import type { LocaleContext, LocaleString } from './context';
import { getData } from './data';
import type { DatumType } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    LocaleModule,
    TimeAxisModule,
    NumberAxisModule,
    ZoomModule,
]);

type ExampleText = {
    localeText: Record<string, string>;
    income: string;
    growth: string;
    month: string;
};
const EXAMPLE_TEXT: { [K in LocaleString]: ExampleText } = {
    'fr-FR': {
        localeText: AG_CHARTS_LOCALE_FR_FR,
        income: 'Revenu',
        growth: 'Croissance',
        month: 'Mois',
    },
    'en-US': {
        localeText: AG_CHARTS_LOCALE_EN_US,
        income: 'Income',
        growth: 'Growth',
        month: 'Month',
    },
    'en-IN': {
        localeText: AG_CHARTS_LOCALE_EN_US,
        income: 'Income',
        growth: 'Growth',
        month: 'Month',
    },
    'pl-PL': {
        localeText: AG_CHARTS_LOCALE_PL_PL,
        income: 'Dochód',
        growth: 'Wzrost',
        month: 'Miesiąc',
    },
    'ar-EG': {
        localeText: AG_CHARTS_LOCALE_AR_EG,
        income: 'الدخل',
        growth: 'النمو',
        month: 'الشهر',
    },
    'fa-IR': {
        localeText: AG_CHARTS_LOCALE_FA_IR,
        income: 'درآمد',
        growth: 'رشد',
        month: 'ماه',
    },
    'tr-TR': {
        localeText: AG_CHARTS_LOCALE_TR_TR,
        income: 'Gelir',
        growth: 'Büyüme',
        month: 'Ay',
    },
    'zh-CN': {
        localeText: AG_CHARTS_LOCALE_ZH_CN,
        income: '收入',
        growth: '增长率',
        month: '月份',
    },
    'he-IL': {
        localeText: AG_CHARTS_LOCALE_HE_IL,
        income: 'הכנסה',
        growth: 'צמיחה',
        month: 'חודש',
    },
};
const INITIAL_LOCALE = 'fr-FR';

const options: AgCartesianChartOptions<DatumType, LocaleContext> & { series: { yName?: string }[] } = {
    context: makeLocaleContext(INITIAL_LOCALE),
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'income',
            yName: EXAMPLE_TEXT[INITIAL_LOCALE].income,
            grouped: false,
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'growth',
            yName: EXAMPLE_TEXT[INITIAL_LOCALE].growth,
            yKeyAxis: 'ySecondary',
            strokeWidth: 3,
            marker: { enabled: true },
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            title: { text: EXAMPLE_TEXT[INITIAL_LOCALE].month },
            label: {
                formatter: (params) => params.context?.formatMonth(params.value),
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: { text: EXAMPLE_TEXT[INITIAL_LOCALE].income },
            label: {
                formatter: (params) => params.context?.formatUSD(params.value),
            },
        },
        ySecondary: {
            type: 'number',
            position: 'right',
            title: { text: EXAMPLE_TEXT[INITIAL_LOCALE].growth },
            label: {
                formatter: (params) => params.context?.formatPercent(params.value),
            },
        },
    },
    legend: { enabled: true },
    zoom: { enabled: true },
    contextMenu: { enabled: true },
    locale: {
        localeText: EXAMPLE_TEXT[INITIAL_LOCALE].localeText,
    },
};

const chart = AgCharts.create(options);

function updateLocale(locale: LocaleString) {
    options.context = makeLocaleContext(locale);
    options.series[0]!.yName = EXAMPLE_TEXT[locale].income;
    options.series[1]!.yName = EXAMPLE_TEXT[locale].growth;
    options.axes!.x!.title!.text = EXAMPLE_TEXT[locale].month;
    options.axes!.y!.title!.text = EXAMPLE_TEXT[locale].income;
    options.axes!.ySecondary!.title!.text = EXAMPLE_TEXT[locale].growth;
    options.locale!.localeText = EXAMPLE_TEXT[locale].localeText;
    chart.update(options);
}
