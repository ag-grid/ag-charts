import {
    AgBarSeriesTooltipRendererParams,
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
        title: 'Monthly Sales Growth and Net Profit Overview',
        subtitle: 'Change in Sales and Net Profit by Month for the Year 2024',
        footnote: 'Source: Regional Sales Department — Internal Report',
        yAxisTitle: 'Amount in US Dollars ($)',
        seriesNames: ['Sales Growth', 'Net Profit'],
        zoomControls: 'Zoom Controls',
        legendControls: 'Legend Controls',
        data: [
            { month: 'January', growth: 45, profit: 40 },
            { month: 'February', growth: -60, profit: 15 },
            { month: 'March', growth: 25, profit: -20 },
            { month: 'April', growth: 80, profit: 65 },
            { month: 'May', growth: -35, profit: -30 },
            { month: 'June', growth: 50, profit: 55 },
        ],
    },
    ar: {
        localeText: AG_CHARTS_LOCALE_AR_EG,
        enableRtl: true,
        title: 'نظرة عامة على نمو Sales المبيعات وصافي الربح الشهري',
        subtitle: 'التغير في بيانات Profit المبيعات وصافي الربح شهريًا لعام 2024',
        footnote: 'المصدر: قسم المبيعات الإقليمي — Sales Department تقرير داخلي',
        yAxisTitle: 'المبلغ Amount بالدولار الأمريكي',
        seriesNames: ['نمو المبيعات', 'صافي الربح'],
        zoomControls: 'عناصر التكبير',
        legendControls: 'عناصر وسيلة الإيضاح',
        data: [
            { month: 'يناير', growth: 45, profit: 40 },
            { month: 'فبراير', growth: -60, profit: 15 },
            { month: 'مارس', growth: 25, profit: -20 },
            { month: 'أبريل', growth: 80, profit: 65 },
            { month: 'مايو', growth: -35, profit: -30 },
            { month: 'يونيو', growth: 50, profit: 55 },
        ],
    },
    fa: {
        localeText: AG_CHARTS_LOCALE_FA_IR,
        enableRtl: true,
        title: 'نمای کلی رشد Sales فروش و سود خالص ماهانه',
        subtitle: 'تغییر داده‌های Profit فروش و سود خالص به تفکیک ماه برای سال 2024',
        footnote: 'منبع: بخش فروش منطقه‌ای — Sales Department گزارش داخلی',
        yAxisTitle: 'مبلغ Amount به دلار آمریکا',
        seriesNames: ['رشد فروش', 'سود خالص'],
        zoomControls: 'کنترل‌های بزرگ‌نمایی',
        legendControls: 'کنترل‌های راهنما',
        data: [
            { month: 'ژانوِیه', growth: 45, profit: 40 },
            { month: 'فوریه', growth: -60, profit: 15 },
            { month: 'مارس', growth: 25, profit: -20 },
            { month: 'آوریل', growth: 80, profit: 65 },
            { month: 'مه', growth: -35, profit: -30 },
            { month: 'ژوئن', growth: 50, profit: 55 },
        ],
    },
    he: {
        localeText: AG_CHARTS_LOCALE_HE_IL,
        enableRtl: true,
        title: 'סקירת צמיחת Sales מכירות ורווח נקי חודשי',
        subtitle: 'השינוי בנתוני Profit מכירות ורווח נקי לפי חודש לשנת 2024',
        footnote: 'מקור: מחלקת מכירות אזורית — Sales Department דוח פנימי',
        yAxisTitle: 'הסכום Amount בשקלים חדשים',
        seriesNames: ['צמיחת מכירות', 'רווח נקי'],
        zoomControls: 'פקדי זום',
        legendControls: 'פקדי מקרא',
        data: [
            { month: 'ינואר', growth: 45, profit: 40 },
            { month: 'פברואר', growth: -60, profit: 15 },
            { month: 'מרץ', growth: 25, profit: -20 },
            { month: 'אפריל', growth: 80, profit: 65 },
            { month: 'מאי', growth: -35, profit: -30 },
            { month: 'יוני', growth: 50, profit: 55 },
        ],
    },
};

// A renderer's HTML is inserted as supplied, so it wraps its own numbers to keep them left-to-right.
const LTR_EMBEDDING = '‪';
const POP_DIRECTIONAL_FORMATTING = '‬';

function profitTooltip({ datum, yName }: AgBarSeriesTooltipRendererParams) {
    const value = `${LTR_EMBEDDING}${datum.profit}${POP_DIRECTIONAL_FORMATTING}`;
    return `<div class="profit-tooltip">${yName} ${value}</div>`;
}

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
    tooltip: { mode: 'single' },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'growth',
            yName: LANGUAGES.en.seriesNames[0],
            label: { enabled: true, placement: 'outside-end' },
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'profit',
            yName: LANGUAGES.en.seriesNames[1],
            label: { enabled: true, placement: 'outside-end' },
            tooltip: { renderer: profitTooltip },
        },
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
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'growth',
            yName: config.seriesNames[0],
            label: { enabled: true, placement: 'outside-end' },
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'profit',
            yName: config.seriesNames[1],
            label: { enabled: true, placement: 'outside-end' },
            tooltip: { renderer: profitTooltip },
        },
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
