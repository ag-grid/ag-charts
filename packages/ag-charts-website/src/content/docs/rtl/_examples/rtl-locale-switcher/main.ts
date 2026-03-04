import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    LocaleModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import {
    AG_CHARTS_LOCALE_AR_EG,
    AG_CHARTS_LOCALE_EN_US,
    AG_CHARTS_LOCALE_FA_IR,
    AG_CHARTS_LOCALE_HE_IL,
} from 'ag-charts-locale';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, LocaleModule, NumberAxisModule]);

type Language = 'en' | 'ar' | 'fa' | 'he';

const LANGUAGES = {
    en: {
        localeText: AG_CHARTS_LOCALE_EN_US,
        enableRtl: false,
        title: 'Monthly Product Sales',
        subtitle: 'Sales and Revenue Data for 2024',
        footnote: 'Source: Sales Department',
        yAxisTitle: 'Amount ($)',
        seriesNames: ['Sales', 'Revenue'],
        data: [
            { month: 'January', sales: 150, revenue: 200 },
            { month: 'February', sales: 230, revenue: 310 },
            { month: 'March', sales: 180, revenue: 250 },
            { month: 'April', sales: 290, revenue: 380 },
            { month: 'May', sales: 210, revenue: 290 },
            { month: 'June', sales: 260, revenue: 350 },
        ],
    },
    ar: {
        localeText: AG_CHARTS_LOCALE_AR_EG,
        enableRtl: true,
        title: 'مبيعات المنتجات الشهرية',
        subtitle: 'بيانات Revenue الشهرية',
        footnote: 'المصدر: قسم المبيعات | Source: Sales Department',
        yAxisTitle: 'المبلغ Amount بالدولار',
        seriesNames: ['مبيعات Sales', 'إيرادات Revenue'],
        data: [
            { month: 'يناير', sales: 150, revenue: 200 },
            { month: 'فبراير', sales: 230, revenue: 310 },
            { month: 'مارس', sales: 180, revenue: 250 },
            { month: 'أبريل', sales: 290, revenue: 380 },
            { month: 'مايو', sales: 210, revenue: 290 },
            { month: 'يونيو', sales: 260, revenue: 350 },
        ],
    },
    fa: {
        localeText: AG_CHARTS_LOCALE_FA_IR,
        enableRtl: true,
        title: 'فروش محصولات ماهانه',
        subtitle: 'داده‌های Revenue ماهانه',
        footnote: 'منبع: بخش فروش | Source: Sales Department',
        yAxisTitle: 'مقدار Amount به دلار',
        seriesNames: ['فروش Sales', 'درآمد Revenue'],
        data: [
            { month: 'فروردین', sales: 150, revenue: 200 },
            { month: 'اردیبهشت', sales: 230, revenue: 310 },
            { month: 'خرداد', sales: 180, revenue: 250 },
            { month: 'تیر', sales: 290, revenue: 380 },
            { month: 'مرداد', sales: 210, revenue: 290 },
            { month: 'شهریور', sales: 260, revenue: 350 },
        ],
    },
    he: {
        localeText: AG_CHARTS_LOCALE_HE_IL,
        enableRtl: true,
        title: 'מכירות מוצרים חודשיות',
        subtitle: 'נתוני Revenue חודשיים',
        footnote: 'מקור: מחלקת מכירות | Source: Sales Department',
        yAxisTitle: 'הסכום Amount בשקלים',
        seriesNames: ['מכירות Sales', 'הכנסות Revenue'],
        data: [
            { month: 'ינואר', sales: 150, revenue: 200 },
            { month: 'פברואר', sales: 230, revenue: 310 },
            { month: 'מרץ', sales: 180, revenue: 250 },
            { month: 'אפריל', sales: 290, revenue: 380 },
            { month: 'מאי', sales: 210, revenue: 290 },
            { month: 'יוני', sales: 260, revenue: 350 },
        ],
    },
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    enableRtl: false,
    locale: {
        localeText: AG_CHARTS_LOCALE_EN_US,
    },
    title: { text: 'Monthly Product Sales' },
    subtitle: { text: 'Sales and Revenue Data for 2024' },
    footnote: { text: 'Source: Sales Department' },
    data: LANGUAGES.en.data,
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sales', yName: 'Sales' },
        { type: 'bar', xKey: 'month', yKey: 'revenue', yName: 'Revenue' },
    ],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: {
            type: 'number',
            position: 'left',
            title: { text: 'Amount ($)' },
        },
    },
};

const chart = AgCharts.create(options);

function updateLanguage(lang: string) {
    const config = LANGUAGES[lang as Language];
    options.enableRtl = config.enableRtl;
    options.locale = { localeText: config.localeText };
    options.title = { text: config.title };
    options.subtitle = { text: config.subtitle };
    options.footnote = { text: config.footnote };
    options.data = config.data;
    options.series = [
        { type: 'bar', xKey: 'month', yKey: 'sales', yName: config.seriesNames[0] },
        { type: 'bar', xKey: 'month', yKey: 'revenue', yName: config.seriesNames[1] },
    ];
    options.axes = {
        x: { type: 'category', position: 'bottom' },
        y: {
            type: 'number',
            position: 'left',
            title: { text: config.yAxisTitle },
        },
    };
    chart.update(options);
}
