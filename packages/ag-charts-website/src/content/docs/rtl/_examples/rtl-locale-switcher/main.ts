import {
    AgCartesianChartOptions,
    AgCharts,
    AgContextMenuItem,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    LocaleModule,
    ModuleRegistry,
    NumberAxisModule,
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
]);

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
        contextMenu: {
            viewSalesReport: 'View Sales Report',
            exportOptions: 'Export Options',
            csvFormat: 'CSV Format',
            chartSettings: 'Chart Settings',
            lightTheme: 'Light Theme',
            darkTheme: 'Dark Theme',
            resolution: 'Resolution 1080p',
            toggleInReport: 'Toggle in Report',
        },
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
        contextMenu: {
            viewSalesReport: 'عرض Sales تقرير',
            exportOptions: 'Export خيارات',
            csvFormat: 'تنسيق CSV',
            chartSettings: 'إعدادات الرسم | Chart Settings',
            lightTheme: 'المظهر الفاتح',
            darkTheme: 'Dark Theme (المظهر الداكن)',
            resolution: 'دقة 1080p الشاشة',
            toggleInReport: 'تبديل في التقرير',
        },
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
        yAxisTitle: 'مبلغ Amount به دلار',
        seriesNames: ['فروش Sales', 'درآمد Revenue'],
        contextMenu: {
            viewSalesReport: 'مشاهده Sales گزارش',
            exportOptions: 'Export گزینه‌ها',
            csvFormat: 'قالب CSV',
            chartSettings: 'تنظیمات نمودار | Chart Settings',
            lightTheme: 'پوسته روشن',
            darkTheme: 'Dark Theme (پوسته تاریک)',
            resolution: 'وضوح 1080p صفحه',
            toggleInReport: 'تغییر در گزارش',
        },
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
        title: 'מכירות מוצרים חודשיות',
        subtitle: 'נתוני Revenue חודשיים',
        footnote: 'מקור: מחלקת מכירות | Source: Sales Department',
        yAxisTitle: 'הסכום Amount בשקלים',
        seriesNames: ['מכירות Sales', 'הכנסות Revenue'],
        contextMenu: {
            viewSalesReport: 'הצג Sales דוח',
            exportOptions: 'Export אפשרויות',
            csvFormat: 'פורמט CSV',
            chartSettings: 'הגדרות תרשים | Chart Settings',
            lightTheme: 'ערכת נושא בהירה',
            darkTheme: 'Dark Theme (ערכת נושא כהה)',
            resolution: 'רזולוציה 1080p מסך',
            toggleInReport: 'הצג בדוח',
        },
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

function buildContextMenuItems(labels: (typeof LANGUAGES)['en']['contextMenu']): AgContextMenuItem[] {
    return [
        'download',
        'separator',
        {
            type: 'action',
            label: labels.viewSalesReport,
            action: () => console.log('View Sales Report clicked'),
        },
        {
            label: labels.exportOptions,
            items: [
                {
                    type: 'action',
                    label: labels.csvFormat,
                    action: () => console.log('CSV Format clicked'),
                },
                {
                    label: labels.chartSettings,
                    items: [
                        {
                            type: 'action',
                            label: labels.lightTheme,
                            action: () => console.log('Light Theme clicked'),
                        },
                        {
                            type: 'action',
                            label: labels.darkTheme,
                            action: () => console.log('Dark Theme clicked'),
                        },
                        {
                            type: 'action',
                            label: labels.resolution,
                            action: () => console.log('Resolution 1080p clicked'),
                        },
                    ],
                },
            ],
        },
        'separator',
        {
            showOn: 'legend-item',
            type: 'action',
            label: labels.toggleInReport,
            action: () => console.log('Toggle in Report clicked'),
        },
    ];
}

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
    contextMenu: {
        items: buildContextMenuItems(LANGUAGES.en.contextMenu),
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
    options.contextMenu = {
        items: buildContextMenuItems(config.contextMenu),
    };
    chart.update(options);
}
