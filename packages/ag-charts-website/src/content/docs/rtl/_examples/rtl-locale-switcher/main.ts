import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    LocaleModule,
    ModuleRegistry,
    NumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';
import {
    AG_CHARTS_LOCALE_AR_EG,
    AG_CHARTS_LOCALE_EN_US,
    AG_CHARTS_LOCALE_FA_IR,
    AG_CHARTS_LOCALE_HE_IL,
} from 'ag-charts-locale';

ModuleRegistry.registerModules([
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    LocaleModule,
    NumberAxisModule,
    ZoomModule,
]);

type Language = 'en' | 'ar' | 'fa' | 'he';

const LANGUAGES = {
    en: {
        localeText: AG_CHARTS_LOCALE_EN_US,
        enableRtl: false,
        title: 'Quarterly Product Sales Performance Overview',
        subtitle: 'Comparison of Sales and Revenue Across Categories for the Year 2024',
        footnote: 'Source: Regional Sales Department — Internal Report',
        yAxisTitle: 'Amount in US Dollars ($)',
        seriesNames: ['Total Sales Volume', 'Gross Revenue'],
        zoomControls: 'Zoom Controls',
        legendControls: 'Legend Controls',
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
        title: 'نظرة عامة على أداء Sales مبيعات المنتجات الفصلية',
        subtitle: 'مقارنة بيانات Revenue المبيعات والإيرادات عبر الفئات لعام 2024',
        footnote: 'المصدر: قسم المبيعات الإقليمي — Sales Department تقرير داخلي',
        yAxisTitle: 'المبلغ Amount بالدولار الأمريكي',
        seriesNames: ['مبيعات Sales', 'إيرادات Revenue'],
        zoomControls: 'عناصر التكبير',
        legendControls: 'عناصر وسيلة الإيضاح',
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
        title: 'نمای کلی عملکرد Sales فروش محصولات فصلی',
        subtitle: 'مقایسه داده‌های Revenue فروش و درآمد در دسته‌بندی‌ها برای سال 2024',
        footnote: 'منبع: بخش فروش منطقه‌ای — Sales Department گزارش داخلی',
        yAxisTitle: 'مبلغ Amount به دلار آمریکا',
        seriesNames: ['فروش Sales', 'درآمد Revenue'],
        zoomControls: 'کنترل‌های بزرگ‌نمایی',
        legendControls: 'کنترل‌های راهنما',
        data: [
            { month: 'ژانوِیه', sales: 150, revenue: 200 },
            { month: 'فوریه', sales: 230, revenue: 310 },
            { month: 'مارس', sales: 180, revenue: 250 },
            { month: 'آوریل', sales: 290, revenue: 380 },
            { month: 'مه', sales: 210, revenue: 290 },
            { month: 'ژوئن', sales: 260, revenue: 350 },
        ],
    },
    he: {
        localeText: AG_CHARTS_LOCALE_HE_IL,
        enableRtl: true,
        title: 'סקירת ביצועי Sales מכירות מוצרים רבעונית',
        subtitle: 'השוואת נתוני Revenue מכירות והכנסות בין קטגוריות לשנת 2024',
        footnote: 'מקור: מחלקת מכירות אזורית — Sales Department דוח פנימי',
        yAxisTitle: 'הסכום Amount בשקלים חדשים',
        seriesNames: ['מכירות Sales', 'הכנסות Revenue'],
        zoomControls: 'פקדי זום',
        legendControls: 'פקדי מקרא',
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
    title: { text: LANGUAGES.en.title, wrapping: 'never', maxWidth: 300 },
    subtitle: { text: LANGUAGES.en.subtitle, wrapping: 'always', maxWidth: 300 },
    footnote: { text: LANGUAGES.en.footnote },
    data: LANGUAGES.en.data,
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sales', yName: LANGUAGES.en.seriesNames[0] },
        { type: 'bar', xKey: 'month', yKey: 'revenue', yName: LANGUAGES.en.seriesNames[1] },
    ],
    axes: {
        x: { type: 'category' },
        y: {
            type: 'number',
            title: { text: LANGUAGES.en.yAxisTitle },
        },
    },
    zoom: { enabled: true },
    contextMenu: {
        items: [
            'download',
            'separator',
            {
                showOn: 'series-area',
                label: LANGUAGES.en.zoomControls,
                items: ['zoom-to-cursor', 'pan-to-cursor', 'reset-zoom'],
            },
            {
                showOn: 'legend-item',
                label: LANGUAGES.en.legendControls,
                items: ['toggle-series-visibility', 'toggle-other-series'],
            },
        ],
    },
};

const chart = AgCharts.create(options);

function updateLanguage(lang: string) {
    const config = LANGUAGES[lang as Language];
    options.enableRtl = config.enableRtl;
    options.locale = { localeText: config.localeText };
    options.title = { text: config.title, wrapping: 'never', maxWidth: 300 };
    options.subtitle = { text: config.subtitle, wrapping: 'always', maxWidth: 300 };
    options.footnote = { text: config.footnote };
    options.data = config.data;
    options.series = [
        { type: 'bar', xKey: 'month', yKey: 'sales', yName: config.seriesNames[0] },
        { type: 'bar', xKey: 'month', yKey: 'revenue', yName: config.seriesNames[1] },
    ];
    options.axes = {
        x: { type: 'category' },
        y: {
            type: 'number',
            title: { text: config.yAxisTitle },
        },
    };
    options.contextMenu = {
        items: [
            'download',
            'separator',
            {
                showOn: 'series-area',
                label: config.zoomControls,
                items: ['zoom-to-cursor', 'pan-to-cursor', 'reset-zoom'],
            },
            {
                showOn: 'legend-item',
                label: config.legendControls,
                items: ['toggle-series-visibility', 'toggle-other-series'],
            },
        ],
    };
    chart.update(options);
}
