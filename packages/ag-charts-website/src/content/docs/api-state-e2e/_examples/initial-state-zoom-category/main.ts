// @ag-skip-fws
import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { quarter: "Q1'18", total: undefined, iphone: 140, mac: 16, ipad: 14, wearables: 12, services: 20 },
        { quarter: "Q2'18", total: undefined, iphone: 124, mac: 20, ipad: 14, wearables: 12, services: 30 },
        { quarter: "Q3'18", total: undefined, iphone: 112, mac: 20, ipad: 18, wearables: 14, services: 36 },
        { quarter: "Q4'18", total: undefined, iphone: 118, mac: 24, ipad: 14, wearables: 14, services: 36 },
    ],
    navigator: { enabled: true },
    zoom: { enabled: true },
    initialState: {
        zoom: {
            rangeX: {
                start: { value: "Q2'18", groupPercentage: 0 },
                end: { value: "Q3'18", groupPercentage: 1 },
            },
        },
    },
    series: [
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'total' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'iphone' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'mac' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'ipad' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'wearables' },
        { type: 'bar', stacked: true, xKey: 'quarter', yKey: 'services' },
    ],
};

AgCharts.create(options);
