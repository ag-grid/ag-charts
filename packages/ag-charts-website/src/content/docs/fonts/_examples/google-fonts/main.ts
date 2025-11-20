import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Title in Pacifico',
        fontFamily: { googleFont: 'Pacifico' },
        fontSize: 25,
        maxHeight: 50,
    },
    subtitle: {
        text: 'Subtitle in DM Serif Text',
        fontFamily: [{ googleFont: 'DM Serif Text' }, 'monospace'],
        fontSize: 18,
    },
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'iceCreamSales',
            yName: 'Ice Cream Sales',
        },
    ],
    axes: {
        y: { position: 'left', type: 'number', label: { fontFamily: ['Helvetica', 'Arial', 'sans-serif'] } },
        x: {
            position: 'bottom',
            type: 'category',
            label: {
                fontFamily: { googleFont: 'Orbitron' },
                fontSize: 12,
            },
        },
    },
    loadGoogleFonts: true,
};

AgCharts.create(options);
