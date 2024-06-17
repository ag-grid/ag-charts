import { AG_CHARTS_LOCALE_FR_FR } from 'ag-charts-community/locales/fr-FR.js';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'French Language',
    },
    subtitle: {
        text: 'Hover toolbar icons for tooltips, right click to show context menu',
    },
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
    ],
    series: [{ type: 'line', xKey: 'month', yKey: 'iceCreamSales' }],
    contextMenu: {
        enabled: true,
    },
    zoom: {
        enabled: true,
    },
    locale: {
        localeText: AG_CHARTS_LOCALE_FR_FR,
    },
};

AgCharts.create(options);
